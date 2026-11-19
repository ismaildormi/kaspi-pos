import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { sanitizeOutboundEndpoint } from "@/lib/security/integration-vault";

export const dynamic = "force-dynamic";

export default async function DynamicQrRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!/^[a-zA-Z0-9_-]{2,48}$/.test(slug)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--kaspi-bg)] text-[var(--kaspi-text-primary)] p-6 text-sm">
        Invalid Dynamic QR Code link.
      </div>
    );
  }

  const keyName = `heyuka_dyn_qr_${slug}`;
  const record = await prisma.systemSetting.findUnique({ where: { providerName: keyName } });

  if (!record || !record.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--kaspi-bg)] text-[var(--kaspi-text-primary)] p-6 text-sm">
        Dynamic QR Code <span className="font-mono mx-1.5 text-rose-400">/{slug}</span> has not been configured yet.
      </div>
    );
  }

  try {
    const meta = JSON.parse(record.apiKey);
    const safeDest = sanitizeOutboundEndpoint(String(meta.targetUrl || ""));
    await prisma.systemSetting
      .update({
        where: { providerName: keyName },
        data: {
          apiKey: JSON.stringify({
            ...meta,
            scansCount: Number(meta.scansCount || 0) + 1,
            lastScannedAt: new Date().toISOString(),
          }),
        },
      })
      .catch(() => {});
    redirect(safeDest);
  } catch (err: any) {
    if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--kaspi-bg)] text-[var(--kaspi-text-primary)] p-6 text-sm">
        Blocked unsafe destination on dynamic QR.
      </div>
    );
  }
}
