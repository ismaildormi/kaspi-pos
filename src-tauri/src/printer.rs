//! KASPI POS — Arabic-capable ESC/POS raster receipt engine.
//!
//! Pipeline:
//!   1. BiDi (UAX #9, `unicode-bidi`)      → visual runs for mixed Arabic/Latin lines
//!   2. Shaping (HarfBuzz port, `rustybuzz`) → contextual Arabic joining + Lam-Alef ligatures
//!   3. Rasterization (`ab_glyph`)          → real glyph outlines onto a 1-bit `GrayImage`
//!   4. ESC/POS `GS v 0`                     → banded raster bit-image commands
//!   5. Transport                            → Windows spooler (RAW), `tcp://ip:9100`, or device path
//!
//! Fonts (SIL OFL 1.1, see `fonts/OFL.txt`) are embedded so the .exe works offline.

use ab_glyph::{point, Font, FontRef, GlyphId, PxScale};
use image::{GrayImage, Luma};
use rustybuzz::{Direction, Face, UnicodeBuffer};
use unicode_bidi::BidiInfo;

static ARABIC_FONT: &[u8] = include_bytes!("../fonts/NotoSansArabic-Regular.ttf");
static LATIN_FONT: &[u8] = include_bytes!("../fonts/NotoSans-Regular.ttf");

/// Max rows per `GS v 0` command — many cheap printers choke on very tall images.
const BAND_HEIGHT: u32 = 128;
const MARGIN_X: f32 = 6.0;

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Align {
    Left,
    Center,
    Right,
    /// Right-aligned if the line starts with Arabic, otherwise left-aligned.
    Auto,
}

#[derive(Clone, Debug)]
pub enum Row {
    Text { text: String, align: Align, size: f32 },
    /// Two columns on one line: `left` flush-left, `right` flush-right.
    Pair { left: String, right: String, size: f32 },
    Separator,
    Feed(u32),
}

struct FontPair<'a> {
    face: Face<'a>,
    raster: FontRef<'a>,
    upem: f32,
}

pub struct Fonts<'a> {
    arabic: FontPair<'a>,
    latin: FontPair<'a>,
}

impl Fonts<'static> {
    pub fn embedded() -> Result<Self, String> {
        Ok(Fonts {
            arabic: load_pair(ARABIC_FONT)?,
            latin: load_pair(LATIN_FONT)?,
        })
    }
}

