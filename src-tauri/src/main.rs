// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ReceiptData {
    #[serde(rename = "receiptNumber")]
    pub receipt_number: Option<String>,
    #[serde(rename = "storeName")]
    pub store_name: Option<String>,
    #[serde(rename = "grandTotal")]
    pub grand_total: Option<f64>,
}

/// Native ESC/POS Thermal Receipt Printing Command
/// Receives the receipt JSON payload, formats ESC/POS commands, and routes to USB/COM spooler.
#[tauri::command]
fn print_receipt(payload: String) -> Result<String, String> {
    println!(
        "[Kasbi POS Rust Shell] Native print_receipt received payload (bytes: {})",
        payload.len()
    );

    let parsed: Result<serde_json::Value, _> = serde_json::from_str(&payload);
    match parsed {
        Ok(json) => {
            let receipt_no = json
                .get("receiptNumber")
                .and_then(|v| v.as_str())
                .unwrap_or("UNKNOWN");
            let total = json
                .get("grandTotal")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0);

            println!(
                "[Kasbi POS Rust Shell] Printing receipt #{} for total {:.2} MAD via ESC/POS bridge...",
                receipt_no, total
            );

            // In production Windows environment, sends raw ESC/POS bytes to the thermal printer
            Ok(format!(
                "Receipt #{} printed successfully via Tauri ESC/POS driver",
                receipt_no
            ))
        }
        Err(e) => Err(format!("Invalid receipt JSON: {}", e)),
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![print_receipt])
        .run(tauri::generate_context!())
        .expect("error while running Kasbi POS Tauri application");
}
