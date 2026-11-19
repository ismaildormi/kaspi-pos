"use client";

import type {
  OfficeExportPayload,
  PdfReportPayload,
  ReceiptTicketPayload,
} from "@/lib/zebra-x/core/bridge-schema";
import { touchWasmResource } from "@/lib/zebra-x/core/wasm-watchdog";

/**
 * Arabic Presentation Forms-B mapping: [isolated, final, initial, medial]
 */
const ARABIC_FORMS: Record<string, [string, string, string, string]> = {
  "\u0621": ["\uFE80", "\uFE80", "\uFE80", "\uFE80"], // ء
  "\u0622": ["\uFE81", "\uFE82", "\uFE81", "\uFE82"], // آ
  "\u0623": ["\uFE83", "\uFE84", "\uFE83", "\uFE84"], // أ
  "\u0624": ["\uFE85", "\uFE86", "\uFE85", "\uFE86"], // ؤ
  "\u0625": ["\uFE87", "\uFE88", "\uFE87", "\uFE88"], // إ
  "\u0626": ["\uFE89", "\uFE8A", "\uFE8B", "\uFE8C"], // ئ
  "\u0627": ["\uFE8D", "\uFE8E", "\uFE8D", "\uFE8E"], // ا
  "\u0628": ["\uFE8F", "\uFE90", "\uFE91", "\uFE92"], // ب
  "\u0629": ["\uFE93", "\uFE94", "\uFE93", "\uFE94"], // ة
  "\u062A": ["\uFE95", "\uFE96", "\uFE97", "\uFE98"], // ت
  "\u062B": ["\uFE99", "\uFE9A", "\uFE9B", "\uFE9C"], // ث
  "\u062C": ["\uFE9D", "\uFE9E", "\uFE9F", "\uFEA0"], // ج
  "\u062D": ["\uFEA1", "\uFEA2", "\uFEA3", "\uFEA4"], // ح
  "\u062E": ["\uFEA5", "\uFEA6", "\uFEA7", "\uFEA8"], // خ
  "\u062F": ["\uFEA9", "\uFEAA", "\uFEA9", "\uFEAA"], // د
  "\u0630": ["\uFEAB", "\uFEAC", "\uFEAB", "\uFEAC"], // ذ
  "\u0631": ["\uFEAD", "\uFEAE", "\uFEAD", "\uFEAE"], // ر
  "\u0632": ["\uFEAF", "\uFEB0", "\uFEAF", "\uFEB0"], // ز
  "\u0633": ["\uFEB1", "\uFEB2", "\uFEB3", "\uFEB4"], // س
  "\u0634": ["\uFEB5", "\uFEB6", "\uFEB7", "\uFEB8"], // ش
  "\u0635": ["\uFEB9", "\uFEBA", "\uFEBB", "\uFEBC"], // ص
  "\u0636": ["\uFEBD", "\uFEBE", "\uFEBF", "\uFEC0"], // ض
  "\u0637": ["\uFEC1", "\uFEC2", "\uFEC3", "\uFEC4"], // ط
  "\u0638": ["\uFEC5", "\uFEC6", "\uFEC7", "\uFEC8"], // ظ
  "\u0639": ["\uFEC9", "\uFECA", "\uFECB", "\uFECC"], // ع
  "\u063A": ["\uFECD", "\uFECE", "\uFECF", "\uFED0"], // غ
  "\u0640": ["\u0640", "\u0640", "\u0640", "\u0640"], // ـ tatweel
  "\u0641": ["\uFED1", "\uFED2", "\uFED3", "\uFED4"], // ف
  "\u0642": ["\uFED5", "\uFED6", "\uFED7", "\uFED8"], // ق
  "\u0643": ["\uFED9", "\uFEDA", "\uFEDB", "\uFEDC"], // ك
  "\u0644": ["\uFEDD", "\uFEDE", "\uFEDF", "\uFEE0"], // ل
  "\u0645": ["\uFEE1", "\uFEE2", "\uFEE3", "\uFEE4"], // م
  "\u0646": ["\uFEE5", "\uFEE6", "\uFEE7", "\uFEE8"], // ن
  "\u0647": ["\uFEE9", "\uFEEA", "\uFEEB", "\uFEEC"], // ه
  "\u0648": ["\uFEED", "\uFEEE", "\uFEED", "\uFEEE"], // و
  "\u0649": ["\uFEEF", "\uFEF0", "\uFEEF", "\uFEF0"], // ى
  "\u064A": ["\uFEF1", "\uFEF2", "\uFEF3", "\uFEF4"], // ي
};

