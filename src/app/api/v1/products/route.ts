import { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError } from "@/server/http/response";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const categoryId = searchParams.get("categoryId");

    const products = await prisma.product.findMany({
      where: {
        tenantId: ctx.tenantId,
        isActive: true,
        ...(categoryId ? { categoryId } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
                { barcode: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
        stockLevels: {
          select: { storeId: true, quantity: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = products.map((p) => {
      const totalStock = p.stockLevels.reduce(
        (sum, s) => sum + Number(s.quantity),
        0
      );
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        salePrice: Number(p.salePrice),
        taxRate: Number(p.taxRate),
        trackStock: p.trackStock,
        stockQuantity: totalStock,
        categoryId: p.categoryId,
        categoryName: p.category?.name || null,
        batchNumber: p.batchNumber,
        expiryDate: p.expiryDate ? p.expiryDate.toISOString() : null,
      };
    });

    return jsonOk({ products: formatted });
  } catch (err) {
    return handleApiError(err);
  }
}
