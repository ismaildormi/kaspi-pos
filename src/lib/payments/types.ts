/**
 * KASPI POS (كسب) — Global & Morocco Payment & Recurring Billing Type Contracts
 *
 * Strictly compliant with:
 * - Bank Al-Maghrib Law 103-12 (Strict separation between KASPI SaaS Billing and Merchant POS Settlement)
 * - PCI DSS 4.0.1 (ZERO raw PAN or CVV/CVC storage; strictly tokenized references only)
 */

export type SupportedCurrency = "MAD" | "EUR" | "USD";

export type PaymentFlowType = "SUBSCRIPTION" | "MERCHANT_POS";

export type BillingCycleInterval = "MONTHLY" | "ANNUAL";

export type MandateStatus =
  | "ACTIVE"
  | "PENDING_3DS"
  | "PAST_DUE_RETRYING"
  | "CANCELED_AT_PERIOD_END"
  | "REVOKED";

export type OfflinePaymentStatus =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED_SETTLED"
  | "FAILED_REVERSED";

export type PaymentGatewayId =
  | "stripe"
  | "naps"
  | "youcanpay"
  | "youcanpay_local"
  | "youcanpay_intl"
  | "cmi"
  | "cmi_web"
  | "cmi_tpe"
  | "payzone"
  | "apple_pay"
  | "google_pay"
  | "samsung_wallet"
  | "bank_transfer";

export type PosFeeSplitRatio = "100/0" | "70/30" | "60/40" | "50/50" | "0/100";

/**
 * PCI-DSS 4.0.1 Safe Tokenized Payment Method Reference.
 * NEVER contains raw card numbers (PAN) or CVV/CVC security codes.
 */
export interface TokenizedPaymentMethod {
  provider: PaymentGatewayId;
  providerCustomerId: string;
  paymentMethodToken: string;
  last4: string;
  brand: "Visa" | "Mastercard" | "CMI" | "Amex" | "ApplePay" | "GooglePay" | "SamsungWallet" | "Card";
  expMonth: number;
  expYear: number;
  countryCode?: string;
  bankName?: string;
  threeDSecureVerified: boolean;
}

/**
 * Auto-Renew Recurring Mandate (`تبقى تقطع ليه ديما حتى يقطعها هو`).
 * Authorizes automatic periodic charging of the tokenized payment method
 * every billing cycle until canceled by the merchant in the Billing Portal or via their bank.
 */
export interface RecurringSubscriptionMandate {
  mandateId: string;
  tenantId: string;
  provider: PaymentGatewayId;
  providerSubscriptionId: string;
  billingInterval: BillingCycleInterval;
  autoRenew: boolean;
  mandateStatus: MandateStatus;
  cancelAtPeriodEnd: boolean;
  retryCount: number;
  maxRetries: number;
  nextBillingAt: string;
  freeTrialEndsAt: string | null;
  posteCount: number;
  firstPostePriceMad: number; // Always 200 MAD/mo
  extraPostePriceMad: number; // Always 150 MAD/mo
  totalCycleAmountMad: number;
  currency: SupportedCurrency;
  tokenizedMethod: TokenizedPaymentMethod | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentIntentOptions {
  amount: number; // Major units (e.g. 200.00)
  currency: string; // MAD, USD, EUR
  orderId: string;
  flow?: PaymentFlowType;
  tenantId?: string;
  idempotencyKey?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
  setupRecurringMandate?: boolean;
  billingInterval?: BillingCycleInterval;
  posteCount?: number;
  metadata?: Record<string, string>;
}

export interface PaymentInitiationResult {
  success: boolean;
  gateway: string;
  transactionId: string;
  redirectUrl?: string;
  clientSecret?: string;
  mandateToken?: string;
  settlementTarget?: "KASPI_SAAS_ACCOUNT" | "MERCHANT_DIRECT_ACCOUNT";
  offlineState?: OfflinePaymentStatus;
  formData?: Record<string, string>;
  rawResponse?: unknown;
  error?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  transactionId?: string;
  orderId?: string;
  eventId?: string;
  eventType?: string;
  status: "succeeded" | "failed" | "pending" | "refunded" | "disputed";
  amount?: number;
  currency?: string;
  mandateToken?: string;
  rawEvent?: unknown;
  error?: string;
}

export interface RefundOptions {
  transactionId: string;
  amount?: number;
  reason?: string;
  isSameDayVoid?: boolean;
  actorRole?: "owner" | "admin" | "manager" | "accountant";
  idempotencyKey?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  actionTaken: "VOID" | "PARTIAL_REFUND" | "FULL_REFUND";
  amountRefunded: number;
  error?: string;
}

export interface PaymentAdapter {
  readonly gatewayName: string;
  isConfigured(): boolean;
  initiatePayment(options: PaymentIntentOptions): Promise<PaymentInitiationResult>;
  verifyWebhook(
    payload: string | Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookVerificationResult>;
  refund(options: RefundOptions): Promise<RefundResult>;
}
