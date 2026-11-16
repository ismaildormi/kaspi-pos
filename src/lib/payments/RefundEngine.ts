/**
 * KASPI POS (كسب) — Void vs Partial/Full Refund Engine (`RefundEngine.ts`)
 *
 * Automatically distinguishes:
 * - Same-day unsettled authorization -> executes zero-fee `VOID`
 * - Settled transaction -> executes `PARTIAL_REFUND` or `FULL_REFUND` with RBAC check
 */

import type { RefundOptions, RefundResult } from "./types";
import { PaymentGatewayManager } from "./PaymentGatewayManager";
import { PaymentAuditLogger } from "./AuditLogger";

export class RefundEngine {
  static async executeRefundOrVoid(
    gateway: string,
    options: RefundOptions & {
      tenantId: string;
      originalAmount: number;
      transactionCreatedAt?: string;
    }
  ): Promise<RefundResult> {
    const allowedRoles = new Set(["owner", "admin", "manager", "accountant"]);
    if (options.actorRole && !allowedRoles.has(options.actorRole)) {
      return {
        success: false,
        refundId: "",
        actionTaken: "FULL_REFUND",
        amountRefunded: 0,
        error: "RBAC Denied: Only Owner, Admin, Manager, or Accountant can authorize refunds",
      };
    }

    const isSameDay =
      options.isSameDayVoid ??
      (options.transactionCreatedAt
        ? Date.now() - new Date(options.transactionCreatedAt).getTime() < 12 * 3600 * 1000
        : false);

    const adapter = PaymentGatewayManager.getAdapter(gateway);
    const res = await adapter.refund({
      ...options,
      isSameDayVoid: isSameDay,
    });

    PaymentAuditLogger.createAuditRecord({
      tenantId: options.tenantId,
      actorRole: options.actorRole,
      flow: "MERCHANT_POS",
      action: "REFUND_OR_VOID_EXECUTED",
      provider: gateway,
      idempotencyKey: options.idempotencyKey || `rf_${options.transactionId}`,
      metadata: {
        transactionId: options.transactionId,
        amountRefunded: res.amountRefunded,
        actionTaken: res.actionTaken,
        reason: options.reason || "Customer return",
      },
    });

    return res;
  }
}
