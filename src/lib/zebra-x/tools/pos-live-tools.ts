import "server-only";
import { prisma } from "@/server/db/prisma";
import { toDecimal, roundMoney } from "@/domain/money";
import type {
  ActionConfirmationPayload,
  PdfReportPayload,
  ReceiptTicketPayload,
} from "@/lib/zebra-x/core/bridge-schema";

/**
 * Helper to encode structured payload safely for inline chat cards.
 * Uses UTF-8 base64 without whitespace or unescaped newlines.
 */
export function encodeInlineCardMarker(
  marker: "KASPI_PDF_REPORT" | "KASPI_RECEIPT_TICKET" | "KASPI_ACTION_CONFIRM",
  payload: unknown
): string {
  const b64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
  return `[${marker}:${b64}]`;
}

/**
 * Queries the most recent served customer (or latest added/updated customer)
 * strictly isolated by tenantId.
 */
export async function fetchLastCustomer(tenantId: string) {
  const latestSaleWithCustomer = await prisma.sale.findFirst({
    where: {
      tenantId,
      customerId: { not: null },
      status: "completed",
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
    },
  });

  if (latestSaleWithCustomer?.customer) {
    const c = latestSaleWithCustomer.customer;
    const agg = await prisma.sale.aggregate({
      where: { tenantId, customerId: c.id, status: "completed" },
      _sum: { grandTotal: true },
      _count: { id: true },
    });

    return {
      found: true,
      customerId: c.id,
      name: c.name,
      phone: c.phone || c.whatsappPhone || null,
      lastSaleReceipt: latestSaleWithCustomer.receiptNumber,
      lastSaleAmountMAD: toDecimal(latestSaleWithCustomer.grandTotal).toFixed(2),
      lastSaleDateIso: latestSaleWithCustomer.createdAt.toISOString(),
      totalOrders: agg._count.id,
      totalSpentMAD: toDecimal(agg._sum.grandTotal || 0).toFixed(2),
      creditBalanceMAD: toDecimal(c.currentCreditBalance).toFixed(2),
    };
  }

  const latestCustomer = await prisma.customer.findFirst({
    where: { tenantId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  if (!latestCustomer) {
    return { found: false, message: "No customers recorded yet in this store." };
  }

  return {
    found: true,
    customerId: latestCustomer.id,
    name: latestCustomer.name,
    phone: latestCustomer.phone || latestCustomer.whatsappPhone || null,
    lastSaleReceipt: null,
    lastSaleAmountMAD: "0.00",
    lastSaleDateIso: latestCustomer.updatedAt.toISOString(),
    totalOrders: 0,
    totalSpentMAD: "0.00",
    creditBalanceMAD: toDecimal(latestCustomer.currentCreditBalance).toFixed(2),
  };
}

/**
 * Fetches the latest completed sale receipt with line items & store details
 * strictly scoped to tenantId, plus an inline visual ticket marker.
 */
export async function fetchLastReceiptTicket(
  tenantId: string,
  receiptNumber?: string
): Promise<{
  found: boolean;
  ticket?: ReceiptTicketPayload;
  inlineMarker?: string;
  message?: string;
}> {
  const sale = await prisma.sale.findFirst({
    where: {
      tenantId,
      ...(receiptNumber ? { receiptNumber: { contains: receiptNumber, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: { orderBy: { lineNo: "asc" } },
      store: { select: { name: true, address: true } },
      customer: { select: { name: true } },
      tenant: { select: { displayName: true } },
    },
  });

  if (!sale) {
    return { found: false, message: "No sales tickets recorded yet in this store." };
  }

  const ticket: ReceiptTicketPayload = {
    receiptNumber: sale.receiptNumber,
    shopName: sale.store?.name || sale.tenant?.displayName || "KASPI POS",
    storeAddress: sale.store?.address || undefined,
    dateIso: (sale.completedAt || sale.createdAt).toISOString(),
    paymentMethod: sale.paymentMethod,
    customerName: sale.customer?.name || undefined,
    subtotalMAD: toDecimal(sale.subtotal).toFixed(2),
    discountTotalMAD: toDecimal(sale.discountTotal).toFixed(2),
    taxTotalMAD: toDecimal(sale.taxTotal).toFixed(2),
    grandTotalMAD: toDecimal(sale.grandTotal).toFixed(2),
    items: sale.items.map((it) => ({
      name: it.productNameSnapshot,
      qty: Number(it.quantity),
      unitPrice: toDecimal(it.unitPrice).toFixed(2),
      lineTotal: toDecimal(it.lineTotal).toFixed(2),
    })),
  };

  return {
    found: true,
    ticket,
    inlineMarker: encodeInlineCardMarker("KASPI_RECEIPT_TICKET", ticket),
  };
}

/**
 * Computes demand forecast / days until stockout using 14-day sales velocity vs StockLevel.
 */
export async function fetchStockDemandForecast(tenantId: string, limit = 8) {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [salesVelocity, stockLevels, products] = await Promise.all([
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: {
        tenantId,
        createdAt: { gte: fourteenDaysAgo },
        productId: { not: null },
      },
      _sum: { quantity: true },
    }),
    prisma.stockLevel.findMany({
      where: { tenantId },
    }),
    prisma.product.findMany({
      where: { tenantId, deletedAt: null, isActive: true },
      select: { id: true, name: true, sku: true, salePrice: true, lowStockThreshold: true },
      take: 80,
    }),
  ]);

  const velocityMap = new Map<string, number>();
  for (const row of salesVelocity) {
    if (row.productId) {
      velocityMap.set(row.productId, Number(row._sum.quantity || 0) / 14);
    }
  }

  const stockMap = new Map<string, number>();
  for (const s of stockLevels) {
    stockMap.set(s.productId, (stockMap.get(s.productId) || 0) + Number(s.quantity || 0));
  }

  const forecasts = products
    .map((p) => {
      const currentQty = stockMap.get(p.id) ?? 0;
      const dailyRate = velocityMap.get(p.id) ?? 0;
      const estimatedDaysRemaining =
        dailyRate > 0 ? Math.round((currentQty / dailyRate) * 10) / 10 : null;
      return {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        currentStock: currentQty,
        dailySalesVelocity: Math.round(dailyRate * 100) / 100,
        estimatedDaysRemaining,
        recommendedReorderQty:
          dailyRate > 0 ? Math.max(0, Math.ceil(dailyRate * 14 - currentQty)) : 0,
      };
    })
    .filter((f) => f.dailySalesVelocity > 0 || f.currentStock <= 5)
    .sort((a, b) => {
      const da = a.estimatedDaysRemaining ?? 9999;
      const db = b.estimatedDaysRemaining ?? 9999;
      return da - db;
    })
    .slice(0, limit);

  return { horizonDays: 14, forecasts };
}

/**
 * Validates product names & prepares an interactive Action Confirmation Card (Safeguard #2)
 * without directly mutating financial ledgers until the merchant clicks Confirm.
 */
export async function preparePosSaleConfirmation(params: {
  tenantId: string;
  items: Array<{ productQuery: string; quantity: number; discountPercent?: number }>;
  customerQuery?: string;
  paymentMethod?: "cash" | "card" | "credit" | "transfer";
  locale?: string;
}): Promise<{
  ok: boolean;
  error?: string;
  confirmation?: ActionConfirmationPayload;
  inlineMarker?: string;
}> {
  const matchedLines: ActionConfirmationPayload["items"] = [];
  const missingNames: string[] = [];

  for (const reqItem of params.items) {
    const q = reqItem.productQuery.trim();
    if (!q) continue;
    const prod = await prisma.product.findFirst({
      where: {
        tenantId: params.tenantId,
        deletedAt: null,
        isActive: true,
        OR: [
          { barcode: q },
          { sku: { equals: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, salePrice: true, taxRate: true },
    });

    if (!prod) {
      missingNames.push(q);
      continue;
    }

    const qty = Math.max(1, Number(reqItem.quantity) || 1);
    const unitPrice = toDecimal(prod.salePrice).toNumber();
    const rawLine = toDecimal(unitPrice).times(qty);
    const discPct = Math.max(0, Math.min(90, Number(reqItem.discountPercent || 0)));
    const discountAmount = roundMoney(rawLine.times(discPct).dividedBy(100)).toNumber();

    matchedLines.push({
      productId: prod.id,
      productName: prod.name,
      quantity: qty,
      unitPrice,
      taxRate: toDecimal(prod.taxRate || 20).toNumber(),
      discountAmount,
    });
  }

  if (matchedLines.length === 0) {
    return {
      ok: false,
      error: `Products not found in catalog: ${missingNames.join(", ") || "empty query"}`,
    };
  }

  let matchedCustomer: { id: string; name: string } | null = null;
  if (params.customerQuery?.trim()) {
    const cq = params.customerQuery.trim();
    matchedCustomer = await prisma.customer.findFirst({
      where: {
        tenantId: params.tenantId,
        deletedAt: null,
        OR: [
          { phone: { contains: cq } },
          { name: { contains: cq, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true },
    });
  }

  let subtotal = toDecimal(0);
  let discountTotal = toDecimal(0);
  let taxTotal = toDecimal(0);

  for (const line of matchedLines) {
    const gross = toDecimal(line.unitPrice).times(line.quantity);
    const disc = toDecimal(line.discountAmount);
    const taxable = gross.minus(disc);
    const lineTax = taxable.times(line.taxRate).dividedBy(100);
    subtotal = subtotal.plus(gross);
    discountTotal = discountTotal.plus(disc);
    taxTotal = taxTotal.plus(lineTax);
  }

  const grandTotal = roundMoney(subtotal.minus(discountTotal).plus(taxTotal));
  const isAr = (params.locale || "ar").startsWith("ar");
  const summaryLines = matchedLines
    .map((l) => `${l.quantity}x ${l.productName} (${l.unitPrice.toFixed(2)} MAD)`)
    .join(" • ");

  const confirmation: ActionConfirmationPayload = {
    actionId: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    kind: "sell_cart_checkout",
    title: isAr ? "تأكيد إتمام عملية البيع" : "Confirmer la vente POS",
    summary: matchedCustomer
      ? `${summaryLines} — ${isAr ? "الزبون" : "Client"}: ${matchedCustomer.name}`
      : summaryLines,
    customerId: matchedCustomer?.id,
    customerName: matchedCustomer?.name,
    paymentMethod: params.paymentMethod || "cash",
    subtotalMAD: roundMoney(subtotal).toNumber(),
    discountTotalMAD: roundMoney(discountTotal).toNumber(),
    taxTotalMAD: roundMoney(taxTotal).toNumber(),
    grandTotalMAD: grandTotal.toNumber(),
    items: matchedLines,
  };

  return {
    ok: true,
    confirmation,
    inlineMarker: encodeInlineCardMarker("KASPI_ACTION_CONFIRM", confirmation),
  };
}

/**
 * Validates product price/stock update & emits an interactive Action Confirmation Card (Safeguard #2).
 */
export async function prepareProductAdjustmentConfirmation(params: {
  tenantId: string;
  productQuery: string;
  kind: "apply_discount" | "adjust_stock";
  newPriceMAD?: number;
  discountPercent?: number;
  newStockQty?: number;
  locale?: string;
}): Promise<{
  ok: boolean;
  error?: string;
  confirmation?: ActionConfirmationPayload;
  inlineMarker?: string;
}> {
  const q = params.productQuery.trim();
  const prod = await prisma.product.findFirst({
    where: {
      tenantId: params.tenantId,
      deletedAt: null,
      OR: [
        { barcode: q },
        { sku: { equals: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, salePrice: true, taxRate: true },
  });

  if (!prod) {
    return { ok: false, error: `Product "${q}" not found in catalog.` };
  }

  const isAr = (params.locale || "ar").startsWith("ar");
  const currentPrice = toDecimal(prod.salePrice).toNumber();

  if (params.kind === "apply_discount") {
    const computedNewPrice =
      params.newPriceMAD !== undefined
        ? roundMoney(toDecimal(Math.max(0, params.newPriceMAD))).toNumber()
        : roundMoney(
            toDecimal(currentPrice).times(
              Math.max(0, 100 - Math.min(95, params.discountPercent || 0))
            ).dividedBy(100)
          ).toNumber();

    const confirmation: ActionConfirmationPayload = {
      actionId: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind: "apply_discount",
      title: isAr ? "تأكيد تعديل الثمن / التخفيض" : "Confirmer la modification de prix",
      summary: `${prod.name}: ${currentPrice.toFixed(2)} MAD -> ${computedNewPrice.toFixed(2)} MAD`,
      paymentMethod: "cash",
      subtotalMAD: computedNewPrice,
      discountTotalMAD: Math.max(0, roundMoney(toDecimal(currentPrice).minus(computedNewPrice)).toNumber()),
      taxTotalMAD: 0,
      grandTotalMAD: computedNewPrice,
      items: [],
      productId: prod.id,
      newPriceMAD: computedNewPrice,
    };

    return {
      ok: true,
      confirmation,
      inlineMarker: encodeInlineCardMarker("KASPI_ACTION_CONFIRM", confirmation),
    };
  }

  const nextQty = Math.max(0, Number(params.newStockQty ?? 0));
  const confirmation: ActionConfirmationPayload = {
    actionId: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    kind: "adjust_stock",
    title: isAr ? "تأكيد تحديث المخزون" : "Confirmer l'ajustement du stock",
    summary: `${prod.name} -> ${nextQty} ${isAr ? "وحدة" : "unités"}`,
    paymentMethod: "cash",
    subtotalMAD: currentPrice,
    discountTotalMAD: 0,
    taxTotalMAD: 0,
    grandTotalMAD: currentPrice,
    items: [],
    productId: prod.id,
    newStockQty: nextQty,
  };

  return {
    ok: true,
    confirmation,
    inlineMarker: encodeInlineCardMarker("KASPI_ACTION_CONFIRM", confirmation),
  };
}

/**
 * Builds structured inline marker for real client-side Arabic/Multilingual PDF export.
 */
export function buildPdfReportToolResult(input: PdfReportPayload) {
  return {
    ready: true,
    title: input.title,
    rowsCount: input.rows.length,
    inlineMarker: encodeInlineCardMarker("KASPI_PDF_REPORT", input),
  };
}
