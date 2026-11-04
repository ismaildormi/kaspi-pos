/**
 * KASPI POS (كسب) — Modular Payment Gateway Adapter Interface
 * 
 * Defines standard contracts for all payment adapters:
 * - Stripe (International)
 * - YouCanPay (Morocco local & international)
 * - CMI Web (Morocco e-commerce gateway)
 * - TPE Bridge (Physical terminal via Rust Tauri command)
 */

export interface PaymentIntentOptions {
  amount: number; // In major units (e.g. 100.00)
  currency: string; // MAD, USD, EUR
  orderId: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export interface PaymentInitiationResult {
  success: boolean;
  gateway: string;
  transactionId: string;
  redirectUrl?: string;
  clientSecret?: string;
  formData?: Record<string, string>; // For CMI form POST redirects
  rawResponse?: unknown;
  error?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  transactionId?: string;
  orderId?: string;
  status: "succeeded" | "failed" | "pending";
  amount?: number;
  currency?: string;
  rawEvent?: unknown;
  error?: string;
}

export interface RefundOptions {
  transactionId: string;
  amount?: number; // Partial or full refund
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amountRefunded: number;
  error?: string;
}

export interface PaymentAdapter {
  readonly gatewayName: string;

  /** Check if necessary credentials and environment variables are present */
  isConfigured(): boolean;

  /** Initiates a payment session or checkout */
  initiatePayment(options: PaymentIntentOptions): Promise<PaymentInitiationResult>;

  /** Verifies a webhook signature and extracts event details */
  verifyWebhook(
    payload: string | Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookVerificationResult>;

  /** Issues a refund */
  refund(options: RefundOptions): Promise<RefundResult>;
}
