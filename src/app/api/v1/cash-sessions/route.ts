import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, jsonError, handleApiError } from "@/server/http/response";
import { buildShiftSummary, openCashShift } from "@/server/cash-shift/engine";

const OpenShiftSchema = z.object({
  storeId: z.string().uuid().optional(),
  openingCash: z.union([z.number(), z.string()]),
  openingNotes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const { searchParams } = new URL(req.url);
    let storeId = searchParams.get("storeId") || ctx.storeIds[0] || "";

    if (!storeId) {
      const defaultStore = await prisma.store.findFirst({
        where: { tenantId: ctx.tenantId, isActive: true },
        select: { id: true },
      });
      storeId = defaultStore?.id || "";
    }

    if (!storeId) {
      return jsonOk({ activeSession: null, recentSessions: [] });
    }

    const openRecord = await prisma.cashSession.findFirst({
      where: {
        tenantId: ctx.tenantId,
        storeId,
        status: "open",
      },
      orderBy: { openedAt: "desc" },
      select: { id: true },
    });

    const activeSession = openRecord
      ? await buildShiftSummary(ctx.tenantId, openRecord.id)
      : null;

    const closedRecords = await prisma.cashSession.findMany({
      where: {
        tenantId: ctx.tenantId,
        storeId,
        status: "closed",
      },
      orderBy: { closedAt: "desc" },
      take: 10,
      select: { id: true },
    });

    const recentSessions = await Promise.all(
      closedRecords.map((r) => buildShiftSummary(ctx.tenantId, r.id))
    );

    return jsonOk({
      storeId,
      activeSession,
      recentSessions,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const parsed = OpenShiftSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid input", 400);
    }

    let storeId = parsed.data.storeId || ctx.storeIds[0] || "";
    if (!storeId) {
      const defaultStore = await prisma.store.findFirst({
        where: { tenantId: ctx.tenantId, isActive: true },
        select: { id: true },
      });
      storeId = defaultStore?.id || "";
    }

    if (!storeId) {
      return jsonError("STORE_NOT_FOUND", "No active store found for this tenant", 404);
    }

    const summary = await openCashShift({
      tenantId: ctx.tenantId,
      storeId,
      userId: ctx.userId,
      openingCash: parsed.data.openingCash,
      openingNotes: parsed.data.openingNotes,
    });

    return jsonOk({ session: summary }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
