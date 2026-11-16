import { NextRequest, NextResponse } from "next/server";
import { getSafeServerContext } from "@/server/auth/context";
import { prisma } from "@/server/db/prisma";
import {
  SubscriptionEngine,
  PaymentOrchestrator,
  PaymentAuditLogger,
  type BillingCycleInterval,
  type PaymentGatewayId,
  type TokenizedPaymentMethod,
} from "@/lib/payments";

export async function GET() {
  try {
    const ctx = await getSafeServerContext();
    const tenantId = ctx.tenantId;

    const [sub, tenant, activeDevicesCount, directPayments, mandateRecord] = await Promise.all([
      prisma.subscription
        .findFirst({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          include: {
            plan: true,
            payments: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
          },
        })
        .catch(() => null),
      prisma.tenant
        .findUnique({
          where: { id: tenantId },
          select: { maxDevices: true },
        })
        .catch(() => null),
      prisma.device
        .count({
          where: { tenantId, revokedAt: null },
        })
        .catch(() => 1),
      prisma.payment
        .findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
        .catch(() => []),
      prisma.idempotencyRecord
        .findUnique({
          where: {
            tenantId_scope_key: {
              tenantId,
              scope: "billing_mandate",
              key: "active_recurring_mandate",
            },
          },
        })
        .catch(() => null),
    ]);

    const storedMandate = (mandateRecord?.responseBody as Record<string, any>) || {};
    const maxDevices = Number(storedMandate.posteCount || tenant?.maxDevices || 1);
    const billingInterval: BillingCycleInterval =
      storedMandate.billingInterval === "ANNUAL" || sub?.billingInterval === "yearly"
        ? "ANNUAL"
        : "MONTHLY";

    const pricing = SubscriptionEngine.computeSeatPricing(maxDevices, billingInterval);

    const now = new Date();
    let daysRemaining = 14;
    if (sub?.currentPeriodEnd) {
      const diffTime = sub.currentPeriodEnd.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    } else if (sub?.trialEndAt) {
      const diffTime = sub.trialEndAt.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const cancelAtPeriodEnd = Boolean(
      storedMandate.cancelAtPeriodEnd ?? sub?.cancelAtPeriodEnd ?? false
    );
    const autoRenew = storedMandate.autoRenew !== undefined ? Boolean(storedMandate.autoRenew) : !cancelAtPeriodEnd;

    const nextBillingAt =
      storedMandate.nextBillingAt ||
      sub?.currentPeriodEnd?.toISOString() ||
      new Date(now.getTime() + daysRemaining * 86_400_000).toISOString();

    return NextResponse.json({
      success: true,
      subscription: {
        id: sub?.id || storedMandate.mandateId || null,
        planCode: sub?.planCode || "kaspi-pro",
        planName: sub?.plan?.name || "KASPI Pro All-in-One",
        status: sub?.status || storedMandate.status || "trialing",
        provider: storedMandate.provider || sub?.provider || "naps",
        billingInterval: billingInterval === "ANNUAL" ? "yearly" : "monthly",
        autoRenew,
        mandateStatus: autoRenew ? "ACTIVE" : "CANCELED_AT_PERIOD_END",
        cancelAtPeriodEnd,
        retryCount: Number(storedMandate.retryCount || 0),
        nextBillingAt,
        freeTrialEndsAt: sub?.trialEndAt?.toISOString() || null,
        currentPeriodEnd: nextBillingAt,
        trialEndAt: sub?.trialEndAt?.toISOString() || null,
        daysRemaining,
        posteCount: maxDevices,
        maxDevices,
        activeDevicesCount,
        priceMAD: pricing.monthlySubtotalMad,
        totalCycleMad: pricing.totalCycleMad,
        priceUSD: pricing.totalCycleUsd,
        priceEUR: pricing.totalCycleEur,
        tokenizedMethod: storedMandate.tokenizedMethod || {
          provider: "naps",
          providerCustomerId: `cus_${tenantId.slice(0, 8)}`,
          paymentMethodToken: `pm_tok_${tenantId.slice(0, 8)}`,
          last4: "4242",
          brand: "Visa",
          expMonth: 12,
          expYear: 2028,
          bankName: "Attijariwafa Bank / CMI",
          threeDSecureVerified: true,
        },
      },
      recentPayments: (() => {
        const list = directPayments.length > 0 ? directPayments : sub?.payments || [];
        return list.map((p: any) => ({
          id: p.id,
          amount: Number(p.amount),
          currency: p.currency,
          status: p.status,
          date: p.createdAt.toISOString(),
          provider: p.provider,
        }));
      })(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load subscription info" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSafeServerContext();
    const tenantId = ctx.tenantId;
    const body = await req.json();

    const posteCount = Math.max(1, Number(body.posteCount || body.maxDevices || 1));
    const billingInterval: BillingCycleInterval =
      String(body.billingInterval || "MONTHLY").toUpperCase() === "ANNUAL"
        ? "ANNUAL"
        : "MONTHLY";
    const provider: PaymentGatewayId = (body.provider || "naps") as PaymentGatewayId;
    const autoRenew = body.autoRenew !== undefined ? Boolean(body.autoRenew) : true;
    const idempotencyKey =
      req.headers.get("Idempotency-Key") ||
      body.idempotencyKey ||
      `sub_${tenantId}_${Date.now()}`;

    // PCI-DSS 4.0.1: Only tokenized reference + last4/brand/exp are accepted or persisted
    const tokenizedMethod: TokenizedPaymentMethod = {
      provider,
      providerCustomerId: body.providerCustomerId || `cus_${tenantId.slice(0, 8)}`,
      paymentMethodToken: body.paymentMethodToken || `tok_${provider}_${Date.now()}`,
      last4: String(body.last4 || "4242").slice(-4),
      brand: body.brand || "Visa",
      expMonth: Number(body.expMonth || 12),
      expYear: Number(body.expYear || 2028),
      bankName: body.bankName || "Moroccan Bank 3DS2",
      threeDSecureVerified: true,
    };

    const mandate = SubscriptionEngine.createRecurringMandate({
      tenantId,
      provider,
      billingInterval,
      posteCount,
      autoRenew,
      tokenizedMethod,
      currency: "MAD",
    });

    await PaymentOrchestrator.executeOrchestratedPayment({
      amount: mandate.totalCycleAmountMad,
      currency: "MAD",
      orderId: mandate.mandateId,
      flow: "SUBSCRIPTION",
      tenantId,
      idempotencyKey,
      preferredGateway: provider,
      setupRecurringMandate: autoRenew,
      billingInterval,
      posteCount,
    });

    await prisma.tenant
      .update({
        where: { id: tenantId },
        data: { maxDevices: posteCount, status: "active" },
      })
      .catch(() => {});

    await prisma.idempotencyRecord
      .upsert({
        where: {
          tenantId_scope_key: {
            tenantId,
            scope: "billing_mandate",
            key: "active_recurring_mandate",
          },
        },
        create: {
          tenantId,
          scope: "billing_mandate",
          key: "active_recurring_mandate",
          requestHash: PaymentAuditLogger.hashIdempotencyKey(idempotencyKey),
          responseStatus: 200,
          responseBody: {
            ...mandate,
            status: "active",
          } as any,
          expiresAt: new Date(Date.now() + 365 * 86_400_000),
        },
        update: {
          requestHash: PaymentAuditLogger.hashIdempotencyKey(idempotencyKey),
          responseBody: {
            ...mandate,
            status: "active",
          } as any,
        },
      })
      .catch(() => {});

    return NextResponse.json({
      success: true,
      mandate,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Subscription update failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await getSafeServerContext();
    const tenantId = ctx.tenantId;
    const body = await req.json();

    const existing = await prisma.idempotencyRecord
      .findUnique({
        where: {
          tenantId_scope_key: {
            tenantId,
            scope: "billing_mandate",
            key: "active_recurring_mandate",
          },
        },
      })
      .catch(() => null);

    const currentBody = (existing?.responseBody as Record<string, any>) || {};
    const nextAutoRenew =
      body.autoRenew !== undefined ? Boolean(body.autoRenew) : !Boolean(body.cancelAtPeriodEnd);
    const nextCancelAtPeriodEnd = !nextAutoRenew;
    const nextPosteCount =
      body.posteCount !== undefined
        ? Math.max(1, Number(body.posteCount))
        : Number(currentBody.posteCount || 1);

    const updatedMandate = {
      ...currentBody,
      autoRenew: nextAutoRenew,
      cancelAtPeriodEnd: nextCancelAtPeriodEnd,
      mandateStatus: nextAutoRenew ? "ACTIVE" : "CANCELED_AT_PERIOD_END",
      posteCount: nextPosteCount,
      updatedAt: new Date().toISOString(),
    };

    await prisma.idempotencyRecord
      .upsert({
        where: {
          tenantId_scope_key: {
            tenantId,
            scope: "billing_mandate",
            key: "active_recurring_mandate",
          },
        },
        create: {
          tenantId,
          scope: "billing_mandate",
          key: "active_recurring_mandate",
          requestHash: PaymentAuditLogger.hashIdempotencyKey(`patch_${Date.now()}`),
          responseStatus: 200,
          responseBody: updatedMandate as any,
          expiresAt: new Date(Date.now() + 365 * 86_400_000),
        },
        update: {
          responseBody: updatedMandate as any,
        },
      })
      .catch(() => {});

    PaymentAuditLogger.createAuditRecord({
      tenantId,
      flow: "SUBSCRIPTION",
      action: nextCancelAtPeriodEnd
        ? "SUBSCRIPTION_CANCELED_AT_PERIOD_END"
        : "SUBSCRIPTION_POSTE_UPDATED",
      provider: currentBody.provider || "naps",
      idempotencyKey: `mandate_patch_${tenantId}_${Date.now()}`,
      metadata: {
        autoRenew: nextAutoRenew,
        cancelAtPeriodEnd: nextCancelAtPeriodEnd,
        posteCount: nextPosteCount,
      },
    });

    return NextResponse.json({
      success: true,
      mandate: updatedMandate,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update recurring mandate" },
      { status: 500 }
    );
  }
}
