import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/auth/context";
import { activateLicenseKey } from "@/server/billing/license";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const licenseKey = (body.licenseKey || "").trim();

    if (!licenseKey) {
      return NextResponse.json(
        { error: "Veuillez saisir un code d'activation" },
        { status: 400 }
      );
    }

    const result = await activateLicenseKey({
      licenseKey,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Échec d'activation de la licence" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      durationDays: result.durationDays,
      currentPeriodEnd: result.newPeriodEnd.toISOString(),
      message: `Licence activée avec succès pour ${result.durationDays} jours !`,
    });
  } catch (err: any) {
    console.error("[License Activation Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Erreur serveur lors de l'activation" },
      { status: 500 }
    );
  }
}
