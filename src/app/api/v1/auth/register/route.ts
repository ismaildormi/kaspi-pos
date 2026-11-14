import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";
import { createSession, SESSION_COOKIE_NAME, SESSION_EXPIRY_DAYS } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http/response";
import { syncUserToSupabaseDirectory } from "@/lib/supabase";
import { sendWelcomeEmail } from "@/lib/email/mailer";
import { planetarySwarmManager } from "@/lib/autonomous-fleet/planetary-swarm-mitosis";

const RegisterSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters").trim(),
  shopName: z.string().min(2, "Shop name must be at least 2 characters").trim(),
  storeType: z.enum(["grocery", "restaurant", "fashion", "electronics"]).optional().default("grocery"),
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
      const firstIssue = parsed.error.issues?.[0];
      const errorMessage = firstIssue?.message || "Invalid registration data";
      return NextResponse.json(
        {
          error: errorMessage,
          message: errorMessage,
          code: "VALIDATION_ERROR",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { email, password, fullName, shopName, storeType, phone, city } = parsed.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        {
          error: "Email already registered. Please log in.",
          message: "Email already registered. Please log in.",
          code: "EMAIL_EXISTS",
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const slug = slugify(shopName);

    // Count existing users: if 0, this first user is the Super Admin!
    const totalUsers = await prisma.user.count();
    const isFirstUser = totalUsers === 0;

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

      // 2. Create User (auto Super Admin if first user)
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
          isSuperAdmin: isFirstUser,
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

      // 6. Persist selected Store Vertical Profile
      const activeStoreType = storeType || "grocery";
      await tx.idempotencyRecord.create({
        data: {
          tenantId: tenant.id,
          scope: "workspace_config",
          key: "store_profile",
          requestHash: `onboard_${activeStoreType}`,
          responseStatus: 200,
          responseBody: {
            storeType: activeStoreType,
            onboardingCompleted: true,
            currency: "MAD",
            receiptLanguage: "ar",
            enableKds: activeStoreType === "restaurant",
            enableTableGrid: activeStoreType === "restaurant",
            enableVariantsMatrix: activeStoreType === "fashion",
            enableSerialTracking: activeStoreType === "electronics",
            enableWeightScale: activeStoreType === "grocery",
            completedAt: new Date().toISOString(),
          },
          expiresAt: new Date("2099-12-31T23:59:59Z"),
        },
      });

      return { user, tenant, store, membership };
    });

    // Spawn dedicated Planetary Mitosis Store Cell with 0ms Global Immunity DNA
    planetarySwarmManager.onNewTenantOrPosteSpawn({
      storeId: result.store.id,
      posteCount: 1,
      countryCode: req.headers.get("cf-ipcountry") || "MA",
    });

    // Mirror newly registered user to Supabase User Directory for marketing / updates
    syncUserToSupabaseDirectory({
      email: result.user.email ?? email,
      fullName: result.user.fullName,
      tenantId: result.tenant.id,
      role: result.membership.role,
      shopName: result.tenant.displayName,
      phone: phone || undefined,
      source: "registration",
    }).catch(() => {});

    // Guaranteed Delivery: Await Welcome & Successful Sign-In Email before closing request
    await sendWelcomeEmail({
      to: result.user.email ?? email,
      userName: result.user.fullName || fullName,
      storeName: result.tenant.displayName || shopName,
      storeCategory: storeType || "grocery",
      loginDate: new Date().toISOString(),
      lang: "ar",
      userId: result.user.id,
      activeTenantId: result.tenant.id,
    }).catch((err) => {
      console.warn("[Register Welcome Email Dispatch Notice]:", err?.message || err);
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
          isSuperAdmin: result.user.isSuperAdmin,
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
  } catch (err: any) {
    console.error("Register Error:", err);
    if (err?.code === "P2002" || err?.message?.includes("Unique constraint")) {
      return NextResponse.json(
        {
          error: "Email already registered. Please log in.",
          message: "Email already registered. Please log in.",
          code: "EMAIL_EXISTS",
        },
        { status: 409 }
      );
    }
    const message = err?.message || "An unexpected error occurred";
    return NextResponse.json(
      {
        error: message,
        message,
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
