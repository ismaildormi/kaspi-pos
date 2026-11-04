import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";

export async function POST(req: NextRequest) {
  try {
    const seedSecret = req.headers.get("x-seed-secret") || req.nextUrl.searchParams.get("secret");
    const expectedSecret = process.env.ADMIN_SEED_SECRET || "kaspi_hq_emergency_admin_2026";
    if (seedSecret !== expectedSecret && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const email = (body.email || "dormiismail02@gmail.com").toLowerCase().trim();
    const password = body.password || "Admin@123456";

    const passwordHash = await hashPassword(password);

    let tenant = await prisma.tenant.findFirst({
      where: { status: "active" },
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          legalName: "KASPI HQ Morocco",
          displayName: "KASPI HQ",
          slug: "kaspi-hq",
          city: "Casablanca",
          countryCode: "MA",
          currency: "MAD",
          timezone: "Africa/Casablanca",
          locale: "ar",
          status: "active",
          maxDevices: 10,
        },
      });
    }

    let store = await prisma.store.findFirst({
      where: { tenantId: tenant.id },
    });

    if (!store) {
      store = await prisma.store.create({
        data: {
          tenantId: tenant.id,
          code: "HQ-01",
          name: "Magasin Principal HQ",
          isActive: true,
        },
      });
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        isSuperAdmin: true,
        isActive: true,
        fullName: "Ismail Dormi (Super Admin)",
        defaultTenantId: tenant.id,
      },
      create: {
        authProvider: "local",
        providerSubject: email,
        email,
        passwordHash,
        fullName: "Ismail Dormi (Super Admin)",
        defaultTenantId: tenant.id,
        isActive: true,
        isSuperAdmin: true,
      },
    });

    await prisma.tenantMembership.upsert({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: user.id,
        },
      },
      update: {
        role: "owner",
        status: "active",
        storeIds: [store.id],
      },
      create: {
        tenantId: tenant.id,
        userId: user.id,
        role: "owner",
        status: "active",
        storeIds: [store.id],
      },
    });

    return NextResponse.json({
      success: true,
      message: `Super Admin account ready for ${email}`,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
    });
  } catch (err: any) {
    console.error("[Seed API Error]:", err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
