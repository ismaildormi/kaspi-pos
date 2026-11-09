import { prisma } from "../db/prisma";
import { randomBytes } from "node:crypto";
import { toPrismaDecimal } from "@/domain/money";

export async function generateLicenseKey(params: {
  durationDays: 30 | 365;
  tenantId?: string;
  planId?: string;
}): Promise<string> {
  const { durationDays, tenantId, planId = "pro" } = params;

  const prefix = durationDays === 365 ? "KASPI-365D" : "KASPI-30D";
  const part1 = randomBytes(2).toString("hex").toUpperCase();
  const part2 = randomBytes(2).toString("hex").toUpperCase();
  const licenseKey = `${prefix}-${part1}-${part2}`;

  const systemTenantId = "00000000-0000-0000-0000-000000000000";

  await prisma.idempotencyRecord.create({
    data: {
      tenantId: systemTenantId,
      scope: "license_key",
      key: licenseKey,
      requestHash: `req_license_${licenseKey}`,
      responseStatus: 200,
      expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
      responseBody: {
        licenseKey,
        durationDays,
        planId,
        targetTenantId: tenantId || null,
        createdAt: new Date().toISOString(),
        usedByTenantId: null,
        usedAt: null,
      },
    },
  });

  return licenseKey;
}

export async function activateLicenseKey(params: {
  licenseKey: string;
  tenantId: string;
  userId: string;
}): Promise<{
  success: boolean;
  durationDays: number;
  newPeriodEnd: Date;
  error?: string;
}> {
  const cleanKey = params.licenseKey.trim().toUpperCase();
  const systemTenantId = "00000000-0000-0000-0000-000000000000";

  const record = await prisma.idempotencyRecord.findUnique({
    where: {
      tenantId_scope_key: {
        tenantId: systemTenantId,
        scope: "license_key",
        key: cleanKey,
      },
    },
  });

  if (!record) {
    return {
      success: false,
      durationDays: 0,
      newPeriodEnd: new Date(),
      error: "Code d'activation invalide ou introuvable",
    };
  }

  const payload = record.responseBody as any;
  if (payload.usedByTenantId) {
    return {
      success: false,
      durationDays: 0,
      newPeriodEnd: new Date(),
      error: "Ce code d'activation a déjà été utilisé",
    };
  }

  if (payload.targetTenantId && payload.targetTenantId !== params.tenantId) {
    return {
      success: false,
      durationDays: 0,
      newPeriodEnd: new Date(),
      error: "Ce code d'activation est réservé à un autre compte",
    };
  }

  const durationDays = Number(payload.durationDays || 30);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Mark license as used
    await tx.idempotencyRecord.update({
      where: {
        tenantId_scope_key: {
          tenantId: systemTenantId,
          scope: "license_key",
          key: cleanKey,
        },
      },
      data: {
        responseBody: {
          ...payload,
          usedByTenantId: params.tenantId,
          usedByUserId: params.userId,
          usedAt: new Date().toISOString(),
        },
      },
    });

    // 2. Fetch existing subscription
    const existingSub = await tx.subscription.findFirst({
      where: { tenantId: params.tenantId },
    });

    const now = new Date();
    const currentEnd =
      existingSub?.currentPeriodEnd && existingSub.currentPeriodEnd > now
        ? new Date(existingSub.currentPeriodEnd)
        : now;

    const newPeriodEnd = new Date(
      currentEnd.getTime() + durationDays * 24 * 60 * 60 * 1000
    );

    let activeSubId: string;

    if (existingSub) {
      const updatedSub = await tx.subscription.update({
        where: { id: existingSub.id },
        data: {
          status: "active",
          planCode: "pro",
          provider: "manual",
          currentPeriodEnd: newPeriodEnd,
        },
      });
      activeSubId = updatedSub.id;
    } else {
      const createdSub = await tx.subscription.create({
        data: {
          tenantId: params.tenantId,
          planCode: "pro",
          status: "active",
          provider: "manual",
          currentPeriodStart: now,
          currentPeriodEnd: newPeriodEnd,
        },
      });
      activeSubId = createdSub.id;
    }

    // 3. Update tenant status to active
    await tx.tenant.update({
      where: { id: params.tenantId },
      data: { status: "active" },
    });

    // 4. Record Payment
    const priceMad = durationDays >= 365 ? 2000 : 200;
    await tx.payment.create({
      data: {
        tenantId: params.tenantId,
        subscriptionId: activeSubId,
        provider: "manual",
        providerTransactionId: `TX-LIC-${cleanKey}-${Date.now()}`,
        amount: toPrismaDecimal(priceMad),
        currency: "MAD",
        status: "paid",
        paidAt: new Date(),
        providerPayload: {
          licenseKey: cleanKey,
          durationDays,
          activatedByUserId: params.userId,
        },
      },
    });

    return newPeriodEnd;
  });

  return {
    success: true,
    durationDays,
    newPeriodEnd: result,
  };
}

export async function instantAdminActivateTenant(params: {
  tenantId: string;
  durationDays: 30 | 365;
}): Promise<{ success: boolean; newPeriodEnd: Date }> {
  const { tenantId, durationDays } = params;
  const now = new Date();

  const existingSub = await prisma.subscription.findFirst({
    where: { tenantId },
  });

  const currentEnd =
    existingSub?.currentPeriodEnd && existingSub.currentPeriodEnd > now
      ? new Date(existingSub.currentPeriodEnd)
      : now;

  const newPeriodEnd = new Date(
    currentEnd.getTime() + durationDays * 24 * 60 * 60 * 1000
  );

  await prisma.$transaction(async (tx) => {
    let activeSubId: string;

    if (existingSub) {
      const updatedSub = await tx.subscription.update({
        where: { id: existingSub.id },
        data: {
          status: "active",
          planCode: "pro",
          provider: "manual",
          currentPeriodEnd: newPeriodEnd,
        },
      });
      activeSubId = updatedSub.id;
    } else {
      const createdSub = await tx.subscription.create({
        data: {
          tenantId,
          planCode: "pro",
          status: "active",
          provider: "manual",
          currentPeriodStart: now,
          currentPeriodEnd: newPeriodEnd,
        },
      });
      activeSubId = createdSub.id;
    }

    await tx.tenant.update({
      where: { id: tenantId },
      data: { status: "active" },
    });

    const priceMad = durationDays >= 365 ? 2000 : 200;
    await tx.payment.create({
      data: {
        tenantId,
        subscriptionId: activeSubId,
        provider: "manual",
        providerTransactionId: `ADMIN-ACTIVATE-${Date.now()}`,
        amount: toPrismaDecimal(priceMad),
        currency: "MAD",
        status: "paid",
        paidAt: new Date(),
        providerPayload: {
          activatedBy: "SUPER_ADMIN",
          durationDays,
        },
      },
    });
  });

  return { success: true, newPeriodEnd };
}
