import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";

const PIN_STORE_PREFIX = "heyuka_chat_pins_v1_";

async function readPinnedSet(userId: string): Promise<Set<string>> {
  const row = await prisma.systemSetting.findUnique({
    where: { providerName: `${PIN_STORE_PREFIX}${userId}` },
  });
  if (!row) return new Set();
  try {
    const arr = JSON.parse(row.apiKey);
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

async function writePinnedSet(userId: string, pinned: Set<string>) {
  await prisma.systemSetting.upsert({
    where: { providerName: `${PIN_STORE_PREFIX}${userId}` },
    update: { apiKey: JSON.stringify(Array.from(pinned)), isActive: true },
    create: {
      providerName: `${PIN_STORE_PREFIX}${userId}`,
      apiKey: JSON.stringify(Array.from(pinned)),
      isActive: true,
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext({ requireTenant: false });
    if (!ctx.userId) {
      return NextResponse.json({ ok: true, authenticated: false, threads: [] });
    }
    const q = String(req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
    const pinnedSet = await readPinnedSet(ctx.userId);

    const sessions = await prisma.aIChatSession.findMany({
      where: { userId: ctx.userId },
      orderBy: { updatedAt: "desc" },
      take: 60,
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
    });

    const filtered = sessions
      .filter((s) => {
        if (!q) return true;
        if ((s.title || "").toLowerCase().includes(q)) return true;
        return s.messages.some((m) => m.content.toLowerCase().includes(q));
      })
      .map((s) => ({
        id: s.id,
        title: s.title || "New conversation",
        pinned: pinnedSet.has(s.id),
        updatedAt: s.updatedAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
        messages: s.messages.map((m) => ({
          id: m.id,
          role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        })),
      }));

    return NextResponse.json({
      ok: true,
      authenticated: true,
      userEmail: ctx.userEmail,
      threads: filtered,
    });
  } catch {
    return NextResponse.json({ ok: true, authenticated: false, threads: [] });
  }
}

const SaveThreadSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(160),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(32000),
      })
    )
    .min(1)
    .max(120),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext({ requireTenant: false });
    if (!ctx.userId) {
      return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
    }
    const body = await req.json().catch(() => null);
    const parsed = SaveThreadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid thread payload" }, { status: 400 });
    }

    let sessionId = parsed.data.id;
    if (sessionId) {
      const existing = await prisma.aIChatSession.findFirst({
        where: { id: sessionId, userId: ctx.userId },
      });
      if (!existing) sessionId = undefined;
    }

    if (!sessionId) {
      const created = await prisma.aIChatSession.create({
        data: {
          userId: ctx.userId,
          tenantId: ctx.tenantId || null,
          title: parsed.data.title.slice(0, 140),
          messages: {
            create: parsed.data.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          },
        },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      return NextResponse.json({
        ok: true,
        thread: {
          id: created.id,
          title: created.title,
          pinned: false,
          updatedAt: created.updatedAt.toISOString(),
          messages: created.messages,
        },
      });
    }

    await prisma.aIChatMessage.deleteMany({ where: { sessionId } });
    const updated = await prisma.aIChatSession.update({
      where: { id: sessionId },
      data: {
        title: parsed.data.title.slice(0, 140),
        messages: {
          create: parsed.data.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    const pinned = await readPinnedSet(ctx.userId);
    return NextResponse.json({
      ok: true,
      thread: {
        id: updated.id,
        title: updated.title,
        pinned: pinned.has(updated.id),
        updatedAt: updated.updatedAt.toISOString(),
        messages: updated.messages,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Save failed" }, { status: 500 });
  }
}

const PatchThreadSchema = z.object({
  action: z.enum(["rename", "pin", "unpin", "bulk_pin", "bulk_delete"]),
  id: z.string().uuid().optional(),
  ids: z.array(z.string().uuid()).optional(),
  title: z.string().min(1).max(160).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await getRequestContext({ requireTenant: false });
    if (!ctx.userId) {
      return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
    }
    const body = await req.json().catch(() => null);
    const parsed = PatchThreadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
    }

    const { action, id, ids, title } = parsed.data;
    if (action === "rename" && id && title) {
      await prisma.aIChatSession.updateMany({
        where: { id, userId: ctx.userId },
        data: { title: title.trim().slice(0, 140) },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "bulk_delete" && ids && ids.length > 0) {
      await prisma.aIChatSession.deleteMany({
        where: { id: { in: ids }, userId: ctx.userId },
      });
      const pinned = await readPinnedSet(ctx.userId);
      ids.forEach((x) => pinned.delete(x));
      await writePinnedSet(ctx.userId, pinned);
      return NextResponse.json({ ok: true });
    }

    const pinned = await readPinnedSet(ctx.userId);
    if (action === "pin" && id) pinned.add(id);
    if (action === "unpin" && id) pinned.delete(id);
    if (action === "bulk_pin" && ids) ids.forEach((x) => pinned.add(x));
    await writePinnedSet(ctx.userId, pinned);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await getRequestContext({ requireTenant: false });
    if (!ctx.userId) {
      return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
    }
    const id = String(req.nextUrl.searchParams.get("id") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, error: "Thread id required" }, { status: 400 });
    }
    await prisma.aIChatSession.deleteMany({
      where: { id, userId: ctx.userId },
    });
    const pinned = await readPinnedSet(ctx.userId);
    if (pinned.delete(id)) await writePinnedSet(ctx.userId, pinned);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Delete failed" }, { status: 500 });
  }
}
