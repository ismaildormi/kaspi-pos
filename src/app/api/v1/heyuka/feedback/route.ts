import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { recordProjectGmail } from "@/lib/heyuka/gmail-directory";
import { sendAdminSupportTicketEmail } from "@/lib/email/mailer";
import { sendAdminWhatsAppAlert } from "@/lib/whatsapp";
import { checkPlanetaryRateLimit } from "@/lib/heyuka/planetary/polyglot-cas-router";

export const dynamic = "force-dynamic";

const PLATFORM_MESSAGES_KEY = "heyuka_platform_messages_v1";

export interface PlatformFeedbackRecord {
  id: string;
  senderName: string;
  senderEmail: string;
  category: "feedback" | "support" | "outreach" | "bug" | "api_request";
  subject: string;
  message: string;
  locale: string;
  status: "unread" | "read" | "replied" | "resolved";
  deviceTelemetry?: string;
  createdAt: string;
}

const FeedbackSchema = z.object({
  senderName: z.string().trim().min(1).max(80).default("HEYUKA User"),
  senderEmail: z.string().trim().email("Please enter a valid email address."),
  category: z
    .enum(["feedback", "support", "outreach", "bug", "api_request"])
    .default("feedback"),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(5).max(5000),
  locale: z.enum(["ar", "fr", "en"]).default("en"),
  deviceTelemetry: z.string().trim().max(400).optional(),
});

async function readFeedbackList(): Promise<PlatformFeedbackRecord[]> {
  try {
    const row = await prisma.systemSetting.findUnique({
      where: { providerName: PLATFORM_MESSAGES_KEY },
    });
    if (!row?.apiKey) return [];
    const parsed = JSON.parse(row.apiKey);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET() {
  let userEmail: string | null = null;
  try {
    const ctx = await getRequestContext({ requireTenant: false });
    userEmail = ctx.userEmail || null;
  } catch {
    // Public read returns only caller's own submissions if signed in
  }

  if (!userEmail) {
    return NextResponse.json({ ok: true, authenticated: false, messages: [] });
  }

  const all = await readFeedbackList();
  const mine = all.filter(
    (m) => m.senderEmail.toLowerCase() === userEmail?.toLowerCase()
  );
  return NextResponse.json({
    ok: true,
    authenticated: true,
    userEmail,
    messages: mine.slice(0, 30),
  });
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const rl = checkPlanetaryRateLimit(`heyuka_feedback:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many messages sent recently. Please retry shortly." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error.issues[0]?.message || "Please fill in all required fields.",
      },
      { status: 400 }
    );
  }

  let tenantId: string | null = null;
  try {
    const ctx = await getRequestContext({ requireTenant: false });
    tenantId = ctx.tenantId || null;
  } catch {
    // Guest submission supported cleanly
  }

  const d = parsed.data;
  const cleanEmail = d.senderEmail.toLowerCase();

  // 1) Collect email into Central Project Gmail Vault & Supabase User Directory
  await recordProjectGmail({
    email: cleanEmail,
    fullName: d.senderName,
    source: `heyuka_${d.category}`,
    tenantId,
    locale: d.locale,
  });

  // 2) Persist in Platform Messages Vault
  const record: PlatformFeedbackRecord = {
    id: `fb_${crypto.randomBytes(6).toString("hex")}`,
    senderName: d.senderName,
    senderEmail: cleanEmail,
    category: d.category,
    subject: d.subject,
    message: d.message,
    locale: d.locale,
    status: "unread",
    deviceTelemetry: d.deviceTelemetry,
    createdAt: new Date().toISOString(),
  };

  try {
    const prev = await readFeedbackList();
    await prisma.systemSetting.upsert({
      where: { providerName: PLATFORM_MESSAGES_KEY },
      update: {
        apiKey: JSON.stringify([record, ...prev].slice(0, 1000)),
        isActive: true,
        baseUrl: "heyuka_platform_messages",
      },
      create: {
        providerName: PLATFORM_MESSAGES_KEY,
        apiKey: JSON.stringify([record]),
        isActive: true,
        baseUrl: "heyuka_platform_messages",
      },
    });
  } catch (err) {
    console.warn("[HEYUKA Feedback] Vault write notice:", err);
  }

  // 3) Mirror into Neon SupportMessage Inbox when a valid tenant exists
  try {
    const targetTenantId =
      tenantId ||
      (
        await prisma.tenant.findFirst({
          orderBy: { createdAt: "asc" },
          select: { id: true },
        })
      )?.id ||
      null;

    if (targetTenantId) {
      await prisma.supportMessage.create({
        data: {
          tenantId: targetTenantId,
          senderName: `${d.senderName} <${cleanEmail}>`,
          subject: `[HEYUKA ${d.category.toUpperCase()}] ${d.subject}`,
          message: d.deviceTelemetry
            ? `${d.message}\n\n[Client Telemetry]: ${d.deviceTelemetry}`
            : d.message,
          status: "unread",
        },
      });
    }
  } catch (err) {
    console.warn("[HEYUKA Feedback] SupportMessage mirror notice:", err);
  }

  // 4) Non-blocking Super Admin Email & WhatsApp Alert
  sendAdminSupportTicketEmail({
    storeName: "HEYUKA Platform Outreach",
    senderName: `${d.senderName} (${cleanEmail})`,
    senderPhone: null,
    subject: `[${d.category.toUpperCase()}] ${d.subject}`,
    message: d.message,
  }).catch(() => {});

  sendAdminWhatsAppAlert(
    `*HEYUKA ${d.category.toUpperCase()}*\nFrom: ${d.senderName} (${cleanEmail})\nSubject: ${d.subject}\n${d.message.slice(0, 300)}`
  ).catch(() => {});

  return NextResponse.json(
    {
      ok: true,
      ticket: record,
      message:
        d.locale === "ar"
          ? "تم إرسال رسالتك وحفظ بريدك في النظام بنجاح."
          : d.locale === "fr"
          ? "Message envoyé avec succès et Gmail enregistré."
          : "Message dispatched cleanly and Gmail saved to project directory.",
    },
    { status: 201 }
  );
}
