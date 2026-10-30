import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";
import { createSession, SESSION_COOKIE_NAME, SESSION_EXPIRY_DAYS } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http/response";

const RegisterSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name is required").trim(),
  shopName: z.string().min(2, "Shop name is required").trim(),
  phone: z.string().optional(),
  city: z.string().optional(),
});

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base || "shop"}-${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(
        "VALIDATION_ERROR",
        "Invalid registration data",
        400,
        parsed.error.flatten()
      );
    }

    const { email, password, fullName, shopName, phone, city } = parsed.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError("EMAIL_EXISTS", "A user with this email already exists", 409);
    }

    const passwordHash = await hashPassword(password);
    const slug = slugify(shopName);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          legalName: shopName,
          displayName: shopName,
          slug,
          city: city ?? "Casablanca",
          countryCode: "MA",
          currency: "MAD",
          timezone: "Africa/Casablanca",
          locale: "ar",
          status: "trialing",
        },
      });

      // 2. Create User
      const user = await tx.user.create({
        data: {
          authProvider: "local",
          providerSubject: email,
          email,
          passwordHash,
          fullName,
          phone: phone ?? null,
          defaultTenantId: tenant.id,
          isActive: true,
        },
      });

      // 3. Create Main Store
      const store = await tx.store.create({
        data: {
          tenantId: tenant.id,
          code: "MAIN",
          name: "المحل الرئيسي / Magasin Principal",
          address: city ? `${city}, Maroc` : null,
          isActive: true,
        },
      });

      // 4. Create Owner Membership
      const membership = await tx.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: "owner",
          status: "active",
          storeIds: [store.id],
        },
      });

      // 5. Seed default Moroccan Tax Rates
      await tx.taxRate.createMany({
        data: [
          { tenantId: tenant.id, code: "TVA_20", label: "TVA Normale (20%)", rate: 20.00, isDefault: true },
          { tenantId: tenant.id, code: "TVA_14", label: "TVA Intermédiaire (14%)", rate: 14.00, isDefault: false },
          { tenantId: tenant.id, code: "TVA_10", label: "TVA Réduite (10%)", rate: 10.00, isDefault: false },
          { tenantId: tenant.id, code: "TVA_7", label: "TVA Super-Réduite (7%)", rate: 7.00, isDefault: false },
          { tenantId: tenant.id, code: "TVA_0", label: "Exonéré (0%)", rate: 0.00, isDefault: false },
        ],
      });

      return { user, tenant, store, membership };
    });

    // Create session
    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;
    const { rawToken } = await createSession({
      userId: result.user.id,
      activeTenantId: result.tenant.id,
      ip,
      userAgent,
    });

    const response = jsonOk(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
        },
        tenant: {
          id: result.tenant.id,
          displayName: result.tenant.displayName,
          slug: result.tenant.slug,
          currency: result.tenant.currency,
        },
        store: {
          id: result.store.id,
          code: result.store.code,
          name: result.store.name,
        },
      },
      201
    );

    // Set HTTP-Only Cookie
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
  } catch (err: unknown) {
    console.error("Register Error:", err);
    return jsonError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
