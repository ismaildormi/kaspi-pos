import { NextRequest, NextResponse } from "next/server";
import { checkSuperAdminUser } from "@/server/admin/guard";
import { prisma } from "@/server/db/prisma";
import { getSupabaseDirectoryEmails } from "@/lib/supabase";
import { sendBroadcastEmail } from "@/lib/email/mailer";

export async function POST(req: NextRequest) {
  try {
    const admin = await checkSuperAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized Super Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { title, version, message } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Le titre de l'annonce est requis" }, { status: 400 });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Le corps du message est requis" }, { status: 400 });
    }

    // 1. Gather all active user emails from Neon DB (Prisma)
    const dbUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        email: { not: undefined },
      },
      select: {
        email: true,
      },
    });

    const recipientSet = new Set<string>();
    for (const u of dbUsers) {
      if (u.email && u.email.includes("@")) {
        recipientSet.add(u.email.toLowerCase().trim());
      }
    }

    // 2. Supplement from Supabase user_directory & auth.users
    try {
      const supaEmails = await getSupabaseDirectoryEmails();
      for (const email of supaEmails) {
        recipientSet.add(email);
      }
    } catch (supaErr) {
      console.warn("[Broadcast API] Supabase user_directory fetch warning:", supaErr);
    }

    const recipients = Array.from(recipientSet);

    if (recipients.length === 0) {
      return NextResponse.json({ ok: false, error: "Aucun utilisateur trouvé pour la diffusion" }, { status: 404 });
    }

    console.log(`[Broadcast API] Starting email broadcast to ${recipients.length} recipients: "${title}"`);

    // Dispatch emails (parallel in batches of 5 to avoid connection flooding)
    const BATCH_SIZE = 5;
    let sentCount = 0;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map((to) =>
          sendBroadcastEmail({
            to,
            title: title.trim(),
            message: message.trim(),
            version: version?.trim(),
          })
        )
      );
      sentCount += batch.length;
    }

    return NextResponse.json({
      ok: true,
      sentCount,
      recipients: recipients.slice(0, 10), // return sample of recipients
    });
  } catch (error: any) {
    console.error("[Broadcast API Error]:", error);
    return NextResponse.json({ error: error?.message || "Erreur interne" }, { status: 500 });
  }
}
