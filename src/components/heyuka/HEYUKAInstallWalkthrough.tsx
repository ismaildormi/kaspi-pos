"use client";

import React, { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  Download,
  ExternalLink,
  KeyRound,
  Layers,
  Monitor,
  Play,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";

export type InstallTarget = "windows" | "macos" | "linux" | "node" | "python" | "curl";

interface HEYUKAInstallWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  locale: "ar" | "fr" | "en";
  activeSecretKey?: string | null;
  activeKeyId?: string | null;
  initialTarget?: InstallTarget;
}

const API_BASE = "https://kaspi-pos.vercel.app/api/v1";

const GUIDE_I18N = {
  ar: {
    badge: "الدليل الرسمي الشامل • HEYUKA من KASPI",
    title: "جميع مراحل تحميل تطبيق HEYUKA والربط بالـ API",
    subtitle:
      "اتبع المراحل الأربع التالية لتحميل التطبيق على جهازك، تأمين مفتاح API حقيقي فريد لك، وربطه فوراً بأي تطبيق عبر بروتوكول OpenAI القياسي.",
    stages: [
      { id: 0, short: "1. التحميل والتثبيت", full: "المرحلة 1: تحميل تطبيق HEYUKA أو حزمة التطوير" },
      { id: 1, short: "2. المفتاح و Key ID", full: "المرحلة 2: إنشاء وحفظ API Key و Key ID الفريدين" },
      { id: 2, short: "3. كود الربط والـ SDK", full: "المرحلة 3: ربط تطبيقك بكود جاهز للنسخ" },
      { id: 3, short: "4. التحقق والتشغيل", full: "المرحلة 4: فحص الاتصال وتشغيل أول طلب حي" },
    ],
    showAllBtn: "عرض جميع المراحل دفعة واحدة",
    stepperBtn: "عرض مرحلة بمرحلة",
    copy: "نسخ الكود",
    copied: "تم النسخ",
    testNow: "اختبار الاتصال الحي الآن",
    testing: "جاري الاختبار...",
    close: "إغلاق",
  },
  fr: {
    badge: "Guide Officiel Complet • HEYUKA par KASPI",
    title: "Toutes les Étapes d'Installation HEYUKA & Intégration API",
    subtitle:
      "Suivez ces 4 étapes claires pour installer l'application, sécuriser votre clé API unique et connecter vos projets en moins de 2 minutes.",
    stages: [
      { id: 0, short: "1. Téléchargement", full: "Étape 1 : Télécharger l'app HEYUKA ou le SDK" },
      { id: 1, short: "2. Clé API & Key ID", full: "Étape 2 : Générer et sécuriser votre clé unique" },
      { id: 2, short: "3. Intégration Code", full: "Étape 3 : Connecter via SDK compatible OpenAI" },
      { id: 3, short: "4. Vérification Live", full: "Étape 4 : Vérifier la connexion en direct" },
    ],
    showAllBtn: "Afficher toutes les étapes",
    stepperBtn: "Mode étape par étape",
    copy: "Copier le code",
    copied: "Copié",
    testNow: "Tester la connexion en direct",
    testing: "Test en cours...",
    close: "Fermer",
  },
  en: {
    badge: "Official Onboarding Guide • HEYUKA by KASPI",
    title: "All HEYUKA Download, Setup & API Integration Stages",
    subtitle:
      "Follow these four visual stages to install HEYUKA Desktop, configure your unique cryptographic API Key & Key ID, and run your first verified request.",
    stages: [
      { id: 0, short: "1. Download & Install", full: "Stage 1: Download HEYUKA Desktop or Install SDK" },
      { id: 1, short: "2. API Key & Key ID", full: "Stage 2: Issue & Store Your Unique Credentials" },
      { id: 2, short: "3. SDK Integration", full: "Stage 3: Copy Production Code Snippets" },
      { id: 3, short: "4. Verify Live", full: "Stage 4: Test Connectivity & Inspect Response" },
    ],
    showAllBtn: "View All Stages Together",
    stepperBtn: "Step-by-Step View",
    copy: "Copy Code",
    copied: "Copied",
    testNow: "Ping Live API Gateway",
    testing: "Verifying...",
    close: "Close",
  },
} as const;

