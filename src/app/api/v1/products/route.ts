import { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { auth } from "@/auth";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";

async function resolveTenantId(): Promise<string> {
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
    if (fallbackTenant?.id) return fallbackTenant.id;
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();

    const SEEDED_DEMO_NAMES = [
      "Huile d'Olive Extra Vierge Atlas 1L",
      "Thé Vert Sultan Habka 200g",
      "Amlou Beldi aux Amandes & Argan 500g",
      "Lait UHT Centrale Entier 1L",
      "Farine Finot Supérieure 5kg",
      "Eau Minérale Sidi Ali 1.5L",
      "Sucre Morceaux Tigre 1kg",
      "Café Moulu Dubois Gold 250g",
      "Espresso Noir Italien / Nous-Nous",
      "Écouteurs Sans Fil ANC Pro (Garantie 12m)",
      "Couscous Royal Vendredi (Tfaya)",
      "Tajine Poulet Citron Confit & Olives",
      "Chemise Lin Premium Casablanca (Taille L)",
      "Sultan Habka Tea 200g",
      "Atlas Olive Oil 1L",
      "Couscous Royal 1kg",
      "Atlalus Olive Oil 1kg",
    ];
    const SEEDED_DEMO_SKUS = [
      "SKU-OIL-001", "SKU-TEA-002", "SKU-AML-003", "SKU-MLK-004",
      "SKU-FAR-005", "SKU-EAU-006", "SKU-SUC-007", "SKU-CAF-008",
      "DEMO-001", "DEMO-002", "DEMO-003", "DEMO-004", "DEMO-005", "DEMO-006", "DEMO-007", "DEMO-008"
    ];
    try {
      await prisma.product.deleteMany({
        where: {
          tenantId,
          OR: [
            { name: { in: SEEDED_DEMO_NAMES } },
            { sku: { in: SEEDED_DEMO_SKUS } },
          ],
        },
      });
    } catch {
      await prisma.product.updateMany({
        where: {
          tenantId,
          OR: [
            { name: { in: SEEDED_DEMO_NAMES } },
            { sku: { in: SEEDED_DEMO_SKUS } },
          ],
        },
        data: { isActive: false },
      }).catch(() => {});
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const categoryId = searchParams.get("categoryId");

    const products = await prisma.product.findMany({
      where: {
        tenantId,
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
        imageUrl: (p as { imageUrl?: string | null }).imageUrl ?? null,
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
        imageUrl: body.imageUrl?.trim() || null,
        salePrice,
        costPrice,
        wholesalePrice: body.wholesalePrice ? Number(body.wholesalePrice) : null,
        taxRate: Number(body.taxRate ?? 20),
        unit: body.unit === "kg" || body.unit === "g" ? body.unit : "piece",
        trackStock: body.trackStock ?? true,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        batchNumber: body.scalePlu || body.serialImei || body.fashionSize || null,
      } as any,
    });

    const initialStock = Number(body.initialStock ?? body.stockQuantity ?? 0);
    if (initialStock > 0) {
      let store = await prisma.store.findFirst({
        where: { tenantId: ctx.tenantId, isActive: true },
      });
      if (!store) {
        store = await prisma.store.create({
          data: {
            tenantId: ctx.tenantId,
            name: "Magasin Principal",
            code: "MAIN-01",
            isActive: true,
          },
        });
      }
      await prisma.stockLevel.upsert({
        where: {
          tenantId_storeId_productId: {
            tenantId: ctx.tenantId,
            storeId: store.id,
            productId: product.id,
          },
        },
        update: { quantity: initialStock },
        create: {
          tenantId: ctx.tenantId,
          storeId: store.id,
          productId: product.id,
          quantity: initialStock,
        },
      });
    }

    return jsonOk({ product }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

