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
  ice?: string;
  taxId?: string;
  rcNumber?: string;
  address?: string;
  cashierName?: string;
  createdAt: string;
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
}

const PRINTER_SETTINGS_KEY = "kaspi.printer.settings";

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
  receiptHeader?: string;
  receiptFooter?: string;
}

export const DEFAULT_PRINTER_SETTINGS: Required<PrinterSettings> = {
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

  // Fallback to Browser Print
  if (typeof window !== "undefined") {
    console.info("[Print Bridge] Falling back to browser window.print()...");
    window.print();
    return { success: true, transport: "browser_print" };
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

  const samplePayload: PrintReceiptPayload = {
    ...stored,
    ...overrides,
    receiptLanguage: lang,
    receiptNumber: toWesternNumerals(`TEST-${Date.now().toString().slice(-6)}`),
    shopName: overrides?.shopName || "KASPI POS GLOBAL",
    storeName: overrides?.shopName || "KASPI POS GLOBAL",
    address: overrides?.address || "Casablanca • Paris • Istanbul",
    ice: toWesternNumerals(overrides?.ice || "001234567000089"),
    taxId: toWesternNumerals(overrides?.taxId || "12345678"),
    cashierName: "Admin Studio",
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
