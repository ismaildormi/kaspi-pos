import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/auth/context";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const CreateStoreSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  code: z.string().min(1, "Store code is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();

    const stores = await prisma.store.findMany({
      where: {
        tenantId: ctx.tenantId,
      },
      include: {
        _count: {
          select: {
            devices: true,
            sales: true,
            stockLevels: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      stores: stores.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        address: s.address,
        phone: s.phone,
        isActive: s.isActive,
        devicesCount: s._count.devices,
        salesCount: s._count.sales,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (err: any) {
    console.error("[GET /api/v1/stores Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch stores" },
      { status: err?.code === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();

    const parsed = CreateStoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid store data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, code, address, phone } = parsed.data;

    // Check if code already exists for this tenant
    const existing = await prisma.store.findFirst({
      where: {
        tenantId: ctx.tenantId,
        code: code.trim().toUpperCase(),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Store with code ${code.toUpperCase()} already exists` },
        { status: 409 }
      );
    }

    const newStore = await prisma.store.create({
      data: {
        tenantId: ctx.tenantId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      store: newStore,
    });
  } catch (err: any) {
    console.error("[POST /api/v1/stores Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create store" },
      { status: err?.code === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