const NON_LEFT_CONNECTING = new Set([
  "\u0621",
  "\u0622",
  "\u0623",
  "\u0624",
  "\u0625",
  "\u0627",
  "\u0629",
  "\u062F",
  "\u0630",
  "\u0631",
  "\u0632",
  "\u0648",
  "\u0649",
]);

const LAM_ALEF_LIGATURES: Record<string, [string, string]> = {
  "\u0622": ["\uFEF5", "\uFEF6"],
  "\u0623": ["\uFEF7", "\uFEF8"],
  "\u0625": ["\uFEF9", "\uFEFA"],
  "\u0627": ["\uFEFB", "\uFEFC"],
};

const HARAKAT_RE = /[\u064B-\u065F\u0670]/;
const ARABIC_CHAR_RE = /[\u0600-\u06FF\uFE70-\uFEFF]/;

function normalizeWesternNumerals(input: string): string {
  return input
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

function shapeArabicWord(word: string): string {
  const chars = Array.from(word).filter((ch) => !HARAKAT_RE.test(ch));
  const out: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const curr = chars[i];
    const form = ARABIC_FORMS[curr];
    if (!form) {
      out.push(curr);
      continue;
    }

    const prev = i > 0 ? chars[i - 1] : "";
    const prevConnectsLeft =
      Boolean(prev) && Boolean(ARABIC_FORMS[prev]) && !NON_LEFT_CONNECTING.has(prev);

    // Handle Lam-Alef ligature cleanly
    const next = i + 1 < chars.length ? chars[i + 1] : "";
    if (curr === "\u0644" && next && LAM_ALEF_LIGATURES[next]) {
      const pair = LAM_ALEF_LIGATURES[next];
      out.push(prevConnectsLeft ? pair[1] : pair[0]);
      i++; // Consume Alef
      continue;
    }

    const currConnectsLeft = !NON_LEFT_CONNECTING.has(curr);
    const nextConnectsRight = Boolean(next) && Boolean(ARABIC_FORMS[next]);
    const hasNext = currConnectsLeft && nextConnectsRight;

    if (prevConnectsLeft && hasNext) out.push(form[3]); // medial
    else if (prevConnectsLeft) out.push(form[1]); // final
    else if (hasNext) out.push(form[2]); // initial
    else out.push(form[0]); // isolated
  }

  return out.reverse().join("");
}

/**
 * Prepares mixed Arabic + Latin text for PDFKit/pdfmake visual glyph rendering:
 * - Converts Eastern numerals to standard 0-9 Western digits.
 * - Reshapes Arabic words to Presentation Forms-B with Lam-Alef ligatures.
 * - Orders RTL Arabic runs right-to-left while preserving LTR Latin/numeric tokens cleanly.
 */
export function shapeTextForPdf(rawText: string): string {
  const normalized = normalizeWesternNumerals(String(rawText || ""));
  if (!ARABIC_CHAR_RE.test(normalized)) {
    return normalized;
  }

  // Split by whitespace while keeping punctuation attached nicely
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const runs: Array<{ rtl: boolean; value: string }> = [];

  for (const tok of tokens) {
    const isRtlToken = ARABIC_CHAR_RE.test(tok);
    const transformed = isRtlToken ? shapeArabicWord(tok) : tok;
    const prev = runs[runs.length - 1];
    if (prev && prev.rtl === isRtlToken) {
      prev.value = isRtlToken
        ? `${transformed} ${prev.value}`
        : `${prev.value} ${transformed}`;
    } else {
      runs.push({ rtl: isRtlToken, value: transformed });
    }
  }

  // Overall line RTL reordering when majority or first segment is Arabic
  return runs.reverse().map((r) => r.value).join(" ");
}

let cachedFontVfs: Record<string, string> | null = null;

