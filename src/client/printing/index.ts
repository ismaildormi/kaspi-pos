/**
 * Printing Bridge: Detects Tauri Desktop Environment or falls back to Browser Window Print
 * Supports Global Multi-Language Receipts (ar, fr, en, tr, es, de) with strict 0-9 Western numerals.
 */

import {
  type ReceiptLanguage,
  type PrinterConnectionMode,
  getReceiptTranslation,
  formatReceiptAmount,
  formatReceiptDate,
  toWesternNumerals,
  translatePaymentMethod,
} from "@/lib/printing/receipt-translations";

export interface PrintReceiptPayload {
  receiptNumber: string;
  storeName?: string;
  shopName?: string;
  legalName?: string;
  logoUrl?: string;
  ice?: string;
  taxId?: string;
  rcNumber?: string;
  address?: string;
  city?: string;
  phone?: string;
  cashierName?: string;
  createdAt?: string;
  date?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  taxTotal: number;
  discountTotal?: number;
  grandTotal: number;
  paymentMethod: string;
  paidTotal: number;
  changeDue: number;
  currency?: string;
  customerName?: string;
  customerIce?: string;
  qrCodeUrl?: string;
  /** Receipt output language independent of dashboard UI locale */
  receiptLanguage?: ReceiptLanguage;
  /** Thermal printer target for the desktop app: `tcp://192.168.1.50:9100`, `COM3`,
   *  a Windows printer name, or omitted for the Windows default printer. */
  printer?: string;
  printerConnectionMode?: PrinterConnectionMode;
  printerIp?: string;
  printerPort?: string;
  paperWidthMm?: 58 | 80;
  openDrawer?: boolean;
  autoPrintReceipt?: boolean;
  showStoreLogo?: boolean;
  receiptHeader?: string;
  receiptFooter?: string;
  pricingTier?: "retail" | "wholesale";
  sectorMetadata?: string[];
  isDeliveryNote?: boolean;
  isGiftVoucher?: boolean;
}

const PRINTER_SETTINGS_KEY = "kaspi.printer.settings";

