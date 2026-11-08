// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod printer;
mod local_ai;
mod tpe_bridge;

use printer::{encode_escpos, render_rows, send_to_printer, to_western_numerals, Align, Fonts, Row};
use local_ai::{get_local_ai_capabilities, run_local_ai_inference};
use tpe_bridge::initiate_tpe_payment;
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
    pub address: Option<String>,
    pub ice: Option<String>,
    pub tax_id: Option<String>,
    pub rc_number: Option<String>,
    pub cashier_name: Option<String>,
    pub created_at: Option<String>,
    pub date: Option<String>,
    pub customer_name: Option<String>,
    pub customer_ice: Option<String>,
    pub subtotal: Option<f64>,
    pub tax_total: Option<f64>,
    pub discount_total: Option<f64>,
    pub grand_total: Option<f64>,
    pub payment_method: Option<String>,
    pub paid_total: Option<f64>,
    pub change_due: Option<f64>,
    pub currency: Option<String>,
    pub receipt_language: Option<String>,
    pub receipt_header: Option<String>,
    pub receipt_footer: Option<String>,
    pub items: Option<Vec<ReceiptItem>>,
    /// `tcp://192.168.1.50:9100`, `COM3`, `\\localhost\POS80`, a Windows printer name,
    /// or empty for the Windows default printer.
    pub printer: Option<String>,
    /// 58 (384 dots) or 80 (576 dots). Defaults to 80.
    pub paper_width_mm: Option<u32>,
    pub open_drawer: Option<bool>,
}

struct ReceiptLabels {
    rtl: bool,
    invoice: &'static str,
    date: &'static str,
    cashier: &'static str,
    customer: &'static str,
    customer_tax_id: &'static str,
    subtotal: &'static str,
    discount: &'static str,
    tax: &'static str,
    grand_total: &'static str,
    payment: &'static str,
    paid: &'static str,
    change: &'static str,
    thank_you: &'static str,
}

impl ReceiptLabels {
    fn for_lang(lang: &str) -> Self {
        match lang.trim().to_ascii_lowercase().as_str() {
            "ar" => Self {
                rtl: true,
                invoice: "رقم الفاتورة",
                date: "التاريخ",
                cashier: "الكاشير",
                customer: "الزبون",
                customer_tax_id: "التعريف الضريبي",
                subtotal: "المجموع بدون ضريبة",
                discount: "التخفيض",
                tax: "الضريبة (TVA)",
                grand_total: "المجموع الإجمالي",
                payment: "طريقة الدفع",
                paid: "المبلغ المدفوع",
                change: "الباقي",
                thank_you: "شكراً لزيارتكم، نراكم قريباً!",
            },
            "en" => Self {
                rtl: false,
                invoice: "Receipt No",
                date: "Date",
                cashier: "Cashier",
                customer: "Customer",
                customer_tax_id: "Tax ID",
                subtotal: "Subtotal",
                discount: "Discount",
                tax: "Tax / VAT",
                grand_total: "GRAND TOTAL",
                payment: "Payment Method",
                paid: "Amount Paid",
                change: "Change Due",
                thank_you: "Thank you for your visit!",
            },
            "tr" => Self {
                rtl: false,
                invoice: "Fiş No",
                date: "Tarih",
                cashier: "Kasiyer",
                customer: "Müşteri",
                customer_tax_id: "Müşteri VKN",
                subtotal: "Ara Toplam",
                discount: "İndirim",
                tax: "Toplam KDV",
                grand_total: "GENEL TOPLAM",
                payment: "Ödeme Yöntemi",
                paid: "Alınan Tutar",
                change: "Para Üstü",
                thank_you: "Bizi tercih ettiğiniz için teşekkür ederiz!",
            },
            "es" => Self {
                rtl: false,
                invoice: "Ticket N.º",
                date: "Fecha",
                cashier: "Cajero",
                customer: "Cliente",
                customer_tax_id: "NIF Cliente",
                subtotal: "Subtotal",
                discount: "Descuento",
                tax: "IVA Total",
                grand_total: "TOTAL A PAGAR",
                payment: "Método de Pago",
                paid: "Recibido",
                change: "Cambio",
                thank_you: "¡Gracias por su visita, hasta pronto!",
            },
            "de" => Self {
                rtl: false,
                invoice: "Beleg-Nr.",
                date: "Datum",
                cashier: "Kassierer",
                customer: "Kunde",
                customer_tax_id: "USt-IdNr.",
                subtotal: "Zwischensumme",
                discount: "Rabatt",
                tax: "MwSt. Gesamt",
                grand_total: "GESAMTBETRAG",
                payment: "Zahlungsart",
                paid: "Gegeben",
                change: "Rückgeld",
                thank_you: "Vielen Dank für Ihren Einkauf!",
            },
            _ => Self {
                rtl: false,
                invoice: "Ticket N°",
                date: "Date",
                cashier: "Caissier",
                customer: "Client",
                customer_tax_id: "ICE Client",
                subtotal: "Total HT",
                discount: "Remise",
                tax: "Total TVA",
                grand_total: "TOTAL TTC",
                payment: "Mode Règlement",
                paid: "Reçu",
                change: "Rendu",
                thank_you: "Merci de votre visite et à bientôt !",
            },
        }
    }
}

