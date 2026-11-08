import { prisma } from "@/server/db/prisma";
import { toDecimal, roundMoney, toPrismaDecimal } from "@/domain/money";

export type CashMovementType = "cash_in" | "cash_out" | "supplier_payout" | "petty_cash";

function decToNumber(dec: ReturnType<typeof roundMoney>): number {
  return Number(dec.toFixed(2));
}

export interface CashMovementRecord {
  id: string;
  type: CashMovementType;
  amount: number;
  reason: string;
  createdByUserId: string;
  createdByName?: string;
  createdAt: string;
}

export interface ShiftFinancialSummary {
  sessionId: string;
  tenantId: string;
  storeId: string;
  status: "open" | "closed";
  openedAt: string;
  closedAt: string | null;
  cashierUserId: string;
  cashierName: string;
  openingCash: number;
  cashSalesTotal: number;
  cardSalesTotal: number;
  creditSalesTotal: number;
  transferSalesTotal: number;
  totalSalesRevenue: number;
  salesCount: number;
  cashInTotal: number;
  cashOutTotal: number;
  expectedCash: number;
  countedCash: number | null;
  discrepancy: number | null;
  varianceStatus: "balanced" | "surplus" | "shortage" | "pending";
  movements: CashMovementRecord[];
  openingNotes?: string;
  closingNotes?: string;
}

/**
 * Pure deterministic calculation of expected drawer cash and variance using Decimal.js
 * Guarantees zero floating-point rounding errors.
 */
export function calculateShiftMath(params: {
  openingCash: number | string;
  cashSalesTotal: number | string;
  cardSalesTotal: number | string;
  creditSalesTotal: number | string;
  transferSalesTotal: number | string;
  movements: Array<{ type: CashMovementType; amount: number | string }>;
  countedCash?: number | string | null;
}) {
  const openingDec = roundMoney(toDecimal(params.openingCash));
  const cashSalesDec = roundMoney(toDecimal(params.cashSalesTotal));
  const cardSalesDec = roundMoney(toDecimal(params.cardSalesTotal));
  const creditSalesDec = roundMoney(toDecimal(params.creditSalesTotal));
  const transferSalesDec = roundMoney(toDecimal(params.transferSalesTotal));

  let cashInDec = toDecimal(0);
  let cashOutDec = toDecimal(0);

  for (const m of params.movements) {
    const amt = roundMoney(toDecimal(m.amount));
    if (m.type === "cash_in") {
      cashInDec = roundMoney(cashInDec.plus(amt));
    } else {
      cashOutDec = roundMoney(cashOutDec.plus(amt));
    }
  }

  const totalSalesRevenueDec = roundMoney(
    cashSalesDec.plus(cardSalesDec).plus(creditSalesDec).plus(transferSalesDec)
  );

  // Expected Cash = Opening Float + Cash Sales + Cash In - Cash Out
  const expectedCashDec = roundMoney(
    openingDec.plus(cashSalesDec).plus(cashInDec).minus(cashOutDec)
  );

  let countedCashNum: number | null = null;
  let discrepancyNum: number | null = null;
  let varianceStatus: "balanced" | "surplus" | "shortage" | "pending" = "pending";

  if (params.countedCash !== undefined && params.countedCash !== null && params.countedCash !== "") {
    const countedDec = roundMoney(toDecimal(params.countedCash));
    const diffDec = roundMoney(countedDec.minus(expectedCashDec));
    countedCashNum = decToNumber(countedDec);
    discrepancyNum = decToNumber(diffDec);

    if (diffDec.isZero()) {
      varianceStatus = "balanced";
    } else if (diffDec.greaterThan(0)) {
      varianceStatus = "surplus";
    } else {
      varianceStatus = "shortage";
    }
  }

  return {
    openingCash: decToNumber(openingDec),
    cashSalesTotal: decToNumber(cashSalesDec),
    cardSalesTotal: decToNumber(cardSalesDec),
    creditSalesTotal: decToNumber(creditSalesDec),
    transferSalesTotal: decToNumber(transferSalesDec),
    totalSalesRevenue: decToNumber(totalSalesRevenueDec),
    cashInTotal: decToNumber(cashInDec),
    cashOutTotal: decToNumber(cashOutDec),
    expectedCash: decToNumber(expectedCashDec),
    countedCash: countedCashNum,
    discrepancy: discrepancyNum,
    varianceStatus,
  };
}

/**
 * Builds the live X-Report or closed Z-Report financial summary for a CashSession.
 */
