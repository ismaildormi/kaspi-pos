import { NextRequest, NextResponse } from "next/server";
import { checkSuperAdminUser } from "@/server/admin/guard";
import { generateLicenseKey, instantAdminActivateTenant } from "@/server/billing/license";

export async function POST(req: NextRequest) {
  try {
    const admin = await checkSuperAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const action = body.action || "generate";

    if (action === "generate") {
      const durationDays = body.durationDays === 365 ? 365 : 30;
      const targetTenantId = body.tenantId || undefined;

      const licenseKey = await generateLicenseKey({
        durationDays,
        tenantId: targetTenantId,
      });

      return NextResponse.json({
        success: true,
        licenseKey,
        durationDays,
      });
    }

    if (action === "instant_activate") {
      const tenantId = body.tenantId;
      if (!tenantId) {
        return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
      }

      const durationDays = body.durationDays === 365 ? 365 : 30;
      const result = await instantAdminActivateTenant({
        tenantId,
        durationDays,
      });

      return NextResponse.json({
        success: true,
        tenantId,
        durationDays,
        currentPeriodEnd: result.newPeriodEnd.toISOString(),
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("[Admin License API Error]:", err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
