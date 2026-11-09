use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};

pub const HANDOFF_PORT: u16 = 41732;
pub const PROTOCOL_SCHEME: &str = "kaspipos";
pub const BASE_URL: &str = "https://kaspi-pos.vercel.app";

/// Parse a deep-link or query string like "kaspipos://open?token=XYZ&lang=ar" or "/handoff?token=XYZ&lang=ar"
pub fn parse_handoff_params(raw: &str) -> Option<(String, String)> {
    let query_str = if let Some(idx) = raw.find('?') {
        &raw[idx + 1..]
    } else {
        raw
    };

    let mut token = None;
    let mut lang = "ar".to_string();

    for pair in query_str.split('&') {
        let mut parts = pair.splitn(2, '=');
        let key = parts.next()?.trim();
        let val = parts.next().unwrap_or("").trim();
        // Remove trailing HTTP/1.1 or quotes if parsed from request line
        let clean_val = val.split_whitespace().next().unwrap_or("").trim_matches('"');
        if key == "token" && !clean_val.is_empty() {
            token = Some(clean_val.to_string());
        } else if key == "lang" && !clean_val.is_empty() {
            lang = clean_val.to_string();
        }
    }

    token.map(|t| (t, lang))
}

/// Find handoff URL in CLI arguments (e.g. when launched via kaspipos://open?token=...)
pub fn find_handoff_url_from_args() -> Option<String> {
    for arg in std::env::args().skip(1) {
        if arg.starts_with("kaspipos://") || arg.contains("token=") {
            if let Some((token, lang)) = parse_handoff_params(&arg) {
                return Some(format!(
                    "{}/api/v1/auth/handoff?token={}&redirect=/{}/dashboard",
                    BASE_URL, token, lang
                ));
            }
        }
    }
    None
}

/// Bring the desktop window to front and navigate to the authenticated dashboard
pub fn focus_and_navigate(app: &AppHandle, target_url: &str) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
        let js = format!("window.location.href = '{}';", target_url);
        let _ = window.eval(&js);
    }
}

/// Forward handoff to an already-running instance over the local TCP socket
pub fn forward_to_running_instance(arg: &str) -> bool {
    let addr = format!("127.0.0.1:{}", HANDOFF_PORT);
    if let Ok(sock_addr) = addr.parse() {
        if let Ok(mut stream) = TcpStream::connect_timeout(&sock_addr, Duration::from_millis(300)) {
            let req = format!("GET /handoff?{} HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n", arg);
            let _ = stream.write_all(req.as_bytes());
            return true;
        }
    }
    false
}

/// Start background listener on 127.0.0.1:41732 to handle IPC and handoff from browser tabs
pub fn start_local_handoff_server(app_handle: AppHandle) {
    thread::spawn(move || {
        let listener = match TcpListener::bind(format!("127.0.0.1:{}", HANDOFF_PORT)) {
            Ok(l) => l,
            Err(_) => return, // Port occupied, another instance is listening
        };

        for stream in listener.incoming() {
            if let Ok(mut stream) = stream {
                let mut buf = [0u8; 2048];
                if let Ok(n) = stream.read(&mut buf) {
                    let req_str = String::from_utf8_lossy(&buf[..n]);
                    let first_line = req_str.lines().next().unwrap_or("");

                    if first_line.starts_with("GET /handoff") {
                        if let Some((token, lang)) = parse_handoff_params(first_line) {
                            let target = format!(
                                "{}/api/v1/auth/handoff?token={}&redirect=/{}/dashboard",
                                BASE_URL, token, lang
                            );
                            focus_and_navigate(&app_handle, &target);
                        }

                        let res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n{\"ok\":true,\"status\":\"brought_to_front\"}\r\n";
                        let _ = stream.write_all(res.as_bytes());
                    } else if first_line.starts_with("OPTIONS") {
                        let res = "HTTP/1.1 204 No Content\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, OPTIONS\r\nConnection: close\r\n\r\n";
                        let _ = stream.write_all(res.as_bytes());
                    }
                }
            }
        }
    });
}

/// On Windows, register `kaspipos://` protocol in HKCU registry so Windows routes clicks to Kasbi POS.exe
pub fn register_windows_protocol() {
    #[cfg(windows)]
    {
        if let Ok(exe_path) = std::env::current_exe() {
            let exe_str = exe_path.to_string_lossy().to_string();
            let cmd_val = format!("\"{}\" \"%1\"", exe_str);

            let _ = std::process::Command::new("reg")
                .args(["add", "HKCU\\Software\\Classes\\kaspipos", "/ve", "/d", "URL:KASPI POS Protocol", "/f"])
                .status();

            let _ = std::process::Command::new("reg")
                .args(["add", "HKCU\\Software\\Classes\\kaspipos", "/v", "URL Protocol", "/d", "", "/f"])
                .status();

            let _ = std::process::Command::new("reg")
                .args(["add", "HKCU\\Software\\Classes\\kaspipos\\shell\\open\\command", "/ve", "/d", &cmd_val, "/f"])
                .status();
        }
    }
}