export async function buildShiftSummary(
  tenantId: string,
  sessionId: string
): Promise<ShiftFinancialSummary> {
  const session = await prisma.cashSession.findFirst({
    where: { tenantId, id: sessionId },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  if (!session) {
    throw new Error(`CashSession ${sessionId} not found`);
  }

  const zJson = (session.zReport as Record<string, any>) || {};
  const movements: CashMovementRecord[] = Array.isArray(zJson.movements) ? zJson.movements : [];

  // Query all completed sales belonging to this shift (either via cashSessionId or within shift time window for this store)
  const sales = await prisma.sale.findMany({
    where: {
      tenantId,
      storeId: session.storeId,
      status: "completed",
      OR: [
        { cashSessionId: session.id },
        {
          cashSessionId: null,
          createdAt: {
            gte: session.openedAt,
            ...(session.closedAt ? { lte: session.closedAt } : {}),
          },
        },
      ],
    },
    select: {
      id: true,
      grandTotal: true,
      paymentMethod: true,
    },
  });

  let cashSalesDec = toDecimal(0);
  let cardSalesDec = toDecimal(0);
  let creditSalesDec = toDecimal(0);
  let transferSalesDec = toDecimal(0);

  for (const s of sales) {
    const gt = toDecimal(s.grandTotal);
    switch (s.paymentMethod) {
      case "cash":
        cashSalesDec = cashSalesDec.plus(gt);
        break;
      case "card":
        cardSalesDec = cardSalesDec.plus(gt);
        break;
      case "credit":
        creditSalesDec = creditSalesDec.plus(gt);
        break;
      case "transfer":
        transferSalesDec = transferSalesDec.plus(gt);
        break;
    }
  }

  const math = calculateShiftMath({
    openingCash: session.openingCash.toString(),
    cashSalesTotal: cashSalesDec.toString(),
    cardSalesTotal: cardSalesDec.toString(),
    creditSalesTotal: creditSalesDec.toString(),
    transferSalesTotal: transferSalesDec.toString(),
    movements,
    countedCash: session.countedCash !== null ? session.countedCash.toString() : null,
  });

  return {
    sessionId: session.id,
    tenantId: session.tenantId,
    storeId: session.storeId,
    status: session.status,
    openedAt: session.openedAt.toISOString(),
    closedAt: session.closedAt ? session.closedAt.toISOString() : null,
    cashierUserId: session.userId,
    cashierName: session.user?.fullName || session.user?.email || "Caissier",
    openingCash: math.openingCash,
    cashSalesTotal: math.cashSalesTotal,
    cardSalesTotal: math.cardSalesTotal,
    creditSalesTotal: math.creditSalesTotal,
    transferSalesTotal: math.transferSalesTotal,
    totalSalesRevenue: math.totalSalesRevenue,
    salesCount: sales.length,
    cashInTotal: math.cashInTotal,
    cashOutTotal: math.cashOutTotal,
    expectedCash: math.expectedCash,
    countedCash: math.countedCash,
    discrepancy: math.discrepancy,
    varianceStatus: math.varianceStatus,
    movements,
    openingNotes: zJson.openingNotes,
    closingNotes: zJson.closingNotes,
  };
}

/**
 * Opens a new CashSession or returns the currently open one for the store.
 */
export async function openCashShift(params: {
  tenantId: string;
  storeId: string;
  userId: string;
  openingCash: number | string;
  openingNotes?: string;
}): Promise<ShiftFinancialSummary> {
  const existingOpen = await prisma.cashSession.findFirst({
    where: {
      tenantId: params.tenantId,
      storeId: params.storeId,
      status: "open",
    },
    orderBy: { openedAt: "desc" },
  });

  if (existingOpen) {
    return buildShiftSummary(params.tenantId, existingOpen.id);
  }

  const openingDec = roundMoney(toDecimal(params.openingCash));

  const created = await prisma.cashSession.create({
    data: {
      tenantId: params.tenantId,
      storeId: params.storeId,
      userId: params.userId,
      openingCash: toPrismaDecimal(openingDec),
      expectedCash: toPrismaDecimal(openingDec),
      status: "open",
      zReport: {
        movements: [],
        openingNotes: params.openingNotes || "",
      },
    },
  });

  await prisma.auditLog
    .create({
      data: {
        tenantId: params.tenantId,
        actorUserId: params.userId,
        action: "cash_session.opened",
        entityType: "cash_session",
        entityId: created.id,
        afterState: {
          openingCash: decToNumber(openingDec),
          storeId: params.storeId,
        },
      },
    })
    .catch(() => {});

  return buildShiftSummary(params.tenantId, created.id);
}

/**
 * Records a mid-day cash movement (cash_in, cash_out, supplier_payout, petty_cash) on an open shift.
 */
export async function recordCashMovement(params: {
  tenantId: string;
  sessionId: string;
  userId: string;
  userName?: string;
  type: CashMovementType;
  amount: number | string;
  reason: string;
}): Promise<ShiftFinancialSummary> {
  const session = await prisma.cashSession.findFirst({
    where: {
      tenantId: params.tenantId,
      id: params.sessionId,
    },
  });

  if (!session) {
    throw new Error("Cash session not found");
  }
  if (session.status !== "open") {
    throw new Error("Cannot record cash movement on a closed shift");
  }

  const amtDec = roundMoney(toDecimal(params.amount));
  if (amtDec.lessThanOrEqualTo(0)) {
    throw new Error("Movement amount must be greater than zero");
  }

  const zJson = (session.zReport as Record<string, any>) || {};
  const movements: CashMovementRecord[] = Array.isArray(zJson.movements) ? [...zJson.movements] : [];

  const newMovement: CashMovementRecord = {
    id: `mv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: params.type,
    amount: decToNumber(amtDec),
    reason: params.reason.trim(),
    createdByUserId: params.userId,
    createdByName: params.userName || "Caissier",
    createdAt: new Date().toISOString(),
  };

  movements.push(newMovement);

  await prisma.cashSession.update({
    where: { id: session.id },
    data: {
      zReport: {
        ...zJson,
        movements,
      } as any,
    },
  });

  // Recompute summary and update expectedCash column
  const summary = await buildShiftSummary(params.tenantId, session.id);

  await prisma.cashSession.update({
    where: { id: session.id },
    data: {
      expectedCash: toPrismaDecimal(summary.expectedCash),
    },
  });

  await prisma.auditLog
    .create({
      data: {
        tenantId: params.tenantId,
        actorUserId: params.userId,
        action: `cash_session.${params.type}`,
        entityType: "cash_session",
        entityId: session.id,
        reason: params.reason,
        afterState: newMovement as any,
      },
    })
    .catch(() => {});

  return summary;
}

/**
 * Closes an open CashSession, computes final expectedCash vs countedCash discrepancy,
 * and locks the immutable Z-Report snapshot.
 */
export async function closeCashShift(params: {
  tenantId: string;
  sessionId: string;
  userId: string;
  countedCash: number | string;
  closingNotes?: string;
}): Promise<ShiftFinancialSummary> {
  const session = await prisma.cashSession.findFirst({
    where: {
      tenantId: params.tenantId,
      id: params.sessionId,
    },
  });

  if (!session) {
    throw new Error("Cash session not found");
  }
  if (session.status === "closed") {
    return buildShiftSummary(params.tenantId, session.id);
  }

  const currentSummary = await buildShiftSummary(params.tenantId, session.id);

  const countedDec = roundMoney(toDecimal(params.countedCash));
  const expectedDec = roundMoney(toDecimal(currentSummary.expectedCash));
  const discrepancyDec = roundMoney(countedDec.minus(expectedDec));

  const closedAt = new Date();
  const zJson = (session.zReport as Record<string, any>) || {};

  const finalZReport = {
    ...zJson,
    movements: currentSummary.movements,
    closingNotes: params.closingNotes || "",
    closedByUserId: params.userId,
    closedAt: closedAt.toISOString(),
    summary: {
      openingCash: currentSummary.openingCash,
      cashSalesTotal: currentSummary.cashSalesTotal,
      cardSalesTotal: currentSummary.cardSalesTotal,
      creditSalesTotal: currentSummary.creditSalesTotal,
      transferSalesTotal: currentSummary.transferSalesTotal,
      totalSalesRevenue: currentSummary.totalSalesRevenue,
      salesCount: currentSummary.salesCount,
      cashInTotal: currentSummary.cashInTotal,
      cashOutTotal: currentSummary.cashOutTotal,
      expectedCash: decToNumber(expectedDec),
      countedCash: decToNumber(countedDec),
      discrepancy: decToNumber(discrepancyDec),
      varianceStatus: discrepancyDec.isZero()
        ? "balanced"
        : discrepancyDec.greaterThan(0)
        ? "surplus"
        : "shortage",
    },
  };

  await prisma.cashSession.update({
    where: { id: session.id },
    data: {
      status: "closed",
      expectedCash: toPrismaDecimal(expectedDec),
      countedCash: toPrismaDecimal(countedDec),
      discrepancy: toPrismaDecimal(discrepancyDec),
      closedAt,
      zReport: finalZReport as any,
    },
  });

  await prisma.auditLog
    .create({
      data: {
        tenantId: params.tenantId,
        actorUserId: params.userId,
        action: "cash_session.closed",
        entityType: "cash_session",
        entityId: session.id,
        reason: params.closingNotes,
        afterState: finalZReport.summary as any,
      },
    })
    .catch(() => {});

  return buildShiftSummary(params.tenantId, session.id);
}
