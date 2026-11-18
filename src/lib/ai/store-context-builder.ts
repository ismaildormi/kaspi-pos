/**
 * ============================================================================
 * KASPI POS — Automatic Store Context Aggregator & Arena Prompt Builder
 * (مُجمّع سياق المتجر التلقائي وحاقن هوية Arena AI + Puck Schema)
 * ============================================================================
 */

import { offlineDb } from "@/client/db";
import type { PuckStorefrontData } from "@/lib/open-source-engines";

export interface StoreProductContextItem {
  id: string;
  name: string;
  sku: string;
  priceMAD: number;
  stockQuantity: number;
  category: string;
  imageUrl?: string | null;
}

export interface AggregatedStoreContext {
  storeName: string;
  slug: string;
  currency: "MAD";
  sector: string;
  whatsAppPhone: string;
  city: string;
  ice: string;
  categories: string[];
  products: StoreProductContextItem[];
  totalCatalogCount: number;
  todayRevenueMAD: number;
  todayOrdersCount: number;
  generatedAt: string;
}

/**
 * Automatically aggregates the merchant's real store profile, categories, and available products
 * from local Dexie DB and/or POS state.
 */
export async function aggregateMerchantStoreContext(overrides?: {
  shopName?: string;
  sector?: string;
  phone?: string;
  city?: string;
  ice?: string;
}): Promise<AggregatedStoreContext> {
  const storeName = overrides?.shopName?.trim() || "ASIMA • متجر كسب";
  const cleanSlug =
    storeName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "kaspi-boutique";

  let rawProducts: any[] = [];
  let rawSales: any[] = [];

  if (typeof window !== "undefined" && offlineDb) {
    try {
      [rawProducts, rawSales] = await Promise.all([
        offlineDb.offlineProducts.toArray().catch(() => []),
        offlineDb.offlineSales.toArray().catch(() => []),
      ]);
    } catch {}
  }

  // Fallback to API if local Dexie is empty
  if (typeof window !== "undefined" && rawProducts.length === 0) {
    try {
      const res = await fetch("/api/v1/products");
      if (res.ok) {
        const json = await res.json();
        rawProducts = json?.data?.products || json?.products || [];
      }
    } catch {}
  }

  const categorySet = new Set<string>(["الكل", "الأكثر مبيعاً", "العروض الخاصة"]);
  const mappedProducts: StoreProductContextItem[] = rawProducts.slice(0, 30).map((p: any, idx: number) => {
    const cat =
      p.categoryName ||
      p.category?.name ||
      p.department ||
      (overrides?.sector === "fashion"
        ? "ألبسة وموضة"
        : overrides?.sector === "electronics"
        ? "إلكترونيات"
        : "مواد عامة");
    if (cat) categorySet.add(String(cat));

    return {
      id: String(p.id || `prod-${idx + 1}`),
      name: String(p.name || `منتج ${idx + 1}`),
      sku: String(p.sku || p.barcode || `SKU-${100 + idx}`),
      priceMAD: Number(p.salePrice ?? p.price ?? 0),
      stockQuantity: Number(p.stockQuantity ?? 10),
      category: String(cat),
      imageUrl: p.imageUrl || p.image || null,
    };
  });

  const todayStart = new Date().setHours(0, 0, 0, 0);
  const todaySales = rawSales.filter((s: any) => Number(s.createdAt || 0) >= todayStart);
  const todayRevenueMAD = todaySales.reduce((acc: number, s: any) => acc + Number(s.grandTotal || 0), 0);

  return {
    storeName,
    slug: cleanSlug,
    currency: "MAD",
    sector: overrides?.sector || "grocery",
    whatsAppPhone: overrides?.phone || "+212600000000",
    city: overrides?.city || "الدار البيضاء • المغرب",
    ice: overrides?.ice || "003291823000045",
    categories: Array.from(categorySet),
    products: mappedProducts,
    totalCatalogCount: rawProducts.length,
    todayRevenueMAD,
    todayOrdersCount: todaySales.length,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Converts the merchant's store context into a structured Hidden System Prompt (System Context)
 * that instructs Arena AI models to generate a Puck-compatible JSON storefront schema.
 */
export function buildArenaStoreSystemPrompt(
  ctx: AggregatedStoreContext,
  merchantCustomGoal?: string
): string {
  const productsSummary =
    ctx.products.length > 0
      ? ctx.products
          .slice(0, 15)
          .map(
            (p, i) =>
              `  ${i + 1}. "${p.name}" | السعر: ${p.priceMAD.toFixed(2)} MAD | المخزون: ${p.stockQuantity} | الصنف: ${p.category}`
          )
          .join("\n")
      : "  (استعمل منتجات افتراضية مناسبة لقطاع المتجر بالدرهم المغربي MAD)";

  return `[HIDDEN_STORE_CONTEXT — KASPI POS MOROCCO ARENA ENGINE]
أنت مهندس متاجر إلكترونية ومصمم واجهات خبير مدمج داخل منصة "Kaspi AI Studio (Arena AI + Puck Builder)".
مهمتك هي توليد تصميم متجر إلكتروني احترافي ومتكامل مخصص لبيانات التاجر الفعلية التالية:

1. معلومات المتجر الأساسية:
   - اسم المتجر: ${ctx.storeName}
   - المسار الرابط (Slug): ${ctx.slug}
   - العملة الرسمية: درهم مغربي (${ctx.currency})
   - قطاع النشاط: ${ctx.sector}
   - المدينة: ${ctx.city}
   - رقم واتساب للطلبات المباشرة: ${ctx.whatsAppPhone}
   - التصنيفات المتوفرة: ${ctx.categories.join(" ، ")}

2. قائمة المنتجات المتوفرة حالياً في مخزون الكاسة (${ctx.totalCatalogCount} سلعة):
${productsSummary}

3. طلب التاجر المخصص:
   "${merchantCustomGoal || "قم بتوليد متجر إلكتروني عصري وفخم بهوية Dark Gray & Emerald Green يحقق أعلى نسبة مبيعات عبر واتساب"}"

4. صيغة المخرجات الإلزامية (Puck JSON Schema):
يجب أن تُخرج JSON متوافقاً 100% مع مخطط مكتبة Puck (@measured/puck) يضم الأقسام التالية:
- HeroBanner (بانر رئيسي باسم المتجر "${ctx.storeName}" وشعار تسويقي جذاب بالدارجة/العربية وزر دعوة للشراء)
- TrustBadges (شريط ضمانات المتجر: التوصيل السريع، الدفع عند الاستلام، الجودة المضمونة)
- CategoryPills (أقسام وتصنيفات المتجر: ${ctx.categories.slice(0, 6).join(", ")})
- ProductGrid (شبكة المنتجات بالصور والأثمنة بالدرهم المغربي MAD)
- PromoBanner (عرض خاص للباك أو الجملة لرفع هامش الربح)
- WhatsAppCheckout (زر الطلب المباشر عبر واتساب: ${ctx.whatsAppPhone})
- StoreFooter (معلومات المتجر وساعات العمل والمدينة)`;
}

/**
 * Converts an Arena AI response or model output into a validated PuckStorefrontData AST
 * ready for immediate 1-click injection into Puck Builder ("Apply to Puck").
 */
export function convertArenaOutputToPuckSchema(
  ctx: AggregatedStoreContext,
  variant: {
    modelName: string;
    heroTitle?: string;
    slogan?: string;
    badgeText?: string;
    ctaText?: string;
    promoTitle?: string;
    promoSubtitle?: string;
    accentColor?: string;
    whatsappBtnText?: string;
  }
): PuckStorefrontData {
  return {
    slug: ctx.slug,
    storeName: variant.heroTitle || ctx.storeName,
    slogan:
      variant.slogan ||
      "أجود السلع المختارة بعناية بأفضل الأثمنة في السوق مع توصيل سريع لباب دارك",
    sector: (ctx.sector as any) || "grocery",
    accentColor: variant.accentColor || "#10b981",
    whatsAppPhone: ctx.whatsAppPhone,
    currency: "MAD",
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        id: "blk-hero",
        type: "HeroBanner",
        visible: true,
        props: {
          badge: variant.badgeText || `متجر معتمد • ${ variant.modelName } Design`,
          ctaText: variant.ctaText || "تصفح الكتالوج واطلب عبر واتساب",
        },
      },
      {
        id: "blk-badges",
        type: "TrustBadges",
        visible: true,
        props: {
          items: [
            { icon: "truck", title: "توصيل فوري", desc: `توصيل سريع في ${ctx.city}` },
            { icon: "cash", title: "الدفع عند الاستلام", desc: "خلص نقداً أو بالبطاقة عند الاستلام" },
            { icon: "shield", title: "جودة مضمونة 100%", desc: "مرتبط مباشرة بمخزون الكاسة الحي" },
          ],
        },
      },
      {
        id: "blk-cats",
        type: "CategoryPills",
        visible: true,
        props: {
          categories: ctx.categories.slice(0, 6),
        },
      },
      {
        id: "blk-products",
        type: "ProductGrid",
        visible: true,
        props: {
          columns: 3,
          showStockBadge: true,
          productsSnapshot: ctx.products.slice(0, 12),
        },
      },
      {
        id: "blk-promo",
        type: "PromoBanner",
        visible: true,
        props: {
          title: variant.promoTitle || "عروض الباك والجملة الخاصة",
          subtitle: variant.promoSubtitle || "وفر أكثر عند طلب باك ×6 أو كرتونة ×12 مباشرة من المتجر",
        },
      },
      {
        id: "blk-whatsapp",
        type: "WhatsAppCheckout",
        visible: true,
        props: {
          buttonText: variant.whatsappBtnText || "اطلب الآن مباشرة عبر واتساب",
        },
      },
      {
        id: "blk-footer",
        type: "StoreFooter",
        visible: true,
        props: {
          hours: "مفتوح يومياً لخدمتكم",
          city: ctx.city,
        },
      },
    ],
  };
}

