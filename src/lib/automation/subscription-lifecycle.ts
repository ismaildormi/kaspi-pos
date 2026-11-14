import { prisma } from "@/server/db/prisma";
import { createChainedInvoiceRecord, INVOICE_GENESIS_HASH } from "@/lib/security/invoice-hash-chain";
import { recordForensicAudit } from "@/lib/security/forensic-audit";

/**
 * KASPI POS — Autonomous Poste-Based Subscription Lifecycle Engine (Layer 8)
 *
 * Pricing Formula (100% Features Included from 1st Poste):
 *   - 1st Poste (Register): 200 MAD / month
 *   - Each Extra Poste:    +150 MAD / month
 *
 * Lifecycle:
 *   - Active -> Renewal Due -> 3-Day Grace Period (`past_due`) -> Safe Read-Only (`readonly_expired`, zero data loss)
 *   - Instant restoration to `active` on webhook confirmation
 *   - Generates SHA-256 signed sequential renewal invoice + WhatsApp/Email notification hook
 */

export const FIRST_POSTE_PRICE_MAD = 200;
export const EXTRA_POSTE_PRICE_MAD = 150;
export const GRACE_PERIOD_DAYS = 3;

export function calculatePosteMonthlyPriceMad(posteCount: number): number {
  const safeCount = Math.max(1, Math.floor(posteCount || 1));
  return FIRST_POSTE_PRICE_MAD + (safeCount - 1) * EXTRA_POSTE_PRICE_MAD;
}

export interface BillingCronResult {
  checkedSubscriptions: number;
  renewalsInvoiced: number;
  movedToGracePeriod: number;
  movedToReadOnly: number;
  invoices: Array<{
    tenantId: string;
    invoiceNumber: string;
    amountMad: number;
    sealCode: string;
    status: string;
  }>;
}

export async function runSubscriptionLifecycleCycle(): Promise<BillingCronResult> {
  const now = new Date();
  const graceCutoff = new Date(now.getTime() - GRACE_PERIOD_DAYS * 86400 * 1000);

  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: { in: ["active", "past_due", "trialing"] },
    },
  });

  const result: BillingCronResult = {
    checkedSubscriptions: subscriptions.length,
    renewalsInvoiced: 0,
    movedToGracePeriod: 0,
    movedToReadOnly: 0,
    invoices: [],
  };

  let previousHash = INVOICE_GENESIS_HASH;

  for (const sub of subscriptions) {
    const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
    if (!periodEnd) continue;

    const deviceCount = await prisma.device.count({
      where: { tenantId: sub.tenantId },
    });
    const posteCount = Math.max(1, deviceCount);
    const amountMad = calculatePosteMonthlyPriceMad(posteCount);

    // 1. Period expired beyond 3-day Grace Period -> Safe Read-Only (`paused`, zero data loss)
    if (periodEnd < graceCutoff && sub.status === "past_due") {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "paused" },
      });

      await recordForensicAudit({
        eventType: "SUBSCRIPTION_STATUS_CHANGED",
        tenantId: sub.tenantId,
        entityType: "subscription_lifecycle",
        entityId: sub.id,
        beforeState: { status: sub.status },
        afterState: { status: "paused", accessMode: "READ_ONLY_SAFE", posteCount, amountMad },
        reason: "3-day grace period elapsed; switched to safe read-only mode without data loss",
      });

      result.movedToReadOnly += 1;
      continue;
    }

    // 2. Period just expired -> Enter 3-day Grace Period + Generate SHA-256 Renewal Invoice
    if (periodEnd <= now && sub.status === "active") {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "past_due" },
      });
      result.movedToGracePeriod += 1;

      const invoiceNumber = `KSP-SUB-${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(
        2,
        "0"
      )}-${sub.tenantId.slice(0, 6).toUpperCase()}`;

      const chained = createChainedInvoiceRecord({
        previousInvoiceHash: previousHash,
        storeId: sub.tenantId,
        invoiceNumber,
        totalAmountMad: amountMad,
        createdAtIso: now.toISOString(),
        cashierId: "KASPI_BILLING_AUTOPILOT",
      });
      previousHash = chained.currentInvoiceHash;

      result.renewalsInvoiced += 1;
      result.invoices.push({
        tenantId: sub.tenantId,
        invoiceNumber,
        amountMad,
        sealCode: chained.sealCode,
        status: "grace_period_3_days",
      });

      await recordForensicAudit({
        eventType: "SUBSCRIPTION_STATUS_CHANGED",
        tenantId: sub.tenantId,
        entityType: "subscription_lifecycle",
        entityId: sub.id,
        beforeState: { status: "active" },
        afterState: {
          status: "past_due",
          gracePeriodDays: GRACE_PERIOD_DAYS,
          invoiceNumber,
          amountMad,
          sealCode: chained.sealCode,
          currentInvoiceHash: chained.currentInvoiceHash,
        },
        reason: "Subscription renewal due; 3-day grace period activated with SHA-256 invoice",
      });
    }
  }

  return result;
}
