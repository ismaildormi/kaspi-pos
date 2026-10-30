import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/auth/context";
import { getPaymentProvider } from "@/lib/billing";
import { BillingProvider } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();

    const planId = body.planId || "pro";
    const rawProvider = (body.provider || "paddle").toLowerCase();
    const provider: BillingProvider =
      rawProvider === "youcanpay"
        ? "youcanpay"
        : rawProvider === "mock"
        ? "mock"
        : "paddle";

    const billingInterval =
      body.billingInterval === "yearly" ? "yearly" : "monthly";

    const origin = req.nextUrl.origin || "http://localhost:3000";
    const successUrl = `${origin}/dashboard/billing?status=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/dashboard/billing?status=canceled`;

    const paymentProvider = getPaymentProvider(provider);

    const session = await paymentProvider.createCheckoutSession({
      tenantId: ctx.tenantId,
      userEmail: ctx.userEmail || "merchant@kasbi.ma",
      userName: ctx.userFullName || "Merchant",
      planId,
      billingInterval,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.checkoutUrl,
      sessionId: session.sessionId,
      provider: session.provider,
    });
  } catch (err: any) {
    console.error("[Billing Checkout Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create checkout session" },
      { status: err?.code === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
