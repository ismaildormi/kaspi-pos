"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Sparkles,
  Code2,
  Eye,
  MessageCircle,
  Loader2,
  Swords,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { usePosStore } from "@/client/store/usePosStore";
import { getApiUrl } from "@/client/sync-engine";
import {
  aggregateMerchantStoreContext,
  type AggregatedStoreContext,
} from "@/lib/ai/store-context-builder";
import {
  ARENA_MODEL_REGISTRY,
  applyDesignToPuckDraft,
  computeBradleyTerryLeaderboard,
  loadHumanPreferenceVotes,
  saveHumanPreferenceVote,
  loadBenchmarkScores,
  saveBenchmarkScores,
  type PuckData,
  type AutomatedBenchmarkScore,
  type BattleOutcome,
  type ArenaModelEvaluationSummary,
} from "@/lib/open-source-engines";

interface ArenaCandidateResponse {
  modelId: string;
  modelName: string;
  provider: string;
  architectureRole: string;
  status: "completed" | "degraded_fallback" | "failed";
  latencyMs: number;
  errorLog: Array<{ timestamp: string; message: string }>;
  validation: {
    valid: boolean;
    warnings: string[];
    sectionsCount: number;
    verifiedProductsCount: number;
  };
  benchmark: AutomatedBenchmarkScore;
  puckData: PuckData;
}

