/**
 * KASPI POS (كسب) — Payzone Moroccan Payment & 3DS2 Adapter (`PayzoneAdapter.ts`)
 */

import crypto from "crypto";
import type {
  PaymentAdapter,
  PaymentIntentOptions,
  PaymentInitiationResult,
  WebhookVerificationResult,
  RefundOptions,
  RefundResult,
} from "./types";

export class PayzonePaymentAdapter implements PaymentAdapter {
  readonly gatewayName = "payzone";
  private merchantAccount: string;
  private secretKey: string;

  constructor(merchantAccount?: string, secretKey?: string) {
    this.merchantAccount = merchantAccount || process.env.PAYZONE_MERCHANT_ACCOUNT || "";
    this.secretKey = secretKey || process.env.PAYZONE_SECRET_KEY || "";
  }

  isConfigured(): boolean {
    return Boolean(this.merchantAccount && this.secretKey);
  }

  async initiatePayment(options: PaymentIntentOptions): Promise<PaymentInitiationResult> {
    const settlementTarget =
      options.flow === "MERCHANT_POS" ? "MERCHANT_DIRECT_ACCOUNT" : "KASPI_SAAS_ACCOUNT";
    const mandateToken = options.setupRecurringMandate
      ? `pz_tok_${crypto.randomBytes(8).toString("hex")}`
      : undefined;

    return {
      success: true,
      gateway: this.gatewayName,
      transactionId: `pz_${options.orderId}_${Date.now()}`,
      mandateToken,
      settlementTarget,
      redirectUrl: `/mock-youcanpay-checkout?gateway=payzone&orderId=${encodeURIComponent(
        options.orderId
      )}`,
    };
  }

  async verifyWebhook(payload: string | Buffer): Promise<WebhookVerificationResult> {
    try {
      const str = Buffer.isBuffer(payload) ? payload.toString("utf8") : payload;
      const data = JSON.parse(str);
      return {
        isValid: true,
        transactionId: data.transactionId || data.id,
        orderId: data.orderId,
        status: data.status === "CHARGED" || data.status === "APPROVED" ? "succeeded" : "failed",
        amount: data.amount ? Number(data.amount) : undefined,
        currency: data.currency || "MAD",
        rawEvent: data,
      };
    } catch {
      return { isValid: false, status: "failed", error: "Invalid Payzone payload" };
    }
  }

  async refund(options: RefundOptions): Promise<RefundResult> {
    return {
      success: true,
      refundId: `pz_rf_${options.transactionId}`,
      actionTaken: options.isSameDayVoid ? "VOID" : "FULL_REFUND",
      amountRefunded: options.amount || 0,
    };
  }
}
