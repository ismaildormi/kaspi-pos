"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Bug,
  Check,
  Copy,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
  Terminal,
  Trash2,
} from "lucide-react";
import { saveActiveConsoleKey, type PortalLocale } from "./platform-data";

interface ApiKeyMeta {
  id: string;
  label: string;
  prefix: string;
  last4: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
  usageCount?: number;
}

type PermissionTierId = "all" | "chat_research" | "vision_media";

const PERMISSION_TIERS: Record<
  PermissionTierId,
  { labelAr: string; labelFr: string; labelEn: string; scopes?: string[] }
> = {
  all: {
    labelAr: "صلاحية كاملة (جميع النماذج والأدوات)",
    labelFr: "Accès Complet (Tous Modèles & Outils)",
    labelEn: "Full Access (All Models & APIs)",
    scopes: undefined,
  },
  chat_research: {
    labelAr: "المحادثة، الكود، والبيانات الحية فقط",
    labelFr: "Chat, Code & Données Live uniquement",
    labelEn: "Chat, Code & Live Research Only",
    scopes: ["chat:universal", "web:research", "public-apis:query", "sandbox:execute"],
  },
  vision_media: {
    labelAr: "الرؤية، الصور، 3D، والصوتيات",
    labelFr: "Vision, Images, 3D & Audio Studio",
    labelEn: "Vision, Images, 3D & Audio Studio",
    scopes: [
      "vision:remove-bg",
      "images:generate",
      "3d:generate",
      "3d:assets",
      "audio:transcribe",
      "audio:separate",
    ],
  },
};

const COPY: Record<
  PortalLocale,
  {
    badge: string;
    title: string;
    subtitle: string;
    signInPrompt: string;
    signInBtn: string;
    registerBtn: string;
    keyNameLabel: string;
    keyNamePlaceholder: string;
    scopesLabel: string;
    prefixLabel: string;
    createBtn: string;
    creatingBtn: string;
    refreshBtn: string;
    onceTitle: string;
    onceSub: string;
    copySecret: string;
    copyKeyId: string;
    copied: string;
    testDebugBtn: string;
    openPlaygroundBtn: string;
    tableName: string;
    tableKeyId: string;
    tableSecret: string;
    tableScopes: string;
    tableUsage: string;
    tableCreated: string;
    tableAction: string;
    emptyKeys: string;
    privacyNote: string;
  }
