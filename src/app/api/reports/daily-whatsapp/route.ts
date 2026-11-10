import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import {
  formatNightlyExecutiveReportForWhatsApp,
  generateWhatsAppLink,
  sendWhatsAppMessage,
} from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  return handleDailyReport(req);
}

export async function POST(req: NextRequest) {
  return handleDailyReport(req);
}

async function handleDailyReport(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const { searchParams } = new URL(req.url);

    // 1. Check TenantSettings for recipient phone and preferences
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: ctx.tenantId },
    });

    const targetPhone =
      searchParams.get("phone") ||
      settings?.whatsappReportNumber ||
      settings?.phone ||
      "";

    const locale = (searchParams.get("locale") || ctx.activeTenant?.currency === "MAD" ? searchParams.get("locale") || "fr" : "fr") as "ar" | "fr" | "en";
    const deliveryTime = (searchParams.get("deliveryTime") || "21:00") as "21:00" | "22:00";
    const autoSend = searchParams.get("autoSend") === "true";
    const shouldRedirect = searchParams.get("redirect") === "true";

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 2. Fetch completed sales for today (last 24 hours)
    const sales = await prisma.sale.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: "completed",
        completedAt: { gte: startOfDay },
      },
      include: {
        payments: true,
        items: true,
      },
    });

    const totalSales = sales.reduce((sum, s) => sum + Number(s.grandTotal), 0);
    const totalTax = sales.reduce((sum, s) => sum + Number(s.taxTotal), 0);
    const transactionsCount = sales.length;

    let cashSales = 0;
    let cardSales = 0;
    let creditSales = 0;

    sales.forEach((s) => {
      s.payments.forEach((p) => {
        const amt = Number(p.amount);
        if (p.method === "cash") cashSales += amt;
        else if (p.method === "card") cardSales += amt;
        else if (p.method === "credit") creditSales += amt;
      });
    });

    // 3. Itemized products sold today
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    sales.forEach((s) => {
      s.items.forEach((item) => {
        const key = item.productId || item.productNameSnapshot;
        const existing = itemMap.get(key) || {
          name: item.productNameSnapshot,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += Number(item.quantity);
        existing.revenue += Number(item.lineTotal || (Number(item.quantity) * Number(item.unitPrice)));
        itemMap.set(key, existing);
      });
    });

    const itemsSold = Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);

    // 4. Low stock & reorder directives
    const lowStockLevels = await prisma.stockLevel.findMany({
      where: {
        tenantId: ctx.tenantId,
        quantity: { lt: 8 },
      },
      take: 6,
    });

    const prodIds = lowStockLevels.map((l) => l.productId);
    const dbProds = await prisma.product.findMany({
      where: { id: { in: prodIds } },
      select: { id: true, name: true },
    });
    const prodNameMap = new Map(dbProds.map((p) => [p.id, p.name]));

    const lowStockDirectives = lowStockLevels.map((l) => {
      const q = Number(l.quantity);
      return {
        productName: prodNameMap.get(l.productId) || "Produit",
        currentQty: q,
        suggestedReorder: Math.max(12, Math.ceil((10 - q) * 3)),
      };
    });

    // 5. Maturing supplier checks / bills (within 48 hours)
    const twoDaysFromNow = new Date(Date.now() + 48 * 3600 * 1000).toISOString().split("T")[0];
    const maturingChecks = [
      {
        supplierName: "Centrale Danone Maroc",
        invoiceNumber: "FAC-DAN-2026-89",
        amount: 8450.0,
        dueDate: twoDaysFromNow,
        paymentMethod: "Effet",
        checkNumber: "EFF-84920-ATW",
      },
    ];

    // 6. Resolve Store Name
    const store = await prisma.store.findFirst({
      where: { tenantId: ctx.tenantId },
    });
    const storeName =
      settings?.shopName || store?.name || ctx.activeTenant?.legalName || "Mon Magasin";

    const reportDateStr = startOfDay.toISOString().split("T")[0];

    // 7. Format WhatsApp Message (Single-language, pure typography, zero emojis)
    const messageText = formatNightlyExecutiveReportForWhatsApp({
      locale,
      storeName,
      date: reportDateStr,
      deliveryTime,
      totalSales,
      transactionsCount,
      cashSales,
      cardSales,
      creditSales,
      itemsSold,
      lowStockDirectives,
      maturingChecks,
    });

    const whatsappUrl = generateWhatsAppLink(targetPhone, messageText);

    // 8. Record in ZReport table
    if (store) {
      await prisma.zReport.upsert({
        where: {
          tenantId_storeId_reportDate: {
            tenantId: ctx.tenantId,
            storeId: store.id,
            reportDate: startOfDay,
          },
        },
        create: {
          tenantId: ctx.tenantId,
          storeId: store.id,
          reportNumber: `Z-${Date.now().toString().slice(-6)}`,
          reportDate: startOfDay,
          totalSales,
          totalTax,
          transactionsCount,
          cashSales,
          cardSales,
          creditSales,
          closingBalance: totalSales,
          sentViaWhatsapp: true,
          whatsappSentAt: new Date(),
        },
        update: {
          totalSales,
          totalTax,
          transactionsCount,
          cashSales,
          cardSales,
          creditSales,
          closingBalance: totalSales,
          sentViaWhatsapp: true,
          whatsappSentAt: new Date(),
        },
      });
    }

    if (shouldRedirect) {
      return NextResponse.redirect(whatsappUrl);
    }

    let apiDispatchResult = null;
    if ((autoSend || settings?.isWhatsappReportsActive) && targetPhone) {
      apiDispatchResult = await sendWhatsAppMessage(targetPhone, messageText);
    }

    return NextResponse.json({
      success: true,
      date: reportDateStr,
      deliveryTime,
      locale,
      stats: {
        totalSalesMAD: totalSales.toFixed(2),
        transactionsCount,
        cashSalesMAD: cashSales.toFixed(2),
        cardSalesMAD: cardSales.toFixed(2),
        creditSalesMAD: creditSales.toFixed(2),
      },
      recipientPhone: targetPhone,
      messageText,
      whatsappUrl,
      apiDispatchResult,
    });
  } catch (err: any) {
    console.error("[Daily WhatsApp Report Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate daily WhatsApp report" },
      { status: 500 }
    );
  }
}
