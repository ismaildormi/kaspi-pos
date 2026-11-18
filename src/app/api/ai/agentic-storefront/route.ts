import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getSafeServerContext } from "@/server/auth/context";
import {
  sanitizeMerchantField,
  computeStockAndAvailability,
} from "@/lib/ai/store-context-builder";

export const dynamic = "force-dynamic";

/**
 * KASPI POS — AGENTIC STOREFRONTS & UNIVERSAL COMMERCE PROTOCOL API (Section 3)
 * Provides a machine-readable, tenant-isolated Product Catalog, Store Knowledge Base,
 * Product Discovery, and Cross-Sell/Upsell Recommendations for AI Shopping Assistants,
 * while keeping 100% data ownership under the merchant's control.
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getSafeServerContext();
    const tenantId = ctx.tenantId;
    const isFallbackTenant = tenantId === "00000000-0000-0000-0000-000000000000";

    const searchParams = req.nextUrl.searchParams;
    const query = sanitizeMerchantField(searchParams.get("q") || "", 120).toLowerCase();
    const aiReferralChannel = sanitizeMerchantField(
      searchParams.get("utm_source") || searchParams.get("ai_agent") || "direct_discovery",
      60
    );

    let storeName = sanitizeMerchantField(ctx.activeTenant?.displayName || "متجر كسب", 80);
    let legalName = sanitizeMerchantField(ctx.activeTenant?.legalName || storeName, 80);
    let slug = sanitizeMerchantField(ctx.activeTenant?.slug || "kaspi-boutique", 60);
    let currency = ctx.activeTenant?.currency?.trim() || "MAD";
    let sector = "grocery";
    let whatsAppPhone = "";
    let city = "Maroc";

    const products: Array<{
      id: string;
      sku: string;
      name: string;
      description: string;
      category: string;
      price: number;
      currency: string;
      stockQuantity: number;
      availabilityStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
      schemaOrgAvailability: string;
    }> = [];

    if (!isFallbackTenant) {
      const [tenantRow, primaryStore, dbProducts, dbStocks] = await Promise.all([
        prisma.tenant.findUnique({ where: { id: tenantId } }).catch(() => null),
        prisma.store
          .findFirst({ where: { tenantId, isActive: true }, orderBy: { createdAt: "asc" } })
          .catch(() => null),
        prisma.product
          .findMany({
            where: { tenantId, isActive: true, deletedAt: null },
            include: { category: { select: { name: true } } },
            take: 100,
          })
          .catch(() => []),
        prisma.stockLevel
          .findMany({
            where: { tenantId },
            select: { productId: true, quantity: true },
          })
          .catch(() => []),
      ]);

      if (tenantRow?.displayName) storeName = sanitizeMerchantField(tenantRow.displayName, 80);
      if (tenantRow?.legalName) legalName = sanitizeMerchantField(tenantRow.legalName, 80);
      if (tenantRow?.slug) slug = sanitizeMerchantField(tenantRow.slug, 60);
      if (tenantRow?.currency) currency = sanitizeMerchantField(tenantRow.currency, 10);
      if (primaryStore?.phone) whatsAppPhone = sanitizeMerchantField(primaryStore.phone, 30);
      if (primaryStore?.city) city = sanitizeMerchantField(primaryStore.city, 60);

      const stockMap = new Map<string, number>();
      for (const s of dbStocks) {
        const cur = stockMap.get(s.productId) || 0;
        stockMap.set(s.productId, cur + Number(s.quantity || 0));
      }

      for (const p of dbProducts) {
        const rawQty = stockMap.has(p.id) ? stockMap.get(p.id)! : 0;
        const { stockQuantity, availabilityStatus } = computeStockAndAvailability(
          rawQty,
          Number(p.reorderLevel || 5)
        );
        const pName = sanitizeMerchantField(p.nameAr || p.nameFr || p.name || "منتج", 120);
        const pCat = sanitizeMerchantField(p.category?.name || "عام", 60);

        if (
          query &&
          !pName.toLowerCase().includes(query) &&
          !pCat.toLowerCase().includes(query) &&
          !String(p.sku || "").toLowerCase().includes(query)
        ) {
          continue;
        }

        products.push({
          id: p.id,
          sku: sanitizeMerchantField(p.sku || "", 40),
          name: pName,
          description: sanitizeMerchantField(p.description || "", 240),
          category: pCat,
          price: Math.max(0, Number(p.salePrice ?? 0)),
          currency,
          stockQuantity,
          availabilityStatus,
          schemaOrgAvailability:
            stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        });
      }
    }

    // Build Cross-Sell & Upsell Recommendations from real catalog
    const inStockItems = products.filter((p) => p.stockQuantity > 0);
    const recommendations =
      inStockItems.length >= 2
        ? [
            {
              type: "CROSS_SELL_BUNDLE",
              title: `باقة مقترحة من ${storeName}`,
              items: inStockItems.slice(0, 2).map((i) => ({ id: i.id, name: i.name, price: i.price })),
              totalPrice:
                Math.round((inStockItems[0].price + inStockItems[1].price) * 100) / 100,
              currency,
            },
          ]
        : [];

    // Schema.org JSON-LD for Agentic Discovery
    const jsonLdCatalog = {
      "@context": "https://schema.org",
      "@type": "Store",
      name: storeName,
      legalName,
      identifier: slug,
      currenciesAccepted: currency,
      address: {
        "@type": "PostalAddress",
        addressLocality: city,
        addressCountry: "MA",
      },
      telephone: whatsAppPhone || undefined,
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: `${storeName} Verified Product Catalog`,
        numberOfItems: products.length,
        itemListElement: products.slice(0, 30).map((prod, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          item: {
            "@type": "Product",
            productID: prod.id,
            sku: prod.sku,
            name: prod.name,
            description: prod.description || prod.name,
            category: prod.category,
            offers: {
              "@type": "Offer",
              price: prod.price,
              priceCurrency: prod.currency,
              availability: prod.schemaOrgAvailability,
              inventoryLevel: prod.stockQuantity,
            },
          },
        })),
      },
    };

    return NextResponse.json({
      success: true,
      protocol: "KASPI-Agentic-Commerce-v1 (Schema.org + Open Discovery)",
      merchantOwnershipPolicy: {
        tenantId,
        dataOwner: legalName,
        externalPlatformClaimed: "NONE (Independent KASPI POS Agentic Storefront)",
        sharingControlledByMerchant: true,
      },
      aiReferralAttribution: {
        channel: aiReferralChannel,
        searchQuery: query || null,
        timestamp: new Date().toISOString(),
      },
      storeKnowledgeBase: {
        storeName,
        legalName,
        slug,
        sector,
        currency,
        city,
        whatsAppCheckoutPhone: whatsAppPhone,
        shippingPolicy: "التوصيل وفق إعدادات المتجر الرسمية وتأكيد الطلب عبر واتساب أو نقطة البيع.",
        returnPolicy: "الاستبدال والإرجاع وفق الفاتورة الرسمية الصادرة من نظام KASPI POS.",
      },
      productDiscovery: {
        totalMatched: products.length,
        inStockCount: inStockItems.length,
        products,
        recommendations,
      },
      jsonLdCatalog,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate Agentic Storefront catalog",
        details: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}
