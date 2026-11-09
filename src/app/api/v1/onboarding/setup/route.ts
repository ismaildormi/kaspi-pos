import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";
import { toPrismaDecimal, toPrismaQtyDecimal, toDecimal } from "@/domain/money";

export type StoreIndustryType = "grocery" | "restaurant" | "fashion" | "electronics";

const SetupOnboardingSchema = z.object({
  storeType: z.enum(["grocery", "restaurant", "fashion", "electronics"]),
  shopName: z.string().min(2).optional(),
  currency: z.enum(["MAD", "EUR", "USD", "SAR", "AED", "TRY"]).default("MAD"),
  receiptLanguage: z.enum(["ar", "fr", "en", "tr", "es", "de"]).default("ar"),
  seedStarterCatalog: z.boolean().default(true),
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
      enableSerialTracking: storeType === "electronics",
      enableWeightScale: storeType === "grocery",
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

    // 5. Seed industry-tailored starter products if requested and catalog is empty (or upsert by SKU)
    let seededProductsCount = 0;
    if (seedStarterCatalog) {
      const templates = INDUSTRY_STARTER_CATALOGS[storeType] || [];
      for (const tpl of templates) {
        const cleanCategory = tpl.category.includes(" • ")
          ? (receiptLanguage === "ar" ? tpl.category.split(" • ")[0].trim() : (tpl.category.split(" • ")[1] || tpl.category).trim())
          : tpl.category;
        const cleanName = tpl.name.includes(" • ")
          ? (receiptLanguage === "ar" ? tpl.name.split(" • ")[0].trim() : (tpl.name.split(" • ")[1] || tpl.name).trim())
          : tpl.name;

        let category = await prisma.category.findFirst({
          where: {
            tenantId: ctx.tenantId,
            name: { equals: cleanCategory, mode: "insensitive" },
          },
        });
        if (!category) {
          category = await prisma.category.create({
            data: {
              tenantId: ctx.tenantId,
              name: cleanCategory,
            },
          });
        }

        const existingProd = await prisma.product.findFirst({
          where: { tenantId: ctx.tenantId, sku: tpl.sku },
        });

        if (!existingProd) {
          const createdProd = await prisma.product.create({
            data: {
              tenantId: ctx.tenantId,
              categoryId: category.id,
              name: cleanName,
              sku: tpl.sku,
              barcode: tpl.barcode,
              description: tpl.description || null,
              unit: tpl.unit,
              salePrice: toPrismaDecimal(toDecimal(tpl.salePrice)),
              costPrice: toPrismaDecimal(toDecimal(tpl.costPrice)),
              taxRate: toPrismaDecimal(toDecimal("20.00")),
              trackStock: true,
              isActive: true,
            },
          });

          await prisma.stockLevel
            .upsert({
              where: {
                tenantId_storeId_productId: {
                  tenantId: ctx.tenantId,
                  storeId: store.id,
                  productId: createdProd.id,
                },
              },
              update: {
                quantity: toPrismaQtyDecimal(toDecimal(tpl.stockQty)),
              },
              create: {
                tenantId: ctx.tenantId,
                storeId: store.id,
                productId: createdProd.id,
                quantity: toPrismaQtyDecimal(toDecimal(tpl.stockQty)),
              },
            })
            .catch(() => {});

          seededProductsCount++;
        }
      }
    }

    return jsonOk({
      workspaceProfile,
      seededProductsCount,
      seededTablesCount,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
