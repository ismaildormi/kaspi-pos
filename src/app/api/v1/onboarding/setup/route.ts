import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";
import { toPrismaDecimal, toPrismaQtyDecimal, toDecimal } from "@/domain/money";

export type StoreIndustryType =
  | "grocery"
  | "butchery"
  | "restaurant"
  | "bakery"
  | "fashion"
  | "electronics"
  | "tech"
  | "wholesale";

const SetupOnboardingSchema = z.object({
  storeType: z.enum([
    "grocery",
    "butchery",
    "restaurant",
    "bakery",
    "fashion",
    "electronics",
    "tech",
    "wholesale",
  ]),
  shopName: z.string().min(2).optional(),
  currency: z.enum(["MAD", "EUR", "USD", "SAR", "AED", "TRY"]).default("MAD"),
  receiptLanguage: z.enum(["ar", "fr", "en", "tr", "es", "de"]).default("ar"),
  seedStarterCatalog: z.boolean().default(false),
});

interface StarterProductTemplate {
  name: string;
  sku: string;
  barcode: string;
  category: string;
  salePrice: string;
  costPrice: string;
  unit: "piece" | "kg" | "liter" | "service";
  stockQty: number;
  description?: string;
}

const INDUSTRY_STARTER_CATALOGS: Record<StoreIndustryType, StarterProductTemplate[]> = {
  grocery: [
    {
      name: "حليب سنترال كامل الدسم 1L • Lait Centrale 1L",
      sku: "GRC-MILK-001",
      barcode: "6111035000010",
      category: "الألبان والمشتقات • Produits Laitiers",
      salePrice: "7.50",
      costPrice: "6.20",
      unit: "liter",
      stockQty: 120,
      description: "Weight/Unit Barcode Priority",
    },
    {
      name: "زيت المائدة لوسيور 5L • Huile Lesieur 5L",
      sku: "GRC-OIL-002",
      barcode: "6111024000526",
      category: "المواد الغذائية • Épicerie",
      salePrice: "92.00",
      costPrice: "81.00",
      unit: "liter",
      stockQty: 45,
      description: "Fast-moving supermarket staple",
    },
    {
      name: "شاي سلطان حبوب 200g • Thé Sultan 200g",
      sku: "GRC-TEA-003",
      barcode: "6111031001240",
      category: "المشروبات والقهوة • Boissons",
      salePrice: "24.00",
      costPrice: "18.50",
      unit: "piece",
      stockQty: 80,
      description: "Moroccan Green Tea",
    },
    {
      name: "تفاح أحمر محلي (بالكيلو) • Pommes Rouges (Kg)",
      sku: "GRC-WGT-004",
      barcode: "2100004000005",
      category: "الخضر والفواكه بالوزن • Fruits & Légumes (Kg)",
      salePrice: "16.00",
      costPrice: "11.00",
      unit: "kg",
      stockQty: 65,
      description: "Scale Weight Pricing (Kg)",
    },
  ],
  restaurant: [
    {
      name: "طاجين لحم بالبرقوق واللوز • Tajine Viande Pruneaux",
      sku: "RST-TAJ-001",
      barcode: "6112000001012",
      category: "الأطباق الرئيسية • Plats Marocains",
      salePrice: "75.00",
      costPrice: "32.00",
      unit: "piece",
      stockQty: 50,
      description: "Modifiers: بدون بصل | خبز إضافي | حار",
    },
    {
      name: "بيتزا مارغريتا نابوليتانا • Pizza Margherita",
      sku: "RST-PIZ-002",
      barcode: "6112000001029",
      category: "البيتزا والباستا • Pizzas & Pâtes",
      salePrice: "55.00",
      costPrice: "20.00",
      unit: "piece",
      stockQty: 60,
      description: "Modifiers: جبن إضافي (+10 DH) | زيتون",
    },
    {
      name: "قهوة إسبريسو مزدوجة • Double Espresso",
      sku: "RST-CAF-003",
      barcode: "6112000001036",
      category: "المشروبات الساخنة • Café & Thé",
      salePrice: "18.00",
      costPrice: "4.50",
      unit: "piece",
      stockQty: 200,
      description: "Modifiers: حليب اللوز | بدون سكر",
    },
    {
      name: "عصير أفوكادو بالفواكه الجافة • Jus Avocat Fruits Secs",
      sku: "RST-JUS-004",
      barcode: "6112000001043",
      category: "العصائر الطازجة • Jus Frais",
      salePrice: "32.00",
      costPrice: "12.00",
      unit: "piece",
      stockQty: 90,
      description: "Modifiers: بدون ثلج | عسل حر",
    },
  ],
  fashion: [
    {
      name: "قميص قطني كلاسيكي أكسفورد • Chemise Oxford Slim",
      sku: "FSH-SHIRT-001",
      barcode: "6113000002019",
      category: "ملابس رجالية • Homme",
      salePrice: "290.00",
      costPrice: "140.00",
      unit: "piece",
      stockQty: 40,
      description: "Sizes: S, M, L, XL, XXL | Colors: Black, White, Navy",
    },
    {
      name: "حذاء رياضي جلدي كاجوال • Sneakers Cuir Premium",
      sku: "FSH-SHOE-002",
      barcode: "6113000002026",
      category: "الأحذية الرياضية • Chaussures",
      salePrice: "540.00",
      costPrice: "260.00",
      unit: "piece",
      stockQty: 25,
      description: "Sizes: 40, 41, 42, 43, 44 | Colors: White, Black",
    },
    {
      name: "سترة شتوية مقاومة للماء • Veste Bomber Imperméable",
      sku: "FSH-JKT-003",
      barcode: "6113000002033",
      category: "المعاطف والسترات • Vestes",
      salePrice: "650.00",
      costPrice: "310.00",
      unit: "piece",
      stockQty: 18,
      description: "Sizes: M, L, XL | Colors: Olive, Charcoal",
    },
    {
      name: "حقيبة يد جلدية فاخرة • Sac à Main Cuir",
      sku: "FSH-BAG-004",
      barcode: "6113000002040",
      category: "إكسسوارات وحقائب • Accessoires",
      salePrice: "420.00",
      costPrice: "190.00",
      unit: "piece",
      stockQty: 30,
      description: "Sizes: OneSize | Colors: Camel, Black, Burgundy",
    },
  ],
  electronics: [
    {
      name: "هاتف ذكي Samsung Galaxy A55 5G 256GB",
      sku: "ELC-PHN-001",
      barcode: "8806095501234",
      category: "الهواتف الذكية • Smartphones",
      salePrice: "3890.00",
      costPrice: "3350.00",
      unit: "piece",
      stockQty: 15,
      description: "IMEI/Serial Tracking Required • Warranty: 12 Months Official",
    },
    {
      name: "سماعات لاسلكية Apple AirPods Pro (USB-C)",
      sku: "ELC-AUD-002",
      barcode: "195949052453",
      category: "الصوتيات والإكسسوارات • Audio",
      salePrice: "2690.00",
      costPrice: "2250.00",
      unit: "piece",
      stockQty: 22,
      description: "Serial Number Tracking • Warranty: 12 Months Apple",
    },
    {
      name: "شاحن سريع جداري 65W GaN Type-C",
      sku: "ELC-ACC-003",
      barcode: "6941876210984",
      category: "الشواحن والكابلات • Chargeurs",
      salePrice: "240.00",
      costPrice: "110.00",
      unit: "piece",
      stockQty: 55,
      description: "Warranty: 6 Months Replacement",
    },
    {
      name: "قارئ باركود ليزر لاسلكي 2D • Douchette Laser 2D",
      sku: "ELC-POS-004",
      barcode: "6114000004013",
      category: "معدات نقاط البيع • Matériel POS",
      salePrice: "580.00",
      costPrice: "320.00",
      unit: "piece",
      stockQty: 12,
      description: "Serial Number Tracking • Warranty: 24 Months",
    },
  ],
  butchery: [
    {
      name: "هبرة بقر ممتازة (بالكيلو) • Viande Bovine Extra (Kg)",
      sku: "BTC-BEEF-001",
      barcode: "2100001000008",
      category: "لحوم البقر الطازجة • Bœuf",
      salePrice: "110.00",
      costPrice: "85.00",
      unit: "kg",
      stockQty: 45,
      description: "Scale Weight (PLU: 0101)",
    },
    {
      name: "كفتة طازجة متبلة (بالكيلو) • Viande Hachée Assaisonnée (Kg)",
      sku: "BTC-MINC-002",
      barcode: "2100002000007",
      category: "مفروم ولحوم جاهزة • Haché",
      salePrice: "95.00",
      costPrice: "70.00",
      unit: "kg",
      stockQty: 30,
      description: "Scale Weight (PLU: 0102)",
    },
    {
      name: "فخذ دجاج رومي طازج (بالكيلو) • Cuisse de Poulet (Kg)",
      sku: "BTC-CHIK-003",
      barcode: "2100003000006",
      category: "الدواجن والطيور • Volaille",
      salePrice: "42.00",
      costPrice: "30.00",
      unit: "kg",
      stockQty: 60,
      description: "Scale Weight (PLU: 0103)",
    },
    {
      name: "نقانق صوصيص بلدي (بالكيلو) • Merguez Traditionnelles (Kg)",
      sku: "BTC-SAUS-004",
      barcode: "2100005000004",
      category: "النقانق والمصنعات • Charcuterie",
      salePrice: "80.00",
      costPrice: "55.00",
      unit: "kg",
      stockQty: 25,
      description: "Scale Weight (PLU: 0104)",
    },
  ],
  bakery: [
    {
      name: "خبز القمح التقليدي • Pain Complet Traditionnel",
      sku: "BKR-BREAD-001",
      barcode: "6115000005011",
      category: "المخبوزات التقليدية • Pains",
      salePrice: "2.00",
      costPrice: "1.20",
      unit: "piece",
      stockQty: 150,
      description: "Moroccan Fresh Daily Bread",
    },
    {
      name: "كرواسون زبدة ممتازة • Croissant Pur Beurre",
      sku: "BKR-CRSN-002",
      barcode: "6115000005028",
      category: "الفطائر والكرواسون • Viennoiserie",
      salePrice: "4.50",
      costPrice: "2.20",
      unit: "piece",
      stockQty: 80,
      description: "Viennoiserie Française",
    },
    {
      name: "خبز باجيت باريسي • Baguette Parisienne",
      sku: "BKR-BAG-003",
      barcode: "6115000005035",
      category: "المخبوزات التقليدية • Pains",
      salePrice: "1.50",
      costPrice: "0.80",
      unit: "piece",
      stockQty: 200,
      description: "Baguette Croustillante",
    },
    {
      name: "حلوى ميل فاي بالشوكولا • Mille-Feuille Chocolat",
      sku: "BKR-MILF-004",
      barcode: "6115000005042",
      category: "الحلويات الراقية • Pâtisserie",
      salePrice: "6.00",
      costPrice: "3.00",
      unit: "piece",
      stockQty: 50,
      description: "Pâtisserie Fraîche",
    },
  ],
  tech: [
    {
      name: "كمبيوتر محمول HP ProBook 15 G9 Core i5",
      sku: "TCH-LPT-001",
      barcode: "196548123456",
      category: "الحواسيب المحمولة • PC Portables",
      salePrice: "7400.00",
      costPrice: "6200.00",
      unit: "piece",
      stockQty: 8,
      description: "Serial Number Tracking • Warranty: 12 Months",
    },
    {
      name: "شاشة ألعاب 24 بوصة IPS 144Hz • Écran Gaming 24\"",
      sku: "TCH-MON-002",
      barcode: "880609123789",
      category: "الشاشات والعرض • Écrans",
      salePrice: "1650.00",
      costPrice: "1250.00",
      unit: "piece",
      stockQty: 15,
      description: "Serial Number Tracking • Warranty: 24 Months",
    },
    {
      name: "قرص تخزين سريع SSD 1TB NVMe PCIe 4.0",
      sku: "TCH-SSD-003",
      barcode: "731855001234",
      category: "التخزين والقطع • Composants",
      salePrice: "890.00",
      costPrice: "680.00",
      unit: "piece",
      stockQty: 35,
      description: "Warranty: 36 Months",
    },
    {
      name: "لوحة مفاتيح ميكانيكية RGB • Clavier Mécanique RGB",
      sku: "TCH-KBD-004",
      barcode: "693234560012",
      category: "الملحقات والطرفيات • Périphériques",
      salePrice: "450.00",
      costPrice: "280.00",
      unit: "piece",
      stockQty: 25,
      description: "Warranty: 12 Months",
    },
  ],
  wholesale: [
    {
      name: "كرتون زيت المائدة 5L × 4 وحدات • Carton Huile 5L (x4)",
      sku: "WHS-OIL-001",
      barcode: "6111024000999",
      category: "الزيوت والمواد الدهنية • Huiles Gros",
      salePrice: "350.00",
      costPrice: "315.00",
      unit: "piece",
      stockQty: 80,
      description: "Colisage: 4 bidons de 5L (Prix unitaire: 87.50 MAD)",
    },
    {
      name: "صندوق سكر قوالب 24Kg • Carton Pain de Sucre 24Kg",
      sku: "WHS-SUG-002",
      barcode: "6111025000888",
      category: "المواد الأساسية • Produits de Base",
      salePrice: "145.00",
      costPrice: "132.00",
      unit: "piece",
      stockQty: 120,
      description: "Conditionnement: 12 pains de 2kg",
    },
    {
      name: "صندوق شاي سلطان 50 علبة • Carton Thé Sultan 200g (x50)",
      sku: "WHS-TEA-003",
      barcode: "6111031009999",
      category: "الشاي والبن بالجملة • Thé & Café Gros",
      salePrice: "1050.00",
      costPrice: "900.00",
      unit: "piece",
      stockQty: 40,
      description: "Colisage B2B: 50 unités de 200g",
    },
    {
      name: "كرتون حليب معقم 1L × 12 • Pack Lait UHT 1L (x12)",
      sku: "WHS-MLK-004",
      barcode: "6111035008888",
      category: "الألبان ومشتقاتها • Laiterie Gros",
      salePrice: "92.00",
      costPrice: "84.00",
      unit: "piece",
      stockQty: 100,
      description: "Colisage Pack: 12 briques d'un litre",
    },
  ],
};

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const parsed = SetupOnboardingSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "Invalid onboarding configuration",
        400
      );
    }

    const { storeType, shopName, currency, receiptLanguage, seedStarterCatalog } = parsed.data;
    const farFuture = new Date("2099-12-31T23:59:59Z");

    // 1. Update Tenant & TenantSettings if shopName provided
    if (shopName) {
      await prisma.tenant
        .update({
          where: { id: ctx.tenantId },
          data: {
            displayName: shopName,
            currency,
            locale: receiptLanguage === "ar" ? "ar" : receiptLanguage === "en" ? "en" : "fr",
          },
        })
        .catch(() => {});

      await prisma.tenantSettings
        .upsert({
          where: { tenantId: ctx.tenantId },
          create: {
            tenantId: ctx.tenantId,
            shopName,
          },
          update: {
            shopName,
          },
        })
        .catch(() => {});
    }

    // 2. Persist Workspace Profile in IdempotencyRecord
    const workspaceProfile = {
      storeType,
      onboardingCompleted: true,
      currency,
      receiptLanguage,
      enableKds: storeType === "restaurant",
      enableTableGrid: storeType === "restaurant",
      enableVariantsMatrix: storeType === "fashion",
      enableSerialTracking: storeType === "electronics" || storeType === "tech",
      enableWeightScale:
        storeType === "grocery" || storeType === "butchery" || storeType === "bakery",
      enableWholesaleTiers: storeType === "wholesale",
      completedAt: new Date().toISOString(),
    };

    await prisma.idempotencyRecord.upsert({
      where: {
        tenantId_scope_key: {
          tenantId: ctx.tenantId,
          scope: "workspace_config",
          key: "store_profile",
        },
      },
      create: {
        tenantId: ctx.tenantId,
        scope: "workspace_config",
        key: "store_profile",
        requestHash: `onboard_${storeType}`,
        responseStatus: 200,
        responseBody: workspaceProfile,
        expiresAt: farFuture,
      },
      update: {
        requestHash: `onboard_${storeType}`,
        responseBody: workspaceProfile,
        expiresAt: farFuture,
      },
    });

    // 3. Ensure default store exists
    let store = await prisma.store.findFirst({
      where: { tenantId: ctx.tenantId, isActive: true },
    });
    if (!store) {
      store = await prisma.store.create({
        data: {
          tenantId: ctx.tenantId,
          name: shopName || "Magasin Principal",
          code: "MAIN-01",
          isActive: true,
        },
      });
    }

    // 4. For Restaurant/Cafe: Auto-seed 6 DiningTables if none exist
    let seededTablesCount = 0;
    if (storeType === "restaurant") {
      const existingTables = await prisma.diningTable.count({
        where: { tenantId: ctx.tenantId, storeId: store.id },
      });
      if (existingTables === 0) {
        const defaultTables = [
          { tableNumber: "T-01", name: "طاولة 1 (صالة) • Table 1", capacity: 4 },
          { tableNumber: "T-02", name: "طاولة 2 (صالة) • Table 2", capacity: 4 },
          { tableNumber: "T-03", name: "طاولة 3 (عائلية) • Table 3 VIP", capacity: 6 },
          { tableNumber: "T-04", name: "طاولة 4 (شرفة) • Terrasse 1", capacity: 2 },
          { tableNumber: "T-05", name: "طاولة 5 (شرفة) • Terrasse 2", capacity: 4 },
          { tableNumber: "T-06", name: "طلبات سريعة • Comptoir / Takeaway", capacity: 2 },
        ];
        for (const t of defaultTables) {
          const tableName = receiptLanguage === "ar"
            ? t.name.split(" • ")[0].trim()
            : (t.name.split(" • ")[1] || t.name).trim();
          await prisma.diningTable
            .create({
              data: {
                tenantId: ctx.tenantId,
                storeId: store.id,
                tableNumber: t.tableNumber,
                name: tableName,
                capacity: t.capacity,
                status: "available",
              },
            })
            .catch(() => {});
          seededTablesCount++;
        }
      }
    }

    // 5. Strict Zero-State: Do not auto-seed fake starter products (guarantees 100% clean account)
    const seededProductsCount = 0;

    return jsonOk({
      workspaceProfile,
      seededProductsCount,
      seededTablesCount,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
