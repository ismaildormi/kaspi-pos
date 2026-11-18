//! KASPI POS — Native Local Ollama Cell Bridge & Hardware Guardrails (Tauri / Rust)
//!
//! Runs 100% locally on the merchant's machine against http://127.0.0.1:11434
//! without requiring external API keys or browser CORS exceptions.
//! Zero fabricated/canned fallback answers: if Ollama is unreachable, returns a
//! transparent error and exposes safe hardware-checked installation helpers.

use serde::{Deserialize, Serialize};
use std::io::{Read, Write};
use std::net::{SocketAddr, TcpStream};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalAICapabilities {
    pub has_gpu_acceleration: bool,
    pub max_threads_allowed: usize,
    pub memory_budget_mb: usize,
    pub supported_quantization: Vec<String>,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaStatusReport {
    pub reachable: bool,
    pub models: Vec<String>,
    pub endpoint: String,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalInferenceRequest {
    pub prompt: String,
    pub system_prompt: Option<String>,
    pub messages: Option<Vec<OllamaChatMessage>>,
    pub model_path: Option<String>,
    pub max_tokens: Option<usize>,
    pub temperature: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalInferenceResponse {
    pub text: String,
    pub tokens_evaluated: usize,
    pub duration_ms: u64,
    pub backend_used: String,
    pub error: Option<String>,
}

fn http_loopback_json(method: &str, path: &str, body_json: Option<&str>, timeout_secs: u64) -> Result<String, String> {
    let addr: SocketAddr = "127.0.0.1:11434"
        .parse()
        .map_err(|e| format!("Invalid Ollama socket address: {e}"))?;
    let mut stream = TcpStream::connect_timeout(&addr, Duration::from_secs(2))
        .map_err(|e| format!("OLLAMA_NOT_RUNNING: Could not connect to 127.0.0.1:11434 ({e})"))?;
    let _ = stream.set_read_timeout(Some(Duration::from_secs(timeout_secs)));
    let _ = stream.set_write_timeout(Some(Duration::from_secs(5)));

    let payload = body_json.unwrap_or("");
    let req = if method == "POST" {
        format!(
            "POST {path} HTTP/1.1\r\nHost: 127.0.0.1:11434\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{payload}",
            payload.len()
        )
    } else {
        format!(
            "GET {path} HTTP/1.1\r\nHost: 127.0.0.1:11434\r\nConnection: close\r\n\r\n"
        )
    };

    stream
        .write_all(req.as_bytes())
        .map_err(|e| format!("Failed writing to Ollama socket: {e}"))?;

    let mut raw_bytes = Vec::new();
    stream
        .read_to_end(&mut raw_bytes)
        .map_err(|e| format!("Failed reading from Ollama socket: {e}"))?;

    let split_idx = raw_bytes
        .windows(4)
        .position(|w| w == b"\r\n\r\n")
        .ok_or_else(|| "Malformed HTTP response from Ollama".to_string())?;
    let headers = String::from_utf8_lossy(&raw_bytes[..split_idx]).to_string();
    let body_bytes = &raw_bytes[split_idx + 4..];

    let status_line = headers.lines().next().unwrap_or("");
    if !status_line.contains(" 200 ") && !status_line.contains(" 201 ") {
        return Err(format!("Ollama returned HTTP error: {status_line}"));
    }

    if headers.to_ascii_lowercase().contains("transfer-encoding: chunked") {
        let mut decoded = Vec::new();
        let mut rest = body_bytes;
        loop {
            if let Some(crlf) = rest.windows(2).position(|w| w == b"\r\n") {
                let len_line = String::from_utf8_lossy(&rest[..crlf]);
                let len_hex = len_line.trim().split(';').next().unwrap_or("0");
                let chunk_len = usize::from_str_radix(len_hex, 16).unwrap_or(0);
                rest = &rest[crlf + 2..];
                if chunk_len == 0 || rest.len() < chunk_len {
                    break;
                }
                decoded.extend_from_slice(&rest[..chunk_len]);
                rest = rest.get(chunk_len + 2..).unwrap_or(&[]);
            } else {
                decoded.extend_from_slice(rest);
                break;
            }
        }
        Ok(String::from_utf8_lossy(&decoded).to_string())
    } else {
        Ok(String::from_utf8_lossy(body_bytes).to_string())
    }
}

#[tauri::command]
pub fn get_local_ai_capabilities() -> LocalAICapabilities {
    let detected_cpus = std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(2);
    let safe_threads = (detected_cpus / 2).clamp(1, 6);

    let status_note = match check_ollama_status() {
        s if s.reachable && !s.models.is_empty() => {
            format!("Ollama Live ({} models ready)", s.models.len())
        }
        s if s.reachable => "Ollama Running (awaiting model pull)".to_string(),
        _ => "Ollama Inactive on 127.0.0.1:11434".to_string(),
    };

    LocalAICapabilities {
        has_gpu_acceleration: cfg!(target_os = "windows"),
        max_threads_allowed: safe_threads,
        memory_budget_mb: 4096,
        supported_quantization: vec![
            "Q4_K_M".to_string(),
            "Q4_0".to_string(),
            "Q5_K_M".to_string(),
        ],
        status: status_note,
    }
}

#[tauri::command]
pub fn check_ollama_status() -> OllamaStatusReport {
    match http_loopback_json("GET", "/api/tags", None, 4) {
        Ok(body) => {
            let parsed: serde_json::Value = serde_json::from_str(&body).unwrap_or_default();
            let models = parsed["models"]
                .as_array()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|m| m["name"].as_str().map(|s| s.to_string()))
                        .collect::<Vec<_>>()
                })
                .unwrap_or_default();
            OllamaStatusReport {
                reachable: true,
                models,
                endpoint: "http://127.0.0.1:11434".to_string(),
                error: None,
            }
        }
        Err(err) => OllamaStatusReport {
            reachable: false,
            models: Vec::new(),
            endpoint: "http://127.0.0.1:11434".to_string(),
            error: Some(err),
        },
    }
}

