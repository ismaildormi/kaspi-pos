import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { formatDailyReportForWhatsApp, generateWhatsAppLink } from "@/lib/whatsapp";

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
    const targetPhone = searchParams.get("phone") || "0661000000";

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 1. Fetch completed sales for today
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

    // 2. Fetch top products today
    const itemMap = new Map<string, { name: string; quantity: number }>();
    sales.forEach((s) => {
      s.items.forEach((item) => {
        const key = item.productId || item.productNameSnapshot;
        const existing = itemMap.get(key) || {
          name: item.productNameSnapshot,
          quantity: 0,
        };
        existing.quantity += Number(item.quantity);
        itemMap.set(key, existing);
      });
    });

    const topProducts = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 3. Fetch low stock products
    const lowStockLevels = await prisma.stockLevel.findMany({
      where: {
        tenantId: ctx.tenantId,
        quantity: { lt: 5 },
      },
      take: 5,
    });

    const prodIds = lowStockLevels.map((l) => l.productId);
    const dbProds = await prisma.product.findMany({
      where: { id: { in: prodIds } },
      select: { id: true, name: true },
    });
    const prodNameMap = new Map(dbProds.map((p) => [p.id, p.name]));

    const lowStockAlerts = lowStockLevels.map((l) => ({
      name: prodNameMap.get(l.productId) || "Produit",
      quantity: Number(l.quantity),
    }));

    // 4. Resolve Store Name
    const store = await prisma.store.findFirst({
      where: { tenantId: ctx.tenantId },
    });
    const storeName = store?.name || ctx.activeTenant?.legalName || "Mon Commerce";

    const reportDateStr = startOfDay.toISOString().split("T")[0];

    // 5. Format WhatsApp Message
    const messageText = formatDailyReportForWhatsApp({
      storeName,
      date: reportDateStr,
      totalSales,
      transactionsCount,
      cashSales,
      cardSales,
      creditSales,
      topProducts,
      lowStockAlerts,
    });

    const whatsappUrl = generateWhatsAppLink(targetPhone, messageText);

    // 6. Record in ZReport table
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

    return NextResponse.json({
      success: true,
      date: reportDateStr,
      stats: {
        totalSalesMAD: totalSales.toFixed(2),
        transactionsCount,
        cashSalesMAD: cashSales.toFixed(2),
        cardSalesMAD: cardSales.toFixed(2),
        creditSalesMAD: creditSales.toFixed(2),
      },
      messageText,
      whatsappUrl,
    });
  } catch (err: any) {
    console.error("[Daily WhatsApp Report Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate daily WhatsApp report" },
      { status: 500 }
    );
  }
}
