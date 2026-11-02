import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { auth } from "@/auth";
import { handleApiError } from "@/server/http/response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim();

    if (!code) {
      return NextResponse.json(
        { error: "Barcode parameter 'code' is required" },
        { status: 400 }
      );
    }

    // Resolve authenticated tenantId
    let tenantId: string | undefined;
    try {
      const ctx = await getRequestContext();
      tenantId = ctx.tenantId;
    } catch {
      const session = await auth();
      if (session?.user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: { memberships: { where: { status: "active" }, take: 1 } },
        });
        tenantId = dbUser?.defaultTenantId || dbUser?.memberships[0]?.tenantId;
      }
      if (!tenantId) {
        const fallbackTenant = await prisma.tenant.findFirst({
          select: { id: true },
        });
        tenantId = fallbackTenant?.id;
      }
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: "Unauthorized: No active tenant context" },
        { status: 401 }
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        tenantId,
        isActive: true,
        barcode: {
          equals: code,
          mode: "insensitive",
        },
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
        stockLevels: {
          select: { storeId: true, quantity: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found in this store" },
        { status: 404 }
      );
    }

    const stockQuantity = product.stockLevels.reduce(
      (sum, level) => sum + Number(level.quantity),
      0
    );

    const salePrice = Number(product.salePrice);
    const taxRate = Number(product.taxRate);

    const payload = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      price: salePrice,
      salePrice,
      taxRate,
      trackStock: product.trackStock,
      stockQuantity,
      categoryId: product.categoryId,
      categoryName: product.category?.name || null,
    };

    return NextResponse.json({ product: payload, data: { product: payload } });
  } catch (err) {
    return handleApiError(err);
  }
}
