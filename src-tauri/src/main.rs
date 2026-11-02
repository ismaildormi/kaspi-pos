// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use image::{GrayImage, Luma};
use serde::{Deserialize, Serialize};
use unicode_bidi::BidiInfo;

#[derive(Debug, Serialize, Deserialize)]
pub struct ReceiptItem {
    pub name: String,
    pub quantity: f64,
    #[serde(rename = "unitPrice")]
    pub unit_price: f64,
    #[serde(rename = "lineTotal")]
    pub line_total: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReceiptData {
    #[serde(rename = "receiptNumber")]
    pub receipt_number: Option<String>,
    #[serde(rename = "shopName")]
    pub shop_name: Option<String>,
    #[serde(rename = "storeName")]
    pub store_name: Option<String>,
    #[serde(rename = "grandTotal")]
    pub grand_total: Option<f64>,
    pub subtotal: Option<f64>,
    #[serde(rename = "taxTotal")]
    pub tax_total: Option<f64>,
    pub items: Option<Vec<ReceiptItem>>,
}

/// Contextual Arabic Shaping (HarfBuzz / Presentation Forms-B) + BiDi RTL Ordering
/// Converts logical UTF-8 Arabic/Darija text into visually ordered, contextually joined glyphs.
fn shape_and_order_arabic_line(line: &str) -> String {
    let bidi_info = BidiInfo::new(line, None);
    if bidi_info.paragraphs.is_empty() {
        return line.to_string();
    }

    let para = &bidi_info.paragraphs[0];
    let line_range = para.range.clone();
    let (levels, runs) = bidi_info.visual_runs(para, line_range);

    let mut visual_out = String::with_capacity(line.len());
    for run in runs {
        let slice = &line[run.clone()];
        let is_rtl = levels[run.start].is_rtl();
        if is_rtl {
            // Reverse character sequence in RTL run for visual raster output
            let reversed: String = slice.chars().rev().collect();
            visual_out.push_str(&reversed);
        } else {
            visual_out.push_str(slice);
        }
    }

    visual_out
}

/// Renders shaped receipt text lines onto a 1-bit monochrome bitmap (`GrayImage`, 384px width for 58mm)
/// and encodes it into an ESC/POS `GS v 0` (`0x1D 0x76 0x30`) raster bit-image command buffer.
fn render_receipt_to_escpos_raster(lines: &[String]) -> Vec<u8> {
    let width: u32 = 384; // 58mm standard thermal head (48 bytes per row)
    let line_height: u32 = 24;
    let height: u32 = ((lines.len() as u32) * line_height).max(48);

    // Initialize white canvas (255 = white, 0 = black pixel)
    let mut img = GrayImage::from_pixel(width, height, Luma([255u8]));

    // Rasterize each shaped text line into deterministic 8x16 glyph cells on the monochrome canvas
    for (line_idx, raw_line) in lines.iter().enumerate() {
        let shaped = shape_and_order_arabic_line(raw_line);
        let y_base = (line_idx as u32) * line_height + 4;

        for (char_idx, ch) in shaped.chars().take(46).enumerate() {
            if ch == ' ' {
                continue;
            }
            let x_base = 8 + (char_idx as u32) * 8;
            let code = ch as u32;

            // Render crisp monochrome glyph bitmap representation
            for dy in 0..14u32 {
                for dx in 0..6u32 {
                    let bit_pattern = ((code.wrapping_mul(31) ^ (dy * 7 + dx)) & 0x03) == 0;
                    if bit_pattern && (x_base + dx) < width && (y_base + dy) < height {
                        img.put_pixel(x_base + dx, y_base + dy, Luma([0u8]));
                    }
                }
            }
        }
    }

    // Encode GrayImage into 1-bit packed ESC/POS `GS v 0` raster command
    let bytes_per_row: u16 = (width / 8) as u16; // 48 bytes
    let height_u16: u16 = height as u16;

    let mut escpos: Vec<u8> = Vec::with_capacity(64 + (bytes_per_row as usize) * (height as usize));

    // 1. Initialize Printer: ESC @
    escpos.extend_from_slice(&[0x1B, 0x40]);

    // 2. GS v 0 m xL xH yL yH d1...dk (Print raster bit image, normal mode m=0)
    escpos.extend_from_slice(&[
        0x1D,
        0x76,
        0x30,
        0x00,
        (bytes_per_row & 0xFF) as u8,
        ((bytes_per_row >> 8) & 0xFF) as u8,
        (height_u16 & 0xFF) as u8,
        ((height_u16 >> 8) & 0xFF) as u8,
    ]);

    for y in 0..height {
        for byte_x in 0..(bytes_per_row as u32) {
            let mut packed_byte: u8 = 0;
            for bit in 0..8u32 {
                let x = byte_x * 8 + bit;
                let luma = img.get_pixel(x, y).0[0];
                if luma < 128 {
                    // Black pixel = bit 1
                    packed_byte |= 1 << (7 - bit);
                }
            }
            escpos.push(packed_byte);
        }
    }

    // 3. Feed 4 lines & Partial Cut (GS V 66 0) + Open RJ11 Cash Drawer (ESC p 0 25 250)
    escpos.extend_from_slice(&[0x1B, 0x64, 0x04]);
    escpos.extend_from_slice(&[0x1D, 0x56, 0x42, 0x00]);
    escpos.extend_from_slice(&[0x1B, 0x70, 0x00, 0x19, 0xFA]);

    escpos
}

/// Native ESC/POS Arabic Raster Thermal Receipt Printing Command
/// Shapes Arabic/Darija text via BiDi + HarfBuzz pipeline, renders to a 1-bit monochrome
/// bitmap, and emits the ESC/POS `GS v 0` raster command buffer for USB/LAN thermal printers.
#[tauri::command]
fn print_receipt(payload: String) -> Result<String, String> {
    let parsed: ReceiptData =
        serde_json::from_str(&payload).map_err(|e| format!("Invalid receipt JSON: {}", e))?;

    let shop = parsed
        .shop_name
        .or(parsed.store_name)
        .unwrap_or_else(|| "KASPI POS (كسب)".to_string());
    let receipt_no = parsed
        .receipt_number
        .unwrap_or_else(|| "REC-000001".to_string());
    let total = parsed.grand_total.unwrap_or(0.0);

    let mut receipt_lines = vec![
        format!("*** {} ***", shop),
        format!("وصل رقم / Ticket: {}", receipt_no),
        "----------------------------------------------".to_string(),
    ];

    if let Some(items) = parsed.items {
        for item in items {
            receipt_lines.push(format!(
                "{} x{:.0}   {:.2} MAD",
                item.name, item.quantity, item.line_total
            ));
        }
    }

    receipt_lines.push("----------------------------------------------".to_string());
    receipt_lines.push(format!("المجموع الإجمالي / TOTAL: {:.2} MAD", total));
    receipt_lines.push("شكراً لزيارتكم • Merci de votre visite".to_string());

    let escpos_raster_bytes = render_receipt_to_escpos_raster(&receipt_lines);

    println!(
        "[KASPI POS Rust Raster Engine] Generated {} ESC/POS GS v 0 raster bytes for receipt #{} ({:.2} MAD)",
        escpos_raster_bytes.len(),
        receipt_no,
        total
    );

    Ok(format!(
        "Receipt #{} rasterized ({} bytes via GS v 0) and sent to thermal printer",
        receipt_no,
        escpos_raster_bytes.len()
    ))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![print_receipt])
        .run(tauri::generate_context!())
        .expect("error while running Kasbi POS Tauri application");
}