function escapeHtml(raw: string): string {
  return String(raw || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolvePrintedStoreName(candidate?: string | null): string {
  const isGeneric = (v?: string | null) => {
    if (!v) return true;
    const t = v.trim();
    return (
      t === "" ||
      t.toUpperCase() === "KASPI POS" ||
      t.toUpperCase() === "KASPI POS GLOBAL" ||
      t === "كسب POS" ||
      t === "Kasbi Retail (كسب)" ||
      t === "Magasin Principal"
    );
  };
  if (!isGeneric(candidate)) return candidate!.trim();
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem("kaspi_store_name");
    if (!isGeneric(saved)) return saved!.trim();
  }
  return "ASIMA";
}

function buildDgiShortHash(receiptNo: string, total: number, itemCount: number): string {
  const seed = `${receiptNo}|${total.toFixed(2)}|${itemCount}|KASPI-DGI`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `DGI-${(hash >>> 0).toString(16).toUpperCase().padStart(8, "0")}-${itemCount}L`;
}

/**
 * Isolated Hidden <iframe /> Thermal Receipt Spooler.
 * Never calls window.print() on the main Next.js window!
 * Prints Store Name in bold header (ZERO logo image) + complete product lines, prices, TVA, and TTC total in pure #000000 ink on #FFFFFF thermal paper.
 */
export async function printThermalReceipt(
  payload: PrintReceiptPayload | any
): Promise<{ success: boolean; transport: "browser_print" }> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { success: false, transport: "browser_print" };
  }

  const stored = getPrinterSettings();
  const data: PrintReceiptPayload =
    typeof payload === "string"
      ? { ...stored, ...JSON.parse(payload) }
      : { ...stored, ...payload };

  const widthMm = data.paperWidthMm === 58 ? 58 : 80;
  const storeName = resolvePrintedStoreName(data.storeName || data.shopName || stored.shopName);
  const receiptNumber = toWesternNumerals(
    data.receiptNumber || `REC-${Date.now().toString().slice(-6)}`
  );
  const createdAt = toWesternNumerals(
    data.createdAt || (data as any).date || formatReceiptDate(new Date(), data.receiptLanguage || "ar")
  );
  const cashierName = data.cashierName || "Caisse 1";
  const currency = toWesternNumerals(data.currency || "MAD");
  const items = Array.isArray(data.items) ? data.items : [];

  const computedSubtotal =
    typeof data.subtotal === "number" && !Number.isNaN(data.subtotal)
      ? data.subtotal
      : items.reduce((s, i) => s + Number(i.unitPrice || 0) * Number(i.quantity || 1), 0);
  const computedTax =
    typeof data.taxTotal === "number" && !Number.isNaN(data.taxTotal) ? data.taxTotal : 0;
  const computedDiscount =
    typeof data.discountTotal === "number" && !Number.isNaN(data.discountTotal)
      ? data.discountTotal
      : 0;
  const computedGrandTotal =
    typeof data.grandTotal === "number" && !Number.isNaN(data.grandTotal)
      ? data.grandTotal
      : computedSubtotal + computedTax - computedDiscount;
  const computedPaid =
    typeof data.paidTotal === "number" && !Number.isNaN(data.paidTotal)
      ? data.paidTotal
      : computedGrandTotal;
  const computedChange =
    typeof data.changeDue === "number" && !Number.isNaN(data.changeDue)
      ? data.changeDue
      : Math.max(0, computedPaid - computedGrandTotal);

  const paymentMethodRaw = String(data.paymentMethod || "cash").toLowerCase();
  const paymentMethodLabel =
    paymentMethodRaw === "cash"
      ? "نقداً (Espèces)"
      : paymentMethodRaw === "card" || paymentMethodRaw === "cmi_tpe"
      ? "بطاقة بنكية (Carte TPE)"
      : paymentMethodRaw === "credit"
      ? "كريدي / الكارني (Crédit)"
      : paymentMethodRaw === "split" || paymentMethodRaw === "transfer"
      ? "أداء مزدوج (Mixte)"
      : data.paymentMethod || "نقداً (Espèces)";

  const saleTypeLabel =
    data.pricingTier === "wholesale"
      ? "بيع بالجملة / بالباك (Gros)"
      : "بيع بالتقسيط (Détail)";

  const dgiHash = buildDgiShortHash(receiptNumber, computedGrandTotal, items.length);

  const itemsRowsHtml = items
    .map((item) => {
      const qty = Number(item.quantity || 1);
      const unitPrice = Number(item.unitPrice || 0);
      const lineTotal =
        typeof item.lineTotal === "number" && !Number.isNaN(item.lineTotal)
          ? item.lineTotal
          : qty * unitPrice;
      const taxRate = (item as any).taxRate;

      return `
        <tr>
          <td class="col-item">
            <div class="item-name">${escapeHtml(item.name || "Article")}</div>
            ${
              taxRate !== undefined && Number(taxRate) > 0
                ? `<div class="item-meta">TVA ${toWesternNumerals(String(taxRate))}%</div>`
                : ""
            }
          </td>
          <td class="col-qty" dir="ltr">${toWesternNumerals(String(qty))} × ${unitPrice.toFixed(2)}</td>
          <td class="col-total" dir="ltr">${lineTotal.toFixed(2)} ${escapeHtml(currency)}</td>
        </tr>
      `;
    })
    .join("");

  const htmlDoc = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>Ticket ${escapeHtml(storeName)} - ${escapeHtml(receiptNumber)}</title>
  <style>
    @page {
      size: ${widthMm}mm auto;
      margin: 0mm;
    }
    * {
      box-sizing: border-box;
      color: #000000 !important;
      background: transparent !important;
      font-family: 'IBM Plex Sans Arabic', 'Cairo', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 4mm 3mm;
      width: ${widthMm}mm;
      max-width: 100%;
      background: #ffffff !important;
      color: #000000 !important;
      direction: rtl;
      font-size: 12px;
      line-height: 1.4;
    }
    .header {
      text-align: center;
      margin-bottom: 6px;
    }
    .store-name {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0;
      margin: 0 0 4px 0;
      text-align: center;
    }
    .store-sub {
      font-size: 11px;
      text-align: center;
      margin: 1px 0;
      font-weight: 600;
    }
    .divider {
      border: 0;
      border-bottom: 1.5px dashed #000000 !important;
      margin: 8px 0;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      margin: 2px 0;
    }
    .meta-label {
      font-weight: 600;
    }
    .meta-val {
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
    }
    table.items-table th {
      border-top: 1.5px solid #000000 !important;
      border-bottom: 1.5px solid #000000 !important;
      padding: 4px 2px;
      font-size: 10.5px;
      font-weight: 800;
      text-align: right;
    }
    table.items-table th.col-qty {
      text-align: center;
    }
    table.items-table th.col-total {
      text-align: left;
    }
    table.items-table td {
      padding: 5px 2px;
      border-bottom: 1px dotted #000000 !important;
      vertical-align: top;
    }
    .item-name {
      font-size: 12.5px;
      font-weight: 800;
      word-break: break-word;
    }
    .item-meta {
      font-size: 9.5px;
      font-weight: 600;
    }
    .col-qty {
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .col-total {
      text-align: left;
      font-size: 12px;
      font-weight: 800;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .grand-total-box {
      border: 2px solid #000000 !important;
      padding: 6px 8px;
      margin: 7px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 15.5px;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }
    .footer {
      text-align: center;
      margin-top: 8px;
      font-size: 10.5px;
    }
    .hash-code {
      font-family: monospace;
      font-size: 9.5px;
      font-weight: 700;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="store-name">${escapeHtml(storeName)}</div>
    ${data.legalName ? `<div class="store-sub">${escapeHtml(data.legalName)}</div>` : ""}
    ${data.address ? `<div class="store-sub">${escapeHtml(data.address)}</div>` : ""}
    ${data.phone ? `<div class="store-sub" dir="ltr">Tel: ${escapeHtml(toWesternNumerals(data.phone))}</div>` : ""}
    ${data.ice ? `<div class="store-sub" dir="ltr">ICE: ${escapeHtml(toWesternNumerals(data.ice))}</div>` : ""}
    ${
      data.taxId || data.rcNumber
        ? `<div class="store-sub" dir="ltr">${data.taxId ? `IF: ${escapeHtml(toWesternNumerals(data.taxId))}` : ""}${
            data.taxId && data.rcNumber ? " | " : ""
          }${data.rcNumber ? `RC: ${escapeHtml(toWesternNumerals(data.rcNumber))}` : ""}</div>`
        : ""
    }
    ${data.receiptHeader ? `<div class="store-sub">${escapeHtml(data.receiptHeader)}</div>` : ""}
  </div>

  <hr class="divider" />

  <div class="meta">
    <div class="meta-row">
      <span class="meta-label">رقم التذكرة / N° Ticket:</span>
      <span class="meta-val" dir="ltr">${escapeHtml(receiptNumber)}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">التاريخ والوقت:</span>
      <span class="meta-val" dir="ltr">${escapeHtml(createdAt)}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">الكاشير / نقطة البيع:</span>
      <span class="meta-val">${escapeHtml(cashierName)}</span>
    </div>
    ${
      data.customerName
        ? `<div class="meta-row"><span class="meta-label">الزبون:</span><span class="meta-val">${escapeHtml(
            data.customerName
          )}</span></div>`
        : ""
    }
    <div class="meta-row">
      <span class="meta-label">النوع:</span>
      <span class="meta-val">${escapeHtml(saleTypeLabel)}</span>
    </div>
  </div>

  <hr class="divider" />

  <table class="items-table">
    <thead>
      <tr>
        <th class="col-item">المنتج (Article)</th>
        <th class="col-qty">الكمية × الثمن</th>
        <th class="col-total">المجموع</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRowsHtml}
    </tbody>
  </table>

  <hr class="divider" />

  <div class="totals">
    <div class="meta-row">
      <span class="meta-label">المجموع الصافي (HT):</span>
      <span class="meta-val" dir="ltr">${computedSubtotal.toFixed(2)} ${escapeHtml(currency)}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">الضريبة (TVA):</span>
      <span class="meta-val" dir="ltr">${computedTax.toFixed(2)} ${escapeHtml(currency)}</span>
    </div>
    ${
      computedDiscount > 0
        ? `<div class="meta-row"><span class="meta-label">التخفيض (Remise):</span><span class="meta-val" dir="ltr">-${computedDiscount.toFixed(
            2
          )} ${escapeHtml(currency)}</span></div>`
        : ""
    }
    <div class="grand-total-box">
      <span>المجموع الإجمالي (TTC):</span>
      <span dir="ltr">${computedGrandTotal.toFixed(2)} ${escapeHtml(currency)}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">طريقة الدفع:</span>
      <span class="meta-val">${escapeHtml(paymentMethodLabel)}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">المبلغ المؤدى:</span>
      <span class="meta-val" dir="ltr">${computedPaid.toFixed(2)} ${escapeHtml(currency)}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">الباقي للزبون:</span>
      <span class="meta-val" dir="ltr">${computedChange.toFixed(2)} ${escapeHtml(currency)}</span>
    </div>
  </div>

  <hr class="divider" />

  <div class="footer">
    <div class="hash-code" dir="ltr">${escapeHtml(dgiHash)}</div>
    <div style="font-weight: 800;">${escapeHtml(
      data.receiptFooter || "شكراً لزيارتكم — Merci de votre visite !"
    )}</div>
  </div>
</body>
</html>`;

  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "kaspi-thermal-spooler");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    const cleanup = () => {
      setTimeout(() => {
        try {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        } catch {}
      }, 600);
    };

    try {
      const doc = iframe.contentWindow?.document;
      if (!doc || !iframe.contentWindow) {
        cleanup();
        resolve({ success: false, transport: "browser_print" });
        return;
      }
      doc.open();
      doc.write(htmlDoc);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          cleanup();
          resolve({ success: true, transport: "browser_print" });
        } catch (err) {
          console.error("[Thermal Spooler] Print error:", err);
          cleanup();
          resolve({ success: false, transport: "browser_print" });
        }
      }, 150);
    } catch (err) {
      console.error("[Thermal Spooler] Iframe setup error:", err);
      cleanup();
      resolve({ success: false, transport: "browser_print" });
    }
  });
}

export interface PrinterSettings {
  receiptLanguage?: ReceiptLanguage;
  printerConnectionMode?: PrinterConnectionMode;
  printer?: string;
  printerIp?: string;
  printerPort?: string;
  paperWidthMm?: 58 | 80;
  openDrawer?: boolean;
  autoPrintReceipt?: boolean;
  showStoreLogo?: boolean;
  logoUrl?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  shopName?: string;
  address?: string;
  ice?: string;
  taxId?: string;
}

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  receiptLanguage: "fr",
  printerConnectionMode: "auto",
  printer: "",
  printerIp: "192.168.1.50",
  printerPort: "9100",
  paperWidthMm: 80,
  openDrawer: true,
  autoPrintReceipt: false,
  showStoreLogo: true,
  receiptHeader: "",
  receiptFooter: "",
};

export function getPrinterSettings(): PrinterSettings {
  if (typeof window === "undefined") return DEFAULT_PRINTER_SETTINGS;
  try {
    const raw = localStorage.getItem(PRINTER_SETTINGS_KEY);
    if (!raw) return DEFAULT_PRINTER_SETTINGS;
    return { ...DEFAULT_PRINTER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PRINTER_SETTINGS;
  }
}

export function savePrinterSettings(settings: PrinterSettings): void {
  if (typeof window === "undefined") return;
  const merged = { ...getPrinterSettings(), ...settings };
  localStorage.setItem(PRINTER_SETTINGS_KEY, JSON.stringify(merged));
}

export async function printReceipt(
  payload: PrintReceiptPayload | any
): Promise<{ success: boolean; transport: "tauri_escpos" | "browser_print" }> {
  const stored = getPrinterSettings();
  const merged: PrintReceiptPayload =
    typeof payload === "string"
      ? { ...stored, ...JSON.parse(payload) }
      : { ...stored, ...payload };

  const lang: ReceiptLanguage = merged.receiptLanguage || stored.receiptLanguage || "fr";
  merged.receiptLanguage = lang;

  // Enforce Western numerals (0-9) on receiptNumber and date
  if (merged.receiptNumber) {
    merged.receiptNumber = toWesternNumerals(merged.receiptNumber);
  }
  if (merged.createdAt) {
    merged.createdAt = toWesternNumerals(merged.createdAt);
  }

  // Resolve printer target based on connection mode
  const mode = merged.printerConnectionMode || stored.printerConnectionMode || "auto";
  if (mode === "network" && merged.printerIp && !merged.printer?.startsWith("tcp://")) {
    const ip = merged.printerIp.trim();
    const port = (merged.printerPort || "9100").trim();
    merged.printer = `tcp://${ip}:${port}`;
  }

  const isTauri =
    typeof window !== "undefined" &&
    ("__TAURI__" in window || "__TAURI_INTERNALS__" in window);

  if (isTauri && mode !== "browser") {
    try {
      const tauri = (window as any).__TAURI__;
      const invoke =
        tauri?.core?.invoke ||
        tauri?.invoke ||
        (window as any).__TAURI_INTERNALS__?.invoke;

      if (typeof invoke === "function") {
        const payloadString = JSON.stringify(merged);
        console.info(`[Tauri Print] Invoking Rust print_receipt (lang=${lang}, width=${merged.paperWidthMm || 80}mm)...`);
        const result = await invoke("print_receipt", { payload: payloadString });
        console.info("[Tauri Print] Hardware response:", result);
        return { success: true, transport: "tauri_escpos" };
      }
    } catch (tauriErr) {
      console.warn("[Tauri Print] Failed to print via Tauri native command, falling back to browser print:", tauriErr);
    }
  }

  // Fallback to Isolated Hidden <iframe /> Thermal Spooler (NEVER call window.print() on main window)
  if (typeof window !== "undefined") {
    return printThermalReceipt(merged);
  }

  return { success: false, transport: "browser_print" };
}