async function fetchFontAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font fetch failed: ${url}`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function getInitializedPdfMake() {
  const pdfMakeMod: any = await import("pdfmake/build/pdfmake");
  const pdfMake = pdfMakeMod?.default || pdfMakeMod;

  if (!cachedFontVfs) {
    const [arabicB64, latinB64] = await Promise.all([
      fetchFontAsBase64("/fonts/NotoSansArabic-Regular.ttf"),
      fetchFontAsBase64("/fonts/NotoSans-Regular.ttf"),
    ]);
    cachedFontVfs = {
      "NotoSansArabic-Regular.ttf": arabicB64,
      "NotoSans-Regular.ttf": latinB64,
    };
  }

  touchWasmResource("pdfmake_fonts", "Arabic PDF Font VFS", () => {
    cachedFontVfs = null;
  });

  if (typeof pdfMake.addVirtualFileSystem === "function") {
    pdfMake.addVirtualFileSystem(cachedFontVfs);
  }
  if (typeof pdfMake.addFonts === "function") {
    pdfMake.addFonts({
      NotoArabic: {
        normal: "NotoSansArabic-Regular.ttf",
        bold: "NotoSansArabic-Regular.ttf",
        italics: "NotoSansArabic-Regular.ttf",
        bolditalics: "NotoSansArabic-Regular.ttf",
      },
      NotoLatin: {
        normal: "NotoSans-Regular.ttf",
        bold: "NotoSans-Regular.ttf",
        italics: "NotoSans-Regular.ttf",
        bolditalics: "NotoSans-Regular.ttf",
      },
    });
  }

  return pdfMake;
}

function chooseFont(text: string): "NotoArabic" | "NotoLatin" {
  return ARABIC_CHAR_RE.test(text) ? "NotoArabic" : "NotoLatin";
}

function makePdfTextCell(rawText: string, options: Record<string, unknown> = {}) {
  const str = String(rawText ?? "");
  const isAr = ARABIC_CHAR_RE.test(str);
  return {
    text: shapeTextForPdf(str),
    font: chooseFont(str),
    alignment: isAr ? "right" : "left",
    ...options,
  };
}

/**
 * Builds & downloads a crisp multilingual PDF (Arabic RTL + French + English)
 * purely in the browser with zero server/Vercel compute cost.
 */
export async function generateAndDownloadArabicPdf(
  payload: PdfReportPayload,
  filename?: string
): Promise<Blob> {
  const pdfMake = await getInitializedPdfMake();
  const isRtlDoc =
    payload.locale === "ar" ||
    ARABIC_CHAR_RE.test(payload.title) ||
    payload.rows.some((r) => ARABIC_CHAR_RE.test(r.col1));

  const cols = payload.columns;
  const orderedCols = isRtlDoc ? [...cols].reverse() : cols;

  const headerRow = orderedCols.map((col) =>
    makePdfTextCell(col, {
      bold: true,
      fontSize: 10,
      color: "#FFFFFF",
      fillColor: "#0F172A",
      margin: [6, 6, 6, 6],
    })
  );

  const bodyRows = payload.rows.map((row, idx) => {
    const rawCells = [row.col1, row.col2, row.col3, row.col4].slice(0, cols.length);
    const orderedCells = isRtlDoc ? [...rawCells].reverse() : rawCells;
    return orderedCells.map((val) =>
      makePdfTextCell(val || "-", {
        fontSize: 9.5,
        color: "#111827",
        fillColor: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
        margin: [6, 5, 6, 5],
      })
    );
  });

  const totalsBlocks = (payload.totals || []).map((t) => ({
    columns: isRtlDoc
      ? [
          makePdfTextCell(t.value, { fontSize: 11, bold: true, color: "#059669", alignment: "left" }),
          makePdfTextCell(t.label, { fontSize: 11, bold: true, color: "#0F172A", alignment: "right" }),
        ]
      : [
          makePdfTextCell(t.label, { fontSize: 11, bold: true, color: "#0F172A", alignment: "left" }),
          makePdfTextCell(t.value, { fontSize: 11, bold: true, color: "#059669", alignment: "right" }),
        ],
    margin: [0, 3, 0, 3],
  }));

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [32, 36, 32, 42],
    defaultStyle: {
      font: isRtlDoc ? "NotoArabic" : "NotoLatin",
      fontSize: 10,
    },
    content: [
      makePdfTextCell(payload.shopName || "KASPI POS", {
        fontSize: 11,
        color: "#059669",
        bold: true,
        margin: [0, 0, 0, 2],
      }),
      makePdfTextCell(payload.title, {
        fontSize: 18,
        bold: true,
        color: "#0F172A",
        margin: [0, 0, 0, 4],
      }),
      ...(payload.subtitle
        ? [
            makePdfTextCell(payload.subtitle, {
              fontSize: 10,
              color: "#475569",
              margin: [0, 0, 0, 12],
            }),
          ]
        : []),
      makePdfTextCell(`Generated: ${payload.generatedAt}`, {
        fontSize: 8.5,
        color: "#64748B",
        font: "NotoLatin",
        alignment: isRtlDoc ? "right" : "left",
        margin: [0, 0, 0, 12],
      }),
      {
        table: {
          headerRows: 1,
          widths: orderedCols.map(() => "*"),
          body: [headerRow, ...bodyRows],
        },
        layout: {
          hLineColor: () => "#CBD5E1",
          vLineColor: () => "#E2E8F0",
        },
        margin: [0, 4, 0, 14],
      },
      ...totalsBlocks,
      makePdfTextCell("HEYUKA Intelligent Report Engine • KASPI POS", {
        font: "NotoLatin",
        fontSize: 8,
        color: "#94A3B8",
        alignment: "center",
        margin: [0, 18, 0, 0],
      }),
    ],
  };

  const doc = pdfMake.createPdf(docDefinition);
  const blob: Blob = await doc.getBlob();
  const safeName =
    filename ||
    `kaspi-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return blob;
}

