/**
 * KASPI POS (كسب) — Universal TPE Integration & Auto-Discovery Type Contracts
 *
 * Enforces:
 * - Zero Amount Re-entry transaction lifecycle (Exact 11-State Machine)
 * - 3 Honest Automation Levels (Full Auto / Assisted Auto / Manual-Unsupported)
 * - 8 Truthful Compatibility Statuses (Never fake "Verified Compatible")
 * - Strict PCI-DSS 4.0.1 & Bank Al-Maghrib Law 103-12 separation (Zero PAN/CVV/PIN)
 */

import type { PosFeeSplitRatio, SupportedCurrency } from "../payments/types";
export type { SupportedCurrency, PosFeeSplitRatio };

export type TpeCustomReceiptPayload = TpeReceiptFormatParams;

export type TpeTransactionState =
  | "CREATED"
  | "VALIDATED"
  | "SENT_TO_TERMINAL"
  | "WAITING_FOR_CUSTOMER"
  | "PROCESSING"
  | "APPROVED"
  | "DECLINED"
  | "CANCELLED"
  | "TIMED_OUT"
  | "UNKNOWN"
  | "RECONCILIATION_REQUIRED";

export type TpeAutomationLevel =
  | "LEVEL_1_FULL_AUTO"
  | "LEVEL_2_ASSISTED_AUTO"
  | "LEVEL_3_MANUAL_UNSUPPORTED";

export type TpeCompatibilityStatus =
  | "Verified Compatible"
  | "Sandbox Tested"
  | "Partially Compatible"
  | "Requires Provider Approval"
  | "Requires Merchant Credentials"
  | "Requires Official SDK"
  | "Unsupported"
  | "Not Yet Tested";

export type TpeConnectionType =
  | "USB"
  | "SERIAL_RS232"
  | "ETHERNET_TCPIP"
  | "WIFI"
  | "BLUETOOTH"
  | "ANDROID_SMART_POS"
  | "CLOUD_API"
  | "LEGACY_BRIDGE";

export type TpeProtocolType =
  | "NEXO_RETAILER"
  | "OPI"
  | "CONCERT_V3"
  | "ZVT"
  | "VERIFONE_ECR"
  | "STRIPE_TERMINAL"
  | "ADYEN_TERMINAL_API"
  | "SQUARE_TERMINAL"
  | "SUMUP_TERMINAL"
  | "ANDROID_SMART_POS"
  | "SERIAL_ESC"
  | "OFFICIAL_MANUFACTURER_SDK"
  | "MANUAL_EXTERNAL";

export type TpeDeclaredCapability =
  | "CHIP_EMV"
  | "NFC_CONTACTLESS"
  | "APPLE_PAY"
  | "GOOGLE_PAY"
  | "SAMSUNG_WALLET"
  | "PRE_AUTH"
  | "CAPTURE"
  | "VOID_SAME_DAY"
  | "PARTIAL_REFUND"
  | "TIPS"
  | "OFFLINE_PENDING_QUEUE"
  | "RECEIPT_PRINT"
  | "CUSTOM_RECEIPT_PRINT"
  | "PRINT_384PX_RASTER"
  | "PRINT_NEXO_DOCUMENT"
  | "PRINT_ESCPOS"
  | "BANK_LOCKED_RECEIPT"
  | "ECR_MODE_CAISSE_REQUIRED";

export type TpePrintPath =
  | "PATH_A_NEXO_PRINT"
  | "PATH_B_STRIPE_RASTER"
  | "PATH_C_ESCPOS"
  | "PATH_D_BANK_LOCKED_FALLBACK";

export interface TpeReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface TpeReceiptFormatParams {
  storeName: string;
  legalName?: string;
  ice?: string;
  taxId?: string;
  address?: string;
  city?: string;
  phone?: string;
  receiptNumber: string;
  date?: string;
  items: TpeReceiptItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal?: number;
  grandTotal: number;
  currency: SupportedCurrency;
  paymentMethod?: string;
  cardScheme?: string;
  authCode?: string;
  terminalId?: string;
  maskedPan?: string;
  aid?: string;
  footerNote?: string;
  paperWidth?: 58 | 80 | 32 | 42;
}

export interface TpeReceiptPrintResult {
  success: boolean;
  path: TpePrintPath;
  rawPayload?: string | Uint8Array;
  rasterPngDataUri?: string;
  bankLockedFallback?: boolean;
  mergedFields?: {
    authCode?: string;
    terminalId?: string;
    maskedPan?: string;
    cardBrand?: string;
    aid?: string;
  };
  message: string;
}

export interface TpeDeviceFingerprint {
  deviceId: string;
  manufacturer: string;
  model: string;
  hardwareRevision: string | null;
  firmwareVersion: string; // Strictly "unknown" when unavailable — never hallucinated
  os: string;
  supportedProtocols: TpeProtocolType[];
  connectionType: TpeConnectionType;
  sdkCompatibility: string | null;
  paymentProvider: string;
  acquirerCompatibility: string[];
  countryCompatibility: string[];
  certificationStatus: TpeCompatibilityStatus;
  endpointAddress?: string | null;
  port?: number | null;
  serialPort?: string | null;
}

