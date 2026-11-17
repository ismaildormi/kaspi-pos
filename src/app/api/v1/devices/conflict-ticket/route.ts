import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/auth/context";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";
import { assertSafeOrigin, stripDangerousKeys } from "@/server/security/kaspi-ironclad-guard";

const ConflictTicketSchema = z
  .object({
    fingerprint: z.string().min(4),
    merchantNote: z.string().max(2000).optional(),
    screenshotData: z.string().optional(),
    primarySummary: z.record(z.string(), z.any()).optional(),
    secondarySummary: z.record(z.string(), z.any()).optional(),
    conflictReason: z.string().default("UNAUTHORIZED_DUAL_DEVICE_ATTEMPT"),
    tenantId: z.string().uuid().optional(),
    storeId: z.string().uuid().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  try {
    if (!assertSafeOrigin(req)) {
      return NextResponse.json(
        { error: "CSRF check failed: invalid origin" },
        { status: 403 }
      );
    }
    let tenantId: string | null = null;
    let storeId: string | null = null;

    try {
      const ctx = await getRequestContext({ requireTenant: false });
      if (ctx?.tenantId) {
        tenantId = ctx.tenantId;
        storeId = ctx.storeIds?.[0] || null;
      }
    } catch {
      // Allow fallback from body
    }

    const rawBody = await req.json().catch(() => ({}));
    const body = stripDangerousKeys(rawBody);
    const parsed = ConflictTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid ticket payload", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const effectiveTenantId = tenantId || parsed.data.tenantId;
    if (!effectiveTenantId) {
      return NextResponse.json(
        { error: "Tenant context required to file conflict ticket" },
        { status: 401 }
      );
    }

    // Find the binding
    const binding = await prisma.posteBinding.findUnique({
      where: {
        tenantId_slotIndex: {
          tenantId: effectiveTenantId,
          slotIndex: 1,
        },
      },
    });

    const ticket = await prisma.supportConflictTicket.create({
      data: {
        tenantId: effectiveTenantId,
        storeId: storeId || parsed.data.storeId || null,
        posteBindingId: binding?.id || null,
        conflictReason: parsed.data.conflictReason,
        screenshotData: parsed.data.screenshotData || null,
        primarySummary: parsed.data.primarySummary || (binding ? {
          name: binding.primaryDeviceName,
          os: binding.primaryOs,
          boundAt: binding.primaryBoundAt ? binding.primaryBoundAt.toISOString() : null,
        } : undefined),
        secondarySummary: parsed.data.secondarySummary || (binding ? {
          name: binding.secondaryDeviceName,
          os: binding.secondaryOs,
          lastConflict: binding.lastConflictAt ? binding.lastConflictAt.toISOString() : null,
        } : undefined),
        merchantNote: parsed.data.merchantNote || "Demande de déblocage / vérification de terminal de caisse",
        strikeCount: binding?.conflictStrikes || 1,
        status: "OPEN",
      },
    });

    // Also log in general support messages if applicable
    await prisma.auditLog.create({
      data: {
        tenantId: effectiveTenantId,
        action: "POSTE_CONFLICT_TICKET_FILED",
        entityType: "SupportConflictTicket",
        entityId: ticket.id,
        afterState: {
          ticketId: ticket.id,
          strikeCount: ticket.strikeCount,
          reason: ticket.conflictReason,
        },
      },
    });

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      status: ticket.status,
      message: "Ticket de support pour conflit de poste transmis avec succès aux administrateurs.",
    });
  } catch (err: any) {
    console.error("[Create Conflict Ticket Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
