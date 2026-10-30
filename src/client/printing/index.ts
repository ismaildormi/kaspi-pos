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
}

export async function printReceipt(
  payload: PrintReceiptPayload | any
): Promise<{ success: boolean; transport: "tauri_escpos" | "browser_print" }> {
  const isTauri =
    typeof window !== "undefined" &&
    ("__TAURI__" in window || "__TAURI_INTERNALS__" in window);

  const payloadString =
    typeof payload === "string" ? payload : JSON.stringify(payload);

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
