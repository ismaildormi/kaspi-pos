import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/auth/context";
import { prisma } from "@/server/db/prisma";
import { BillingProvider } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json().catch(() => ({}));

    const rawProvider = (body.provider || "youcanpay").toLowerCase();
    const provider: BillingProvider =
      rawProvider === "paddle"
        ? "paddle"
        : rawProvider === "mock"
        ? "mock"
        : "youcanpay";

    const quantity = Math.max(1, parseInt(body.quantity || 1, 10));

    // Fetch tenant to get current limit
    const tenant = await prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      include: {
        subscriptions: {
          where: { status: "active" },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const currentMax = tenant.maxDevices || 1;
    const newMaxDevices = currentMax + quantity;
    const costPerDevice = provider === "paddle" ? 15.0 : 150.0;
    const totalAmount = costPerDevice * quantity;
    const currency = provider === "paddle" ? "USD" : "MAD";

    // Record the payment in database
    const payment = await prisma.payment.create({
      data: {
        tenantId: ctx.tenantId,
        subscriptionId: tenant.subscriptions[0]?.id || null,
        provider,
        providerTransactionId: `TXN-DEV-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        amount: new Decimal(totalAmount),
        currency,
        status: "paid",
        paidAt: new Date(),
        providerPayload: {
          description: `Ajout de ${quantity} poste(s) de caisse (Capacité portée à ${newMaxDevices} appareils)`,
        },
      },
    });

    // Update tenant's maxDevices limit
    const updatedTenant = await prisma.tenant.update({
      where: { id: ctx.tenantId },
      data: {
        maxDevices: newMaxDevices,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        actorUserId: ctx.userId,
        action: "DEVICE_LIMIT_UPGRADED",
        entityType: "Tenant",
        entityId: ctx.tenantId,
        afterState: {
          previousMaxDevices: currentMax,
          newMaxDevices,
          quantityAdded: quantity,
          amountPaid: totalAmount,
          currency,
          paymentId: payment.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      maxDevices: updatedTenant.maxDevices,
      message: `Capacité augmentée à ${updatedTenant.maxDevices} terminaux. Facturation mise à jour.`,
      paymentId: payment.id,
    });
  } catch (err: any) {
    console.error("[Add Device Billing Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to add device" },
      { status: err?.code === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
