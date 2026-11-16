/**
 * Printing Bridge: Detects Tauri Desktop Environment or falls back to Browser Window Print
 * Supports Global Multi-Language Receipts (ar, fr, en) with strict 0-9 Western numerals.
 * 100% Merchant Store Branded, ZERO Kaspi Logo, Zero Phone Number, Zero Fake DGI IDs.
 */

import {
  type ReceiptLanguage,
  type PrinterConnectionMode,
  getReceiptTranslation,
  formatReceiptAmount,
  formatReceiptDate,
  formatReceiptIsoDateTime,
  toWesternNumerals,
  translatePaymentMethod,
} from "@/lib/printing/receipt-translations";
import { generateCode128Svg, generateQrCodeSvg } from "@/lib/printing/client-codes";

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
    unit?: string;
    modifiers?: string[];
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
  orderNumber?: string | number;
  serviceMode?: "dine_in" | "takeaway" | "delivery";
  taxDisplayMode?: "INCLUSIVE_CLEAN" | "TAX_BREAKDOWN";
  storeIndustryType?: string;
  showLegalIceOnReceipt?: boolean;
  receiptFooterCodeType?: "NONE" | "TICKET_BARCODE_1D" | "STORE_QR_CODE";
  receiptQrTargetUrl?: string;
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