/**
 * Generates the CSS & JS White-Label Injection snippet for Tauri WebView / Embedded Arena frames
 * unifying colors to KASPI POS Dark Gray (#1e1e1e) and Emerald Green (#10b981).
 */
export function getArenaWhiteLabelInjectionScript(hiddenContextPrompt: string): {
  css: string;
  js: string;
} {
  const css = `
    :root, body, html {
      background-color: #1e1e1e !important;
      color: #f4f4f5 !important;
      font-family: 'Inter', 'Cairo', sans-serif !important;
    }
    header, nav.external-navbar, .lm-arena-topbar, footer.external-footer {
      display: none !important;
    }
    button.primary, .btn-primary, [type="submit"] {
      background-color: #10b981 !important;
      border-color: #059669 !important;
      color: #000000 !important;
      font-weight: 700 !important;
      border-radius: 12px !important;
    }
    textarea, input[type="text"] {
      background-color: #14161a !important;
      border: 1px solid rgba(16, 185, 129, 0.35) !important;
      color: #ffffff !important;
      border-radius: 14px !important;
    }
  `.trim();

  const escapedPrompt = JSON.stringify(hiddenContextPrompt);
  const js = `
    (function() {
      const style = document.createElement('style');
      style.textContent = ${JSON.stringify(css)};
      document.head.appendChild(style);
      const inputEl = document.querySelector('textarea') || document.querySelector('input[type="text"]');
      if (inputEl && !inputEl.dataset.kaspiInjected) {
        inputEl.value = ${escapedPrompt};
        inputEl.dataset.kaspiInjected = 'true';
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })();
  `.trim();

  return { css, js };
}
