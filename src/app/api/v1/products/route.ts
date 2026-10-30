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

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();

    const name = body.name?.trim();
    if (!name) {
      return jsonOk({ error: "Product name is required" }, 400);
    }

    const salePrice = Number(body.salePrice ?? body.suggestedPriceMAD ?? 0);
    const costPrice = body.costPrice ? Number(body.costPrice) : (body.costPriceMAD ? Number(body.costPriceMAD) : null);
    const barcode = body.barcode?.trim() || null;
    const categoryName = body.category?.trim() || body.categoryName?.trim();

    // Resolve or auto-create category for tenant
    let categoryId = body.categoryId || null;
    if (!categoryId && categoryName) {
      let existingCat = await prisma.category.findFirst({
        where: { tenantId: ctx.tenantId, name: { equals: categoryName, mode: "insensitive" } },
      });
      if (!existingCat) {
        existingCat = await prisma.category.create({
          data: {
            tenantId: ctx.tenantId,
            name: categoryName,
          },
        });
      }
      categoryId = existingCat.id;
    }

    // Auto-generate unique SKU if not provided
    const sku =
      body.sku?.trim() ||
      `SKU-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const product = await prisma.product.create({
      data: {
        tenantId: ctx.tenantId,
        name,
        sku,
        barcode,
        categoryId,
        description: body.description?.trim() || null,
        salePrice,
        costPrice,
        taxRate: Number(body.taxRate ?? 20),
        unit: body.unit || "piece",
        trackStock: body.trackStock ?? true,
      },
    });

    return jsonOk({ product }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