fn money(v: f64, currency: &str) -> String {
    format!("{v:.2} {currency}")
}

/// Helper to create a two-column pair row respecting RTL (label on right, value on left) vs LTR.
fn pair_row(rtl: bool, label: impl Into<String>, value: impl Into<String>, size: f32) -> Row {
    let l = label.into();
    let v = value.into();
    if rtl {
        Row::Pair { left: v, right: l, size }
    } else {
        Row::Pair { left: l, right: v, size }
    }
}

fn build_rows(r: &ReceiptData) -> Vec<Row> {
    let lang = r.receipt_language.as_deref().unwrap_or("fr");
    let labels = ReceiptLabels::for_lang(lang);
    let currency = r.currency.as_deref().unwrap_or("MAD");

    let shop = r
        .shop_name
        .clone()
        .or_else(|| r.store_name.clone())
        .unwrap_or_else(|| "KASPI POS (كسب)".to_string());

    let mut rows = vec![Row::Text { text: shop, align: Align::Center, size: 30.0 }];

    if let Some(addr) = r.address.as_ref().filter(|s| !s.trim().is_empty()) {
        rows.push(Row::Text { text: addr.clone(), align: Align::Center, size: 17.0 });
    }

    if let Some(ice) = r.ice.as_ref().filter(|s| !s.trim().is_empty()) {
        let tax_line = match r.tax_id.as_ref().filter(|s| !s.trim().is_empty()) {
            Some(if_id) => format!("ICE: {} | IF: {}", to_western_numerals(ice), to_western_numerals(if_id)),
            None => format!("ICE: {}", to_western_numerals(ice)),
        };
        rows.push(Row::Text { text: tax_line, align: Align::Center, size: 16.0 });
    }

    if let Some(hdr) = r.receipt_header.as_ref().filter(|s| !s.trim().is_empty()) {
        rows.push(Row::Text { text: hdr.clone(), align: Align::Center, size: 18.0 });
    }

    rows.push(Row::Separator);

    let receipt_num = to_western_numerals(r.receipt_number.as_deref().unwrap_or("-"));
    rows.push(pair_row(labels.rtl, labels.invoice, receipt_num, 19.0));

    if let Some(d) = r.created_at.as_ref().or(r.date.as_ref()) {
        rows.push(pair_row(labels.rtl, labels.date, to_western_numerals(d), 18.0));
    }
    if let Some(c) = &r.cashier_name {
        rows.push(pair_row(labels.rtl, labels.cashier, c.clone(), 18.0));
    }
    rows.push(Row::Separator);

    for item in r.items.iter().flatten() {
        rows.push(Row::Text { text: item.name.clone(), align: Align::Auto, size: 21.0 });
        rows.push(Row::Pair {
            left: format!("{} x {:.2}", trim_qty(item.quantity), item.unit_price),
            right: money(item.line_total, currency),
            size: 19.0,
        });
    }
    rows.push(Row::Separator);

    if let Some(v) = r.subtotal {
        rows.push(pair_row(labels.rtl, labels.subtotal, money(v, currency), 19.0));
    }
    if let Some(v) = r.discount_total.filter(|d| *d > 0.0) {
        rows.push(pair_row(labels.rtl, labels.discount, format!("-{}", money(v, currency)), 19.0));
    }
    if let Some(v) = r.tax_total {
        rows.push(pair_row(labels.rtl, labels.tax, money(v, currency), 19.0));
    }
    rows.push(pair_row(
        labels.rtl,
        labels.grand_total,
        money(r.grand_total.unwrap_or(0.0), currency),
        25.0,
    ));
    if let Some(m) = &r.payment_method {
        rows.push(pair_row(labels.rtl, labels.payment, m.clone(), 18.0));
    }
    if let Some(v) = r.paid_total {
        rows.push(pair_row(labels.rtl, labels.paid, money(v, currency), 18.0));
    }
    if let Some(v) = r.change_due.filter(|c| *c > 0.0) {
        rows.push(pair_row(labels.rtl, labels.change, money(v, currency), 18.0));
    }
    if let Some(c) = &r.customer_name {
        rows.push(Row::Separator);
        rows.push(pair_row(labels.rtl, labels.customer, c.clone(), 18.0));
        if let Some(ice) = &r.customer_ice {
            rows.push(pair_row(labels.rtl, labels.customer_tax_id, to_western_numerals(ice), 18.0));
        }
    }
    rows.push(Row::Feed(8));

    let footer = r
        .receipt_footer
        .as_ref()
        .filter(|s| !s.trim().is_empty())
        .map(|s| s.as_str())
        .unwrap_or(labels.thank_you);

    rows.push(Row::Text {
        text: footer.into(),
        align: Align::Center,
        size: 19.0,
    });
    rows
}

fn trim_qty(q: f64) -> String {
    if q.fract() == 0.0 { format!("{q:.0}") } else { format!("{q:.3}") }
}

/// Renders the receipt (Arabic shaped via rustybuzz + BiDi, Latin/Turkish UTF-8 via NotoSans),
/// encodes it as ESC/POS `GS v 0` raster bands and sends it to the configured thermal printer.
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
            run_local_ai_inference,
            initiate_tpe_payment
        ])
        .run(tauri::generate_context!())
        .expect("error while running Kasbi POS Tauri application");
}
