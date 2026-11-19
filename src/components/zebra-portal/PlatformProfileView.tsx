"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Laptop, LogOut, ShieldCheck, Trash2, X } from "lucide-react";
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
    createdAt: string;
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
      const json = await res.json();
      setData(json);
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
        <h2 className="text-2xl font-bold text-[var(--kaspi-text-primary)]">Profile</h2>
        <p className="text-xs text-[var(--kaspi-text-secondary)]">
          Sign in with your Gmail address to manage your HEYUKA account, API keys, and active devices.
        </p>
        <div className="rounded-2xl kaspi-glass-surface p-5">
          <HEYUKAGmailAccessCard locale={locale} onAuthenticated={loadProfile} />
        </div>
      </div>
    );
  }

  const profile = data?.profile;

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-xl font-black text-rose-400 uppercase">
          {(profile?.name || "H").slice(0, 1)}
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--kaspi-text-primary)]">
            {profile?.name || "Loading..."}
          </h2>
          <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{profile?.googleConnected ? "Gmail / Google Connected" : "Verified Account"}</span>
          </span>
        </div>
      </div>

      {/* Exact DeepSeek Profile Fields Layout (Screenshot 4) */}
      <div className="space-y-4 rounded-2xl kaspi-glass-surface p-5 text-xs">
        <div className="space-y-1">
          <p className="text-[var(--kaspi-text-muted)]">Name</p>
          <p className="font-semibold text-[var(--kaspi-text-primary)] text-sm">
            {profile?.name || "—"}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[var(--kaspi-text-muted)]">Email address</p>
          <p className="font-mono font-semibold text-[var(--kaspi-text-primary)]">
            {profile?.maskedEmail || "—"}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[var(--kaspi-text-muted)]">Phone number</p>
          <p className="font-mono text-[var(--kaspi-text-secondary)]">
            {profile?.phone || "-"}
          </p>
        </div>

        <div className="flex flex-wrap gap-6 pt-2">
          <div className="space-y-1.5">
            <p className="text-[var(--kaspi-text-muted)]">Language</p>
            <LanguageSwitcher />
          </div>
          <div className="space-y-1.5">
            <p className="text-[var(--kaspi-text-muted)]">Theme</p>
            <KaspiThemeToggle locale={locale} />
          </div>
        </div>
      </div>

      {/* Action Buttons matching DeepSeek Profile bottom row */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl kaspi-glass-surface text-xs font-semibold text-[var(--kaspi-text-primary)] hover:border-rose-500/40 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log out</span>
        </button>

        <button
          type="button"
          onClick={() => setDevicesOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl kaspi-glass-surface text-xs font-semibold text-[var(--kaspi-text-primary)] hover:border-rose-500/40 cursor-pointer"
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Devices management ({profile?.devices?.length ?? 0})</span>
        </button>
      </div>

      <KaspiGlassModalPortal
        isOpen={devicesOpen}
        onClose={() => setDevicesOpen(false)}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="w-full max-w-md rounded-2xl kaspi-opaque-glass-modal p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--kaspi-text-primary)]">
              Active Devices & Sessions
            </h3>
            <button
              type="button"
              onClick={() => setDevicesOpen(false)}
              className="p-1 rounded hover:bg-white/10 text-[var(--kaspi-text-muted)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(profile?.devices || []).map((dev) => (
              <div
                key={dev.id}
                className="flex items-center justify-between gap-2 p-3 rounded-xl kaspi-glass-surface text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--kaspi-text-primary)] truncate">
                    {dev.deviceLabel}
                  </p>
                  <p className="text-[11px] text-[var(--kaspi-text-muted)] font-mono">
                    {dev.ipAddress} • {new Date(dev.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRevokeDevice(dev.id)}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                  title="Sign out this session"
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