/**
 * Isolated Hidden <iframe /> Thermal Receipt Spooler.
 * Never calls window.print() on the main Next.js window!
 * Prints Store Name in bold header (ZERO logo image) in pure #000000 ink on #FFFFFF thermal paper.
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
  const rawCreatedAt = data.createdAt || (data as any).date;
  const formattedDateTime = formatReceiptIsoDateTime(rawCreatedAt);

  const cashierName = data.cashierName || "Caisse 1";
  const currency = toWesternNumerals(data.currency || "MAD");
  const items = Array.isArray(data.items) ? data.items : [];
  const lang: ReceiptLanguage = data.receiptLanguage || stored.receiptLanguage || "ar";
  const dict = getReceiptTranslation(lang);
  const isRtl = dict.dir === "rtl";

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

  // In INCLUSIVE_CLEAN (default): grandTotal is exact retail price without added VAT surcharge
  const taxMode = data.taxDisplayMode || stored.taxDisplayMode || "INCLUSIVE_CLEAN";
  const isTaxBreakdown = taxMode === "TAX_BREAKDOWN";

  const computedGrandTotal =
    typeof data.grandTotal === "number" && !Number.isNaN(data.grandTotal)
      ? data.grandTotal
      : isTaxBreakdown
      ? computedSubtotal + computedTax - computedDiscount
      : Math.max(0, computedSubtotal - computedDiscount);

  const computedPaid =
    typeof data.paidTotal === "number" && !Number.isNaN(data.paidTotal)
      ? data.paidTotal
      : computedGrandTotal;
  const computedChange =
    typeof data.changeDue === "number" && !Number.isNaN(data.changeDue)
      ? data.changeDue
      : Math.max(0, computedPaid - computedGrandTotal);

  const paymentMethodRaw = String(data.paymentMethod || "cash").toLowerCase();
  const paymentMethodLabel = translatePaymentMethod(paymentMethodRaw, lang);

  const saleTypeLabel =
    data.pricingTier === "wholesale"
      ? dict.wholesale
      : dict.retail;

  // Deduplicate Address and City
  const rawCity = (data.city || "").trim();
  let rawAddress = (data.address || "").trim();
  if (rawCity && rawAddress.toLowerCase().includes(rawCity.toLowerCase())) {
    rawAddress = rawAddress.replace(new RegExp(`,?\\s*${rawCity}`, "i"), "").trim();
  }
  const addressLine = [rawAddress, rawCity].filter(Boolean).join(" - ");

  // Legal IDs: Only real ICE if explicitly non-demo
  const isDemoIce = (v?: string | null) =>
    !v || v === "002345678000045" || v === "001987654000089" || v.startsWith("0000");
  const hasRealIce = Boolean(data.ice && !isDemoIce(data.ice));
  const showIce = hasRealIce && data.showLegalIceOnReceipt !== false;

  // Detect Cafe / Restaurant Mode
  const isCafeRestaurant =
    data.storeIndustryType === "restaurant" ||
    data.storeIndustryType === "cafe" ||
    data.storeIndustryType === "cafe_restaurant" ||
    Boolean(data.orderNumber) ||
    Boolean(data.serviceMode);

  const heroOrderNo =
    data.orderNumber ||
    (receiptNumber ? receiptNumber.replace(/^[A-Za-z-]+/, "").slice(-3) : "1");

  // Client-Side 1D Barcode & 2D QR Code Generation
  const codeType = data.receiptFooterCodeType || stored.receiptFooterCodeType || "NONE";
  const barcodeSvg =
    codeType === "TICKET_BARCODE_1D"
      ? generateCode128Svg(receiptNumber, {
          height: 38,
          barWidth: widthMm === 58 ? 1.3 : 1.7,
          showText: true,
        })
      : "";

  const qrSvg =
    codeType === "STORE_QR_CODE"
      ? generateQrCodeSvg(data.receiptQrTargetUrl || stored.receiptQrTargetUrl || "https://kaspi.ma", {
          size: widthMm === 58 ? 76 : 94,
        })
      : "";

  const itemsRowsHtml = items
    .map((item) => {
      const qty = Number(item.quantity || 1);
      const unitPrice = Number(item.unitPrice || 0);
      const lineTotal =
        typeof item.lineTotal === "number" && !Number.isNaN(item.lineTotal)
          ? item.lineTotal
          : qty * unitPrice;
      const unitLabel = item.unit ? ` ${escapeHtml(item.unit)}` : "";
      const modifiers = Array.isArray(item.modifiers) && item.modifiers.length > 0
        ? `<div class="item-meta">+ ${escapeHtml(item.modifiers.join(", "))}</div>`
        : "";

      return `
        <tr>
          <td class="col-item">
            <div class="item-name">${escapeHtml(item.name || "Article")}</div>
            ${modifiers}
          </td>
          <td class="col-qty" dir="ltr">${toWesternNumerals(String(qty))}${unitLabel} × ${unitPrice.toFixed(2)}</td>
          <td class="col-total" dir="ltr">${lineTotal.toFixed(2)} ${escapeHtml(currency)}</td>
        </tr>
      `;
    })
    .join("");

  const htmlDoc = `<!DOCTYPE html>
<html lang="${lang}" dir="${dict.dir}">
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
      direction: ${dict.dir};
      font-size: 11.5px;
      line-height: 1.35;
    }
    .header {
      text-align: center;
      margin-bottom: 6px;
    }
    .store-name {
      font-size: 19px;
      font-weight: 900;
      letter-spacing: 0;
      margin: 0 0 3px 0;
      text-align: center;
      text-transform: uppercase;
    }
    .store-sub {
      font-size: 10.5px;
      text-align: center;
      margin: 1px 0;
      font-weight: 600;
    }
    .hero-order-box {
      border: 2px solid #000000 !important;
      padding: 5px 6px;
      margin: 6px 0;
      text-align: center;
      border-radius: 4px;
    }
    .hero-order-label {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .hero-order-num {
      font-size: 24px;
      font-weight: 900;
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
    }
    .hero-order-mode {
      font-size: 9.5px;
      font-weight: 800;
      display: inline-block;
      border: 1px solid #000000;
      padding: 1px 6px;
      border-radius: 3px;
      margin-top: 2px;
    }
    .divider {
      border: 0;
      border-bottom: 1.5px dashed #000000 !important;
      margin: 6px 0;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
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
      font-size: 10px;
      font-weight: 800;
      text-align: ${isRtl ? "right" : "left"};
    }
    table.items-table th.col-qty {
      text-align: center;
    }
    table.items-table th.col-total {
      text-align: ${isRtl ? "left" : "right"};
    }
    table.items-table td {
      padding: 4px 2px;
      border-bottom: 1px dotted #000000 !important;
      vertical-align: top;
    }
    .item-name {
      font-size: 11.5px;
      font-weight: 800;
      word-break: break-word;
    }
    .item-meta {
      font-size: 9px;
      font-weight: 600;
      font-style: italic;
    }
    .col-qty {
      text-align: center;
      font-size: 10.5px;
      font-weight: 700;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .col-total {
      text-align: ${isRtl ? "left" : "right"};
      font-size: 11.5px;
      font-weight: 800;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .grand-total-box {
      border-top: 2px solid #000000 !important;
      border-bottom: 2px solid #000000 !important;
      padding: 5px 2px;
      margin: 6px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 15px;
      font-weight: 900;
      font-variant-numeric: tabular-nums;
    }
    .footer {
      text-align: center;
      margin-top: 7px;
      font-size: 10.5px;
    }
    .code-container {
      margin: 6px auto;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="store-name">${escapeHtml(storeName)}</div>
    ${addressLine ? `<div class="store-sub">${escapeHtml(addressLine)}</div>` : ""}
    ${showIce ? `<div class="store-sub" dir="ltr">ICE: ${escapeHtml(toWesternNumerals(data.ice))}</div>` : ""}
    ${data.receiptHeader ? `<div class="store-sub">${escapeHtml(data.receiptHeader)}</div>` : ""}
  </div>

  ${
    isCafeRestaurant
      ? `
  <div class="hero-order-box">
    <div class="hero-order-label">${escapeHtml(dict.orderNumber)}</div>
    <div class="hero-order-num" dir="ltr">#${escapeHtml(toWesternNumerals(heroOrderNo))}</div>
    ${
      data.serviceMode
        ? `<div class="hero-order-mode">${escapeHtml(
            data.serviceMode === "dine_in"
              ? dict.dineIn
              : data.serviceMode === "takeaway"
              ? dict.takeaway
              : dict.delivery
          )}</div>`
        : ""
    }
  </div>`
      : ""
  }

  <hr class="divider" />

  <div class="meta">
    <div class="meta-row">
      <span class="meta-label">${escapeHtml(dict.invoiceNo)}:</span>
      <span class="meta-val" dir="ltr">${escapeHtml(receiptNumber)}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">${escapeHtml(dict.date)}:</span>
      <span class="meta-val" dir="ltr" style="direction:ltr;unicode-bidi:isolate;">${escapeHtml(formattedDateTime)}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">${escapeHtml(dict.cashier)}:</span>
      <span class="meta-val">${escapeHtml(cashierName)}</span>
    </div>
    ${
      data.customerName
        ? `<div class="meta-row"><span class="meta-label">${escapeHtml(dict.customer)}:</span><span class="meta-val">${escapeHtml(
            data.customerName
          )}</span></div>`
        : ""
    }
    <div class="meta-row">
      <span class="meta-label">${escapeHtml(dict.serviceMode)}:</span>
      <span class="meta-val">${escapeHtml(saleTypeLabel)}</span>
    </div>
  </div>

  <hr class="divider" />

  <table class="items-table">
    <thead>
      <tr>
        <th class="col-item">${escapeHtml(dict.item)}</th>
        <th class="col-qty">${escapeHtml(dict.qty)}</th>
        <th class="col-total">${escapeHtml(dict.lineTotal)}</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRowsHtml}
    </tbody>
  </table>

  <hr class="divider" />

  <div class="totals">
    ${
      isTaxBreakdown
        ? `
    <div class="meta-row">
      <span class="meta-label">${escapeHtml(dict.subtotal)}:</span>
      <span class="meta-val" dir="ltr">${computedSubtotal.toFixed(2)} ${escapeHtml(currency)}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">${escapeHtml(dict.tax)}:</span>
      <span class="meta-val" dir="ltr">${computedTax.toFixed(2)} ${escapeHtml(currency)}</span>
    </div>`
        : ""
    }
    ${
      computedDiscount > 0
        ? `<div class="meta-row"><span class="meta-label">${escapeHtml(dict.discount)}:</span><span class="meta-val" dir="ltr">-${computedDiscount.toFixed(
            2
          )} ${escapeHtml(currency)}</span></div>`
        : ""
    }
    <div class="grand-total-box">
      <span>${escapeHtml(dict.totalClean)}:</span>
      <span dir="ltr">${computedGrandTotal.toFixed(2)} ${escapeHtml(currency)}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">${escapeHtml(dict.paymentMethod)}:</span>
      <span class="meta-val">${escapeHtml(paymentMethodLabel)}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">${escapeHtml(dict.paid)}:</span>
      <span class="meta-val" dir="ltr">${computedPaid.toFixed(2)} ${escapeHtml(currency)}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">${escapeHtml(dict.change)}:</span>
      <span class="meta-val" dir="ltr">${computedChange.toFixed(2)} ${escapeHtml(currency)}</span>
    </div>
  </div>

  <hr class="divider" />

  <div class="footer">
    <div style="font-weight: 800; margin-bottom: 4px;">${escapeHtml(
      data.receiptFooter || dict.thankYou
    )}</div>
    ${barcodeSvg ? `<div class="code-container">${barcodeSvg}</div>` : ""}
    ${qrSvg ? `<div class="code-container">${qrSvg}</div>` : ""}
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
  taxDisplayMode?: "INCLUSIVE_CLEAN" | "TAX_BREAKDOWN";
  showLegalIceOnReceipt?: boolean;
  receiptFooterCodeType?: "NONE" | "TICKET_BARCODE_1D" | "STORE_QR_CODE";
  receiptQrTargetUrl?: string;
}

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  receiptLanguage: "ar",
  printerConnectionMode: "auto",
  printer: "",
  printerIp: "192.168.1.50",
  printerPort: "9100",
  paperWidthMm: 80,
  openDrawer: true,
  autoPrintReceipt: false,
  showStoreLogo: false,
  receiptHeader: "",
  receiptFooter: "",
  taxDisplayMode: "INCLUSIVE_CLEAN",
  showLegalIceOnReceipt: false,
  receiptFooterCodeType: "NONE",
  receiptQrTargetUrl: "",
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
