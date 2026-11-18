"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Sparkles,
  Check,
  Code2,
  Eye,
  ExternalLink,
  Layers,
  ShoppingBag,
  MessageCircle,
  Loader2,
  Copy,
  Swords,
  Globe,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { usePosStore } from "@/client/store/usePosStore";
import { getApiUrl } from "@/client/sync-engine";
import {
  aggregateMerchantStoreContext,
  buildArenaStoreSystemPrompt,
  getArenaWhiteLabelInjectionScript,
  type AggregatedStoreContext,
} from "@/lib/ai/store-context-builder";
import {
  savePuckStorefront,
  loadArenaLeaderboard,
  recordArenaBattleVote,
  type PuckStorefrontData,
  type ArenaModelStats,
} from "@/lib/open-source-engines";

interface ArenaCandidateResult {
  modelId: string;
  modelName: string;
  pitchSummary: string;
  puckData: PuckStorefrontData;
}

export const KaspiArenaBuilder: React.FC<{
  locale?: string;
  onLog?: (msg: string) => void;
  onApplyToPuck?: (data: PuckStorefrontData) => void;
}> = ({ locale = "ar", onLog, onApplyToPuck }) => {
  const { tenantInfo, storeType } = usePosStore();
  const [subMode, setSubMode] = useState<"battle" | "leaderboard" | "webview">("battle");

  const [storeCtx, setStoreCtx] = useState<AggregatedStoreContext | null>(null);
  const [hiddenPrompt, setHiddenPrompt] = useState<string>("");
  const [showHiddenPrompt, setShowHiddenPrompt] = useState(false);

  const [customGoal, setCustomGoal] = useState(
    "صمم متجراً إلكترونياً احترافياً بهوية Dark Gray & Emerald Green يعرض منتجاتي بالدرهم المغربي مع طلب فوري عبر واتساب"
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [candidateA, setCandidateA] = useState<ArenaCandidateResult | null>(null);
  const [candidateB, setCandidateB] = useState<ArenaCandidateResult | null>(null);
  const [inspectJsonSide, setInspectJsonSide] = useState<"none" | "A" | "B">("none");
  const [votedOutcome, setVotedOutcome] = useState<"model_a" | "model_b" | "tie" | null>(null);
  const [leaderboard, setLeaderboard] = useState<ArenaModelStats[]>([]);

  // 1. Load & Aggregate Merchant Store Context on Mount
  const refreshStoreContext = async () => {
    const ctx = await aggregateMerchantStoreContext({
      shopName: tenantInfo?.shopName || "ASIMA",
      sector: storeType || "grocery",
      phone: tenantInfo?.phone || "+212600000000",
      city: tenantInfo?.city || "الدار البيضاء • المغرب",
      ice: tenantInfo?.ice || "003291823000045",
    });
    setStoreCtx(ctx);
    const sysPrompt = buildArenaStoreSystemPrompt(ctx, customGoal);
    setHiddenPrompt(sysPrompt);
    onLog?.(
      `[Store Context Aggregator] ✔ تم تجميع سياق المتجر تلقائياً: ${ctx.storeName} (${ctx.products.length} سلعة، العملة ${ctx.currency}، ${ctx.categories.length} تصنيفات)`
    );
    return { ctx, sysPrompt };
  };

  useEffect(() => {
    setLeaderboard(loadArenaLeaderboard());
    refreshStoreContext().then(({ ctx, sysPrompt }) => {
      handleRunArenaBattle(ctx, sysPrompt);
    });
  }, [tenantInfo?.shopName, storeType]);

  // 2. Execute Dual-Model Arena Battle
  const handleRunArenaBattle = async (
    overrideCtx?: AggregatedStoreContext,
    overrideSysPrompt?: string
  ) => {
    setIsGenerating(true);
    setVotedOutcome(null);
    const activeCtx = overrideCtx || storeCtx || (await refreshStoreContext()).ctx;
    const activeSys = overrideSysPrompt || buildArenaStoreSystemPrompt(activeCtx, customGoal);
    setHiddenPrompt(activeSys);

    onLog?.(
      `[Arena AI Battle] بدء المقارنة المزدوجة (Side-by-Side) لتوليد مخطط Puck JSON لمتجر ${activeCtx.storeName}...`
    );

    try {
      const res = await fetch(getApiUrl("/api/ai/studio"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "arena_battle",
          storeContext: activeCtx,
          customGoal,
          hiddenSystemPrompt: activeSys,
        }),
      });
      const data = await res.json();
      if (data?.candidateA && data?.candidateB) {
        setCandidateA(data.candidateA);
        setCandidateB(data.candidateB);
        onLog?.(
          `[Arena AI Battle] ✔ اكتمل توليد التصميمين (Model A vs Model B) في ${data.latencyMs}ms بصيغة Puck JSON.`
        );
      }
    } catch {
      toast.error("حدث خطأ أثناء الاتصال بمحرك Arena AI");
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Apply chosen Arena design directly to Puck Builder ("Apply to Puck")
  const handleApplyToPuck = (candidate: ArenaCandidateResult, sideLabel: "A" | "B") => {
    const saved = savePuckStorefront(candidate.puckData);
    onLog?.(
      `[Arena -> Apply to Puck] ✔ تم تطبيق تصميم النموذج ${sideLabel} (${candidate.modelName}) مباشرة في محرر Puck وحفظ المسار /${locale}/store/${saved.slug}`
    );
    toast.success(`تم تطبيق تصميم (${candidate.modelName}) على متجرك فوراً! جاري فتح محرر Puck...`);
    if (onApplyToPuck) {
      onApplyToPuck(saved);
    }
  };

  // 4. Vote in Arena & Update Elo Rating
  const handleVote = (outcome: "model_a" | "model_b" | "tie") => {
    if (!candidateA || !candidateB) return;
    setVotedOutcome(outcome);
    const updatedBoard = recordArenaBattleVote(candidateA.modelId, candidateB.modelId, outcome);
    setLeaderboard(updatedBoard);
    onLog?.(
      `[arena-hard-auto Elo] ✔ تم تسجيل التصويت (${outcome.toUpperCase()}) وتحديث ترتيب النماذج بنجاح.`
    );
    toast.success("تم تسجيل تقييمك في Arena AI وتحديث نقاط الـ Elo!");
  };

  const renderStorePreviewCard = (candidate: ArenaCandidateResult, side: "A" | "B") => {
    const p = candidate.puckData;
    const prods = storeCtx?.products?.slice(0, 4) || [];
    const showJson = inspectJsonSide === side;

    return (
      <div className="rounded-2xl bg-[#181a1f] border border-white/15 p-3.5 flex flex-col justify-between gap-3 shadow-xl">
        {/* Candidate Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                النموذج {side}
              </span>
              <h5 className="text-xs font-extrabold text-white truncate">{candidate.modelName}</h5>
            </div>
            <p className="text-[10px] text-zinc-400 truncate mt-0.5">{candidate.pitchSummary}</p>
          </div>

          <button
            type="button"
            onClick={() => setInspectJsonSide(showJson ? "none" : side)}
            className="px-2 py-1 rounded-lg kaspi-glass-surface border border-white/10 text-[10px] font-mono text-zinc-300 hover:text-white flex items-center gap-1 shrink-0 cursor-pointer"
          >
            {showJson ? <Eye className="w-3 h-3 text-emerald-400" /> : <Code2 className="w-3 h-3 text-emerald-400" />}
            <span>{showJson ? "المعاينة" : "Puck JSON"}</span>
          </button>
        </div>

        {/* Either Puck JSON Schema View OR Visual Storefront Preview */}
        {showJson ? (
          <pre
            className="p-3 rounded-xl bg-black/80 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-72"
            dir="ltr"
          >
            {JSON.stringify(p, null, 2)}
          </pre>
        ) : (
          <div className="rounded-2xl bg-[#121418] border border-white/10 p-3 space-y-3">
            {/* Hero Section */}
            <div
              className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/80 via-[#1a1d24] to-black border border-emerald-500/30 text-center space-y-1.5"
            >
              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {p.blocks.find((b) => b.type === "HeroBanner")?.props?.badge || "متجر معتمد"}
              </span>
              <h3 className="text-sm font-black text-white">{p.storeName}</h3>
              <p className="text-[10px] text-zinc-300 leading-relaxed">{p.slogan}</p>
            </div>

            {/* Categories Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {(storeCtx?.categories || ["الكل", "الأكثر مبيعاً", "عروض الباك"]).slice(0, 4).map((c, i) => (
                <span
                  key={i}
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${
                    i === 0 ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {c}
                </span>
              ))}
            </div>

            {/* Live Merchant Products Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {(prods.length > 0
                ? prods
                : [
                    { id: "1", name: "سلعة المتجر الممتازة 1", priceMAD: 120, stockQuantity: 15 },
                    { id: "2", name: "سلعة المتجر الممتازة 2", priceMAD: 45, stockQuantity: 24 },
                  ]
              )
                .slice(0, 4)
                .map((item: any) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-xl bg-[#1e1e1e] border border-white/10 flex flex-col justify-between gap-1"
                  >
                    <p className="text-[10px] font-bold text-white truncate">{item.name}</p>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-emerald-400 font-black font-mono">
                        {Number(item.priceMAD || 0).toFixed(2)} MAD
                      </span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        + سلة
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            {/* WhatsApp CTA Bar */}
            <div className="p-2 rounded-xl bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>
                  {p.blocks.find((b) => b.type === "WhatsAppCheckout")?.props?.buttonText ||
                    "طلب مباشر عبر واتساب"}
                </span>
              </div>
              <span className="text-[9px] font-mono bg-black/25 px-1.5 py-0.5 rounded">MAD</span>
            </div>
          </div>
        )}

        {/* Primary CTA: Apply to Puck Immediately */}
        <button
          type="button"
          onClick={() => handleApplyToPuck(candidate, side)}
          className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
        >
          <Sparkles className="w-4 h-4 stroke-[2.5]" />
          <span>تطبيق التصميم على المتجر فوراً (Apply to Puck)</span>
        </button>
      </div>
    );
  };

  const injectionPayload = getArenaWhiteLabelInjectionScript(hiddenPrompt);

  return (
    <div className="space-y-4 text-start">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Swords className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white">
              منصة التقييم وبناء المواقع (Kaspi Arena AI • Side-by-Side Storefront Generator)
            </h4>
            <p className="text-[11px] text-zinc-400">
              github.com/lm-sys/FastChat + arena-hard-auto + Puck • توليد متجر إلكتروني مخصص لسلعك بضغطة زر
            </p>
          </div>
        </div>

        {/* Sub-mode tabs */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl kaspi-glass-surface border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setSubMode("battle")}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer ${
              subMode === "battle" ? "kaspi-glass-btn text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-emerald-400" />
            <span>مقارنة وتوليد المتجر</span>
          </button>
          <button
            type="button"
            onClick={() => setSubMode("leaderboard")}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer ${
              subMode === "leaderboard" ? "kaspi-glass-btn text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
            <span>ترتيب Elo ({leaderboard.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubMode("webview")}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer ${
              subMode === "webview" ? "kaspi-glass-btn text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>حقن سياق Arena</span>
          </button>
        </div>
      </div>

      {/* Auto-Aggregated Store Context Strip */}
      {storeCtx && (
        <div className="p-3 rounded-2xl bg-[#1e1e1e] border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white">
                سياق المتجر المحقون تلقائياً ({storeCtx.storeName}):
              </span>
              <span className="text-zinc-300 font-mono text-[11px]">
                {storeCtx.products.length} سلعة نشطة • العملة {storeCtx.currency} • {storeCtx.categories.length} تصنيفات
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowHiddenPrompt(!showHiddenPrompt)}
                className="px-2.5 py-1 rounded-lg kaspi-glass-surface border border-white/10 text-[11px] text-emerald-400 hover:underline cursor-pointer"
              >
                {showHiddenPrompt ? "إخفاء الـ System Prompt" : "معاينة الـ System Prompt المخفي"}
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(hiddenPrompt);
                  toast.success("تم نسخ سياق المتجر الكامل (Store Context Prompt)!");
                }}
                className="px-2.5 py-1 rounded-lg kaspi-glass-surface border border-white/10 text-[11px] text-white flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3 text-emerald-400" />
                <span>نسخ السياق</span>
              </button>
            </div>
          </div>

          {showHiddenPrompt && (
            <pre className="p-3 rounded-xl bg-black/80 border border-white/10 text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-44 whitespace-pre-wrap">
              {hiddenPrompt}
            </pre>
          )}
        </div>
      )}

      {/* SUB-MODE 1: SIDE-BY-SIDE ARENA BATTLE & PUCK GENERATOR */}
      {subMode === "battle" && (
        <div className="space-y-4">
          {/* Prompt & 1-Click Generator Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="صف شكل المتجر أو العروض التي تريدها (مثلاً: متجر بقالة عصري مع عروض الباك والتوصيل المجاني)..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#1e1e1e] border border-emerald-500/35 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
            />
            <button
              type="button"
              onClick={() => handleRunArenaBattle()}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري توليد المتجر...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>توليد متجر جديد بضغطة زر</span>
                </>
              )}
            </button>
          </div>

          {/* Side-by-Side Comparison Grid */}
          {candidateA && candidateB && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderStorePreviewCard(candidateA, "A")}
                {renderStorePreviewCard(candidateB, "B")}
              </div>

              {/* Arena Voting Bar (Bradley-Terry Elo Evaluation) */}
              <div className="p-3 rounded-2xl bg-[#1e1e1e] border border-white/10 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-zinc-300">
                  🗳️ تقييم Arena الرسمي (أي تصميم أعجبك أكثر لمتجرك؟):
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleVote("model_a")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      votedOutcome === "model_a"
                        ? "bg-emerald-500 text-black border-emerald-400"
                        : "kaspi-glass-surface text-zinc-300 border-white/10 hover:text-white"
                    }`}
                  >
                    👈 النموذج A أفضل
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVote("tie")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      votedOutcome === "tie"
                        ? "bg-emerald-500 text-black border-emerald-400"
                        : "kaspi-glass-surface text-zinc-300 border-white/10 hover:text-white"
                    }`}
                  >
                    🤝 تعادل (كلاهما رائع)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVote("model_b")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      votedOutcome === "model_b"
                        ? "bg-emerald-500 text-black border-emerald-400"
                        : "kaspi-glass-surface text-zinc-300 border-white/10 hover:text-white"
                    }`}
                  >
                    👉 النموذج B أفضل
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* SUB-MODE 2: ARENA ELO LEADERBOARD (lm-sys/arena-hard-auto) */}
      {subMode === "leaderboard" && (
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#1e1e1e]">
          <table className="w-full text-xs text-start">
            <thead className="bg-black/40 text-zinc-400 text-[10px] font-mono border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3 text-start">الترتيب</th>
                <th className="py-2.5 px-3 text-start">النموذج (Arena Model)</th>
                <th className="py-2.5 px-3 text-center">نقاط Elo</th>
                <th className="py-2.5 px-3 text-center">فوز / خسارة / تعادل</th>
                <th className="py-2.5 px-3 text-end">المواجهات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {leaderboard.map((m, idx) => (
                <tr key={m.id} className="hover:bg-white/[0.03]">
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">#{idx + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-white">
                    {m.name}
                    <span className="block text-[10px] text-zinc-400 font-normal">{m.provider}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-extrabold text-emerald-400">
                    {m.elo}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-zinc-300">
                    {m.wins}W / {m.losses}L / {m.ties}T
                  </td>
                  <td className="py-2.5 px-3 text-end font-mono text-zinc-400">{m.battles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-MODE 3: WHITE-LABELED WEBVIEW / CSS & JS INJECTION */}
      {subMode === "webview" && (
        <div className="space-y-3 bg-[#1e1e1e] p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h5 className="text-xs font-bold text-white">
                كود حقن الهوية الموحدة (Dark Gray #1e1e1e & Emerald #10b981) + Store Context Injection
              </h5>
              <p className="text-[10px] text-zinc-400">
                يتم حقنه تلقائياً في نافذة WebView لسطح المكتب لتوحيد الألوان وحقن منتجات التاجر
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(injectionPayload.js);
                toast.success("تم نسخ كود الحقن التلقائي (JS/CSS Injection)!");
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>نسخ كود الحقن JS/CSS</span>
            </button>
          </div>

          <pre
            className="p-3 rounded-xl bg-black/80 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-60"
            dir="ltr"
          >
            {injectionPayload.js}
          </pre>
        </div>
      )}
    </div>
  );
};

export default KaspiArenaBuilder;