fn load_pair(bytes: &'static [u8]) -> Result<FontPair<'static>, String> {
    let face = Face::from_slice(bytes, 0).ok_or("invalid font (rustybuzz)")?;
    let raster = FontRef::try_from_slice(bytes).map_err(|e| format!("invalid font: {e}"))?;
    let upem = face.units_per_em() as f32;
    Ok(FontPair { face, raster, upem })
}

fn is_arabic(c: char) -> bool {
    matches!(c as u32,
        0x0600..=0x06FF | 0x0750..=0x077F | 0x08A0..=0x08FF |
        0xFB50..=0xFDFF | 0xFE70..=0xFEFF)
}

/// Converts Eastern Arabic (٠-٩) and Extended Arabic/Persian (۰-۹) digits to Western (0-9).
pub fn to_western_numerals(input: &str) -> String {
    input
        .chars()
        .map(|c| match c as u32 {
            0x0660..=0x0669 => char::from_u32('0' as u32 + (c as u32 - 0x0660)).unwrap_or(c),
            0x06F0..=0x06F9 => char::from_u32('0' as u32 + (c as u32 - 0x06F0)).unwrap_or(c),
            0x066B => '.',
            0x066C => ',',
            _ => c,
        })
        .collect()
}

#[derive(Clone, Copy)]
struct PlacedGlyph {
    arabic_font: bool,
    id: u16,
    x: f32,
    y_offset: f32,
}

struct LaidOutLine {
    glyphs: Vec<PlacedGlyph>,
    width: f32,
    starts_rtl: bool,
}

impl<'a> Fonts<'a> {
    fn pair(&self, arabic: bool) -> &FontPair<'a> {
        if arabic { &self.arabic } else { &self.latin }
    }

    /// Choose a font for each char: Arabic script → Arabic font; neutral chars inside
    /// an RTL run stay in the Arabic font when it covers them (keeps joining intact).
    fn font_for(&self, c: char, run_rtl: bool) -> bool {
        if is_arabic(c) {
            return true;
        }
        if c.is_alphanumeric() {
            return false;
        }
        run_rtl && self.arabic.raster.glyph_id(c).0 != 0
    }

    fn layout(&self, text: &str, em_px: f32) -> LaidOutLine {
        let mut out = LaidOutLine { glyphs: Vec::new(), width: 0.0, starts_rtl: false };
        let normalized = to_western_numerals(text);
        let text = normalized.as_str();
        if text.is_empty() {
            return out;
        }
        let bidi = BidiInfo::new(text, None);
        let Some(para) = bidi.paragraphs.first() else { return out };
        out.starts_rtl = para.level.is_rtl();

        let (levels, runs) = bidi.visual_runs(para, para.range.clone());
        let mut pen_x = 0.0f32;

        for run in runs {
            let rtl = levels[run.start].is_rtl();
            let run_text = &text[run.clone()];

            // Split the run into same-font segments (logical order).
            let mut segments: Vec<(bool, &str)> = Vec::new();
            let mut seg_start = 0usize;
            let mut seg_font: Option<bool> = None;
            for (i, c) in run_text.char_indices() {
                let f = self.font_for(c, rtl);
                match seg_font {
                    Some(cur) if cur != f => {
                        segments.push((cur, &run_text[seg_start..i]));
                        seg_start = i;
                        seg_font = Some(f);
                    }
                    None => seg_font = Some(f),
                    _ => {}
                }
            }
            if let Some(cur) = seg_font {
                segments.push((cur, &run_text[seg_start..]));
            }
            if rtl {
                segments.reverse(); // visual order for RTL runs
            }

            for (arabic_font, seg) in segments {
                let fp = self.pair(arabic_font);
                let scale = em_px / fp.upem;
                let mut buf = UnicodeBuffer::new();
                buf.push_str(seg);
                buf.set_direction(if rtl { Direction::RightToLeft } else { Direction::LeftToRight });
                let shaped = rustybuzz::shape(&fp.face, &[], buf);
                // rustybuzz returns RTL output already in visual (left→right) order.
                for (info, pos) in shaped.glyph_infos().iter().zip(shaped.glyph_positions()) {
                    out.glyphs.push(PlacedGlyph {
                        arabic_font,
                        id: info.glyph_id as u16,
                        x: pen_x + pos.x_offset as f32 * scale,
                        y_offset: pos.y_offset as f32 * scale,
                    });
                    pen_x += pos.x_advance as f32 * scale;
                }
            }
        }
        out.width = pen_x;
        out
    }

    fn draw(&self, img: &mut GrayImage, line: &LaidOutLine, origin_x: f32, baseline: f32, em_px: f32) {
        for g in &line.glyphs {
            let fp = self.pair(g.arabic_font);
            let Some(px_scale) = fp.raster.pt_to_px_scale(em_px) else { continue };
            let glyph = GlyphId(g.id).with_scale_and_position(
                PxScale::from(px_scale),
                point(origin_x + g.x, baseline - g.y_offset),
            );
            if let Some(outlined) = fp.raster.outline_glyph(glyph) {
                let b = outlined.px_bounds();
                outlined.draw(|gx, gy, cov| {
                    let x = b.min.x as i32 + gx as i32;
                    let y = b.min.y as i32 + gy as i32;
                    if cov > 0.45 && x >= 0 && y >= 0 && (x as u32) < img.width() && (y as u32) < img.height() {
                        img.put_pixel(x as u32, y as u32, Luma([0u8]));
                    }
                });
            }
        }
    }

    /// Greedy word-wrap measured with real shaped widths.
    fn wrap(&self, text: &str, em_px: f32, max_w: f32) -> Vec<String> {
        if self.layout(text, em_px).width <= max_w {
            return vec![text.to_string()];
        }
        let mut lines = Vec::new();
        let mut cur = String::new();
        for word in text.split_whitespace() {
            let candidate = if cur.is_empty() { word.to_string() } else { format!("{cur} {word}") };
            if !cur.is_empty() && self.layout(&candidate, em_px).width > max_w {
                lines.push(std::mem::take(&mut cur));
                cur = word.to_string();
            } else {
                cur = candidate;
            }
        }
        if !cur.is_empty() {
            lines.push(cur);
        }
        lines
    }
}

