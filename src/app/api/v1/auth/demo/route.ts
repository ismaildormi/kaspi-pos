import { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";
import {
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_EXPIRY_DAYS,
} from "@/server/auth/session";
import { jsonOk, handleApiError } from "@/server/http/response";
import { toPrismaDecimal, toPrismaQtyDecimal } from "@/domain/money";

const DEMO_PRODUCTS = [
  {
    name: "Huile d'Olive Extra Vierge Atlas 1L",
    sku: "DEMO-GRO-01",
    barcode: "6111000900011",
    category: "Épicerie & Supermarché",
    salePrice: 85.0,
    costPrice: 65.0,
    taxRate: 20,
    stock: 48,
  },
  {
    name: "Thé Vert Sultan Habka 200g",
    sku: "DEMO-GRO-02",
    barcode: "6111000900028",
    category: "Épicerie & Supermarché",
    salePrice: 18.5,
    costPrice: 13.0,
    taxRate: 7,
    stock: 120,
  },
  {
    name: "Amlou Beldi aux Amandes & Argan 500g",
    sku: "DEMO-GRO-03",
    barcode: "6111000900035",
    category: "Épicerie & Supermarché",
    salePrice: 110.0,
    costPrice: 80.0,
    taxRate: 20,
    stock: 30,
  },
  {
    name: "Tajine Poulet Citron Confit & Olives",
    sku: "DEMO-RES-01",
    barcode: "6111000900042",
    category: "Restaurant & Café",
    salePrice: 65.0,
    costPrice: 25.0,
    taxRate: 10,
    stock: 99,
  },
  {
    name: "Espresso Noir Italien / Nous-Nous",
    sku: "DEMO-RES-02",
    barcode: "6111000900059",
    category: "Restaurant & Café",
    salePrice: 15.0,
    costPrice: 3.5,
    taxRate: 10,
    stock: 200,
  },
  {
    name: "Couscous Royal Vendredi (Tfaya)",
    sku: "DEMO-RES-03",
    barcode: "6111000900066",
    category: "Restaurant & Café",
    salePrice: 75.0,
    costPrice: 28.0,
    taxRate: 10,
    stock: 60,
  },
  {
    name: "Chemise Lin Premium Casablanca (Taille L)",
    sku: "DEMO-FAS-01",
    barcode: "6111000900073",
    category: "Mode & Vêtements",
    salePrice: 249.0,
    costPrice: 120.0,
    taxRate: 20,
    stock: 25,
  },
  {
    name: "Écouteurs Sans Fil ANC Pro (Garantie 12m)",
    sku: "DEMO-ELC-01",
    barcode: "6111000900080",
    category: "Électronique",
    salePrice: 390.0,
    costPrice: 210.0,
    taxRate: 20,
    stock: 18,
  },
];

export async function POST(req: NextRequest) {
  try {
    const demoEmail = "demo@kaspi.ma";
    const demoPass = "KaspiDemo2026!";
    const demoSlug = "kaspi-demo-showroom";

    // 1. Upsert Sandboxed Demo Tenant (with high maxDevices so concurrent demo visitors never get blocked)
    const demoTenant = await prisma.tenant.upsert({
      where: { slug: demoSlug },
      update: {
        maxDevices: 99,
        status: "active",
      },
      create: {
        slug: demoSlug,
        legalName: "KASPI POS Demo Showroom SARL",
        displayName: "KASPI Showroom (Démo Maroc)",
        currency: "MAD",
        locale: "fr",
        maxDevices: 99,
        status: "active",
        ice: "002998877000042",
        taxId: "45899123",
        rcNumber: "112233 Casablanca",
        address: "Boulevard d'Anfa, Casablanca",
        city: "Casablanca",
      },
    });

    // 2. Upsert Demo User
    const passwordHash = await hashPassword(demoPass);
    const demoUser = await prisma.user.upsert({
      where: { email: demoEmail },
      update: {
        fullName: "Commerçant Démo KASPI",
        passwordHash,
        defaultTenantId: demoTenant.id,
        isActive: true,
      },
      create: {
        email: demoEmail,
        fullName: "Commerçant Démo KASPI",
        name: "Commerçant Démo KASPI",
        passwordHash,
        defaultTenantId: demoTenant.id,
        isActive: true,
      },
    });

    // 3. Upsert Active Membership
    await prisma.tenantMembership.upsert({
      where: {
        tenantId_userId: {
          tenantId: demoTenant.id,
          userId: demoUser.id,
        },
      },
      update: {
        role: "owner",
        status: "active",
      },
      create: {
        tenantId: demoTenant.id,
        userId: demoUser.id,
        role: "owner",
        status: "active",
      },
    });

    // 4. Ensure Demo Store & Dining Tables exist
    let store = await prisma.store.findFirst({
      where: { tenantId: demoTenant.id, isActive: true },
    });
    if (!store) {
      store = await prisma.store.create({
        data: {
          tenantId: demoTenant.id,
          name: "Showroom Principal Casablanca",
          code: "DEMO-01",
          address: "Casablanca",
          isActive: true,
        },
      });
    }

    const existingTablesCount = await prisma.diningTable.count({
      where: { tenantId: demoTenant.id, storeId: store.id },
    });
    if (existingTablesCount === 0) {
      for (let i = 1; i <= 6; i++) {
        const code = `T-0${i}`;
        await prisma.diningTable
          .create({
            data: {
              tenantId: demoTenant.id,
              storeId: store.id,
              tableNumber: code,
              name: `Table ${code}`,
              capacity: i <= 4 ? 4 : 6,
              status: "available",
            },
          })
          .catch(() => {});
      }
    }

    // 5. Seed Demo Catalog & Sample Customer if empty
    const prodCount = await prisma.product.count({
      where: { tenantId: demoTenant.id, isActive: true },
    });

    if (prodCount < 3) {
      for (const item of DEMO_PRODUCTS) {
        let cat = await prisma.category.findFirst({
          where: { tenantId: demoTenant.id, name: item.category },
        });
        if (!cat) {
          cat = await prisma.category.create({
            data: {
              tenantId: demoTenant.id,
              name: item.category,
            },
          });
        }

        const createdProd = await prisma.product.upsert({
          where: {
            tenantId_sku: {
              tenantId: demoTenant.id,
              sku: item.sku,
            },
          },
          update: {
            name: item.name,
            barcode: item.barcode,
            salePrice: toPrismaDecimal(item.salePrice),
            costPrice: toPrismaDecimal(item.costPrice),
            taxRate: toPrismaDecimal(item.taxRate),
            isActive: true,
          },
          create: {
            tenantId: demoTenant.id,
            categoryId: cat.id,
            name: item.name,
            sku: item.sku,
            barcode: item.barcode,
            salePrice: toPrismaDecimal(item.salePrice),
            costPrice: toPrismaDecimal(item.costPrice),
            taxRate: toPrismaDecimal(item.taxRate),
            trackStock: true,
            isActive: true,
          },
        });

        await prisma.stockLevel.upsert({
          where: {
            tenantId_storeId_productId: {
              tenantId: demoTenant.id,
              storeId: store.id,
              productId: createdProd.id,
            },
          },
          update: { quantity: toPrismaQtyDecimal(item.stock) },
          create: {
            tenantId: demoTenant.id,
            storeId: store.id,
            productId: createdProd.id,
            quantity: toPrismaQtyDecimal(item.stock),
          },
        });
      }

      const custCount = await prisma.customer.count({
        where: { tenantId: demoTenant.id },
      });
      if (custCount === 0) {
        const cust = await prisma.customer.create({
          data: {
            tenantId: demoTenant.id,
            name: "Mohammed Benjelloun (Client VIP Démo)",
            phone: "0661234567",
            ice: "00152436000089",
            currentCreditBalance: toPrismaDecimal(150.0),
            creditLimit: toPrismaDecimal(3000.0),
          },
        });
        await prisma.loyaltyPoint.create({
          data: {
            tenantId: demoTenant.id,
            customerId: cust.id,
            deltaPoints: 180,
            reason: "earn",
            idempotencyKey: `demo_loyalty_${cust.id}`,
          },
        });
      }
    }

    // 6. Create Authenticated Session & Set Cookie
    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const { rawToken } = await createSession({
      userId: demoUser.id,
      activeTenantId: demoTenant.id,
      ip,
      userAgent,
    });

    const response = jsonOk({
      email: demoEmail,
      password: demoPass,
      tenantId: demoTenant.id,
      shopName: demoTenant.displayName,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: rawToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
