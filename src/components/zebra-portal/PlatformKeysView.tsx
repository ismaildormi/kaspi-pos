"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Check, Copy, KeyRound, Trash2, X } from "lucide-react";
import { HEYUKAGmailAccessCard } from "@/components/heyuka/HEYUKAGmailAccessCard";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";
import { LiveOmnisciencePanel } from "@/components/studio/LiveOmnisciencePanel";
import { saveActiveConsoleKey, type PortalLocale } from "./platform-data";

interface ApiKeyRow {
  id: string;
  label: string;
  prefix: string;
  last4: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
  usageCount?: number;
}

export function PlatformKeysView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const isRtl = locale === "ar";

  const [authenticated, setAuthenticated] = useState(false);
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [revealedKeyId, setRevealedKeyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/zebra-x/keys", { cache: "no-store" });
      const json = await res.json();
      setAuthenticated(Boolean(json?.authenticated));
      setKeys(Array.isArray(json?.keys) ? json.keys : []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchKeys();
  }, [fetchKeys]);

  const handleCopy = async (id: string, val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedId(id);
      setTimeout(() => setCopiedId((p) => (p === id ? null : p)), 1600);
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/zebra-x/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim() || "HEYUKA API Key",
          tokenPrefix: "hk-live",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Could not create API key.");
        return;
      }
      setRevealedSecret(json.secretKeyOnce);
      setRevealedKeyId(json.keyId);
      saveActiveConsoleKey(json.secretKeyOnce, json.keyId);
      setLabel("");
      await fetchKeys();
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (id: string) => {
    const res = await fetch(`/api/v1/zebra-x/keys?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) await fetchKeys();
  };

  return (
    <div className="space-y-6">
      {/* Exact Screenshot 1 Header & Description */}
      <div className="space-y-2 max-w-3xl">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {locale === "ar" ? "مفاتيح الـ API" : "API keys"}
        </h1>
        <p className="text-[13px] text-zinc-400 leading-relaxed">
          {locale === "ar"
            ? "تظهر مفاتيح الـ API الخاصة بك أدناه. يظهر المفتاح السري مرة واحدة فقط عند الإنشاء. احفظه بأمان ولا تشاركه في المتصفح العام. الحد الأقصى 300 مفتاح لكل حساب، والخدمة مجانية 100% ($0.00)."
            : "Your API keys are listed below. The API key is only visible and can be copied once at creation. Save it securely. Do not share your API key with others, or expose it in client-side code. Each account can retain up to 300 API Keys."}
        </p>
      </div>

      {/* Right-aligned Pill Buttons matching Screenshot 1 */}
      <div className="flex items-center justify-end gap-2.5">
        <Link
          href={`/${locale}/zebra-x`}
          className="px-4 py-2 rounded-full bg-[#222328] hover:bg-[#2B2D33] text-xs font-medium text-zinc-100 transition-colors"
        >
          API Key Usage
        </Link>
        <button
          type="button"
          onClick={() => {
            setRevealedSecret(null);
            setRevealedKeyId(null);
            setError(null);
            setCreateOpen(true);
          }}
          className="px-4 py-2 rounded-full bg-white hover:bg-zinc-200 text-xs font-semibold text-zinc-900 cursor-pointer transition-colors"
        >
          Create new API key
        </button>
      </div>

      {/* Table Box matching Antigravity calm surface */}
      <div className="rounded-xl bg-[#161618] border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-zinc-400 font-medium">
                <th className="py-3.5 px-5 text-start">Name</th>
                <th className="py-3.5 px-5 text-start">Tracking ID</th>
                <th className="py-3.5 px-5 text-start">Key</th>
                <th className="py-3.5 px-5 text-start">Created</th>
                <th className="py-3.5 px-5 text-start">Last used</th>
                <th className="py-3.5 px-5 text-end" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    Loading...
                  </td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-zinc-400">
                    No API key, you can{" "}
                    <button
                      type="button"
                      onClick={() => setCreateOpen(true)}
                      className="text-white font-semibold underline underline-offset-4 hover:text-[#007ACC] cursor-pointer"
                    >
                      Create new API key
                    </button>
                    .
                  </td>
                </tr>
              ) : (
                keys.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-white/[0.05] hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3.5 px-5 font-medium text-zinc-100">{row.label}</td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-zinc-400">
                      <button
                        type="button"
                        onClick={() => void handleCopy(`id-${row.id}`, row.id)}
                        className="inline-flex items-center gap-1.5 hover:text-[#007ACC] cursor-pointer"
                      >
                        <span>{row.id}</span>
                        {copiedId === `id-${row.id}` ? (
                          <Check className="w-3 h-3 text-[#007ACC]" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-60" />
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-zinc-200">
                      {row.prefix}••••{row.last4}
                    </td>
                    <td className="py-3.5 px-5 text-zinc-400">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-zinc-400">
                      {row.lastUsedAt
                        ? new Date(row.lastUsedAt).toLocaleDateString()
                        : `${row.usageCount || 0} reqs`}
                    </td>
                    <td className="py-3.5 px-5 text-end">
                      <button
                        type="button"
                        onClick={() => void handleRevoke(row.id)}
                        className="p-1.5 rounded hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-100 cursor-pointer"
                        title="Delete key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Key / Gmail Sign-in Dialog */}
      <KaspiGlassModalPortal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="w-full max-w-md rounded-2xl kaspi-opaque-glass-modal p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#007ACC]" />
              <span>{revealedSecret ? "Save your API key" : "Create new API key"}</span>
            </h3>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="p-1 rounded hover:bg-white/10 text-zinc-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!authenticated ? (
            <HEYUKAGmailAccessCard locale={locale} compact onAuthenticated={fetchKeys} />
          ) : revealedSecret ? (
            <div className="space-y-4">
              <p className="text-xs text-zinc-300 bg-[#007ACC]/10 border border-[#007ACC]/30 rounded-lg p-3">
                Copy this key now. For security, you won&apos;t be able to see it again.
              </p>
              {revealedKeyId && (
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Tracking ID</span>
                    <button
                      type="button"
                      onClick={() => void handleCopy("new-id", revealedKeyId)}
                      className="text-[#007ACC] cursor-pointer"
                    >
                      {copiedId === "new-id" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#101010] font-mono text-[11px] break-all select-all">
                    {revealedKeyId}
                  </div>
                </div>
              )}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Secret API Key</span>
                  <button
                    type="button"
                    onClick={() => void handleCopy("new-sec", revealedSecret)}
                    className="text-[#007ACC] cursor-pointer"
                  >
                    {copiedId === "new-sec" ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-[#101010] border border-[#007ACC]/40 font-mono text-[11px] break-all select-all text-zinc-100">
                  {revealedSecret}
                </div>
              </div>
              <div className="flex justify-between items-center pt-1">
                <Link
                  href={`/${locale}/zebra-x/debug`}
                  className="text-xs text-[#007ACC] hover:underline"
                >
                  Test in Live Debugger →
                </Link>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-5 py-2 rounded-full bg-white text-zinc-900 text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  Name your API key
                </label>
                <input
                  type="text"
                  autoFocus
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. My Agent / Production"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141519] border border-white/10 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>
              {error && <p className="text-xs text-rose-400">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-full bg-white/10 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-full bg-white text-zinc-900 text-xs font-bold cursor-pointer"
                >
                  {busy ? "..." : "Create"}
                </button>
              </div>
            </form>
          )}
        </div>
      </KaspiGlassModalPortal>

      <LiveOmnisciencePanel locale={locale} isLight={false} showSeedControls={true} />
    </div>
  );
}
