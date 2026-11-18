import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getSafeServerContext } from "@/server/auth/context";
import {
  sanitizeMerchantField,
  computeStockAndAvailability,
  type AggregatedStoreContext,
  type StoreCategoryContextItem,
  type StoreProductContextItem,
} from "@/lib/ai/store-context-builder";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const ctx = await getSafeServerContext();
    const tenantId = ctx.tenantId;
    const isFallbackTenant = tenantId === "00000000-0000-0000-0000-000000000000";

    if (isFallbackTenant) {
      const fallbackCtx: AggregatedStoreContext = {
        tenantId,
        storeId: null,
        storeName: sanitizeMerchantField(ctx.activeTenant?.displayName || "متجر كسب", 80),
        legalName: sanitizeMerchantField(ctx.activeTenant?.legalName || "متجر كسب", 80),
        slug: sanitizeMerchantField(ctx.activeTenant?.slug || "kaspi-boutique", 60),
        currency: ctx.activeTenant?.currency?.trim() || "MAD",
        sector: "grocery",
        businessInfo: {
          sector: "grocery",
          legalName: sanitizeMerchantField(ctx.activeTenant?.legalName || "متجر كسب", 80),
          ice: null,
          taxId: null,
          rcNumber: null,
          pricesIncludeTax: true,
          restaurantMode: false,
        },
        contactInfo: {
          phone: null,
          whatsAppPhone: null,
          address: null,
          city: null,
          countryCode: "MA",
        },
        visualIdentity: {
          backgroundColor: "#1e1e1e",
          accentColor: "#10b981",
          logoUrl: null,
          themeName: "kaspi-dark-emerald",
        },
        whatsAppPhone: "",
        city: "",
        ice: "",
        categories: [],
        categoryItems: [],
        products: [],
        totalCatalogCount: 0,
        todayRevenueMAD: 0,
        todayOrdersCount: 0,
        isolationVerified: true,
        sourceMode: "database_authenticated",
        generatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, context: fallbackCtx });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      tenantRow,
      primaryStore,
      profileRecord,
      dbCategories,
      dbProducts,
      dbStockLevels,
      todaySales,
    ] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }).catch(() => null),
      prisma.store
        .findFirst({
          where: { tenantId, isActive: true },
          orderBy: { createdAt: "asc" },
        })
        .catch(() => null),
      prisma.idempotencyRecord
        .findUnique({
          where: {
            tenantId_scope_key: {
              tenantId,
              scope: "workspace_config",
              key: "store_profile",
            },
          },
        })
        .catch(() => null),
      prisma.category
        .findMany({
          where: { tenantId, isActive: true, deletedAt: null },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        })
        .catch(() => []),
      prisma.product
        .findMany({
          where: { tenantId, isActive: true, deletedAt: null },
          include: {
            category: { select: { id: true, name: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 100,
        })
        .catch(() => []),
      prisma.stockLevel
        .findMany({
          where: { tenantId },
          select: { productId: true, quantity: true },
        })
        .catch(() => []),
      prisma.sale
        .findMany({
          where: {
            tenantId,
            status: "completed",
            createdAt: { gte: startOfDay },
          },
          select: { grandTotal: true },
        })
        .catch(() => []),
    ]);

    const profileJson = (profileRecord?.responseBody as Record<string, unknown> | null) || {};
    const currency =
      (typeof tenantRow?.currency === "string" && tenantRow.currency.trim()) ||
      ctx.activeTenant?.currency?.trim() ||
      "MAD";

    const storeName = sanitizeMerchantField(
      (profileJson.shopName as string) ||
        tenantRow?.displayName ||
        primaryStore?.name ||
        ctx.activeTenant?.displayName ||
        "متجر كسب",
      80
    );
    const legalName = sanitizeMerchantField(
      tenantRow?.legalName || ctx.activeTenant?.legalName || storeName,
      80
    );
    const slug =
      sanitizeMerchantField(tenantRow?.slug || ctx.activeTenant?.slug || "boutique", 60)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-") || "boutique";

    const sector = sanitizeMerchantField(
      (profileJson.storeType as string) ||
        (tenantRow?.restaurantMode ? "restaurant" : "grocery"),
      30
    );

    const phone = profileJson.phone
      ? sanitizeMerchantField(profileJson.phone, 30)
      : primaryStore?.phone
      ? sanitizeMerchantField(primaryStore.phone, 30)
      : null;

    const city = tenantRow?.city
      ? sanitizeMerchantField(tenantRow.city, 60)
      : primaryStore?.address
      ? sanitizeMerchantField(primaryStore.address, 60)
      : null;

    const address = tenantRow?.address
      ? sanitizeMerchantField(tenantRow.address, 120)
      : primaryStore?.address
      ? sanitizeMerchantField(primaryStore.address, 120)
      : null;

    const ice = tenantRow?.ice ? sanitizeMerchantField(tenantRow.ice, 30) : null;
    const taxId = tenantRow?.taxId ? sanitizeMerchantField(tenantRow.taxId, 30) : null;
    const rcNumber = tenantRow?.rcNumber ? sanitizeMerchantField(tenantRow.rcNumber, 30) : null;

    // Aggregate stock levels per product (clamping negative stock to 0)
    const stockMap = new Map<string, number>();
    for (const sl of dbStockLevels) {
      const current = stockMap.get(sl.productId) || 0;
      const delta = Number(sl.quantity || 0);
      stockMap.set(sl.productId, current + (Number.isFinite(delta) ? delta : 0));
    }

    const catCountMap = new Map<string, number>();
    const mappedProducts: StoreProductContextItem[] = dbProducts.map((p) => {
      const rawStock = stockMap.get(p.id) ?? 0;
      const threshold = p.lowStockThreshold ? Number(p.lowStockThreshold) : 5;
      const { stockQuantity, availabilityStatus } = computeStockAndAvailability(
        rawStock,
        p.trackStock,
        threshold
      );
      const catName = sanitizeMerchantField(p.category?.name || "عام", 60);
      if (p.categoryId) {
        catCountMap.set(p.categoryId, (catCountMap.get(p.categoryId) || 0) + 1);
      }
      const price = Math.max(0, Number(p.salePrice || 0));

      return {
        id: p.id,
        name: sanitizeMerchantField(p.name, 120),
        description: p.description ? sanitizeMerchantField(p.description, 200) : null,
        sku: sanitizeMerchantField(p.sku, 40),
        barcode: p.barcode ? sanitizeMerchantField(p.barcode, 40) : null,
        price,
        priceMAD: price,
        currency,
        categoryId: p.categoryId,
        category: catName,
        imageUrl: p.imageUrl && p.imageUrl.trim() ? p.imageUrl.trim() : null,
        stockQuantity,
        trackStock: p.trackStock,
        availabilityStatus,
      };
    });

    const categoryItems: StoreCategoryContextItem[] = dbCategories.map((c) => ({
      id: c.id,
      name: sanitizeMerchantField(c.name, 60),
      sortOrder: c.sortOrder,
      productCount: catCountMap.get(c.id) || 0,
    }));

    // If products reference categories not yet in categoryItems, include them
    const knownCatNames = new Set(categoryItems.map((c) => c.name));
    for (const prod of mappedProducts) {
      if (prod.category && !knownCatNames.has(prod.category)) {
        knownCatNames.add(prod.category);
        categoryItems.push({
          id: prod.categoryId || `cat-${categoryItems.length + 1}`,
          name: prod.category,
          sortOrder: categoryItems.length + 1,
          productCount: mappedProducts.filter((x) => x.category === prod.category).length,
        });
      }
    }

    const todayRevenue = todaySales.reduce(
      (acc, s) => acc + Math.max(0, Number(s.grandTotal || 0)),
      0
    );

    const context: AggregatedStoreContext = {
      tenantId,
      storeId: primaryStore?.id || null,
      storeName,
      legalName,
      slug,
      currency,
      sector,
      businessInfo: {
        sector,
        legalName,
        ice,
        taxId,
        rcNumber,
        pricesIncludeTax: tenantRow?.pricesIncludeTax ?? true,
        restaurantMode: Boolean(tenantRow?.restaurantMode),
      },
      contactInfo: {
        phone,
        whatsAppPhone: phone,
        address,
        city,
        countryCode: tenantRow?.countryCode || "MA",
      },
      visualIdentity: {
        backgroundColor: "#1e1e1e",
        accentColor: "#10b981",
        logoUrl: typeof profileJson.logoUrl === "string" ? profileJson.logoUrl : null,
        themeName: "kaspi-dark-emerald",
      },
      whatsAppPhone: phone || "",
      city: city || "",
      ice: ice || "",
      categories: categoryItems.map((c) => c.name),
      categoryItems,
      products: mappedProducts,
      totalCatalogCount: mappedProducts.length,
      todayRevenueMAD: Math.round(todayRevenue * 100) / 100,
      todayOrdersCount: todaySales.length,
      isolationVerified: true,
      sourceMode: "database_authenticated",
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      context,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load store context";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
