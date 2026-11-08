import { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError } from "@/server/http/response";
import { toPrismaDecimal } from "@/domain/money";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json().catch(() => ({}));
    const clearCatalog = Boolean(body?.clearCatalog);

    const summary = await prisma.$transaction(async (tx) => {
      // 1. Delete KDS tickets & items
      await tx.kitchenTicketItem.deleteMany({
        where: { tenantId: ctx.tenantId },
      });
      const deletedKds = await tx.kitchenTicket.deleteMany({
        where: { tenantId: ctx.tenantId },
      });

      // Reset dining tables to available
      await tx.diningTable.updateMany({
        where: { tenantId: ctx.tenantId },
        data: { status: "available", currentSaleId: null },
      });

      // 2. Delete Customer Credit & Loyalty ledger entries & reset credit balances
      await tx.customerCredit.deleteMany({
        where: { tenantId: ctx.tenantId },
      });
      await tx.loyaltyPoint.deleteMany({
        where: { tenantId: ctx.tenantId },
      });
      await tx.customer.updateMany({
        where: { tenantId: ctx.tenantId },
        data: { currentCreditBalance: toPrismaDecimal(0) },
      });

      // 3. Delete Sales, SaleItems, SalePayments
      await tx.salePayment.deleteMany({
        where: { tenantId: ctx.tenantId },
      });
      await tx.saleItem.deleteMany({
        where: { tenantId: ctx.tenantId },
      });
      const deletedSales = await tx.sale.deleteMany({
        where: { tenantId: ctx.tenantId },
      });

      // 4. Delete Cash Movements & Cash Sessions
      await tx.idempotencyRecord.deleteMany({
        where: { tenantId: ctx.tenantId, scope: "cash_shift_movement" },
      });
      const deletedShifts = await tx.cashSession.deleteMany({
        where: { tenantId: ctx.tenantId },
      });

      // 5. Delete Inventory Movements
      await tx.inventoryMovement.deleteMany({
        where: { tenantId: ctx.tenantId },
      });

      // 6. Optional: Clear Demo Products & Categories if requested
      let deletedProductsCount = 0;
      if (clearCatalog) {
        await tx.stockLevel.deleteMany({
          where: { tenantId: ctx.tenantId },
        });
        const delProds = await tx.product.deleteMany({
          where: { tenantId: ctx.tenantId },
        });
        deletedProductsCount = delProds.count;
        await tx.category.deleteMany({
          where: { tenantId: ctx.tenantId },
        });
      }

      return {
        deletedSales: deletedSales.count,
        deletedKds: deletedKds.count,
        deletedShifts: deletedShifts.count,
        deletedProducts: deletedProductsCount,
      };
    });

    return jsonOk({
      reset: true,
      summary,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