#[tauri::command]
pub fn run_local_ai_inference(request: LocalInferenceRequest) -> LocalInferenceResponse {
    let start_time = std::time::Instant::now();
    let prompt_trimmed = request.prompt.trim();

    if prompt_trimmed.is_empty() {
        return LocalInferenceResponse {
            text: String::new(),
            tokens_evaluated: 0,
            duration_ms: 0,
            backend_used: "None".to_string(),
            error: Some("Prompt cannot be empty".to_string()),
        };
    }

    let model = request
        .model_path
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or("qwen2.5:3b");

    let mut chat_messages: Vec<serde_json::Value> = Vec::new();
    if let Some(sys) = request.system_prompt.as_deref().filter(|s| !s.trim().is_empty()) {
        chat_messages.push(serde_json::json!({ "role": "system", "content": sys }));
    }
    if let Some(msgs) = request.messages.as_ref().filter(|m| !m.is_empty()) {
        for m in msgs {
            if m.role == "system" && request.system_prompt.is_some() {
                continue;
            }
            chat_messages.push(serde_json::json!({ "role": m.role, "content": m.content }));
        }
    } else {
        chat_messages.push(serde_json::json!({ "role": "user", "content": prompt_trimmed }));
    }

    let payload = serde_json::json!({
        "model": model,
        "messages": chat_messages,
        "stream": false,
        "options": {
            "temperature": request.temperature.unwrap_or(0.35),
            "num_predict": request.max_tokens.unwrap_or(1024).min(4096),
            "num_ctx": 8192
        }
    });

    match http_loopback_json("POST", "/api/chat", Some(&payload.to_string()), 90) {
        Ok(body) => {
            let parsed: serde_json::Value = serde_json::from_str(&body).unwrap_or_default();
            let reply = parsed["message"]["content"]
                .as_str()
                .or_else(|| parsed["response"].as_str())
                .unwrap_or("")
                .trim()
                .to_string();
            let eval_count = parsed["eval_count"].as_u64().unwrap_or(0) as usize;
            let duration = start_time.elapsed().as_millis() as u64;

            if reply.is_empty() {
                return LocalInferenceResponse {
                    text: String::new(),
                    tokens_evaluated: eval_count,
                    duration_ms: duration,
                    backend_used: format!("Ollama ({model})"),
                    error: Some("Ollama returned empty completion".to_string()),
                };
            }

            LocalInferenceResponse {
                text: reply,
                tokens_evaluated: eval_count,
                duration_ms: duration,
                backend_used: format!("Ollama Local ({model})"),
                error: None,
            }
        }
        Err(err) => LocalInferenceResponse {
            text: String::new(),
            tokens_evaluated: 0,
            duration_ms: start_time.elapsed().as_millis() as u64,
            backend_used: "Unavailable".to_string(),
            error: Some(err),
        },
    }
}

#[tauri::command]
pub fn setup_local_ollama_background(model_tag: Option<String>) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        use std::process::Command;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let requested = model_tag
            .as_deref()
            .map(str::trim)
            .filter(|s| !s.is_empty() && s.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | ':' | '-' | '_')))
            .unwrap_or("auto");

        let ps_script = format!(
            "$ram = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory/1GB,1); \
             $free = [math]::Round((Get-PSDrive C).Free/1GB,1); \
             if ($free -lt 5.5) {{ exit 2 }}; \
             $m = '{requested}'; if ($m -eq 'auto') {{ if ($ram -ge 12 -and $free -ge 10) {{ $m='qwen2.5:7b' }} else {{ $m='qwen2.5:3b' }} }}; \
             [Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS','https://kaspi-pos.vercel.app,http://localhost:3000,http://127.0.0.1:*','User'); \
             $exe = (Get-Command ollama -EA SilentlyContinue).Source; \
             if (-not $exe -and (Test-Path \"$env:LOCALAPPDATA\\Programs\\Ollama\\ollama.exe\")) {{ $exe = \"$env:LOCALAPPDATA\\Programs\\Ollama\\ollama.exe\" }}; \
             if (-not $exe) {{ winget install -e --id Ollama.Ollama --accept-package-agreements --accept-source-agreements; $exe = \"$env:LOCALAPPDATA\\Programs\\Ollama\\ollama.exe\" }}; \
             try {{ Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2 | Out-Null }} catch {{ Start-Process -FilePath $exe -ArgumentList 'serve' -WindowStyle Hidden; Start-Sleep -Seconds 3 }}; \
             & $exe pull $m"
        );

        Command::new("powershell.exe")
            .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", &ps_script])
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .map_err(|e| format!("Failed launching background Ollama setup: {e}"))?;

        Ok(format!("Started safe hardware-checked Ollama setup ({requested}) in background."))
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = model_tag;
        Err("Automated Ollama background bootstrap is configured for Windows Desktop installs.".to_string())
    }
}