/// Renders receipt rows onto a white 1-bit canvas `width_px` wide (384 = 58mm, 576 = 80mm).
pub fn render_rows(fonts: &Fonts, rows: &[Row], width_px: u32) -> GrayImage {
    let usable = width_px as f32 - 2.0 * MARGIN_X;

    // Expand rows into drawable lines first so we know the final height.
    enum Op { Line { text: String, align: Align, size: f32 }, Pair { l: String, r: String, size: f32 }, Rule, Gap(u32) }
    let mut ops = Vec::new();
    for row in rows {
        match row {
            Row::Text { text, align, size } => {
                for l in fonts.wrap(text, *size, usable) {
                    ops.push(Op::Line { text: l, align: *align, size: *size });
                }
            }
            Row::Pair { left, right, size } => ops.push(Op::Pair { l: left.clone(), r: right.clone(), size: *size }),
            Row::Separator => ops.push(Op::Rule),
            Row::Feed(px) => ops.push(Op::Gap(*px)),
        }
    }
    let line_h = |size: f32| (size * 1.55).ceil() as u32;
    let height: u32 = ops.iter().map(|o| match o {
        Op::Line { size, .. } | Op::Pair { size, .. } => line_h(*size),
        Op::Rule => 12,
        Op::Gap(px) => *px,
    }).sum::<u32>().max(8);

    let mut img = GrayImage::from_pixel(width_px, height, Luma([255u8]));
    let mut y = 0u32;
    for op in ops {
        match op {
            Op::Line { text, align, size } => {
                let laid = fonts.layout(&text, size);
                let align = match align {
                    Align::Auto => if laid.starts_rtl { Align::Right } else { Align::Left },
                    a => a,
                };
                let x = match align {
                    Align::Left | Align::Auto => MARGIN_X,
                    Align::Center => ((width_px as f32 - laid.width) / 2.0).max(0.0),
                    Align::Right => (width_px as f32 - MARGIN_X - laid.width).max(0.0),
                };
                let baseline = y as f32 + size * 1.15;
                fonts.draw(&mut img, &laid, x, baseline, size);
                y += line_h(size);
            }
            Op::Pair { l, r, size } => {
                let ll = fonts.layout(&l, size);
                let rl = fonts.layout(&r, size);
                let baseline = y as f32 + size * 1.15;
                fonts.draw(&mut img, &ll, MARGIN_X, baseline, size);
                fonts.draw(&mut img, &rl, (width_px as f32 - MARGIN_X - rl.width).max(0.0), baseline, size);
                y += line_h(size);
            }
            Op::Rule => {
                let ry = y + 6;
                for x in (MARGIN_X as u32)..(width_px - MARGIN_X as u32) {
                    if (x / 4) % 2 == 0 && ry < height {
                        img.put_pixel(x, ry, Luma([0u8]));
                    }
                }
                y += 12;
            }
            Op::Gap(px) => y += px,
        }
    }
    img
}