/**
 * Converts a ReceiptTicketPayload directly into a structured PdfReportPayload
 * so users can export their last thermal ticket as a crisp Arabic/Latin PDF.
 */
export function buildPdfPayloadFromReceipt(
  receipt: ReceiptTicketPayload,
  locale: string
): PdfReportPayload {
  const isAr = locale === "ar";
  return {
    title: isAr
      ? `تذكرة البيع رقم ${receipt.receiptNumber}`
      : `Ticket de Caisse #${receipt.receiptNumber}`,
    subtitle: receipt.customerName
      ? `${isAr ? "الزبون" : "Client"}: ${receipt.customerName} • ${receipt.paymentMethod.toUpperCase()}`
      : `${receipt.paymentMethod.toUpperCase()}`,
    locale,
    shopName: receipt.shopName,
    generatedAt: receipt.dateIso,
    columns: isAr
      ? ["المنتج", "الكمية", "ثمن الوحدة (MAD)", "المجموع (MAD)"]
      : ["Article", "Qté", "P.U (MAD)", "Total (MAD)"],
    rows: receipt.items.map((it) => ({
      col1: it.name,
      col2: String(it.qty),
      col3: it.unitPrice,
      col4: it.lineTotal,
    })),
    totals: [
      { label: isAr ? "المجموع الفرعي" : "Sous-total", value: `${receipt.subtotalMAD} MAD` },
      ...(Number(receipt.discountTotalMAD) > 0
        ? [{ label: isAr ? "التخفيض" : "Remise", value: `-${receipt.discountTotalMAD} MAD` }]
        : []),
      { label: "TVA", value: `${receipt.taxTotalMAD} MAD` },
      { label: isAr ? "الإجمالي الصافي" : "TOTAL TTC", value: `${receipt.grandTotalMAD} MAD` },
    ],
  };
}

/**
 * Renders a crisp 80mm-style thermal ticket image PNG purely on HTML5 Canvas
 * using native browser text shaping (zero server cost, supports Arabic/Latin/all scripts).
 */