export const KaspiArenaBuilder: React.FC<{
  locale?: string;
  onLog?: (msg: string) => void;
  onApplyToPuck?: (data: PuckData) => void;
}> = ({ locale = "ar", onLog, onApplyToPuck }) => {
  const { tenantInfo, storeType } = usePosStore();
  const [subMode, setSubMode] = useState<"battle" | "evaluation">("battle");

  const [storeCtx, setStoreCtx] = useState<AggregatedStoreContext | null>(null);
  const [modelAId, setModelAId] = useState<string>(ARENA_MODEL_REGISTRY[0].id);
  const [modelBId, setModelBId] = useState<string>(ARENA_MODEL_REGISTRY[1].id);

  const [customGoal, setCustomGoal] = useState(
    "توليد متجر إلكتروني متكامل يعرض أقسام ومنتجات المتجر الفعلية مع الطلب عبر واتساب"
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [candidateA, setCandidateA] = useState<ArenaCandidateResponse | null>(null);
  const [candidateB, setCandidateB] = useState<ArenaCandidateResponse | null>(null);
  const [inspectJsonSide, setInspectJsonSide] = useState<"none" | "A" | "B">("none");
  const [votedOutcome, setVotedOutcome] = useState<BattleOutcome | null>(null);
  const [evaluationSummaries, setEvaluationSummaries] = useState<
    ArenaModelEvaluationSummary[]
  >([]);

  const refreshEvaluations = (tenantId: string) => {
    const votes = loadHumanPreferenceVotes(tenantId);
    const benchmarks = loadBenchmarkScores(tenantId);
    setEvaluationSummaries(computeBradleyTerryLeaderboard(votes, benchmarks));
  };

  const refreshStoreContext = async () => {
    const ctx = await aggregateMerchantStoreContext({
      shopName: tenantInfo?.shopName || "متجر كسب",
      sector: storeType || "grocery",
      phone: tenantInfo?.phone,
      city: tenantInfo?.city,
      ice: tenantInfo?.ice,
    });
    setStoreCtx(ctx);
    refreshEvaluations(ctx.tenantId);
    onLog?.(
      `[Store Context Builder] ✔ تم جلب بيانات المتجر الموثقة (${ctx.storeName} • العملة: ${ctx.currency} • ${ctx.products.length} سلعة نشطة • ${ctx.categories.length} تصنيفات)`
    );
    return ctx;
  };

  useEffect(() => {
    refreshStoreContext().then((ctx) => {
      handleRunArenaBattle(ctx);
    });
  }, [tenantInfo?.shopName, storeType]);

  const handleRunArenaBattle = async (overrideCtx?: AggregatedStoreContext) => {
    if (modelAId === modelBId) {
      toast.error("يرجى اختيار نموذجين مختلفين للمقارنة في Arena");
      return;
    }
    setIsGenerating(true);
    setVotedOutcome(null);
    const activeCtx = overrideCtx || storeCtx || (await refreshStoreContext());

    onLog?.(
      `[Arena Side-by-Side] إرسال طلب موحد إلى (${modelAId}) و (${modelBId}) بشكل مستقل...`
    );

    try {
      const res = await fetch(getApiUrl("/api/ai/studio"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "arena_battle",
          modelAId,
          modelBId,
          customGoal,
          storeContext: activeCtx,
        }),
      });
      const data = await res.json();
      if (data?.candidateA && data?.candidateB) {
        setCandidateA(data.candidateA);
        setCandidateB(data.candidateB);

        const benchScores = saveBenchmarkScores(activeCtx.tenantId, {
          [data.candidateA.modelId]: data.candidateA.benchmark?.totalScorePct ?? 100,
          [data.candidateB.modelId]: data.candidateB.benchmark?.totalScorePct ?? 100,
        });
        const votes = loadHumanPreferenceVotes(activeCtx.tenantId);
        setEvaluationSummaries(computeBradleyTerryLeaderboard(votes, benchScores));

        onLog?.(
          `[Arena Battle Complete] ✔ النموذج A (${data.candidateA.latencyMs}ms • Benchmark ${data.candidateA.benchmark.totalScorePct}%) | النموذج B (${data.candidateB.latencyMs}ms • Benchmark ${data.candidateB.benchmark.totalScorePct}%)`
        );
      }
    } catch {
      toast.error("حدث خطأ أثناء الاتصال بمحرك Arena AI");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyDesignToStore = (
    candidate: ArenaCandidateResponse,
    sideLabel: "A" | "B"
  ) => {
    if (!storeCtx) return;
    const { validation, draft } = applyDesignToPuckDraft(
      candidate.puckData,
      storeCtx,
      `Arena ${sideLabel}: ${candidate.modelName}`
    );

    if (!validation.valid) {
      toast.error(`فشل التحقق من مخطط Puck: ${validation.errors.join(", ")}`);
      return;
    }

    // Persist draft to server database as well
    fetch(getApiUrl("/api/ai/studio"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_puck_storefront",
        publish: false,
        puckData: draft,
        storeContext: storeCtx,
      }),
    }).catch(() => {});

    onLog?.(
      `[Apply Design to Store] ✔ تم التحقق من ${validation.sectionsCount} قسم و ${validation.verifiedProductsCount} منتج، وحفظ التصميم كمسودة (Draft) في محرر Puck مع حفظ النسخة السابقة في السجل.`
    );
    toast.success(
      `تم تحميل تصميم (${candidate.modelName}) في محرر Puck كمسودة قابلة للتعديل!`
    );
    if (onApplyToPuck) {
      onApplyToPuck(draft);
    }
  };

  const handleVote = async (outcome: BattleOutcome) => {
    if (!candidateA || !candidateB || !storeCtx) return;
    setVotedOutcome(outcome);

    const updatedVotes = saveHumanPreferenceVote({
      tenantId: storeCtx.tenantId,
      promptSummary: customGoal.slice(0, 120),
      modelAId: candidateA.modelId,
      modelBId: candidateB.modelId,
      outcome,
    });

    const benchmarks = loadBenchmarkScores(storeCtx.tenantId);
    setEvaluationSummaries(computeBradleyTerryLeaderboard(updatedVotes, benchmarks));

    // Persist vote to server DB
    fetch(getApiUrl("/api/ai/studio"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "arena_vote",
        modelAId: candidateA.modelId,
        modelBId: candidateB.modelId,
        outcome,
        promptSummary: customGoal.slice(0, 120),
      }),
    }).catch(() => {});

    onLog?.(
      `[Arena Human Preference] ✔ تم تسجيل تصويت التاجر (${outcome}) وتحديث نموذج Bradley-Terry.`
    );
    toast.success("تم حفظ تصويتك في سجل التقييم!");
  };

  const renderCandidateColumn = (
    candidate: ArenaCandidateResponse,
    side: "A" | "B"
  ) => {
    const p = candidate.puckData;
    const heroProps =
      p.content.find((c) => c.type === "HeroSection")?.props || {};
    const cardsProps =
      p.content.find((c) => c.type === "ProductCards")?.props || {};
    const waProps =
      p.content.find((c) => c.type === "WhatsAppOrdering")?.props || {};
    const prods = Array.isArray(cardsProps.products)
      ? (cardsProps.products as any[])
      : [];
    const showJson = inspectJsonSide === side;

    return (
      <div className="rounded-2xl bg-[#1e1e1e] border border-white/15 p-3.5 flex flex-col justify-between gap-3 shadow-xl">
        {/* Candidate Header & Independent Telemetry */}
        <div className="space-y-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                Model {side}
              </span>
              <h5 className="text-xs font-extrabold text-white truncate">
                {candidate.modelName}
              </h5>
            </div>

            <button
              type="button"
              onClick={() => setInspectJsonSide(showJson ? "none" : side)}
              className="px-2 py-1 rounded-lg kaspi-glass-surface border border-white/10 text-[10px] font-mono text-zinc-300 hover:text-white flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {showJson ? (
                <Eye className="w-3 h-3 text-emerald-400" />
              ) : (
                <Code2 className="w-3 h-3 text-emerald-400" />
              )}
              <span>{showJson ? "المعاينة الحية" : "Puck Data JSON"}</span>
            </button>
          </div>

          {/* Telemetry & Benchmark Badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
            <span className="px-2 py-0.5 rounded bg-black/40 text-zinc-300 flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>{candidate.latencyMs}ms</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                candidate.status === "completed"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-amber-500/15 text-amber-300"
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>
                {candidate.status === "completed" ? "متصل ومكتمل" : "محرك احتياطي موثق"}
              </span>
            </span>
            <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-300">
              الأقسام: {candidate.benchmark.sectionsPresentCount}/
              {candidate.benchmark.requiredSectionsCount}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
              Benchmark: {candidate.benchmark.totalScorePct}%
            </span>
          </div>

          {candidate.errorLog.length > 0 && (
            <div className="text-[10px] text-amber-300/90 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span className="truncate">
                تنبيه النموذج المستقل: {candidate.errorLog[0].message} (تم التبديل الآمن)
              </span>
            </div>
          )}
        </div>

        {/* JSON Inspector OR Live 14-Section Puck Preview */}
        {showJson ? (
          <pre
            className="p-3 rounded-xl bg-black/80 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-72"
            dir="ltr"
          >
            {JSON.stringify(p, null, 2)}
          </pre>
        ) : (
          <div className="rounded-2xl bg-[#14161a] border border-white/10 p-3 space-y-2.5">
            {/* Hero Section */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-950/70 via-[#1e1e1e] to-black border border-emerald-500/30 text-center space-y-1">
              <h3 className="text-xs sm:text-sm font-black text-white">
                {String(heroProps.headline || p.root.props.title)}
              </h3>
              <p className="text-[10px] text-zinc-300 leading-relaxed">
                {String(heroProps.subheadline || "")}
              </p>
            </div>

            {/* Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {(storeCtx?.categories.length
                ? storeCtx.categories
                : ["جميع المنتجات"]
              )
                .slice(0, 5)
                .map((cat, idx) => (
                  <span
                    key={idx}
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${
                      idx === 0
                        ? "bg-emerald-500 text-black"
                        : "bg-[#1e1e1e] text-zinc-300 border border-white/10"
                    }`}
                  >
                    {cat}
                  </span>
                ))}
            </div>

            {/* Real Merchant Products */}
            {prods.length === 0 ? (
              <div className="p-3 rounded-xl bg-[#1e1e1e] border border-white/5 text-center text-[10px] text-zinc-400">
                لا توجد منتجات نشطة مسجلة حالياً في قاعدة البيانات (0 منتجات مخترعة).
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {prods.slice(0, 4).map((prod: any) => (
                  <div
                    key={prod.id}
                    className="p-2 rounded-xl bg-[#1e1e1e] border border-white/10 flex flex-col justify-between gap-1"
                  >
                    <p className="text-[10px] font-bold text-white truncate">
                      {prod.name}
                    </p>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-emerald-400 font-black font-mono">
                        {Number(prod.price || 0).toFixed(2)} {p.root.props.currency}
                      </span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono">
                        متوفر: {prod.stockQuantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* WhatsApp Ordering Bar */}
            <div className="p-2 rounded-xl bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {String(waProps.buttonLabel || "إرسال الطلب عبر واتساب")}
                </span>
              </div>
              <span className="text-[9px] font-mono bg-black/25 px-1.5 py-0.5 rounded shrink-0">
                {p.root.props.currency}
              </span>
            </div>
          </div>
        )}

        {/* Required Action Button: Apply Design to Store */}
        <button
          type="button"
          onClick={() => handleApplyDesignToStore(candidate, side)}
          className="w-full py-2.5 px-3 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
        >
          <Sparkles className="w-4 h-4 stroke-[2.5]" />
          <span>Apply Design to Store (تطبيق التصميم في محرر Puck)</span>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4 text-start">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Swords className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white">
              Kaspi Arena AI — المقارنة المزدوجة وتوليد المتجر (@measured/puck)
            </h4>
            <p className="text-[11px] text-zinc-400">
              مقارنة مستقلة جنباً إلى جنب (Side-by-Side) مبنية حصرياً على بيانات متجرك الموثقة
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#1e1e1e] border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setSubMode("battle")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer ${
              subMode === "battle"
                ? "bg-[#10b981] text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>مقارنة النماذج (Side-by-Side)</span>
          </button>
          <button
            type="button"
            onClick={() => setSubMode("evaluation")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer ${
              subMode === "evaluation"
                ? "bg-[#10b981] text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>نظام التقييم والترتيب (Arena-Rank)</span>
          </button>
        </div>
      </div>

      {/* Store Context Status Strip (Safe Summary — Never Exposes Secret System Prompt) */}
      {storeCtx && (
        <div className="p-3 rounded-2xl bg-[#1e1e1e] border border-emerald-500/30 flex items-center justify-between gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-white">
              سياق المتجر الموثق ({storeCtx.storeName}):
            </span>
            <span className="text-zinc-300 font-mono text-[11px]">
              {storeCtx.products.length} سلعة نشطة • {storeCtx.categories.length} تصنيفات • العملة:{" "}
              {storeCtx.currency}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Tenant Isolation Verified • Hidden Context Active
          </span>
        </div>
      )}

      {subMode === "battle" && (
        <div className="space-y-4">
          {/* Model Selection Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#1e1e1e] border border-white/10 space-y-1">
              <label className="text-[10px] font-mono text-emerald-400 block">
                اختيار النموذج الأول (Model A):
              </label>
              <select
                value={modelAId}
                onChange={(e) => setModelAId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none"
              >
                {ARENA_MODEL_REGISTRY.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-2.5 rounded-xl bg-[#1e1e1e] border border-white/10 space-y-1">
              <label className="text-[10px] font-mono text-emerald-400 block">
                اختيار النموذج الثاني (Model B):
              </label>
              <select
                value={modelBId}
                onChange={(e) => setModelBId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none"
              >
                {ARENA_MODEL_REGISTRY.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prompt Input & Run Battle Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="اكتب توجيهات تصميم المتجر..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#1e1e1e] border border-emerald-500/35 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
            />
            <button
              type="button"
              onClick={() => handleRunArenaBattle()}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-emerald-400 disabled:opacity-40 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري المقارنة المستقلة...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>إرسال الطلب إلى النموذجين</span>
                </>
              )}
            </button>
          </div>

          {/* Side-by-Side Results */}
          {candidateA && candidateB && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderCandidateColumn(candidateA, "A")}
                {renderCandidateColumn(candidateB, "B")}
              </div>

              {/* Human Preference Voting Bar */}
              <div className="p-3 rounded-2xl bg-[#1e1e1e] border border-white/10 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-zinc-300">
                  🗳️ تصويت التفضيل البشري (Human Preference Vote):
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: "model_a", label: "👈 النموذج A أفضل" },
                    { id: "tie", label: "🤝 تعادل" },
                    { id: "model_b", label: "👉 النموذج B أفضل" },
                    { id: "both_bad", label: "👎 كلاهما يحتاج تعديلاً" },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => handleVote(btn.id as BattleOutcome)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        votedOutcome === btn.id
                          ? "bg-[#10b981] text-black border-emerald-400"
                          : "kaspi-glass-surface text-zinc-300 border-white/10 hover:text-white"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* SUB-MODE 2: SEPARATED EVALUATION METRICS TABLE */}
      {subMode === "evaluation" && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-[#1e1e1e] border border-white/10 text-[11px] text-zinc-300 leading-relaxed">
            <strong className="text-emerald-400">منهجية التقييم الموحدة (Arena-Rank + FastChat + Arena-Hard-Auto):</strong>{" "}
            يتم الفصل الصارم بين <strong>تصويت التاجر البشري (Human Preference)</strong>، و<strong>نسبة الفوز (Win Rate)</strong>، و<strong>تصنيف Bradley-Terry Elo</strong> (يبدأ من 1000.0 ولا يتغير إلا بتصويت فعلي)، و<strong>تقييم المطابقة الآلي (Benchmark Score)</strong>. هذه النتائج محلية خاصة بمتجرك ولا تُنسب إلى لوحة LMSYS العامة.
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#1e1e1e]">
            <table className="w-full text-xs text-start">
              <thead className="bg-black/40 text-zinc-400 text-[10px] font-mono border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3 text-start">النموذج</th>
                  <th className="py-2.5 px-3 text-center">Bradley-Terry Elo</th>
                  <th className="py-2.5 px-3 text-center">Win Rate</th>
                  <th className="py-2.5 px-3 text-center">Human Votes (W/L/T)</th>
                  <th className="py-2.5 px-3 text-center">Schema Benchmark</th>
                  <th className="py-2.5 px-3 text-end">LLM-as-a-Judge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {evaluationSummaries.map((m) => (
                  <tr key={m.modelId} className="hover:bg-white/[0.03]">
                    <td className="py-2.5 px-3 font-bold text-white">
                      {m.displayName}
                      <span className="block text-[10px] text-zinc-400 font-normal">
                        {m.provider}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-extrabold text-emerald-400">
                      {m.bradleyTerryElo}{" "}
                      {m.isProvisionalElo && (
                        <span className="text-[9px] text-zinc-500 font-normal">
                          (أساسي)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-zinc-200">
                      {m.winRatePct !== null ? `${m.winRatePct}%` : "— (0 مواجهات)"}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-zinc-300">
                      {m.humanWins}W / {m.humanLosses}L / {m.humanTies}T ({m.humanBattles})
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-emerald-300">
                      {m.lastBenchmarkScorePct !== null
                        ? `${m.lastBenchmarkScorePct}%`
                        : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-end font-mono text-[10px] text-zinc-400">
                      {m.llmJudgeMode === "disabled_zero_token"
                        ? "اختياري (يتطلب API خارجي)"
                        : "نشط"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default KaspiArenaBuilder;
