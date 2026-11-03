// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod printer;
mod local_ai;

use printer::{encode_escpos, render_rows, send_to_printer, Align, Fonts, Row};
use local_ai::{get_local_ai_capabilities, run_local_ai_inference};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceiptItem {
    pub name: String,
    pub quantity: f64,
    #[serde(default)]
    pub unit_price: f64,
    pub line_total: f64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceiptData {
    pub receipt_number: Option<String>,
    pub shop_name: Option<String>,
    pub store_name: Option<String>,
    pub cashier_name: Option<String>,
    pub created_at: Option<String>,
    pub customer_name: Option<String>,
    pub customer_ice: Option<String>,
    pub subtotal: Option<f64>,
    pub tax_total: Option<f64>,
    pub discount_total: Option<f64>,
    pub grand_total: Option<f64>,
    pub payment_method: Option<String>,
    pub paid_total: Option<f64>,
    pub change_due: Option<f64>,
    pub items: Option<Vec<ReceiptItem>>,
    /// `tcp://192.168.1.50:9100`, `COM3`, `\\localhost\POS80`, a Windows printer name,
    /// or empty for the Windows default printer.
    pub printer: Option<String>,
    /// 58 (384 dots) or 80 (576 dots). Defaults to 80.
    pub paper_width_mm: Option<u32>,
    pub open_drawer: Option<bool>,
}

fn money(v: f64) -> String {
    format!("{v:.2} MAD")
}

fn build_rows(r: &ReceiptData) -> Vec<Row> {
    let shop = r
        .shop_name
        .clone()
        .or_else(|| r.store_name.clone())
        .unwrap_or_else(|| "KASPI POS (كسب)".to_string());

    let mut rows = vec![
        Row::Text { text: shop, align: Align::Center, size: 30.0 },
        Row::Text {
            text: format!("وصل رقم / Ticket: {}", r.receipt_number.as_deref().unwrap_or("-")),
            align: Align::Center,
            size: 20.0,
        },
    ];
    if let Some(d) = &r.created_at {
        rows.push(Row::Text { text: d.clone(), align: Align::Center, size: 18.0 });
    }
    if let Some(c) = &r.cashier_name {
        rows.push(Row::Text { text: format!("Caissier / الكاشير: {c}"), align: Align::Auto, size: 18.0 });
    }
    rows.push(Row::Separator);

    for item in r.items.iter().flatten() {
        rows.push(Row::Text { text: item.name.clone(), align: Align::Auto, size: 22.0 });
        rows.push(Row::Pair {
            left: format!("{} x {:.2}", trim_qty(item.quantity), item.unit_price),
            right: money(item.line_total),
            size: 20.0,
        });
    }
    rows.push(Row::Separator);

    if let Some(v) = r.subtotal {
        rows.push(Row::Pair { left: "Sous-total HT".into(), right: money(v), size: 20.0 });
    }
    if let Some(v) = r.discount_total.filter(|d| *d > 0.0) {
        rows.push(Row::Pair { left: "Remise / تخفيض".into(), right: format!("-{}", money(v)), size: 20.0 });
    }
    if let Some(v) = r.tax_total {
        rows.push(Row::Pair { left: "TVA / الضريبة".into(), right: money(v), size: 20.0 });
    }
    rows.push(Row::Pair {
        left: "TOTAL / المجموع".into(),
        right: money(r.grand_total.unwrap_or(0.0)),
        size: 26.0,
    });
    if let Some(m) = &r.payment_method {
        rows.push(Row::Pair { left: "Paiement".into(), right: m.clone(), size: 18.0 });
    }
    if let Some(v) = r.paid_total {
        rows.push(Row::Pair { left: "Reçu / المدفوع".into(), right: money(v), size: 18.0 });
    }
    if let Some(v) = r.change_due.filter(|c| *c > 0.0) {
        rows.push(Row::Pair { left: "Rendu / الباقي".into(), right: money(v), size: 18.0 });
    }
    if let Some(c) = &r.customer_name {
        rows.push(Row::Separator);
        rows.push(Row::Text { text: format!("Client / الزبون: {c}"), align: Align::Auto, size: 18.0 });
        if let Some(ice) = &r.customer_ice {
            rows.push(Row::Text { text: format!("ICE: {ice}"), align: Align::Auto, size: 18.0 });
        }
    }
    rows.push(Row::Feed(8));
    rows.push(Row::Text {
        text: "شكراً لزيارتكم • Merci de votre visite".into(),
        align: Align::Center,
        size: 20.0,
    });
    rows
}

fn trim_qty(q: f64) -> String {
    if q.fract() == 0.0 { format!("{q:.0}") } else { format!("{q:.3}") }
}

/// Renders the receipt (Arabic shaped via rustybuzz + BiDi), encodes it as ESC/POS
/// `GS v 0` raster bands and sends it to the configured thermal printer.
#[tauri::command]
fn print_receipt(payload: String) -> Result<String, String> {
    let receipt: ReceiptData =
        serde_json::from_str(&payload).map_err(|e| format!("Invalid receipt JSON: {e}"))?;

    let width_px = match receipt.paper_width_mm.unwrap_or(80) {
        58 => 384,
        _ => 576,
    };

    let fonts = Fonts::embedded()?;
    let canvas = render_rows(&fonts, &build_rows(&receipt), width_px);
    let bytes = encode_escpos(&canvas, true, receipt.open_drawer.unwrap_or(true));

    let target = receipt
        .printer
        .clone()
        .or_else(|| std::env::var("KASPI_PRINTER").ok())
        .unwrap_or_default();

    send_to_printer(&target, &bytes)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            print_receipt,
            get_local_ai_capabilities,
            run_local_ai_inference
        ])
        .run(tauri::generate_context!())
        .expect("error while running Kasbi POS Tauri application");
}