export const HEYUKAInstallWalkthrough: React.FC<HEYUKAInstallWalkthroughProps> = ({
  isOpen,
  onClose,
  locale,
  activeSecretKey,
  activeKeyId,
  initialTarget = "windows",
}) => {
  const isAr = locale === "ar";
  const t = GUIDE_I18N[locale];

  const [target, setTarget] = useState<InstallTarget>(initialTarget);
  const [activeStage, setActiveStage] = useState<number>(0);
  const [viewAllStages, setViewAllStages] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState<string>("");
  const [pingBusy, setPingBusy] = useState(false);

  const sampleKey = activeSecretKey || "hk-live-YOUR_UNIQUE_SECRET_KEY";
  const sampleKeyId = activeKeyId || "hk_YOUR_UNIQUE_KEY_ID";

  const copyText = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
    } catch {}
  };

  const snippets = useMemo(() => {
    const installCmd =
      target === "python"
        ? "pip install --upgrade openai requests python-dotenv"
        : target === "node"
        ? "npm install openai dotenv"
        : target === "macos"
        ? "# Download Complete HEYUKA Desktop Bundle (Electron + Python + 3D Studio)\ncurl -fSL \"https://kaspi-pos.vercel.app/api/v1/heyuka/installer?platform=desktop_zip\" -o HEYUKA-Desktop-App.zip && unzip -q HEYUKA-Desktop-App.zip -d HEYUKA-Desktop"
        : target === "linux"
        ? "# Download Complete HEYUKA Desktop Bundle & Inspect Linux Build\ncurl -fSL \"https://kaspi-pos.vercel.app/api/v1/heyuka/installer?platform=desktop_zip\" -o HEYUKA-Desktop-App.zip && unzip -q HEYUKA-Desktop-App.zip -d HEYUKA-Desktop"
        : target === "curl"
        ? "# No SDK package required — works natively with curl, HTTPie, or Postman\ncurl --version"
        : "# Windows 10 / 11 (x64) — Download Complete HEYUKA Desktop Bundle (.zip)\nInvoke-WebRequest -Uri \"https://kaspi-pos.vercel.app/api/v1/heyuka/installer?platform=desktop_zip\" -OutFile \"$env:USERPROFILE\\Desktop\\HEYUKA-Desktop-App.zip\"; Expand-Archive -Path \"$env:USERPROFILE\\Desktop\\HEYUKA-Desktop-App.zip\" -DestinationPath \"$env:USERPROFILE\\Desktop\\HEYUKA-Desktop\"";

    const envSnippet =
      target === "windows"
        ? `# PowerShell / .env configuration\n$env:HEYUKA_API_KEY="${sampleKey}"\n$env:HEYUKA_KEY_ID="${sampleKeyId}"\n$env:HEYUKA_BASE_URL="${API_BASE}"`
        : `# .env (Never commit real secret keys to Git)\nHEYUKA_API_KEY=${sampleKey}\nHEYUKA_KEY_ID=${sampleKeyId}\nHEYUKA_BASE_URL=${API_BASE}`;

    const integrateCode =
      target === "python"
        ? `import os\nfrom openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ.get("HEYUKA_API_KEY", "${sampleKey}"),\n    base_url="${API_BASE}",\n    default_headers={"X-API-Key-Id": os.environ.get("HEYUKA_KEY_ID", "${sampleKeyId}")},\n)\n\nresponse = client.chat.completions.create(\n    model="heyuka-omni",\n    messages=[\n        {"role": "system", "content": "You are HEYUKA by KASPI."},\n        {"role": "user", "content": "Analyze today's market outlook and summarize cleanly."},\n    ],\n)\nprint(response.choices[0].message.content)`
        : target === "curl"
        ? `curl -X POST "${API_BASE}/chat/completions" \\\n  -H "Authorization: Bearer ${sampleKey}" \\\n  -H "X-API-Key-Id: ${sampleKeyId}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "heyuka-omni",\n    "messages": [\n      { "role": "user", "content": "Hello HEYUKA, confirm system readiness." }\n    ]\n  }'`
        : `import OpenAI from "openai";\n\nconst heyuka = new OpenAI({\n  apiKey: process.env.HEYUKA_API_KEY || "${sampleKey}",\n  baseURL: "${API_BASE}",\n  defaultHeaders: {\n    "X-API-Key-Id": process.env.HEYUKA_KEY_ID || "${sampleKeyId}",\n  },\n});\n\nconst completion = await heyuka.chat.completions.create({\n  model: "heyuka-omni",\n  messages: [\n    { role: "user", content: "Design a multilingual launch checklist for my brand." },\n  ],\n});\nconsole.log(completion.choices[0].message.content);`;

    const verifyCmd = `curl -s "${API_BASE}/debug" \\\n  -H "Authorization: Bearer ${sampleKey}" \\\n  -H "X-API-Key-Id: ${sampleKeyId}"`;

    return { installCmd, envSnippet, integrateCode, verifyCmd };
  }, [target, sampleKey, sampleKeyId]);

  const runLivePing = async () => {
    setPingBusy(true);
    const t0 = performance.now();
    try {
      const headers: Record<string, string> = {};
      if (activeSecretKey) headers.Authorization = `Bearer ${activeSecretKey}`;
      if (activeKeyId) headers["X-API-Key-Id"] = activeKeyId;
      const pingUrl = activeSecretKey ? "/api/v1/debug" : "/api/v1/models";
      const res = await fetch(pingUrl, { headers, cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      const ms = Math.round(performance.now() - t0);
      setPingResult(`HTTP ${res.status} (${ms} ms)\n${JSON.stringify(json, null, 2)}`);
    } catch (err: any) {
      setPingResult(`Network Error: ${err?.message || "Failed"}`);
    } finally {
      setPingBusy(false);
    }
  };

  const renderCodeBlock = (id: string, title: string, code: string) => (
    <div className="rounded-2xl kaspi-frosted-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--kaspi-border)]">
        <span className="text-[11px] font-mono text-[var(--kaspi-text-secondary)]">{title}</span>
        <button
          type="button"
          onClick={() => void copyText(id, code)}
          className="kaspi-glass-btn rounded-lg px-3 py-1 text-[11px] font-bold inline-flex items-center gap-1.5 text-rose-500 cursor-pointer"
        >
          {copiedId === id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedId === id ? t.copied : t.copy}</span>
        </button>
      </div>
      <pre
        dir="ltr"
        className="p-4 text-[11px] sm:text-xs font-mono text-[var(--kaspi-text-primary)] overflow-x-auto leading-relaxed whitespace-pre-wrap"
      >
        {code}
      </pre>
    </div>
  );

  const showStage = (idx: number) => viewAllStages || activeStage === idx;

  return (
    <KaspiGlassModalPortal isOpen={isOpen} onClose={onClose} dir={isAr ? "rtl" : "ltr"}>
      <div className="w-full max-w-5xl rounded-3xl kaspi-opaque-glass-modal kaspi-polar-aurora-orbit relative overflow-hidden text-[var(--kaspi-text-primary)]">
        {/* Top Branded Header */}
        <div className="px-6 py-5 border-b border-[var(--kaspi-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl kaspi-glass-surface flex items-center justify-center shrink-0">
              <img src="/logo-mark.png" alt="HEYUKA" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-500">
                <Sparkles className="w-3 h-3" />
                <span>{t.badge}</span>
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-[var(--kaspi-text-primary)] mt-0.5">{t.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setViewAllStages((v) => !v)}
              className="kaspi-glass-btn rounded-xl px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-rose-500" />
              <span>{viewAllStages ? t.stepperBtn : t.showAllBtn}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className="kaspi-glass-btn w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[78vh] overflow-y-auto kaspi-no-scrollbar space-y-6">
          <p className="text-xs sm:text-sm text-[var(--kaspi-text-secondary)] leading-relaxed">{t.subtitle}</p>

          {/* OS & Runtime Selector Pills */}
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "windows", label: "Windows (.exe / .bat)", icon: Monitor },
                { id: "macos", label: "macOS (Universal DMG)", icon: Monitor },
                { id: "linux", label: "Linux (AppImage)", icon: Terminal },
                { id: "node", label: "Node.js / TypeScript", icon: Code2 },
                { id: "python", label: "Python (OpenAI SDK)", icon: Code2 },
                { id: "curl", label: "REST / cURL", icon: Terminal },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTarget(opt.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    target === opt.id
                      ? "kaspi-orbit-active text-rose-500"
                      : "kaspi-glass-surface text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Stage Stepper Bar */}
          {!viewAllStages && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {t.stages.map((st, idx) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setActiveStage(idx)}
                  className={`p-3 rounded-2xl text-start transition-all cursor-pointer ${
                    activeStage === idx
                      ? "kaspi-orbit-active text-[var(--kaspi-text-primary)] font-bold"
                      : "kaspi-frosted-surface text-[var(--kaspi-text-secondary)]"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>{st.short}</span>
                    {activeStage > idx && <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Stage 1: Download & Install */}
          {showStage(0) && (
            <div className="p-5 rounded-2xl kaspi-glass-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-[var(--kaspi-text-primary)] flex items-center gap-2">
                    <Download className="w-4 h-4 text-rose-500" />
                    <span>{t.stages[0].full}</span>
                  </h3>
                  <p className="text-xs text-[var(--kaspi-text-secondary)] mt-1">
                    {isAr
                      ? "اختر الحزمة المناسبة لنظامك. يشمل المثبت الرسمي البيئة ثلاثية الأبعاد والاتصال السحابي السريع لـ HEYUKA."
                      : locale === "fr"
                      ? "Téléchargez l'installeur officiel adapté à votre système ou installez le SDK compatible OpenAI."
                      : "Download the verified HEYUKA package for your OS or add the OpenAI-compatible SDK to your project."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {target === "windows" && (
                    <>
                      <a
                        href="/api/v1/heyuka/installer?platform=desktop_zip"
                        download="HEYUKA-Desktop-App.zip"
                        className="kaspi-primary-cta-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isAr ? "تحميل تطبيق HEYUKA الكامل (.zip)" : "Download Full Desktop App (.zip)"}</span>
                      </a>
                      <a
                        href="/api/v1/heyuka/installer?platform=windows"
                        className="kaspi-glass-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>{isAr ? "المشغّل السريع (.bat)" : "Quick Launcher (.bat)"}</span>
                      </a>
                      <a
                        href="/download/exe"
                        className="kaspi-glass-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>CI Binary (.exe)</span>
                      </a>
                    </>
                  )}
                  {target === "macos" && (
                    <>
                      <a
                        href="/api/v1/heyuka/installer?platform=desktop_zip"
                        download="HEYUKA-Desktop-App.zip"
                        className="kaspi-primary-cta-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isAr ? "حزمة HEYUKA الكاملة (macOS .zip)" : "Full App Bundle (.zip)"}</span>
                      </a>
                      <a
                        href="/api/v1/heyuka/installer?platform=macos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="kaspi-glass-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>macOS CI Spec (.dmg)</span>
                      </a>
                    </>
                  )}
                  {target === "linux" && (
                    <>
                      <a
                        href="/api/v1/heyuka/installer?platform=desktop_zip"
                        download="HEYUKA-Desktop-App.zip"
                        className="kaspi-primary-cta-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isAr ? "حزمة HEYUKA الكاملة (Linux .zip)" : "Full App Bundle (.zip)"}</span>
                      </a>
                      <a
                        href="/api/v1/heyuka/installer?platform=linux"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="kaspi-glass-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Linux CI Spec (AppImage)</span>
                      </a>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl kaspi-frosted-surface">
                  <p className="font-bold text-rose-500">
                    {isAr ? "1.1 التحميل الرسمي" : "1.1 Verified Package"}
                  </p>
                  <p className="text-[var(--kaspi-text-secondary)] mt-1">
                    {isAr
                      ? "تشغيل سريع بدون تعقيد مع دعم التسريع الرسومي WebGL2."
                      : "Signed multi-platform launcher with WebGL2 acceleration."}
                  </p>
                </div>
                <div className="p-3 rounded-xl kaspi-frosted-surface">
                  <p className="font-bold text-rose-500">
                    {isAr ? "1.2 تهيئة الخصوصية" : "1.2 Isolated Tenant Vault"}
                  </p>
                  <p className="text-[var(--kaspi-text-secondary)] mt-1">
                    {isAr
                      ? "عزل تام لبياناتك وتشفير المفاتيح من طرف KASPI."
                      : "Tenant-isolated workspaces and hashed API credentials."}
                  </p>
                </div>
                <div className="p-3 rounded-xl kaspi-frosted-surface">
                  <p className="font-bold text-rose-500">
                    {isAr ? "1.3 توافق قياسي" : "1.3 Standard OpenAI API"}
                  </p>
                  <p className="text-[var(--kaspi-text-secondary)] mt-1">
                    {isAr
                      ? "يعمل مع مكتبات OpenAI الرسمية في بايثون ونود جي إس مباشرة."
                      : "Drop-in compatible with official OpenAI Python & JS SDKs."}
                  </p>
                </div>
              </div>

              {renderCodeBlock("stage1-cmd", "Terminal / PowerShell Install Command", snippets.installCmd)}
            </div>
          )}

          {/* Stage 2: Unique Key ID + Secret Key */}
          {showStage(1) && (
            <div className="p-5 rounded-2xl kaspi-glass-card space-y-4">
              <h3 className="text-base font-extrabold text-[var(--kaspi-text-primary)] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-rose-500" />
                <span>{t.stages[1].full}</span>
              </h3>
              <p className="text-xs text-[var(--kaspi-text-secondary)] leading-relaxed">
                {isAr
                  ? "تماماً مثل منصات الذكاء الاصطناعي الكبرى، كل مفتاح تُنشئه يكون فريداً ومشفراً بـ SHA-256، ويقترن بمعرف Key ID قابل للتحقق عبر ترويسة X-API-Key-Id. لا تشارك المفتاح السري في الواجهة الأمامية أو Git."
                  : locale === "fr"
                  ? "Chaque clé générée est cryptographiquement unique (hk-live-...) et associée à un Key ID vérifiable (hk_...). Stockez vos clés uniquement dans des variables d'environnement serveur."
                  : "Every key you create is cryptographically distinct (hk-live-...) and paired with a verifiable Key ID (hk_...). Store secret keys in environment variables — never expose them in client bundles."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl kaspi-frosted-surface space-y-1">
                  <span className="font-mono font-bold text-rose-500">Authorization: Bearer hk-live-...</span>
                  <p className="text-[var(--kaspi-text-secondary)]">
                    {isAr
                      ? "المفتاح السري الحقيقي للمصادقة — يُعرض مرة واحدة فقط عند الإنشاء."
                      : "Primary bearer secret key — displayed once upon creation and stored only as SHA-256 hash."}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl kaspi-frosted-surface space-y-1">
                  <span className="font-mono font-bold text-amber-500">X-API-Key-Id: hk_...</span>
                  <p className="text-[var(--kaspi-text-secondary)]">
                    {isAr
                      ? "معرف المفتاح العام لتتبّع الاستخدام، تدوير المفاتيح، وتشديد التحقق."
                      : "Public verifiable Key ID for usage telemetry, audit matching, and instant key revocation."}
                  </p>
                </div>
              </div>

              {renderCodeBlock("stage2-env", ".env / Environment Credentials", snippets.envSnippet)}
            </div>
          )}

          {/* Stage 3: Integration Code */}
          {showStage(2) && (
            <div className="p-5 rounded-2xl kaspi-glass-card space-y-4">
              <h3 className="text-base font-extrabold text-[var(--kaspi-text-primary)] flex items-center gap-2">
                <Code2 className="w-4 h-4 text-rose-500" />
                <span>{t.stages[2].full}</span>
              </h3>
              <p className="text-xs text-[var(--kaspi-text-secondary)] leading-relaxed">
                {isAr
                  ? "استعمل نقطة النهاية الرسمية لـ HEYUKA مع نموذج heyuka-omni أو heyuka-core أو heyuka-vision للربط المباشر في تطبيقاتك، بوتاتك، أو تطبيق سطح المكتب."
                  : locale === "fr"
                  ? "Pointez votre client OpenAI ou vos appels HTTP vers le gateway officiel HEYUKA avec les modèles heyuka-omni, heyuka-core ou heyuka-vision."
                  : "Configure the official HEYUKA API base URL with heyuka-omni, heyuka-core, or heyuka-vision inside your backend or desktop app."}
              </p>

              {renderCodeBlock(
                "stage3-code",
                target === "python" ? "heyuka_quickstart.py" : target === "curl" ? "curl_request.sh" : "heyuka_quickstart.ts",
                snippets.integrateCode
              )}
            </div>
          )}

          {/* Stage 4: Live Verification */}
          {showStage(3) && (
            <div className="p-5 rounded-2xl kaspi-glass-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-[var(--kaspi-text-primary)] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-500" />
                    <span>{t.stages[3].full}</span>
                  </h3>
                  <p className="text-xs text-[var(--kaspi-text-secondary)] mt-1">
                    {isAr
                      ? "تحقق من استجابة البوابة الرسمية (/api/v1/debug) قبل النشر للتأكد من جهوزية الموديلات والربط."
                      : "Verify gateway reachability and confirm your Key ID + Secret Token pair cleanly."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void runLivePing()}
                  disabled={pingBusy}
                  className="kaspi-primary-cta-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{pingBusy ? t.testing : t.testNow}</span>
                </button>
              </div>

              {renderCodeBlock("stage4-verify", "Verification Health Ping", snippets.verifyCmd)}

              {pingResult && (
                <pre
                  dir="ltr"
                  className="p-4 rounded-2xl kaspi-frosted-surface font-mono text-[11px] text-[var(--kaspi-text-primary)] max-h-52 overflow-auto whitespace-pre-wrap"
                >
                  {pingResult}
                </pre>
              )}
            </div>
          )}

          {/* Bottom Next Stage Navigation when in Stepper Mode */}
          {!viewAllStages && activeStage < 3 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveStage((s) => Math.min(3, s + 1))}
                className="kaspi-primary-cta-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer"
              >
                <span>{t.stages[activeStage + 1].short}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </KaspiGlassModalPortal>
  );
};

export default HEYUKAInstallWalkthrough;
