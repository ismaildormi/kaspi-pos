"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Laptop, ShieldCheck, Trash2, X } from "lucide-react";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";
import { HEYUKAGmailAccessCard } from "@/components/heyuka/HEYUKAGmailAccessCard";
import { KaspiThemeToggle } from "@/components/theme/KaspiThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { PortalLocale } from "./platform-data";

interface ProfilePayload {
  authenticated: boolean;
  profile?: {
    id: string;
    name: string;
    maskedEmail: string;
    email: string;
    phone: string | null;
    googleConnected: boolean;
    devices: Array<{
      id: string;
      deviceLabel: string;
      ipAddress: string;
      createdAt: string;
    }>;
  };
}

export function PlatformProfileView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const isRtl = locale === "ar";
  const router = useRouter();

  const [data, setData] = useState<ProfilePayload | null>(null);
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/zebra-x/profile", { cache: "no-store" });
      setData(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleLogout = async () => {
    setBusy(true);
    try {
      await fetch("/api/v1/zebra-x/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      await loadProfile();
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleRevokeDevice = async (sessionId: string) => {
    await fetch("/api/v1/zebra-x/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke_device", sessionId }),
    });
    await loadProfile();
  };

  if (data && !data.authenticated) {
    return (
      <div className="max-w-md space-y-4">
        <h2 className="text-xl font-bold text-white">Profile</h2>
        <div className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-5">
          <HEYUKAGmailAccessCard locale={locale} onAuthenticated={loadProfile} />
        </div>
      </div>
    );
  }

  const profile = data?.profile;

  return (
    <div className="max-w-lg space-y-6">
      {/* Avatar matching Screenshot 4 */}
      <div className="w-14 h-14 rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-lg font-bold text-rose-400 uppercase">
        {(profile?.name || "H").slice(0, 1)}
      </div>

      {/* Vertical Form Fields matching Screenshot 4 */}
      <div className="space-y-4 text-xs">
        <div className="space-y-1">
          <p className="text-zinc-400">Name</p>
          <p className="font-semibold text-sm text-zinc-100 inline-flex items-center gap-2">
            <span>{profile?.name || "—"}</span>
            {profile?.googleConnected && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-rose-400">
                <ShieldCheck className="w-3 h-3" />
                <span>Google</span>
              </span>
            )}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-zinc-400">Email address</p>
          <p className="font-semibold text-zinc-100">{profile?.maskedEmail || "—"}</p>
        </div>

        <div className="space-y-1">
          <p className="text-zinc-400">Phone number</p>
          <p className="text-zinc-300">{profile?.phone || "-"}</p>
        </div>

        <div className="space-y-1.5">
          <p className="text-zinc-400">Language</p>
          <LanguageSwitcher />
        </div>

        <div className="space-y-1.5">
          <p className="text-zinc-400">Theme</p>
          <KaspiThemeToggle locale={locale} />
        </div>
      </div>

      {/* Bottom 3 Buttons matching Screenshot 4 (`Log out`, `Devices management`, red `Delete`) */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2">
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-[#222328] hover:bg-[#2C2E35] border border-white/[0.08] text-xs font-medium text-zinc-100 cursor-pointer"
        >
          Log out
        </button>

        <button
          type="button"
          onClick={() => setDevicesOpen(true)}
          className="px-4 py-2 rounded-lg bg-[#222328] hover:bg-[#2C2E35] border border-white/[0.08] text-xs font-medium text-zinc-100 cursor-pointer"
        >
          Devices management
        </button>

        <button
          type="button"
          onClick={() => setDevicesOpen(true)}
          className="px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-[#EF4444] text-xs font-semibold text-white cursor-pointer"
        >
          Delete
        </button>
      </div>

      <KaspiGlassModalPortal
        isOpen={devicesOpen}
        onClose={() => setDevicesOpen(false)}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="w-full max-w-md rounded-2xl kaspi-opaque-glass-modal p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-rose-500" />
              <span>Devices management</span>
            </h3>
            <button type="button" onClick={() => setDevicesOpen(false)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(profile?.devices || []).map((dev) => (
              <div
                key={dev.id}
                className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.05] text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-100 truncate">{dev.deviceLabel}</p>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {dev.ipAddress} • {new Date(dev.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRevokeDevice(dev.id)}
                  className="p-1.5 rounded text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </KaspiGlassModalPortal>
    </div>
  );
}