> = {
  ar: {
    badge: "خزنة مفاتيح KASPI • تجزئة SHA-256",
    title: "إدارة مفاتيح الـ API (IPK) والمعرّفات الحقيقية",
    subtitle:
      "كل مفتاح يتم إنشاؤه فريد تماماً ومشفّر بتجزئة SHA-256 مع معرف Key ID مستقل للتحقق وتتبع الاستهلاك الحقيقي.",
    signInPrompt: "سجّل الدخول بحسابك في KASPI لإصدار وإدارة مفاتيح API حقيقية خاصة بك:",
    signInBtn: "تسجيل الدخول للمنصة",
    registerBtn: "إنشاء حساب مجاني",
    keyNameLabel: "اسم المفتاح / المشروع",
    keyNamePlaceholder: "مثال: تطبيق المتجر أو اختبار الذكاء",
    scopesLabel: "نطاق الصلاحيات (Scopes)",
    prefixLabel: "بادئة المفتاح",
    createBtn: "توليد مفتاح API فريد الآن",
    creatingBtn: "جاري التوليد...",
    refreshBtn: "تحديث",
    onceTitle: "تم توليد مفتاحك السري بنجاح — احفظه الآن (يُعرض مرة واحدة فقط)",
    onceSub: "يمكنك نسخه أو إرساله مباشرة لفاحص Live Debugger للتأكد من عمله فوراً.",
    copySecret: "نسخ Secret API Key",
    copyKeyId: "نسخ Key ID",
    copied: "تم النسخ ✓",
    testDebugBtn: "فحص المفتاح في Live Debugger",
    openPlaygroundBtn: "تجربة في Playground",
    tableName: "الاسم",
    tableKeyId: "Key ID",
    tableSecret: "المفتاح المخفي",
    tableScopes: "الصلاحيات",
    tableUsage: "الاستهلاك",
    tableCreated: "تاريخ الإنشاء",
    tableAction: "إجراء",
    emptyKeys: "لا توجد مفاتيح نشطة بعد. أنشئ مفتاحك الأول أعلاه.",
    privacyNote:
      "جميع المفاتيح معزولة على مستوى كل حساب ولا تُخزَّن كنص صريح بعد التوليد.",
  },
  fr: {
    badge: "Coffre-Fort SHA-256 • KASPI Isolation",
    title: "Gestion des Clés API (IPK) & Key IDs Réels",
    subtitle:
      "Chaque clé générée est unique, hachée en SHA-256 et associée à un Key ID vérifiable avec compteur de requêtes en direct.",
    signInPrompt: "Connectez-vous à votre compte KASPI pour générer vos propres clés API uniques :",
    signInBtn: "Se connecter",
    registerBtn: "Créer un compte",
    keyNameLabel: "Nom du projet",
    keyNamePlaceholder: "Ex: Mon App Commerce / Test IA",
    scopesLabel: "Périmètre d'autorisation (Scopes)",
    prefixLabel: "Format du préfixe",
    createBtn: "Générer Clé Unique + Key ID",
    creatingBtn: "Génération...",
    refreshBtn: "Actualiser",
    onceTitle: "Votre clé secrète est prête — Copiez-la maintenant (affichage unique)",
    onceSub: "Envoyez-la directement vers le Live Debugger pour valider son fonctionnement.",
    copySecret: "Copier Secret Key",
    copyKeyId: "Copier Key ID",
    copied: "Copié ✓",
    testDebugBtn: "Vérifier dans Live Debugger",
    openPlaygroundBtn: "Tester dans Playground",
    tableName: "Nom",
    tableKeyId: "Key ID",
    tableSecret: "Clé Masquée",
    tableScopes: "Scopes",
    tableUsage: "Usage",
    tableCreated: "Création",
    tableAction: "Action",
    emptyKeys: "Aucune clé active. Générez votre première clé ci-dessus.",
    privacyNote:
      "Zéro stockage en clair après création : vous pouvez révoquer et remplacer toute clé à tout moment.",
  },
  en: {
    badge: "Zero-Plaintext SHA-256 Vault • Tenant Isolated",
    title: "API Keys (IPK) & Verifiable Key IDs",
    subtitle:
      "Issue cryptographically unique Secret API Keys paired with an independent X-API-Key-Id for instant verification and usage telemetry.",
    signInPrompt: "Sign in to your KASPI account to issue and manage unique API Keys:",
    signInBtn: "Sign in",
    registerBtn: "Create account",
    keyNameLabel: "Project / Key Label",
    keyNamePlaceholder: "e.g. Production Assistant or AI Evaluator",
    scopesLabel: "Permission Scopes",
    prefixLabel: "Token Prefix",
    createBtn: "Create Secret Key Now",
    creatingBtn: "Creating...",
    refreshBtn: "Refresh",
    onceTitle: "Secret Key Created — Save it now (shown only once)",
    onceSub: "You can test this key immediately inside the 7-point Live API Debugger.",
    copySecret: "Copy Secret Key",
    copyKeyId: "Copy Key ID",
    copied: "Copied ✓",
    testDebugBtn: "Verify Key in Live Debugger",
    openPlaygroundBtn: "Open in Playground",
    tableName: "Name",
    tableKeyId: "Key ID",
    tableSecret: "Secret Key",
    tableScopes: "Scopes",
    tableUsage: "Usage",
    tableCreated: "Created",
    tableAction: "Action",
    emptyKeys: "No active keys yet. Generate your first Secret Key above.",
    privacyNote:
      "Keys are stored strictly as SHA-256 hashes inside tenant-isolated storage. Revoke compromised keys instantly.",
  },
};

