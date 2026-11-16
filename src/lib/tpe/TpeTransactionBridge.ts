/**
 * KASPI POS (كسب) — Zero-Amount-Re-entry Transaction Bridge & Recovery State Machine (`TpeTransactionBridge.ts`)
 *
 * Enforces the strict 10-step POS-to-Terminal workflow:
 * 1. Cashier builds cart -> 2. Pricing engine computes exact total (taxes, discounts, configured terminal fee split) ->
 * 3. Single amount push via adapter (`CREATED -> VALIDATED -> SENT_TO_TERMINAL`) ->
 * 4. Customer taps/inserts Card / Apple Pay / Google Pay / Samsung Wallet on TPE (`WAITING_FOR_CUSTOMER -> PROCESSING`) ->
 * 5. Terminal & Acquirer verify -> 6. ONLY `APPROVED` allows POS Sale recording, Inventory deduction, & Z-Report update!
 *
 * Safe Timeout & Disconnect Recovery Rule:
 * NEVER blindly retry a payment if network drops! First inspect `getTransactionStatus()` /
 * `getLastTransaction()` and transition uncertain outcomes cleanly to `RECONCILIATION_REQUIRED`.
 */

import { FeeEngine } from "../payments/FeeEngine";
import { resolveUniversalTpeAdapter } from "./UniversalAdapters";
import type {
  TpeDeviceFingerprint,
  TpeStartPaymentRequest,
  TpeTransactionResult,
  TpeTransactionState,
} from "./types";

const idempotentTxnCache = new Map<string, TpeTransactionResult>();

export interface ZeroReentryExecutionTrace {
  steps: Array<{ state: TpeTransactionState; timestamp: string; label: string }>;
  feeCustomerSurcharge: number;
  finalPushAmount: number;
  netMerchantSettlement: number;
  result: TpeTransactionResult;
}

export class TpeTransactionBridge {
  /**
   * Executes a single-push TPE payment with Fee-Split awareness and duplicate protection.
   */
  static async executeZeroReentryPayment(params: {
    request: TpeStartPaymentRequest;
    fingerprint: TpeDeviceFingerprint;
    adapterId?: string;
  }): Promise<ZeroReentryExecutionTrace> {
    const { request } = params;
    const steps: ZeroReentryExecutionTrace["steps"] = [];
    const nowIso = () => new Date().toISOString();

    steps.push({ state: "CREATED", timestamp: nowIso(), label: "Cart amount locked" });

    // Idempotency / duplicate guard
    const cached = idempotentTxnCache.get(request.idempotencyKey);
    if (cached) {
      return {
        steps: [
          ...steps,
          { state: cached.state, timestamp: nowIso(), label: "Idempotent reply returned (0 duplicate charge)" },
        ],
        feeCustomerSurcharge: cached.feeCustomerSurcharge,
        finalPushAmount: cached.amount,
        netMerchantSettlement: cached.netMerchantSettlement,
        result: cached,
      };
    }

    // Fee-split computation (independent optional per-terminal split)
    const feeEngine = new FeeEngine();
    const splitRatio = request.feeSplitRatio || "0/100";
    const feeCalc = feeEngine.calculate({
      amount: request.amount + (request.tipAmount || 0) - (request.splitCashAmount || 0),
      gateway: "cmi_tpe",
      currency: request.currency,
      splitRatio,
      surchargeEnabled: splitRatio !== "0/100",
    });

    const finalPushAmount = Math.max(0, feeCalc.customerPayableTotal);
    if (finalPushAmount <= 0) {
      throw new Error("TPE_INVALID_AMOUNT: Final amount must be greater than 0.");
    }

    steps.push({ state: "VALIDATED", timestamp: nowIso(), label: `Validated ${finalPushAmount.toFixed(2)} ${request.currency}` });

    const adapter = resolveUniversalTpeAdapter({
      adapterId: params.adapterId,
      fingerprint: params.fingerprint,
    });

    steps.push({ state: "SENT_TO_TERMINAL", timestamp: nowIso(), label: "Exact amount pushed ONCE to TPE" });
    steps.push({ state: "WAITING_FOR_CUSTOMER", timestamp: nowIso(), label: "Customer Card / Apple Pay / Google Pay prompt active" });
    steps.push({ state: "PROCESSING", timestamp: nowIso(), label: "Acquirer / CMI authorization in progress" });

    try {
      const adapterResult = await adapter.startPayment({
        ...request,
        amount: finalPushAmount,
      });

      const enrichedResult: TpeTransactionResult = {
        ...adapterResult,
        feeCustomerSurcharge: feeCalc.customerTransparentSurcharge,
        netMerchantSettlement: feeCalc.netMerchantSettlement,
        canSafelyFinalizeSale: adapterResult.state === "APPROVED",
      };

      steps.push({
        state: enrichedResult.state,
        timestamp: nowIso(),
        label: enrichedResult.canSafelyFinalizeSale
          ? "Terminal APPROVED — safe to record POS Sale & inventory"
          : `Terminal returned ${enrichedResult.state} — POS sale NOT finalized automatically`,
      });

      idempotentTxnCache.set(request.idempotencyKey, enrichedResult);

      return {
        steps,
        feeCustomerSurcharge: feeCalc.customerTransparentSurcharge,
        finalPushAmount,
        netMerchantSettlement: feeCalc.netMerchantSettlement,
        result: enrichedResult,
      };
    } catch {
      // Safe Disconnect / Timeout Recovery: query status before considering retry!
      steps.push({ state: "UNKNOWN", timestamp: nowIso(), label: "Link interrupted — querying last status before retry" });
      const recovered = await adapter.getLastTransaction();
      const recoveryResult: TpeTransactionResult =
        recovered && recovered.idempotencyKey === request.idempotencyKey
          ? recovered
          : {
              transactionId: `tpe_rec_${Date.now()}`,
              idempotencyKey: request.idempotencyKey,
              terminalId: request.terminalId,
              providerReference: null,
              state: "RECONCILIATION_REQUIRED",
              amount: finalPushAmount,
              currency: request.currency,
              authCode: null,
              cardScheme: null,
              maskedLast4: null,
              walletUsed: "NONE",
              feeCustomerSurcharge: feeCalc.customerTransparentSurcharge,
              netMerchantSettlement: feeCalc.netMerchantSettlement,
              isSandbox: Boolean(request.isSandbox),
              offlinePending: Boolean(request.isOffline),
              canSafelyFinalizeSale: false,
              recoveryRequired: true,
              message:
                "Terminal connection dropped. Marked RECONCILIATION_REQUIRED — never blindly re-charged.",
              timestamp: nowIso(),
            };

      steps.push({
        state: recoveryResult.state,
        timestamp: nowIso(),
        label: "Moved to safe reconciliation guard",
      });

      return {
        steps,
        feeCustomerSurcharge: feeCalc.customerTransparentSurcharge,
        finalPushAmount,
        netMerchantSettlement: feeCalc.netMerchantSettlement,
        result: recoveryResult,
      };
    }
  }
}
