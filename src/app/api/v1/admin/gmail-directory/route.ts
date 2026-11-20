import { NextResponse } from "next/server";
import { checkSuperAdminUser } from "@/server/admin/guard";
import { listAllProjectGmails } from "@/lib/heyuka/gmail-directory";
import { prisma } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await checkSuperAdminUser();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized Super Admin access required" },
      { status: 403 }
    );
  }

  try {
    const [{ entries, allEmails }, feedbackRow] = await Promise.all([
      listAllProjectGmails(),
      prisma.systemSetting
        .findUnique({ where: { providerName: "heyuka_platform_messages_v1" } })
        .catch(() => null),
    ]);

    let outreachMessages: unknown[] = [];
    if (feedbackRow?.apiKey) {
      try {
        const parsed = JSON.parse(feedbackRow.apiKey);
        if (Array.isArray(parsed)) outreachMessages = parsed;
      } catch {}
    }

    const gmailOnlyCount = allEmails.filter((e) => e.endsWith("@gmail.com")).length;

    return NextResponse.json({
      ok: true,
      totalEmails: entries.length,
      gmailOnlyCount,
      entries: entries.slice(0, 500),
      outreachMessages: outreachMessages.slice(0, 100),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unable to load project Gmail directory" },
      { status: 500 }
    );
  }
}