export function renderReceiptTicketPng(receipt: ReceiptTicketPayload): string {
  const width = 420;
  const lineH = 26;
  const height = 250 + receipt.items.length * 36 + 110;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#111827";
  ctx.textAlign = "center";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(receipt.shopName || "KASPI POS", width / 2, 38);

  ctx.font = "12px monospace";
  ctx.fillStyle = "#4B5563";
  if (receipt.storeAddress) ctx.fillText(receipt.storeAddress.slice(0, 48), width / 2, 58);
  ctx.fillText(`Ticket: ${receipt.receiptNumber}`, width / 2, 80);
  ctx.fillText(new Date(receipt.dateIso).toLocaleString(), width / 2, 98);
  if (receipt.customerName) {
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(`Client: ${receipt.customerName}`, width / 2, 120);
  }

  let y = 148;
  ctx.strokeStyle = "#CBD5E1";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(20, y);
  ctx.lineTo(width - 20, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += 24;

  ctx.textAlign = "left";
  ctx.font = "bold 13px sans-serif";
  ctx.fillStyle = "#111827";
  for (const item of receipt.items) {
    ctx.textAlign = "left";
    ctx.fillText(item.name.slice(0, 26), 20, y);
    ctx.textAlign = "right";
    ctx.font = "13px monospace";
    ctx.fillText(`${item.qty} x ${item.unitPrice} = ${item.lineTotal}`, width - 20, y + 16);
    ctx.font = "bold 13px sans-serif";
    y += 36;
  }

  ctx.strokeStyle = "#CBD5E1";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(20, y);
  ctx.lineTo(width - 20, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += 28;

  const drawPair = (label: string, val: string, bold = false, size = 13) => {
    ctx.font = `${bold ? "bold " : ""}${size}px monospace`;
    ctx.fillStyle = bold ? "#059669" : "#374151";
    ctx.textAlign = "left";
    ctx.fillText(label, 20, y);
    ctx.textAlign = "right";
    ctx.fillText(val, width - 20, y);
    y += lineH;
  };

  drawPair("Subtotal:", `${receipt.subtotalMAD} MAD`);
  if (Number(receipt.discountTotalMAD) > 0) {
    drawPair("Discount:", `-${receipt.discountTotalMAD} MAD`);
  }
  drawPair("TVA:", `${receipt.taxTotalMAD} MAD`);
  drawPair("TOTAL TTC:", `${receipt.grandTotalMAD} MAD`, true, 16);
  drawPair("Payment:", receipt.paymentMethod.toUpperCase());

  ctx.textAlign = "center";
  ctx.font = "11px sans-serif";
  ctx.fillStyle = "#6B7280";
  ctx.fillText("HEYUKA Smart Receipt • Thank you", width / 2, y + 14);

  return canvas.toDataURL("image/png");
}

// ============================================================================
// Phase 2 Universal Browser Document Engines (Lazy-Loaded Dynamic Imports)
// Covers: PDF Read (PDF.js), Word Write/Read (docx + mammoth), Excel/CSV
// Write/Read/Analyze (exceljs + papaparse), PowerPoint (pptxgenjs), Text Diff
// ============================================================================

function triggerBrowserBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Extracts text across pages from a PDF ArrayBuffer completely inside the browser via `pdfjs-dist`.
 */
export async function extractTextFromPdfBuffer(buffer: ArrayBuffer): Promise<{
  pageCount: number;
  text: string;
}> {
  const pdfjs = await import("pdfjs-dist");
  if (typeof window !== "undefined" && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/workers/pdf.worker.min.mjs";
  }

  touchWasmResource("pdfjs-reader", "PDF.js Reader", () => {});
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  const doc = await loadingTask.promise;
  const pages: string[] = [];

  const maxPages = Math.min(doc.numPages, 40);
  for (let p = 1; p <= maxPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const pageText = (tc.items as any[])
      .map((item) => ("str" in item ? String(item.str) : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) pages.push(`--- Page ${p} ---\n${pageText}`);
  }
  await doc.cleanup().catch(() => {});
  await loadingTask.destroy().catch(() => {});

  return {
    pageCount: doc.numPages,
    text: pages.join("\n\n"),
  };
}

/**
 * Extracts plain text and HTML from an uploaded Word (.docx) file locally via `mammoth`.
 */
export async function extractTextFromWordBuffer(buffer: ArrayBuffer): Promise<{
  text: string;
  html: string;
}> {
  const mammoth = await import("mammoth");
  const [rawRes, htmlRes] = await Promise.all([
    mammoth.extractRawText({ arrayBuffer: buffer }),
    mammoth.convertToHtml({ arrayBuffer: buffer }),
  ]);
  return {
    text: (rawRes.value || "").trim(),
    html: htmlRes.value || "",
  };
}

/**
 * Generates and downloads a real Word (.docx) file in browser via lazy `docx` library (RTL/LTR ready).
 */
export async function generateAndDownloadWordDocx(
  payload: OfficeExportPayload
): Promise<{ filename: string }> {
  const {
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import("docx");

  const isRtl = payload.locale === "ar";
  const children: any[] = [
    new Paragraph({
      text: payload.title,
      heading: HeadingLevel.HEADING_1,
      bidirectional: isRtl,
    }),
  ];

  if (payload.subtitle) {
    children.push(
      new Paragraph({
        bidirectional: isRtl,
        children: [new TextRun({ text: payload.subtitle, italics: true, color: "555555" })],
      })
    );
  }

  for (const sec of payload.sections || []) {
    children.push(
      new Paragraph({
        text: sec.heading,
        heading: HeadingLevel.HEADING_2,
        bidirectional: isRtl,
      })
    );
    if (sec.body) {
      children.push(new Paragraph({ text: sec.body, bidirectional: isRtl }));
    }
    for (const b of sec.bullets || []) {
      children.push(
        new Paragraph({
          text: b,
          bullet: { level: 0 },
          bidirectional: isRtl,
        })
      );
    }
  }

  if (payload.columns && payload.columns.length > 0 && payload.rows && payload.rows.length > 0) {
    const headerRow = new TableRow({
      children: payload.columns.map(
        (col) =>
          new TableCell({
            children: [
              new Paragraph({
                bidirectional: isRtl,
                children: [new TextRun({ text: col, bold: true })],
              }),
            ],
          })
      ),
    });

    const dataRows = payload.rows.map(
      (r) =>
        new TableRow({
          children: payload.columns!.map(
            (_, idx) =>
              new TableCell({
                children: [new Paragraph({ text: String(r[idx] ?? ""), bidirectional: isRtl })],
              })
          ),
        })
    );

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        visuallyRightToLeft: isRtl,
        rows: [headerRow, ...dataRows],
      })
    );
  }

  for (const tot of payload.totals || []) {
    children.push(
      new Paragraph({
        bidirectional: isRtl,
        children: [
          new TextRun({ text: `${tot.label}: `, bold: true }),
          new TextRun({ text: tot.value }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });
  const blob = await Packer.toBlob(doc);
  const slug = (payload.title || "kaspi-document")
    .replace(/[^\w\u0600-\u06FF-]+/g, "-")
    .slice(0, 40);
  const filename = `${slug || "kaspi-document"}.docx`;
  triggerBrowserBlobDownload(blob, filename);
  return { filename };
}

/**
 * Generates and downloads a styled Excel (.xlsx) workbook directly inside the browser via `exceljs`.
 */
export async function generateAndDownloadExcelXlsx(
  payload: OfficeExportPayload
): Promise<{ filename: string }> {
  const ExcelMod = await import("exceljs");
  const Workbook = (ExcelMod as any).Workbook ?? ExcelMod.default?.Workbook;
  const wb = new Workbook();
  wb.creator = "KASPI POS - HEYUKA";
  wb.created = new Date();

  const sheet = wb.addWorksheet(payload.title.slice(0, 28) || "Report", {
    views: [{ rightToLeft: payload.locale === "ar" }],
  });

  if (payload.columns && payload.columns.length > 0) {
    const headerRow = sheet.addRow(payload.columns);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF059669" },
    };
  }

  for (const r of payload.rows || []) {
    sheet.addRow(
      r.map((cell) => {
        const num = Number(cell);
        return cell.trim() !== "" && Number.isFinite(num) && /^-?\d+(\.\d+)?$/.test(cell.trim())
          ? num
          : cell;
      })
    );
  }

  if (payload.totals && payload.totals.length > 0) {
    sheet.addRow([]);
    for (const t of payload.totals) {
      const row = sheet.addRow([t.label, t.value]);
      row.font = { bold: true };
    }
  }

  sheet.columns.forEach((col: any) => {
    col.width = 22;
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const slug = (payload.title || "kaspi-sheet")
    .replace(/[^\w\u0600-\u06FF-]+/g, "-")
    .slice(0, 40);
  const filename = `${slug || "kaspi-sheet"}.xlsx`;
  triggerBrowserBlobDownload(blob, filename);
  return { filename };
}

/**
 * Parses uploaded .xlsx spreadsheet rows in browser via `exceljs` for instant AI analysis.
 */
export async function parseExcelBufferToText(buffer: ArrayBuffer): Promise<{
  sheetName: string;
  rowCount: number;
  previewCsv: string;
}> {
  const ExcelMod = await import("exceljs");
  const Workbook = (ExcelMod as any).Workbook ?? ExcelMod.default?.Workbook;
  const wb = new Workbook();
  await wb.xlsx.load(buffer);
  const sheet = wb.worksheets[0];
  if (!sheet) return { sheetName: "Empty", rowCount: 0, previewCsv: "" };

  const lines: string[] = [];
  sheet.eachRow((row: any, rowNum: number) => {
    if (rowNum > 120) return;
    const vals = (row.values as any[]).slice(1).map((v) => String(v ?? "").replace(/,/g, " "));
    lines.push(vals.join(", "));
  });
  return {
    sheetName: sheet.name,
    rowCount: sheet.rowCount,
    previewCsv: lines.join("\n"),
  };
}

/**
 * Generates and downloads a multi-slide PowerPoint (.pptx) presentation cleanly via `pptxgenjs`.
 */
export async function generateAndDownloadPowerPointPptx(
  payload: OfficeExportPayload
): Promise<{ filename: string }> {
  const pptxMod = await import("pptxgenjs");
  const PptxGenJS = (pptxMod as any).default ?? pptxMod;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "HEYUKA • KASPI";
  pptx.title = payload.title;

  // Title slide
  const cover = pptx.addSlide();
  cover.background = { color: "0F172A" };
  cover.addText(payload.title, {
    x: 0.7,
    y: 1.8,
    w: 8.6,
    h: 1.2,
    fontSize: 30,
    bold: true,
    color: "34D399",
    align: payload.locale === "ar" ? "right" : "left",
  });
  if (payload.subtitle) {
    cover.addText(payload.subtitle, {
      x: 0.7,
      y: 3.1,
      w: 8.6,
      h: 0.8,
      fontSize: 16,
      color: "E2E8F0",
      align: payload.locale === "ar" ? "right" : "left",
    });
  }

  for (const sec of payload.sections || []) {
    const s = pptx.addSlide();
    s.background = { color: "111827" };
    s.addText(sec.heading, {
      x: 0.6,
      y: 0.5,
      w: 8.8,
      h: 0.7,
      fontSize: 22,
      bold: true,
      color: "34D399",
      align: payload.locale === "ar" ? "right" : "left",
    });
    const bodyText = [
      ...(sec.body ? [sec.body] : []),
      ...(sec.bullets || []).map((b) => `• ${b}`),
    ].join("\n");
    s.addText(bodyText, {
      x: 0.6,
      y: 1.4,
      w: 8.8,
      h: 3.6,
      fontSize: 15,
      color: "F8FAFC",
      valign: "top",
      align: payload.locale === "ar" ? "right" : "left",
    });
  }

  if (payload.columns && payload.columns.length > 0 && payload.rows && payload.rows.length > 0) {
    const tSlide = pptx.addSlide();
    tSlide.background = { color: "111827" };
    const tableRows = [
      payload.columns.map((c) => ({
        text: c,
        options: { bold: true, fill: { color: "059669" }, color: "FFFFFF" },
      })),
      ...payload.rows.slice(0, 14).map((r) =>
        r.map((cell) => ({ text: String(cell), options: { color: "F8FAFC", fill: { color: "1E293B" } } }))
      ),
    ];
    tSlide.addTable(tableRows, { x: 0.5, y: 0.7, w: 9.0, fontSize: 11 });
  }

  const slug = (payload.title || "kaspi-deck")
    .replace(/[^\w\u0600-\u06FF-]+/g, "-")
    .slice(0, 40);
  const filename = `${slug || "kaspi-deck"}.pptx`;
  await pptx.writeFile({ fileName: filename });
  return { filename };
}

/**
 * Lightweight zero-TensorFlow CSV DataFrame analyzer powered by installed `papaparse`.
 */
export async function analyzeCsvDataframe(csvText: string) {
  const Papa = (await import("papaparse")).default;
  const parsed = Papa.parse<Record<string, string>>(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
  });
  const rows = parsed.data || [];
  const fields = parsed.meta?.fields || [];
  const numericStats: Record<string, { count: number; sum: number; min: number; max: number; avg: number }> = {};

  for (const col of fields) {
    const nums = rows
      .map((r) => Number(String(r[col] ?? "").replace(/,/g, "")))
      .filter((n) => Number.isFinite(n));
    if (nums.length > 0) {
      const sum = nums.reduce((a, b) => a + b, 0);
      numericStats[col] = {
        count: nums.length,
        sum: Number(sum.toFixed(2)),
        min: Math.min(...nums),
        max: Math.max(...nums),
        avg: Number((sum / nums.length).toFixed(2)),
      };
    }
  }

  return {
    rowCount: rows.length,
    columns: fields,
    numericStats,
    sampleRows: rows.slice(0, 5),
  };
}
