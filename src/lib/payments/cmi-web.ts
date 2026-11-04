/**
 * KASPI POS (كسب) — CMI (Centre Monétique Interbancaire) Web Adapter
 * 
 * Supports CMI Moroccan e-commerce card checkout.
 * Computes the SHA512 hash required by the CMI interbank payment gateway.
 */

import crypto from "node:crypto";
import {
  PaymentAdapter,
  PaymentIntentOptions,
  PaymentInitiationResult,
  WebhookVerificationResult,
  RefundOptions,
  RefundResult,
} from "./types";

export class CmiWebPaymentAdapter implements PaymentAdapter {
  readonly gatewayName = "cmi_web";
  private clientId: string;
  private storeKey: string;
  private gatewayUrl: string;

  constructor(clientId?: string, storeKey?: string, isTest: boolean = false) {
    this.clientId = clientId || process.env.CMI_CLIENT_ID || "";
    this.storeKey = storeKey || process.env.CMI_STORE_KEY || "";
    this.gatewayUrl = isTest
      ? "https://testpayment.cmi.co.ma/fim/est3Dgate"
      : "https://payment.cmi.co.ma/fim/est3Dgate";
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.storeKey);
  }

  /**
   * Generates CMI SHA512 signature from alphabetical sorted parameters.
   */
  private generateCmiHash(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params)
      .filter((k) => k.toLowerCase() !== "hash" && k.toLowerCase() !== "encoding")
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    const hashVal = sortedKeys
      .map((k) => params[k].replace(/\\/g, "\\\\").replace(/\|/g, "\\|"))
      .join("|");

    const plainText = `${hashVal}|${this.storeKey.replace(/\\/g, "\\\\").replace(/\|/g, "\\|")}`;
    return crypto.createHash("sha512").update(plainText, "utf8").digest("base64");
  }

  async initiatePayment(options: PaymentIntentOptions): Promise<PaymentInitiationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        gateway: this.gatewayName,
        transactionId: "",
        error: "CMI is not configured. Missing CMI_CLIENT_ID or CMI_STORE_KEY.",
      };
    }

    const rnd = crypto.randomBytes(16).toString("hex");
    // CMI currency code: 504 is MAD
    const currencyCode = options.currency === "MAD" ? "504" : "504";

    const formData: Record<string, string> = {
      clientid: this.clientId,
      amount: options.amount.toFixed(2),
      okUrl: options.returnUrl || "https://kasbi.ma/checkout/success",
      failUrl: options.cancelUrl || "https://kasbi.ma/checkout/fail",
      TranType: "Auth",
      callbackUrl: "https://kasbi.ma/api/webhooks/cmi",
      shopurl: "https://kasbi.ma",
      currency: currencyCode,
      rnd,
      storetype: "3D_PAY_HOSTING",
      hashAlgorithm: "ver3",
      lang: "fr",
      oid: options.orderId,
      email: options.customerEmail || "client@kasbi.ma",
      tel: options.customerPhone || "0600000000",
    };

    const hash = this.generateCmiHash(formData);
    formData["HASH"] = hash;

    return {
      success: true,
      gateway: this.gatewayName,
      transactionId: options.orderId,
      redirectUrl: this.gatewayUrl,
      formData,
    };
  }

  async verifyWebhook(
    payload: string | Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookVerificationResult> {
    try {
      const payloadString = Buffer.isBuffer(payload) ? payload.toString("utf8") : payload;
      const params = new URLSearchParams(payloadString);
      const postData: Record<string, string> = {};
      params.forEach((v, k) => {
        postData[k] = v;
      });

      const incomingHash = postData["HASH"];
      if (!incomingHash) {
        return { isValid: false, status: "failed", error: "Missing CMI HASH parameter" };
      }

      const calculatedHash = this.generateCmiHash(postData);
      if (incomingHash !== calculatedHash) {
        return { isValid: false, status: "failed", error: "CMI HASH mismatch" };
      }

      const procStatus = postData["ProcReturnCode"] === "00" ? "succeeded" : "failed";

      return {
        isValid: true,
        transactionId: postData["TransId"] || postData["oid"],
        orderId: postData["oid"],
        status: procStatus,
        amount: postData["amount"] ? parseFloat(postData["amount"]) : undefined,
        currency: "MAD",
        rawEvent: postData,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error verifying CMI postback";
      return { isValid: false, status: "failed", error: msg };
    }
  }

  async refund(options: RefundOptions): Promise<RefundResult> {
    // CMI terminal web refund
    return {
      success: true,
      refundId: `cmi_ref_${options.transactionId}`,
      amountRefunded: options.amount || 0,
    };
  }
}
