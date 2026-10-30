import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/auth/context";
import { prisma } from "@/server/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();

    const sub = await prisma.subscription.findFirst({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        plan: true,
        payments: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    const now = new Date();
    let daysRemaining = 14;
    if (sub?.currentPeriodEnd) {
      const diffTime = sub.currentPeriodEnd.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    } else if (sub?.trialEndAt) {
      const diffTime = sub.trialEndAt.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: sub?.id || null,
        planCode: sub?.planCode || "pro",
        planName: sub?.plan?.name || "KASPI All-in-One",
        status: sub?.status || "trialing",
        provider: sub?.provider || "manual",
        billingInterval: sub?.billingInterval || "monthly",
        currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() || null,
        trialEndAt: sub?.trialEndAt?.toISOString() || null,
        daysRemaining,
        priceUSD: 10.0,
        priceMAD: 100.0,
      },
      recentPayments:
        sub?.payments.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          currency: p.currency,
          status: p.status,
          date: p.createdAt.toISOString(),
          provider: p.provider,
        })) || [],
    });
  } catch (err: any) {
    console.error("[Get Subscription Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load subscription info" },
      { status: err?.code === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
