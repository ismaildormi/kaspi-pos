import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminUser } from "@/server/admin/guard";
import { prisma } from "@/server/db/prisma";
import { sendWhatsAppMessage, sendAdminWhatsAppAlert } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  try {
    // 1. Guard: Only Super Admin can broadcast alerts
    await getSuperAdminUser();

    const body = await req.json();
    const { message, target = "admin_only" } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Le message d'alerte ne peut pas être vide." }, { status: 400 });
    }

    const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || "+212687597267";

    if (target === "admin_only") {
      const res = await sendAdminWhatsAppAlert(message);
      return NextResponse.json({
        success: true,
        target: "admin_only",
        recipient: adminPhone,
        result: res,
      });
    }

    // Target: all tenants with registered WhatsApp number
    const tenantSettings = await prisma.tenantSettings.findMany({
      where: {
        whatsappReportNumber: { not: null },
      },
      select: {
        tenantId: true,
        shopName: true,
        whatsappReportNumber: true,
      },
    });

    const results = [];
    for (const ts of tenantSettings) {
      if (ts.whatsappReportNumber) {
        const res = await sendWhatsAppMessage(ts.whatsappReportNumber, message);
        results.push({ tenantId: ts.tenantId, phone: ts.whatsappReportNumber, success: res.success });
      }
    }

    // Also send confirmation copy to Super Admin
    await sendAdminWhatsAppAlert(
      `[Alerte Diffusée] Votre message a été envoyé à ${results.length} commerces :\n\n"${message}"`
    );

    return NextResponse.json({
      success: true,
      target: "all_tenants",
      dispatchedCount: results.length,
      details: results,
    });
  } catch (err: any) {
    console.error("[Admin WhatsApp Alert Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Erreur lors de l'envoi de l'alerte WhatsApp" },
      { status: 500 }
    );
  }
}
