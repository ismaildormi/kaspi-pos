import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/server/auth/context";
import {
  createHyperswitchPayment,
  isHyperswitchConfigured,
  preferredConnector,
} from "@/lib/hyperswitch";

const CreatePaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["MAD", "USD", "EUR"]).default("MAD"),
  description: z.string().max(200).optional(),
  planId: z.string().optional(),
});

/**
 * POST /api/payments/hyperswitch
 * Creates a unified payment intent via the self-hosted Hyperswitch orchestrator.
 * Returns the `client_secret` for the Hyperswitch Web SDK on the client.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const parsed = CreatePaymentSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 422 }
      );
    }

    if (!isHyperswitchConfigured()) {
      // TODO(keys): fill HYPERSWITCH_* env vars after deploying deploy/docker-compose.yml
      return NextResponse.json(
        {
          error: "Hyperswitch is not configured yet.",
          fallback: "/api/billing/checkout",
        },
        { status: 503 }
      );
    }

    const { amount, currency, description, planId } = parsed.data;
    const origin = req.nextUrl.origin;

    const payment = await createHyperswitchPayment({
      tenantId: ctx.tenantId,
      amount,
      currency,
      description,
      customerEmail: ctx.userEmail || undefined,
      customerName: ctx.userFullName || undefined,
      returnUrl: `${origin}/dashboard/billing?status=success`,
      metadata: planId ? { planId } : undefined,
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.payment_id,
      clientSecret: payment.client_secret,
      status: payment.status,
      connector: payment.connector || preferredConnector(currency),
      publishableKey: process.env.HYPERSWITCH_PUBLISHABLE_KEY || null,
    });
  } catch (err: any) {
    console.error("[Hyperswitch Payment Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create payment" },
      { status: err?.code === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
