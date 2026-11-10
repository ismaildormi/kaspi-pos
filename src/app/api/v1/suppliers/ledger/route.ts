import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";

export interface SupplierLedgerItem {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierPhone?: string | null;
  invoiceNumber: string;
  amountMAD: number;
  balanceOwedMAD: number;
  paymentMethod: "check" | "effet" | "cash" | "virement";
  checkNumber?: string | null;
  dueDate: string;
  status: "pending" | "settled" | "overdue";
  notes?: string | null;
  createdAt: string;
}

// In-memory / tenant-scoped store for supplier debt ledger & paper checks
const tenantSupplierLedgers = new Map<string, SupplierLedgerItem[]>();

function getTenantLedger(tenantId: string): SupplierLedgerItem[] {
  let list = tenantSupplierLedgers.get(tenantId);
  if (!list) {
    list = [];
    tenantSupplierLedgers.set(tenantId, list);
  }
  return list;
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const ledger = getTenantLedger(ctx.tenantId);

    // Compute live KPI summaries
    const now = new Date();
    const nowStr = now.toISOString().split("T")[0];
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split("T")[0];

    let totalDebtOwedMAD = 0;
    let upcomingMaturitiesCount = 0;
    let upcomingMaturitiesAmountMAD = 0;

    for (const item of ledger) {
      if (item.status !== "settled" && item.balanceOwedMAD > 0) {
        totalDebtOwedMAD += item.balanceOwedMAD;
        if (item.dueDate <= sevenDaysFromNow) {
          upcomingMaturitiesCount += 1;
          upcomingMaturitiesAmountMAD += item.balanceOwedMAD;
        }
      }
    }

    // Fetch suppliers count from Prisma
    const suppliersCount = await prisma.supplier.count({
      where: { tenantId: ctx.tenantId },
    });

    return jsonOk({
      summary: {
        totalSuppliers: suppliersCount,
        totalDebtOwedMAD,
        upcomingMaturitiesCount,
        upcomingMaturitiesAmountMAD,
      },
      items: ledger,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const CreateLedgerItemSchema = z.object({
  supplierId: z.string(),
  supplierName: z.string().min(1),
  supplierPhone: z.string().optional(),
  invoiceNumber: z.string().min(1),
  amountMAD: z.number().positive(),
  balanceOwedMAD: z.number().nonnegative(),
  paymentMethod: z.enum(["check", "effet", "cash", "virement"]),
  checkNumber: z.string().optional(),
  dueDate: z.string(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();

    if (body.action === "settle") {
      const { id, amountPaid } = body;
      const ledger = getTenantLedger(ctx.tenantId);
      const item = ledger.find((l) => l.id === id);
      if (!item) {
        throw new AppError("NOT_FOUND", "Facture fournisseur introuvable", 404);
      }
      const paid = Number(amountPaid) || item.balanceOwedMAD;
      item.balanceOwedMAD = Math.max(0, item.balanceOwedMAD - paid);
      if (item.balanceOwedMAD === 0) {
        item.status = "settled";
      }
      return jsonOk({ success: true, item });
    }

    const parsed = CreateLedgerItemSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0].message, 422);
    }

    const newItem: SupplierLedgerItem = {
      id: `sup-inv-${Date.now()}`,
      ...parsed.data,
      status: parsed.data.balanceOwedMAD === 0 ? "settled" : "pending",
      createdAt: new Date().toISOString(),
    };

    const ledger = getTenantLedger(ctx.tenantId);
    ledger.unshift(newItem);

    return jsonOk({ success: true, item: newItem }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
