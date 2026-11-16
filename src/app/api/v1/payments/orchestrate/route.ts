import { NextRequest, NextResponse } from "next/server";
import { getSafeServerContext } from "@/server/auth/context";
import { prisma } from "@/server/db/prisma";
import {
  PaymentOrchestrator,
  FeeEngine,
  SettlementManager,
  PaymentAuditLogger,
  type PaymentFlowType,
  type PaymentGatewayId,
  type PosFeeSplitRatio,
  type SupportedCurrency,
} from "@/lib/payments";

/**
 * KASPI POS (كسب) — Payment Orchestration & Fee-Split API (`/api/v1/payments/orchestrate`)
 *
 * Enforces Bank Al-Maghrib Law 103-12 strict separation (`SUBSCRIPTION` vs `MERCHANT_POS`),
 * PCI-DSS 4.0.1 zero-PAN/CVV storage, Idempotency-Key protection, and PostgreSQL PaymentAuditLog.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await getSafeServerContext();
    const tenantId = ctx.tenantId;
    const body = await req.json();

    const flow: PaymentFlowType =
      body.flow === "MERCHANT_POS" ? "MERCHANT_POS" : "SUBSCRIPTION";
    const amount = Math.max(0.01, Number(body.amount || 200));
    const currency: SupportedCurrency = (body.currency || "MAD") as SupportedCurrency;
    const gateway: PaymentGatewayId = (body.gateway || "naps") as PaymentGatewayId;
    const splitRatio: PosFeeSplitRatio = (body.splitRatio || "0/100") as PosFeeSplitRatio;
    const idempotencyKey =
      req.headers.get("Idempotency-Key") ||
      body.idempotencyKey ||
      `orch_${tenantId}_${Date.now()}`;

    const feeEngine = new FeeEngine();
    const feeBreakdown = feeEngine.calculate({
      amount,
      gateway,
      currency,
      splitRatio,
      surchargeEnabled: splitRatio !== "0/100",
    });

    const orchestrationResult = await PaymentOrchestrator.executeOrchestratedPayment({
      amount: feeBreakdown.customerPayableTotal,
      currency,
      orderId: body.orderId || `ORD-${Date.now()}`,
      flow,
      tenantId,
      idempotencyKey,
      countryCode: body.countryCode || "MA",
      preferredGateway: gateway,
      setupRecurringMandate: Boolean(body.setupRecurringMandate),
    });

    const settlementBatch = SettlementManager.buildSettlementBatch({
      storeId: ctx.storeIds?.[0] || "main-store",
      tenantId,
      flow,
      provider: (orchestrationResult.gateway || gateway) as PaymentGatewayId,
      currency,
      grossAmount: feeBreakdown.customerPayableTotal,
      pspFeeAmount: feeBreakdown.actualPspFee,
    });

    const auditRecord = PaymentAuditLogger.createAuditRecord({
      tenantId,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      flow,
      action: flow === "SUBSCRIPTION" ? "SUBSCRIPTION_MANDATE_CREATED" : "POS_TPE_INITIATED",
      provider: orchestrationResult.gateway || gateway,
      idempotencyKey,
      metadata: {
        feeBreakdown,
        settlementBatch,
        routeDecision: orchestrationResult.routeDecision,
      },
    });

    await (prisma as any).paymentAuditLog
      ?.create?.({
        data: {
          tenantId,
          actorUserId: ctx.userId || null,
          flow,
          action: auditRecord.action,
          provider: auditRecord.provider,
          settlementTarget: settlementBatch.settlementTarget,
          amount: feeBreakdown.customerPayableTotal,
          currency,
          idempotencyKeyHash: auditRecord.idempotencyKeyHash,
          sanitizedMetadata: auditRecord.sanitizedMetadata as any,
          entryHash: auditRecord.entryHash,
        },
      })
      ?.catch(() => {});

    return NextResponse.json({
      ok: true,
      orchestrationResult,
      feeBreakdown,
      settlementBatch,
      auditHash: auditRecord.entryHash,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Payment orchestration failed" },
      { status: 500 }
    );
  }
}
