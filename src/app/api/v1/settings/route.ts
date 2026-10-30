import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: ctx.tenantId },
    });

    return NextResponse.json({
      success: true,
      settings: settings || {
        shopName: ctx.activeTenant?.displayName || ctx.activeTenant?.legalName || "",
        address: "",
        ice: "",
        taxId: "",
        rcNumber: "",
        phone: "",
        receiptHeader: "Bienvenue dans notre magasin",
        receiptFooter: "Merci de votre visite et à bientôt !",
        whatsappReportNumber: "",
        isWhatsappReportsActive: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();

    const updated = await prisma.tenantSettings.upsert({
      where: { tenantId: ctx.tenantId },
      create: {
        tenantId: ctx.tenantId,
        shopName: body.shopName,
        address: body.address,
        ice: body.ice,
        taxId: body.taxId,
        rcNumber: body.rcNumber,
        phone: body.phone,
        logoUrl: body.logoUrl,
        receiptHeader: body.receiptHeader,
        receiptFooter: body.receiptFooter,
        whatsappReportNumber: body.whatsappReportNumber,
        isWhatsappReportsActive: body.isWhatsappReportsActive ?? true,
      },
      update: {
        shopName: body.shopName,
        address: body.address,
        ice: body.ice,
        taxId: body.taxId,
        rcNumber: body.rcNumber,
        phone: body.phone,
        logoUrl: body.logoUrl,
        receiptHeader: body.receiptHeader,
        receiptFooter: body.receiptFooter,
        whatsappReportNumber: body.whatsappReportNumber,
        isWhatsappReportsActive: body.isWhatsappReportsActive ?? true,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