export function PlatformKeysView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const t = COPY[locale];

  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKeyMeta[]>([]);
  const [label, setLabel] = useState("");
  const [tier, setTier] = useState<PermissionTierId>("all");
  const [tokenPrefix, setTokenPrefix] = useState<"hk-live" | "yk-live" | "zx-live">("hk-live");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadKeys = async () => {
    try {
      const r = await fetch("/api/v1/zebra-x/keys", { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      setAuthenticated(Boolean(data.authenticated));
      setUserEmail(data.userEmail || null);
      setKeys(Array.isArray(data.keys) ? data.keys : []);
    } catch {}
  };

  useEffect(() => {
    void loadKeys();
  }, []);

  const copyValue = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId((p) => (p === id ? null : p)), 1800);
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/v1/zebra-x/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim() || `HEYUKA Key #${keys.length + 1}`,
          scopes: PERMISSION_TIERS[tier].scopes,
          tokenPrefix,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Failed to generate API key");
        return;
      }
      const nextKey = String(json.secretKeyOnce || "");
      const nextId = String(json.keyId || json.key?.id || "");
      setCreatedSecret(nextKey);
      setCreatedId(nextId);
      saveActiveConsoleKey(nextKey, nextId);
      setLabel("");
      await loadKeys();
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await fetch(`/api/v1/zebra-x/keys?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await loadKeys();
    } catch {}
  };

  const loginHref = `/${locale}/login?from=${encodeURIComponent(`/${locale}/zebra-x/api-keys`)}`;
  const registerHref = `/${locale}/register?from=${encodeURIComponent(`/${locale}/zebra-x/api-keys`)}`;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <section className="kaspi-glass-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full kaspi-glass-surface text-xs font-semibold text-emerald-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--kaspi-text-primary)]">
            {t.title}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--kaspi-text-secondary)] max-w-2xl">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {userEmail && (
            <span className="kaspi-frosted-surface rounded-full px-3.5 py-1.5 text-xs font-mono text-[var(--kaspi-text-primary)]">
              {userEmail}
            </span>
          )}
          <button
            type="button"
            onClick={() => void loadKeys()}
            className="kaspi-glass-btn rounded-full px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.refreshBtn}</span>
          </button>
        </div>
      </section>

      {!authenticated ? (
        <section className="kaspi-glass-card kaspi-polar-aurora-orbit relative rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl kaspi-glass-surface flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="space-y-1">
              <div className="text-sm sm:text-base font-extrabold text-[var(--kaspi-text-primary)]">
                {t.signInPrompt}
              </div>
              <div className="text-xs text-[var(--kaspi-text-muted)]">{t.privacyNote}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Link href={loginHref} className="kaspi-primary-cta-btn rounded-2xl px-4 py-2.5 text-xs font-bold">
              {t.signInBtn}
            </Link>
            <Link href={registerHref} className="kaspi-glass-btn rounded-2xl px-4 py-2.5 text-xs font-bold">
              {t.registerBtn}
            </Link>
          </div>
        </section>
      ) : (
        <form
          onSubmit={handleCreate}
          className="kaspi-glass-card kaspi-polar-aurora-orbit relative rounded-3xl p-5 sm:p-7 space-y-5"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-5 space-y-1.5">
              <label className="text-xs font-bold text-[var(--kaspi-text-secondary)]">
                {t.keyNameLabel}
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t.keyNamePlaceholder}
                className="w-full rounded-2xl kaspi-glass-surface px-4 py-3 text-xs sm:text-sm text-[var(--kaspi-text-primary)] placeholder:text-[var(--kaspi-text-muted)] focus:outline-none"
              />
            </div>

            <div className="lg:col-span-7 space-y-1.5">
              <div className="text-xs font-bold text-[var(--kaspi-text-secondary)]">
                {t.scopesLabel}
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PERMISSION_TIERS) as PermissionTierId[]).map((id) => {
                  const cfg = PERMISSION_TIERS[id];
                  const active = tier === id;
                  const txt = locale === "ar" ? cfg.labelAr : locale === "fr" ? cfg.labelFr : cfg.labelEn;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTier(id)}
                      className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? "kaspi-orbit-active text-emerald-500"
                          : "kaspi-glass-surface text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)]"
                      }`}
                    >
                      {txt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[var(--kaspi-border)]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[var(--kaspi-text-muted)]">{t.prefixLabel}:</span>
              {(["hk-live", "yk-live", "zx-live"] as const).map((pref) => (
                <button
                  key={pref}
                  type="button"
                  onClick={() => setTokenPrefix(pref)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    tokenPrefix === pref
                      ? "kaspi-orbit-active text-emerald-500"
                      : "kaspi-glass-surface text-[var(--kaspi-text-muted)]"
                  }`}
                >
                  {pref}-...
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="kaspi-primary-cta-btn rounded-2xl px-6 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              <span>{busy ? t.creatingBtn : t.createBtn}</span>
            </button>
          </div>

          {error && (
            <div className="kaspi-frosted-surface rounded-2xl p-3 text-xs font-semibold text-rose-500">
              {error}
            </div>
          )}
        </form>
      )}

      {/* One-time Created Secret Display */}
      {createdSecret && (
        <section className="kaspi-glass-card kaspi-polar-aurora-orbit relative rounded-3xl p-5 sm:p-7 space-y-4">
          <div className="space-y-1">
            <div className="text-sm sm:text-base font-black text-emerald-500">
              {t.onceTitle}
            </div>
            <p className="text-xs text-[var(--kaspi-text-secondary)]">{t.onceSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {createdId && (
              <div className="kaspi-frosted-surface rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[var(--kaspi-text-muted)]">
                    Key ID (`X-API-Key-Id`)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyValue("once-id", createdId)}
                    className="kaspi-glass-btn rounded-xl px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === "once-id" ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedId === "once-id" ? t.copied : t.copyKeyId}</span>
                  </button>
                </div>
                <div dir="ltr" className="font-mono text-xs sm:text-sm text-[var(--kaspi-text-primary)] break-all">
                  {createdId}
                </div>
              </div>
            )}

            <div className="kaspi-frosted-surface rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[var(--kaspi-text-muted)]">
                  Secret API Key (`Authorization: Bearer ...`)
                </span>
                <button
                  type="button"
                  onClick={() => copyValue("once-secret", createdSecret)}
                  className="kaspi-primary-cta-btn rounded-xl px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === "once-secret" ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedId === "once-secret" ? t.copied : t.copySecret}</span>
                </button>
              </div>
              <div dir="ltr" className="font-mono text-xs sm:text-sm text-emerald-500 font-bold break-all">
                {createdSecret}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={`/${locale}/zebra-x/debug`}
              onClick={() => saveActiveConsoleKey(createdSecret, createdId)}
              className="kaspi-primary-cta-btn rounded-2xl px-4 py-2.5 text-xs font-bold inline-flex items-center gap-2"
            >
              <Bug className="w-4 h-4" />
              <span>{t.testDebugBtn}</span>
            </Link>
            <Link
              href={`/${locale}/zebra-x/playground`}
              onClick={() => saveActiveConsoleKey(createdSecret, createdId)}
              className="kaspi-glass-btn rounded-2xl px-4 py-2.5 text-xs font-bold inline-flex items-center gap-2"
            >
              <Terminal className="w-4 h-4 text-emerald-500" />
              <span>{t.openPlaygroundBtn}</span>
            </Link>
          </div>
        </section>
      )}

      {/* Keys Table */}
      <section className="kaspi-glass-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="overflow-x-auto rounded-2xl kaspi-frosted-surface">
          <table className="w-full text-xs sm:text-[13px] border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-[var(--kaspi-border)] text-[var(--kaspi-text-muted)]">
                <th className="p-3.5 text-start font-bold">{t.tableName}</th>
                <th className="p-3.5 text-start font-bold">{t.tableKeyId}</th>
                <th className="p-3.5 text-start font-bold">{t.tableSecret}</th>
                <th className="p-3.5 text-start font-bold">{t.tableScopes}</th>
                <th className="p-3.5 text-start font-bold">{t.tableUsage}</th>
                <th className="p-3.5 text-start font-bold">{t.tableCreated}</th>
                <th className="p-3.5 text-end font-bold">{t.tableAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--kaspi-border)]">
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--kaspi-text-muted)]">
                    <KeyRound className="w-5 h-5 mx-auto mb-2 opacity-60" />
                    {t.emptyKeys}
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k.id} className="hover:bg-[var(--kaspi-surface-hover)] transition-colors">
                    <td className="p-3.5 font-extrabold text-[var(--kaspi-text-primary)]">
                      {k.label}
                    </td>
                    <td className="p-3.5 font-mono text-amber-500">
                      <button
                        type="button"
                        onClick={() => copyValue(`row-${k.id}`, k.id)}
                        className="inline-flex items-center gap-1.5 hover:underline cursor-pointer"
                      >
                        {copiedId === `row-${k.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 opacity-70" />
                        )}
                        <span>{k.id}</span>
                      </button>
                    </td>
                    <td dir="ltr" className="p-3.5 font-mono text-emerald-500 font-semibold">
                      {k.prefix}••••{k.last4}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full kaspi-glass-surface text-[11px] font-semibold">
                        {Array.isArray(k.scopes) ? `${k.scopes.length} scopes` : "all"}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[var(--kaspi-text-secondary)]">
                      {k.usageCount ?? 0} reqs
                    </td>
                    <td className="p-3.5 text-[var(--kaspi-text-muted)]">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-end">
                      <button
                        type="button"
                        onClick={() => handleRevoke(k.id)}
                        className="kaspi-glass-btn rounded-xl px-3 py-1.5 text-[11px] font-bold text-rose-500 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoke</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[var(--kaspi-text-muted)] px-1">{t.privacyNote}</p>
      </section>
    </div>
  );
}