/**
 * Fires a live test receipt print using the selected language and paper width.
 */
export async function printTestReceipt(
  overrides?: Partial<PrintReceiptPayload>
): Promise<{ success: boolean; transport: "tauri_escpos" | "browser_print" }> {
  const stored = getPrinterSettings();
  const lang = overrides?.receiptLanguage || stored.receiptLanguage || "fr";
  const dict = getReceiptTranslation(lang);

  const sampleItems =
    lang === "ar"
      ? [
          { name: "قهوة إسبريسو ممتازة", quantity: 2, unitPrice: 15.0, lineTotal: 30.0 },
          { name: "كرواسون بالزبدة", quantity: 1, unitPrice: 12.0, lineTotal: 12.0 },
        ]
      : lang === "tr"
      ? [
          { name: "Türk Kahvesi (Double)", quantity: 2, unitPrice: 45.0, lineTotal: 90.0 },
          { name: "Tereyağlı Kruvasan", quantity: 1, unitPrice: 60.0, lineTotal: 60.0 },
        ]
      : [
          { name: "Café Espresso Premium", quantity: 2, unitPrice: 15.0, lineTotal: 30.0 },
          { name: "Croissant Pur Beurre", quantity: 1, unitPrice: 12.0, lineTotal: 12.0 },
        ];

  const subtotal = sampleItems.reduce((acc, i) => acc + i.lineTotal, 0);
  const taxTotal = Number((subtotal * 0.2).toFixed(2));
  const grandTotal = subtotal;

  const resolvedShop = resolvePrintedStoreName(overrides?.shopName || stored.shopName);
  const samplePayload: PrintReceiptPayload = {
    ...stored,
    ...overrides,
    receiptLanguage: lang,
    receiptNumber: toWesternNumerals(`TEST-${Date.now().toString().slice(-6)}`),
    shopName: resolvedShop,
    storeName: resolvedShop,
    logoUrl: undefined,
    showStoreLogo: false,
    address: overrides?.address || "Casablanca, Maroc",
    ice: toWesternNumerals(overrides?.ice || "001234567000089"),
    taxId: toWesternNumerals(overrides?.taxId || "12345678"),
    cashierName: "Caisse 1",
    createdAt: formatReceiptDate(new Date(), lang),
    items: sampleItems,
    subtotal: Number((grandTotal - taxTotal).toFixed(2)),
    taxTotal,
    grandTotal,
    paidTotal: grandTotal,
    changeDue: 0,
    paymentMethod: translatePaymentMethod("cash", lang),
    currency: lang === "tr" ? "TRY" : lang === "en" || lang === "es" || lang === "de" ? "EUR" : "MAD",
    receiptHeader: overrides?.receiptHeader || stored.receiptHeader || dict.welcomeHeader,
    receiptFooter: overrides?.receiptFooter || stored.receiptFooter || dict.thankYou,
  };

  return printReceipt(samplePayload);
}
