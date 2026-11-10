import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { sendAdminWhatsAppAlert } from "@/lib/whatsapp";

export async function GET() {
  try {
    const ctx = await getRequestContext();
    const messages = await prisma.supportMessage.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, messages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();

    const { senderName, senderPhone, subject, message } = body;
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Le message est requis" }, { status: 400 });
    }

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: ctx.tenantId },
    });

    const created = await prisma.supportMessage.create({
      data: {
        tenantId: ctx.tenantId,
        senderName:
          senderName?.trim() ||
          ctx.activeTenant?.displayName ||
          "Commerçant",
        senderPhone:
          senderPhone?.trim() ||
          settings?.whatsappReportNumber ||
          settings?.phone ||
          null,
        subject: subject?.trim() || "Assistance Technique KASPI POS",
        message: message.trim(),
        status: "unread",
      },
    });

    // Notify Super Admin via WhatsApp adapter (non-blocking)
    sendAdminWhatsAppAlert(
      `*NOUVEAU TICKET SUPPORT KASPI POS*\nDe : ${created.senderName}\nSujet : ${created.subject}\nMessage : ${created.message}`
    ).catch(() => {});

    return NextResponse.json({ success: true, supportMessage: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
