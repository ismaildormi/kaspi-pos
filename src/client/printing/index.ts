/**
 * Printing Bridge: Detects Tauri Desktop Environment or falls back to Browser Window Print
 */

export interface PrintReceiptPayload {
  receiptNumber: string;
  storeName: string;
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
  customerName?: string;
  customerIce?: string;
  qrCodeUrl?: string;
  /** Thermal printer target for the desktop app: `tcp://192.168.1.50:9100`, `COM3`,
   *  a Windows printer name, or omitted for the Windows default printer. */
  printer?: string;
  paperWidthMm?: 58 | 80;
  openDrawer?: boolean;
}

const PRINTER_SETTINGS_KEY = "kaspi.printer.settings";

export interface PrinterSettings {
  printer?: string;
  paperWidthMm?: 58 | 80;
  openDrawer?: boolean;
}

export function getPrinterSettings(): PrinterSettings {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PRINTER_SETTINGS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function savePrinterSettings(settings: PrinterSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRINTER_SETTINGS_KEY, JSON.stringify(settings));
}

export async function printReceipt(
  payload: PrintReceiptPayload | any
): Promise<{ success: boolean; transport: "tauri_escpos" | "browser_print" }> {
  const isTauri =
    typeof window !== "undefined" &&
    ("__TAURI__" in window || "__TAURI_INTERNALS__" in window);

  const payloadString =
    typeof payload === "string"
      ? payload
      : JSON.stringify({ ...getPrinterSettings(), ...payload });

  if (isTauri) {
    try {
      const tauri = (window as any).__TAURI__;
      const invoke =
        tauri?.core?.invoke ||
        tauri?.invoke ||
        (window as any).__TAURI_INTERNALS__?.invoke;

      if (typeof invoke === "function") {
        console.info("[Tauri Print] Invoking Rust print_receipt command...");
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
