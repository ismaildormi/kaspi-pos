"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Check, Copy, KeyRound, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { HEYUKAGmailAccessCard } from "@/components/heyuka/HEYUKAGmailAccessCard";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";
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

const COPY: Record<
  PortalLocale,
  {
    heading: string;
    subtitle: string;
    usageBtn: string;
    createBtn: string;
    colName: string;
    colTracking: string;
    colKey: string;
    colCreated: string;
    colLastUsed: string;
    colAction: string;
    emptyPrefix: string;
    modalTitle: string;
    labelField: string;
    labelPlaceholder: string;
    prefixField: string;
    scopeField: string;
    scopeAll: string;
    scopeChat: string;
    scopeVision: string;
    confirmCreate: string;
    cancel: string;
    createdTitle: string;
    createdWarn: string;
    doneBtn: string;
    signInPrompt: string;
    revokeBtn: string;
  }
> = {
  ar: {
    heading: "مفاتيح الـ API (API keys)",
    subtitle:
      "قائمة مفاتيح الـ API الخاصة بك بالأسفل. يظهر المفتاح السري مرة واحدة فقط عند الإنشاء. احفظه بأمان ولا تشاركه في كود المتصفح العام. كل حساب يمكنه الاحتفاظ حتى 300 مفتاح API.",
    usageBtn: "إحصائيات الاستهلاك",
    createBtn: "إنشاء مفتاح API جديد",
    colName: "الاسم",
    colTracking: "معرف التتبع (Key ID)",
    colKey: "المفتاح",
    colCreated: "تاريخ الإنشاء",
    colLastUsed: "آخر استخدام",
    colAction: "إجراء",
    emptyPrefix: "لا يوجد أي مفتاح API بعد، يمكنك ",
    modalTitle: "إنشاء مفتاح API جديد",
    labelField: "اسم المفتاح (مثال: تطبيقي أو خادم الإنتاج)",
    labelPlaceholder: "مثال: تطبيق الويب أو الموديل",
    prefixField: "بادئة المفتاح (Prefix)",
    scopeField: "نطاق الصلاحيات (Scopes)",
    scopeAll: "صلاحية كاملة (جميع النماذج)",
    scopeChat: "المحادثة والأكواد والبحث",
    scopeVision: "الرؤية والصور والـ 3D",
    confirmCreate: "توليد المفتاح الآن",
    cancel: "إلغاء",
    createdTitle: "انسخ مفتاح الـ API الآن",
    createdWarn:
      "لأسباب أمنية لا يمكن عرض المفتاح السري مرة أخرى بعد إغلاق النافذة. تم حفظه بتجزئة SHA-256.",
    doneBtn: "تم الحفظ",
    signInPrompt: "سجّل الدخول ببريد Gmail لإنشاء مفاتيح API فريدة ومجانية 100%:",
    revokeBtn: "تعطيل",
  },
  fr: {
    heading: "Clés API (API keys)",
    subtitle:
      "Vos clés API sont listées ci-dessous. La clé secrète n'est visible et copiable qu'une seule fois à la création. Ne la partagez jamais côté client. Jusqu'à 300 clés API par espace.",
    usageBtn: "Usage des Clés",
    createBtn: "Créer une clé API",
    colName: "Nom",
    colTracking: "Tracking ID",
    colKey: "Clé",
    colCreated: "Créée le",
    colLastUsed: "Dernière utilisation",
    colAction: "Action",
    emptyPrefix: "Aucune clé API, vous pouvez ",
    modalTitle: "Créer une nouvelle clé API",
    labelField: "Nom de la clé",
    labelPlaceholder: "Ex: Serveur Production, Application Mobile",
    prefixField: "Format / Préfixe",
    scopeField: "Permissions (Scopes)",
    scopeAll: "Accès Complet (Tous modèles)",
    scopeChat: "Chat, Code & Recherche",
    scopeVision: "Vision, Images & 3D",
    confirmCreate: "Générer la clé",
    cancel: "Annuler",
    createdTitle: "Copiez votre nouvelle clé API",
    createdWarn:
      "Cette clé secrète ne sera plus jamais affichée ultérieurement (hachage SHA-256).",
    doneBtn: "Terminer",
    signInPrompt: "Connectez-vous avec Gmail pour générer des clés API gratuites à 100% :",
    revokeBtn: "Révoquer",
  },
  en: {
    heading: "API keys",
    subtitle:
      "Your API keys are listed below. The API key is only visible and can be copied once at creation. Save it securely and do not expose it in public client code. Each account can retain up to 300 API keys.",
    usageBtn: "API Key Usage",
    createBtn: "Create new API key",
    colName: "Name",
    colTracking: "Tracking ID",
    colKey: "Key",
    colCreated: "Created",
    colLastUsed: "Last used",
    colAction: "Action",
    emptyPrefix: "No API key, you can ",
    modalTitle: "Create new API key",
    labelField: "Key Name",
    labelPlaceholder: "e.g. Production Agent, HEYUKA Desktop",
    prefixField: "Token Format",
    scopeField: "Permissions",
    scopeAll: "All Capabilities",
    scopeChat: "Chat, Code & Search",
    scopeVision: "Vision, Images & 3D",
    confirmCreate: "Create",
    cancel: "Cancel",
    createdTitle: "Save your secret API key",
    createdWarn:
      "You will not be able to view this secret key again after closing this window. We also auto-linked it to your Live Debugger session.",
    doneBtn: "Done",
    signInPrompt: "Continue with Gmail to generate instant cryptographic API keys ($0.00):",
    revokeBtn: "Revoke",
  },
};

