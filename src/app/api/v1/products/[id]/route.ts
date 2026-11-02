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

    // Strict tenant isolation check: verify product belongs to authenticated tenant
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

    const updateData: {
      imageUrl?: string | null;
      salePrice?: number;
      name?: string;
      sku?: string;
      barcode?: string | null;
      taxRate?: number;
    } = {};

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

    const updated = await prisma.product.update({
      where: {
        tenantId_id: {
          tenantId,
          id: existing.id,
        },
      },
      data: updateData,
    });

    return jsonOk({
      product: {
        id: updated.id,
        name: updated.name,
        sku: updated.sku,
        barcode: updated.barcode,
        imageUrl: updated.imageUrl,
        salePrice: Number(updated.salePrice),
        taxRate: Number(updated.taxRate),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
