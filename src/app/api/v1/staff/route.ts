import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();

    const memberships = await prisma.tenantMembership.findMany({
      where: {
        tenantId: ctx.tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        members: memberships.map((m) => ({
          id: m.id,
          userId: m.userId,
          name: m.user?.fullName || m.user?.email?.split("@")[0] || "Employé",
          email: m.user?.email || "—",
          phone: m.user?.phone || "—",
          role: m.role,
          status: m.status,
          createdAt: m.createdAt,
        })),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();

    const { email, fullName, role = "cashier" } = body;
    if (!email) {
      return NextResponse.json({ error: "L'adresse email est requise." }, { status: 400 });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          fullName: fullName || email.split("@")[0],
          name: fullName || email.split("@")[0],
        },
      });
    }

    // Check existing membership
    const existing = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId: ctx.tenantId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      const updated = await prisma.tenantMembership.update({
        where: { id: existing.id },
        data: { role, status: "active" },
      });
      return NextResponse.json({ success: true, member: updated });
    }

    const created = await prisma.tenantMembership.create({
      data: {
        tenantId: ctx.tenantId,
        userId: user.id,
        role,
        status: "active",
      },
    });

    return NextResponse.json({ success: true, member: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const { searchParams } = new URL(req.url);
    const membershipId = searchParams.get("id");

    if (!membershipId) {
      return NextResponse.json({ error: "ID membre requis" }, { status: 400 });
    }

    // Cannot revoke own owner membership
    const membership = await prisma.tenantMembership.findUnique({
      where: { id: membershipId },
    });

    if (!membership || membership.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    if (membership.role === "owner" && membership.userId === ctx.userId) {
      return NextResponse.json(
        { error: "Impossible de révoquer l'accès du propriétaire principal." },
        { status: 400 }
      );
    }

    await prisma.tenantMembership.update({
      where: { id: membershipId },
      data: { status: "revoked" },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