export interface TpeAdapterTestResult {
  testedAt: string;
  environment: "SANDBOX" | "LOCAL_SIMULATION" | "HARDWARE_BENCH" | "LIVE_PILOT";
  passed: boolean;
  notes: string;
  evidenceId: string;
}

export interface TpeAdapterRegistryEntry {
  adapterId: string;
  manufacturer: string;
  supportedModels: string[];
  supportedFirmware: string;
  protocol: TpeProtocolType;
  sdkVersion: string;
  provider: string;
  supportedCountries: string[];
  requiredPermissions: string[];
  installationMethod: "BUILTIN_CLOUD_OR_NEXO" | "BROWSER_SERIAL_USB" | "TAURI_LOCAL_BRIDGE" | "OEM_SDK_BUILD" | "MANUAL_ONLY";
  licenseInfo: string;
  registrySourceUrl: string;
  securitySignature: string;
  sha256: string;
  compatibilityStatus: TpeCompatibilityStatus;
  automationLevel: TpeAutomationLevel;
  isInitialResearchMatrix: boolean;
  lastVerifiedDate: string | null;
  testResults: TpeAdapterTestResult[];
  declaredCapabilities: TpeDeclaredCapability[];
}

export interface TpeStartPaymentRequest {
  idempotencyKey: string;
  saleId?: string;
  storeId: string;
  tenantId: string;
  terminalId: string;
  amount: number;
  tipAmount?: number;
  splitCashAmount?: number;
  currency: SupportedCurrency;
  feeSplitRatio?: PosFeeSplitRatio;
  isSandbox?: boolean;
  isOffline?: boolean;
  captureMethod?: "IMMEDIATE" | "PRE_AUTH";
}

export interface TpeTransactionResult {
  transactionId: string;
  idempotencyKey: string;
  terminalId: string;
  providerReference: string | null;
  state: TpeTransactionState;
  amount: number;
  currency: SupportedCurrency;
  authCode: string | null;
  cardScheme: string | null; // e.g. "CMI / VISA / MASTERCARD" — NEVER PAN/CVV/PIN
  maskedLast4: string | null;
  walletUsed: "NONE" | "APPLE_PAY" | "GOOGLE_PAY" | "SAMSUNG_WALLET";
  feeCustomerSurcharge: number;
  netMerchantSettlement: number;
  isSandbox: boolean;
  offlinePending: boolean;
  canSafelyFinalizeSale: boolean; // True ONLY when state === "APPROVED"
  recoveryRequired: boolean;
  message: string;
  timestamp: string;
}

export interface TpeHealthCheckResult {
  terminalId: string;
  healthy: boolean;
  latencyMs: number | null;
  firmwareVersion: string;
  connectionType: TpeConnectionType;
  checkedAt: string;
  notes: string;
}

export interface TpeDiagnosticReport {
  terminalId: string;
  adapterId: string;
  protocol: TpeProtocolType;
  connectionType: TpeConnectionType;
  lastHeartbeatAt: string;
  capabilities: TpeDeclaredCapability[];
  redactedEvents: Array<{
    timestamp: string;
    level: "INFO" | "WARN" | "ERROR";
    code: string;
    message: string;
  }>;
}

export interface UniversalTpeAdapter {
  readonly adapterId: string;
  readonly protocol: TpeProtocolType;
  readonly declaredCapabilities: TpeDeclaredCapability[];
  readonly supportsCustomPrint?: boolean;
  readonly printPath?: TpePrintPath;

  discover(scopeConfig?: {
    subnetHint?: string;
    endpoints?: string[];
  }): Promise<TpeDeviceFingerprint[]>;
  identify(targetEndpoint?: string): Promise<TpeDeviceFingerprint>;
  connect(config: Record<string, unknown>): Promise<{ connected: boolean; sessionToken?: string; message: string }>;
  authenticate(credentials: Record<string, string>): Promise<{ authenticated: boolean; message: string }>;
  getDeviceInfo(): Promise<TpeDeviceFingerprint>;
  getCapabilities(): TpeDeclaredCapability[];
  sendAmount(params: { amount: number; currency: SupportedCurrency; orderId: string }): Promise<{ acknowledged: boolean; terminalDisplayText: string }>;
  startPayment(request: TpeStartPaymentRequest): Promise<TpeTransactionResult>;
  getTransactionStatus(transactionId: string): Promise<TpeTransactionResult>;
  cancelPayment(transactionId: string): Promise<{ cancelled: boolean; state: TpeTransactionState; message: string }>;
  requestRefund(params: { transactionId: string; amount: number; reason?: string }): Promise<{ refunded: boolean; refundReference: string; message: string }>;
  getLastTransaction(): Promise<TpeTransactionResult | null>;
  disconnect(): Promise<{ disconnected: boolean }>;
  healthCheck(): Promise<TpeHealthCheckResult>;
  diagnostics(): Promise<TpeDiagnosticReport>;
  printCustomReceipt?(params: TpeReceiptFormatParams): Promise<TpeReceiptPrintResult>;
}
