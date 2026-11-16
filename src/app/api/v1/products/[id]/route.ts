import { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { auth } from "@/auth";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";

async function resolveAuthenticatedTenantId(): Promise<string> {
  try {
    const ctx = await getRequestContext();
    return ctx.tenantId;
  } catch {
    const session = await auth();
    if (session?.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { memberships: { where: { status: "active" }, take: 1 } },
      });
      const tenantId =
        dbUser?.defaultTenantId || dbUser?.memberships[0]?.tenantId;
      if (tenantId) return tenantId;
    }

    const fallbackTenant = await prisma.tenant.findFirst({
      select: { id: true },
    });
    if (fallbackTenant?.id) {
      return fallbackTenant.id;
    }

    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await resolveAuthenticatedTenantId();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.product.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existing) {
      throw new AppError(
        "PRODUCT_NOT_FOUND",
        "Product not found or access denied for this tenant",
        404
      );
    }

    const updateData: Record<string, any> = {};

    if (body.imageUrl !== undefined) {
      updateData.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
    }

    if (body.salePrice !== undefined) {
      const parsedPrice = Number(body.salePrice);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        throw new AppError(
          "INVALID_PRICE",
          "Sale price must be a valid non-negative number",
          400
        );
      }
      updateData.salePrice = parsedPrice;
    }

    if (body.costPrice !== undefined) {
      const parsedCost = Number(body.costPrice);
      if (!Number.isNaN(parsedCost) && parsedCost >= 0) {
        updateData.costPrice = parsedCost;
      }
    }

    if (body.wholesalePrice !== undefined) {
      const parsedWh = Number(body.wholesalePrice);
      if (!Number.isNaN(parsedWh) && parsedWh >= 0) {
        updateData.wholesalePrice = parsedWh;
      }
    }

    if (body.name !== undefined && String(body.name).trim()) {
      updateData.name = String(body.name).trim();
    }

    if (body.sku !== undefined && String(body.sku).trim()) {
      updateData.sku = String(body.sku).trim();
    }

    if (body.barcode !== undefined) {
      updateData.barcode = body.barcode ? String(body.barcode).trim() : null;
    }

    if (body.taxRate !== undefined) {
      updateData.taxRate = Number(body.taxRate);
    }

    if (body.unit !== undefined && ["piece", "kg", "liter", "service"].includes(String(body.unit))) {
      updateData.unit = String(body.unit);
    }

    if (body.expiryDate !== undefined) {
      updateData.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    if (body.categoryId !== undefined) {
      updateData.categoryId = body.categoryId || null;
    } else if (body.categoryName !== undefined && String(body.categoryName).trim()) {
      const catName = String(body.categoryName).trim();
      let cat = await prisma.category.findFirst({
        where: { tenantId, name: catName },
      });
      if (!cat) {
        cat = await prisma.category.create({
          data: {
            tenantId,
            name: catName,
            sortOrder: 0,
            isActive: true,
          },
        });
      }
      updateData.categoryId = cat.id;
    }

    const updated = await prisma.product.update({
      where: {
        tenantId_id: {
          tenantId,
          id: existing.id,
        },
      },
      data: updateData,
      include: {
        category: true,
      },
    });

    if (body.stockQuantity !== undefined) {
      const parsedStock = Number(body.stockQuantity);
      if (!Number.isNaN(parsedStock) && parsedStock >= 0) {
        const store = await prisma.store.findFirst({
          where: { tenantId },
          select: { id: true },
        });
        if (store) {
          await prisma.stockLevel.upsert({
            where: {
              tenantId_storeId_productId: {
                tenantId,
                storeId: store.id,
                productId: existing.id,
              },
            },
            create: {
              tenantId,
              storeId: store.id,
              productId: existing.id,
              quantity: parsedStock,
            },
            update: {
              quantity: parsedStock,
            },
          });
        }
      }
    }

    return jsonOk({
      product: {
        id: updated.id,
        name: updated.name,
        sku: updated.sku,
        barcode: updated.barcode,
        imageUrl: updated.imageUrl ?? null,
        salePrice: Number(updated.salePrice),
        costPrice: updated.costPrice !== null ? Number(updated.costPrice) : undefined,
        wholesalePrice: updated.wholesalePrice !== null ? Number(updated.wholesalePrice) : undefined,
        taxRate: Number(updated.taxRate),
        unit: updated.unit,
        categoryId: updated.categoryId,
        categoryName: updated.category?.name ?? body.categoryName ?? null,
        expiryDate: updated.expiryDate ? updated.expiryDate.toISOString().slice(0, 10) : null,
        isActive: updated.isActive,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await resolveAuthenticatedTenantId();
    const { id } = await params;

    const existing = await prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppError("PRODUCT_NOT_FOUND", "Product not found", 404);
    }

    await prisma.product.update({
      where: {
        tenantId_id: {
          tenantId,
          id: existing.id,
        },
      },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return jsonOk({ deleted: true, id: existing.id });
  } catch (err) {
    return handleApiError(err);
  }
}