const SCOPE_SETS: Record<"all" | "chat" | "vision", string[]> = {
  all: [
    "chat:universal",
    "public-apis:query",
    "images:generate",
    "sandbox:execute",
    "web:research",
    "vision:remove-bg",
    "3d:generate",
    "3d:assets",
    "audio:transcribe",
    "audio:separate",
    "connector:discover",
  ],
  chat: ["chat:universal", "public-apis:query", "sandbox:execute", "web:research"],
  vision: ["chat:universal", "vision:remove-bg", "3d:generate", "3d:assets", "images:generate", "audio:transcribe"],
};

export function PlatformKeysView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const isRtl = locale === "ar";
  const t = COPY[locale];

  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [prefixFormat, setPrefixFormat] = useState<"hk-live" | "yk-live" | "zx-live">("hk-live");
  const [scopeMode, setScopeMode] = useState<"all" | "chat" | "vision">("all");
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
      setUserEmail(json?.userEmail || null);
      setKeys(Array.isArray(json?.keys) ? json.keys : []);
    } catch {
      // Ignore transient errors cleanly
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
      setTimeout(() => setCopiedId((p) => (p === id ? null : p)), 1800);
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
          label: label.trim() || "HEYUKA Production Key",
          tokenPrefix: prefixFormat,
          scopes: SCOPE_SETS[scopeMode],
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
    try {
      const res = await fetch(`/api/v1/zebra-x/keys?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) await fetchKeys();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header matching platform.deepseek.com/api_keys */}
      <div className="space-y-2 max-w-3xl">
        <h2 className="text-2xl font-bold text-[var(--kaspi-text-primary)] tracking-tight">
          {t.heading}
        </h2>
        <p className="text-xs sm:text-[13px] text-[var(--kaspi-text-secondary)] leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* Action Buttons Row right-aligned (exact DeepSeek alignment) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-[var(--kaspi-text-muted)]">
          {authenticated && userEmail ? (
            <span className="inline-flex items-center gap-1.5 text-[var(--kaspi-text-secondary)]">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
              <span>{userEmail}</span>
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/${locale}/zebra-x`}
            className="px-4 py-2 rounded-full kaspi-glass-surface text-xs font-semibold text-[var(--kaspi-text-primary)] hover:border-rose-500/40 transition-colors"
          >
            {t.usageBtn}
          </Link>
          <button
            type="button"
            onClick={() => {
              setRevealedSecret(null);
              setRevealedKeyId(null);
              setError(null);
              setCreateOpen(true);
            }}
            className="px-4 py-2 rounded-full bg-white text-zinc-900 hover:bg-zinc-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.createBtn}</span>
          </button>
        </div>
      </div>

      {/* API Keys Table Card matching Screenshot 1 */}
      <div className="rounded-2xl kaspi-glass-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--kaspi-border)] text-[var(--kaspi-text-muted)] font-medium">
                <th className="py-3.5 px-4 text-start">{t.colName}</th>
                <th className="py-3.5 px-4 text-start">{t.colTracking}</th>
                <th className="py-3.5 px-4 text-start">{t.colKey}</th>
                <th className="py-3.5 px-4 text-start">{t.colCreated}</th>
                <th className="py-3.5 px-4 text-start">{t.colLastUsed}</th>
                <th className="py-3.5 px-4 text-end">{t.colAction}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[var(--kaspi-text-muted)]">
                    Loading...
                  </td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--kaspi-text-muted)]">
                    <span>{t.emptyPrefix}</span>
                    <button
                      type="button"
                      onClick={() => setCreateOpen(true)}
                      className="text-[var(--kaspi-text-primary)] font-semibold underline underline-offset-4 hover:text-rose-400 cursor-pointer"
                    >
                      {t.createBtn}
                    </button>
                    <span>.</span>
                  </td>
                </tr>
              ) : (
                keys.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-[var(--kaspi-border)] hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-[var(--kaspi-text-primary)]">
                      {row.label}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--kaspi-text-secondary)]">
                      <button
                        type="button"
                        onClick={() => void handleCopy(`id-${row.id}`, row.id)}
                        className="inline-flex items-center gap-1.5 hover:text-rose-400 cursor-pointer"
                        title="Copy Tracking Key ID"
                      >
                        <span>{row.id}</span>
                        {copiedId === `id-${row.id}` ? (
                          <Check className="w-3 h-3 text-rose-500" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-60" />
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-rose-400">
                      {row.prefix}••••{row.last4}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--kaspi-text-muted)]">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--kaspi-text-muted)]">
                      {row.lastUsedAt
                        ? `${new Date(row.lastUsedAt).toLocaleDateString()} (${row.usageCount || 0})`
                        : `${row.usageCount || 0} calls`}
                    </td>
                    <td className="py-3.5 px-4 text-end">
                      <button
                        type="button"
                        onClick={() => void handleRevoke(row.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/15 text-[11px] font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{t.revokeBtn}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Key / Gmail Auth Modal via KaspiGlassModalPortal */}
      <KaspiGlassModalPortal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="w-full max-w-lg rounded-3xl kaspi-opaque-glass-modal p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-extrabold text-[var(--kaspi-text-primary)] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-rose-500" />
              <span>{revealedSecret ? t.createdTitle : t.modalTitle}</span>
            </h3>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--kaspi-text-muted)] cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!authenticated ? (
            <div className="space-y-4">
              <p className="text-xs text-[var(--kaspi-text-secondary)]">{t.signInPrompt}</p>
              <HEYUKAGmailAccessCard
                locale={locale}
                compact
                onAuthenticated={fetchKeys}
              />
            </div>
          ) : revealedSecret ? (
            <div className="space-y-4">
              <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">
                {t.createdWarn}
              </p>

              {revealedKeyId && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[var(--kaspi-text-muted)]">
                    <span>Tracking ID (`X-API-Key-Id`)</span>
                    <button
                      type="button"
                      onClick={() => void handleCopy("new-id", revealedKeyId)}
                      className="text-rose-400 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === "new-id" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === "new-id" ? "Copied" : "Copy ID"}</span>
                    </button>
                  </div>
                  <div className="p-3 rounded-xl kaspi-glass-surface font-mono text-xs break-all select-all text-[var(--kaspi-text-primary)]">
                    {revealedKeyId}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[var(--kaspi-text-muted)]">
                  <span>Secret API Key (`Authorization: Bearer ...`)</span>
                  <button
                    type="button"
                    onClick={() => void handleCopy("new-secret", revealedSecret)}
                    className="text-rose-400 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === "new-secret" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === "new-secret" ? "Copied" : "Copy Key"}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl kaspi-glass-surface font-mono text-xs break-all select-all text-rose-300 border border-rose-500/40">
                  {revealedSecret}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <Link
                  href={`/${locale}/zebra-x/debug`}
                  className="text-xs font-semibold text-rose-400 hover:underline"
                >
                  Open Live Debugger →
                </Link>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-5 py-2 rounded-full bg-white text-zinc-900 hover:bg-zinc-200 text-xs font-bold cursor-pointer"
                >
                  {t.doneBtn}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--kaspi-text-secondary)] block">
                  {t.labelField}
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={t.labelPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl kaspi-glass-surface text-xs text-[var(--kaspi-text-primary)] placeholder:text-[var(--kaspi-text-muted)] focus:outline-none focus:border-rose-500/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--kaspi-text-secondary)] block">
                  {t.prefixField}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["hk-live", "yk-live", "zx-live"] as const).map((pfx) => (
                    <button
                      key={pfx}
                      type="button"
                      onClick={() => setPrefixFormat(pfx)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold cursor-pointer border transition-colors ${
                        prefixFormat === pfx
                          ? "bg-rose-600/20 border-rose-500 text-rose-300"
                          : "kaspi-glass-surface border-[var(--kaspi-border)] text-[var(--kaspi-text-secondary)]"
                      }`}
                    >
                      {pfx}-...
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--kaspi-text-secondary)] block">
                  {t.scopeField}
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all" as const, label: t.scopeAll },
                    { id: "chat" as const, label: t.scopeChat },
                    { id: "vision" as const, label: t.scopeVision },
                  ].map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setScopeMode(sc.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                        scopeMode === sc.id
                          ? "bg-white text-zinc-900 border-white"
                          : "kaspi-glass-surface border-[var(--kaspi-border)] text-[var(--kaspi-text-secondary)]"
                      }`}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-full kaspi-glass-surface text-xs font-semibold text-[var(--kaspi-text-secondary)] cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-full bg-white text-zinc-900 hover:bg-zinc-200 text-xs font-bold cursor-pointer"
                >
                  {busy ? "..." : t.confirmCreate}
                </button>
              </div>
            </form>
          )}
        </div>
      </KaspiGlassModalPortal>
    </div>
  );
}
