import { NextRequest, NextResponse } from "next/server";
import { checkSuperAdminUser } from "@/server/admin/guard";
import { prisma } from "@/server/db/prisma";
import { resolveConflictTicket } from "@/server/devices/poste-binding-engine";
import { z } from "zod";

const ResolveTicketSchema = z
  .object({
    ticketId: z.string().uuid(),
    action: z.enum(["UNLOCK_PRIMARY", "AUTHORIZE_NEW_PC", "REQUIRE_EXTRA_POSTE", "SUSPEND"]),
    adminNotes: z.string().optional(),
  })
  .strict();

export async function GET(req: NextRequest) {
  try {
    const user = await checkSuperAdminUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized SuperAdmin access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const tickets = await prisma.supportConflictTicket.findMany({
      where: status ? { status } : undefined,
      include: {
        tenant: {
          select: {
            id: true,
            displayName: true,
            legalName: true,
            city: true,
            maxDevices: true,
            subscriptions: {
              where: { status: "active" },
              select: { planCode: true, status: true },
              take: 1,
            },
          },
        },
        posteBinding: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const openCount = await prisma.supportConflictTicket.count({ where: { status: "OPEN" } });
    const resolvedCount = await prisma.supportConflictTicket.count({ where: { status: "RESOLVED" } });

    return NextResponse.json({
      success: true,
      tickets,
      counts: {
        open: openCount,
        resolved: resolvedCount,
        total: openCount + resolvedCount,
      },
    });
  } catch (err: any) {
    console.error("[Admin Conflict Tickets GET Error]:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await checkSuperAdminUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized SuperAdmin access" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = ResolveTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid resolution payload", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await resolveConflictTicket(
      parsed.data.ticketId,
      parsed.data.action,
      parsed.data.adminNotes
    );

    return NextResponse.json({
      ...result,
    });
  } catch (err: any) {
    console.error("[Admin Conflict Tickets POST Error]:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
