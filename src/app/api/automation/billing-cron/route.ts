import { NextRequest, NextResponse } from "next/server";
import { runSubscriptionLifecycleCycle } from "@/lib/automation/subscription-lifecycle";

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
  }

  try {
    const summary = await runSubscriptionLifecycleCycle();
    return NextResponse.json({
      success: true,
      executedAtIso: new Date().toISOString(),
      summary,
    });
  } catch (err: any) {
    console.error("[Billing Cron Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Billing lifecycle cycle failed" },
      { status: 500 }
    );
  }
}
