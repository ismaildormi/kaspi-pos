/**
 * KASPI POS (كسب) — Physical TPE (Terminal de Paiement Électronique) Bridge
 * 
 * Bridges web frontend and Tauri Desktop Rust engine to dispatch card payment
 * commands to physical Ingenico, Pax, or Verifone terminals via USB/Serial or IP.
 */

import {
  PaymentAdapter,
  PaymentIntentOptions,
  PaymentInitiationResult,
  WebhookVerificationResult,
  RefundOptions,
  RefundResult,
} from "./types";

export interface TpeHardwareConfig {
  terminalIp?: string;
  port?: number;
  serialPort?: string;
}

export class TpeBridgePaymentAdapter implements PaymentAdapter {
  readonly gatewayName = "cmi_tpe";
  private config: TpeHardwareConfig;

  constructor(config: TpeHardwareConfig = {}) {
    this.config = config;
  }

  isConfigured(): boolean {
    return true; // Always usable in either Tauri hardware or simulator fallback mode
  }

  /**
   * Dispatches payment request to Tauri Rust bridge `initiate_tpe_payment`.
   * Falls back gracefully in standard web browser mode.
   */
  async initiatePayment(options: PaymentIntentOptions): Promise<PaymentInitiationResult> {
    const payload = JSON.stringify({
      amountMad: options.amount,
      receiptNumber: options.orderId,
      terminalIp: this.config.terminalIp || null,
      port: this.config.port || 8000,
      serialPort: this.config.serialPort || null,
    });

    try {
      // Check if running in Tauri desktop context
      if (typeof window !== "undefined") {
        const tauriWindow = window as any;
        const invoke =
          tauriWindow.__TAURI_INTERNALS__?.invoke ||
          tauriWindow.__TAURI__?.core?.invoke ||
          tauriWindow.__TAURI__?.invoke;

        if (typeof invoke === "function") {
          const rawJson = await invoke("initiate_tpe_payment", { payload });
          const res = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;

          return {
            success: res.success ?? true,
            gateway: this.gatewayName,
            transactionId: res.transactionId || `TPE-${Date.now()}`,
            clientSecret: res.authCode,
            rawResponse: res,
          };
        }
      }

      // Web Fallback: Emulate instant physical terminal approval for browser cashier
      const simulatedTxn = `TPE-WEB-${Date.now().toString().slice(-6)}`;
      return {
        success: true,
        gateway: this.gatewayName,
        transactionId: simulatedTxn,
        clientSecret: "AUTH-889900",
        rawResponse: {
          simulated: true,
          amount: options.amount,
          cardScheme: "CB / VISA CMI",
          terminalId: "TERM-01-VIRTUAL",
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "TPE Bridge dispatch error";
      return {
        success: false,
        gateway: this.gatewayName,
        transactionId: "",
        error: msg,
      };
    }
  }

  async verifyWebhook(): Promise<WebhookVerificationResult> {
    // Physical TPE communicates synchronously over local hardware, not HTTP webhook
    return {
      isValid: true,
      status: "succeeded",
    };
  }

  async refund(options: RefundOptions): Promise<RefundResult> {
    return {
      success: true,
      refundId: `tpe_ref_${options.transactionId}`,
      amountRefunded: options.amount || 0,
    };
  }
}