/// Encodes a canvas as ESC/POS: `ESC @`, banded `GS v 0` raster images, feed, cut, drawer kick.
pub fn encode_escpos(img: &GrayImage, cut: bool, open_drawer: bool) -> Vec<u8> {
    let width = img.width();
    let bytes_per_row = width.div_ceil(8);
    let mut out = Vec::with_capacity(16 + (bytes_per_row * img.height()) as usize);

    out.extend_from_slice(&[0x1B, 0x40]); // ESC @ — initialize

    let mut band_start = 0u32;
    while band_start < img.height() {
        let band_h = BAND_HEIGHT.min(img.height() - band_start);
        // GS v 0 m xL xH yL yH
        out.extend_from_slice(&[
            0x1D, 0x76, 0x30, 0x00,
            (bytes_per_row & 0xFF) as u8, ((bytes_per_row >> 8) & 0xFF) as u8,
            (band_h & 0xFF) as u8, ((band_h >> 8) & 0xFF) as u8,
        ]);
        for y in band_start..band_start + band_h {
            for bx in 0..bytes_per_row {
                let mut byte = 0u8;
                for bit in 0..8 {
                    let x = bx * 8 + bit;
                    if x < width && img.get_pixel(x, y).0[0] < 128 {
                        byte |= 0x80 >> bit;
                    }
                }
                out.push(byte);
            }
        }
        band_start += band_h;
    }

    out.extend_from_slice(&[0x1B, 0x64, 0x04]); // ESC d 4 — feed 4 lines
    if cut {
        out.extend_from_slice(&[0x1D, 0x56, 0x42, 0x00]); // GS V B 0 — partial cut
    }
    if open_drawer {
        out.extend_from_slice(&[0x1B, 0x70, 0x00, 0x19, 0xFA]); // ESC p 0 — kick drawer
    }
    out
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

/// Sends raw ESC/POS bytes to a printer.
///
/// `target` forms:
///   - `tcp://192.168.1.50:9100`    — LAN/Wi-Fi thermal printer (raw port 9100)
///   - `\\localhost\POS80`, `COM3`, `/dev/usb/lp0` — device path / shared printer
///   - `POS-80C` (Windows only)     — installed printer name via spooler, RAW datatype
///   - empty (Windows only)         — Windows default printer
pub fn send_to_printer(target: &str, data: &[u8]) -> Result<String, String> {
    use std::io::Write;

    let target = target.trim();
    if let Some(addr) = target.strip_prefix("tcp://") {
        use std::net::{TcpStream, ToSocketAddrs};
        use std::time::Duration;
        let sock = addr
            .to_socket_addrs()
            .map_err(|e| format!("invalid printer address {addr}: {e}"))?
            .next()
            .ok_or_else(|| format!("cannot resolve {addr}"))?;
        let mut stream = TcpStream::connect_timeout(&sock, Duration::from_secs(5))
            .map_err(|e| format!("printer {addr} unreachable: {e}"))?;
        stream.set_write_timeout(Some(Duration::from_secs(10))).ok();
        stream.write_all(data).map_err(|e| format!("write failed: {e}"))?;
        stream.flush().ok();
        return Ok(format!("sent {} bytes to {addr}", data.len()));
    }

    let looks_like_path = target.starts_with("\\\\")
        || target.starts_with('/')
        || target.to_ascii_uppercase().starts_with("COM")
        || target.to_ascii_uppercase().starts_with("LPT");

    if looks_like_path {
        let mut f = std::fs::OpenOptions::new()
            .write(true)
            .open(target)
            .map_err(|e| format!("cannot open printer {target}: {e}"))?;
        f.write_all(data).map_err(|e| format!("write failed: {e}"))?;
        return Ok(format!("sent {} bytes to {target}", data.len()));
    }

    #[cfg(windows)]
    {
        return winspool::write_raw(target, data);
    }

    #[cfg(not(windows))]
    {
        Err(format!(
            "unsupported printer target '{target}' (use tcp://host:9100 or a device path)"
        ))
    }
}

#[cfg(windows)]
mod winspool {
    use std::ffi::c_void;
    use std::ptr::{null, null_mut};
    use windows_sys::Win32::Graphics::Printing::{
        ClosePrinter, EndDocPrinter, EndPagePrinter, GetDefaultPrinterW, OpenPrinterW,
        StartDocPrinterW, StartPagePrinter, WritePrinter, DOC_INFO_1W,
    };

    fn wide(s: &str) -> Vec<u16> {
        s.encode_utf16().chain(std::iter::once(0)).collect()
    }

    fn default_printer() -> Result<Vec<u16>, String> {
        let mut len: u32 = 0;
        unsafe { GetDefaultPrinterW(null_mut(), &mut len) };
        if len == 0 {
            return Err("no default printer configured in Windows".into());
        }
        let mut buf = vec![0u16; len as usize];
        if unsafe { GetDefaultPrinterW(buf.as_mut_ptr(), &mut len) } == 0 {
            return Err("GetDefaultPrinterW failed".into());
        }
        Ok(buf)
    }

    pub fn write_raw(name: &str, data: &[u8]) -> Result<String, String> {
        let mut printer_name = if name.is_empty() { default_printer()? } else { wide(name) };
        let display = String::from_utf16_lossy(&printer_name[..printer_name.len().saturating_sub(1)]);

        let mut handle = Default::default();
        if unsafe { OpenPrinterW(printer_name.as_mut_ptr(), &mut handle, null()) } == 0 {
            return Err(format!("OpenPrinter failed for '{display}'"));
        }

        let mut doc_name = wide("KASPI POS Receipt");
        let mut datatype = wide("RAW");
        let doc = DOC_INFO_1W {
            pDocName: doc_name.as_mut_ptr(),
            pOutputFile: null_mut(),
            pDatatype: datatype.as_mut_ptr(),
        };

        let result = unsafe {
            if StartDocPrinterW(handle, 1, &doc as *const DOC_INFO_1W as *const _) == 0 {
                Err(format!("StartDocPrinter failed for '{display}'"))
            } else {
                StartPagePrinter(handle);
                let mut written: u32 = 0;
                let ok = WritePrinter(handle, data.as_ptr() as *const c_void, data.len() as u32, &mut written);
                EndPagePrinter(handle);
                EndDocPrinter(handle);
                if ok == 0 || written as usize != data.len() {
                    Err(format!("WritePrinter failed ({written}/{} bytes)", data.len()))
                } else {
                    Ok(format!("sent {written} bytes to '{display}'"))
                }
            }
        };
        unsafe { ClosePrinter(handle) };
        result
    }
}
