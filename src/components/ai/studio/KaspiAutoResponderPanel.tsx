"use client";

import React, { useEffect, useState } from "react";
import {
  MessageSquareReply,
  Link2,
  Send,
  Plus,
  Trash2,
  Check,
  Loader2,
  Sparkles,
  Copy,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { getApiUrl } from "@/client/sync-engine";
import { probeAndChatLocalOllama } from "@/lib/zebra-x/sovereign-brain";

interface RuleItem {
  id: string;
  name: string;
  channel: "facebook" | "instagram" | "whatsapp" | "tiktok" | "storefront";
  keywords: string[];
  languageTone: "darija" | "ar" | "fr" | "en";
  includeStoreLink: boolean;
  includeProductPrice: boolean;
  requireApprovalBeforeSend: boolean;
  customInstruction: string;
  enabled: boolean;
}

interface CatalogProductRef {
  id: string;
  name: string;
  price: number;
  link: string;
}

interface ResponderLog {
  id: string;
  createdAt: string;
  channel: string;
  incomingComment: string;
  matchedProductName?: string;
  replyDraft: string;
  storefrontUrl: string;
  dispatched: boolean;
  dispatchStatus: string;
}

export const KaspiAutoResponderPanel: React.FC<{
  locale: string;
  localOllamaModel?: string;
}> = ({ locale, localOllamaModel }) => {
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState("KASPI Store");
  const [storeBaseUrl, setStoreBaseUrl] = useState("");
  const [currency, setCurrency] = useState("MAD");
  const [products, setProducts] = useState<CatalogProductRef[]>([]);
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [logs, setLogs] = useState<ResponderLog[]>([]);

  const [testComment, setTestComment] = useState(
    isAr ? "السلام عليكم شحال التمن ديال هاد المنتج وعطيني الرابط باش نكوموندي؟" : "Bonjour, prix svp et le lien pour commander ?"
  );
  const [selectedRuleId, setSelectedRuleId] = useState("");
  const [dispatchWebhook, setDispatchWebhook] = useState(false);
  const [runningTest, setRunningTest] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/ai/auto-responder?locale=${encodeURIComponent(locale)}`));
      const data = await res.json();
      if (res.ok && data?.success) {
        setStoreName(data.storeName || "KASPI Store");
        setStoreBaseUrl(data.storeBaseUrl || "");
        setCurrency(data.currency || "MAD");
        setProducts(Array.isArray(data.products) ? data.products : []);
        setRules(Array.isArray(data.rules) ? data.rules : []);
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        if (data.rules?.[0]?.id) setSelectedRuleId(data.rules[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [locale]);

  const handleSaveRules = async (updatedRules: RuleItem[]) => {
    setSavingRules(true);
    setStatusMsg(null);
    try {
      const res = await fetch(getApiUrl("/api/ai/auto-responder"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_rules", locale, rules: updatedRules }),
      });
      if (res.ok) {
        setRules(updatedRules);
        setStatusMsg(isAr ? "تم حفظ قواعد الرد التلقائي وإرسال الروابط." : "Auto-responder rules saved.");
      }
    } finally {
      setSavingRules(false);
    }
  };

  const handleAddRule = () => {
    const newRule: RuleItem = {
      id: `rule-${Date.now()}`,
      name: isAr ? "قاعدة رد جديد" : "New Comment Rule",
      channel: "instagram",
      keywords: ["شحال", "prix", "link", "ثمن"],
      languageTone: "darija",
      includeStoreLink: true,
      includeProductPrice: true,
      requireApprovalBeforeSend: false,
      customInstruction: "رد بود مع ذكر الثمن ورابط الطلب المباشر.",
      enabled: true,
    };
    const next = [...rules, newRule];
    setRules(next);
    setSelectedRuleId(newRule.id);
  };

  const handleRunCommentTest = async () => {
    if (!testComment.trim() || runningTest) return;
    setRunningTest(true);
    setStatusMsg(null);

    try {
      const activeRule = rules.find((r) => r.id === selectedRuleId) || rules[0];
      const lower = testComment.toLowerCase();
      const matched =
        products.find((p) => lower.includes(p.name.toLowerCase())) ||
        products.find((p) =>
          p.name
            .toLowerCase()
            .split(/\s+/)
            .some((w) => w.length > 3 && lower.includes(w))
        ) ||
        products[0] ||
        null;

      const directLink = matched ? matched.link : storeBaseUrl;
      const catalogBrief = products
        .slice(0, 10)
        .map((p) => `- ${p.name}: ${p.price} ${currency} (${p.link})`)
        .join("\n");

      // 1. Prefer Local Ollama Qwen on merchant's PC first
      let localDraft = "";
      let usedModel = localOllamaModel || "cloud-router";
      const localRes = await probeAndChatLocalOllama({
        preferredModel: localOllamaModel,
        messages: [
          {
            role: "system",
            content: `You are ${storeName}'s official Social Comments & Customer Auto-Responder.
Language/Tone: ${activeRule?.languageTone || "darija"}.
Instruction: ${activeRule?.customInstruction || "Answer concisely with the exact price and storefront link."}
Mandatory clickable link to include verbatim: ${directLink}
Catalog:\n${catalogBrief || "(Storefront only)"}`,
          },
          { role: "user", content: testComment },
        ],
      });

      if (localRes.ok && localRes.text) {
        localDraft = localRes.text;
        usedModel = localRes.model;
      }

      const res = await fetch(getApiUrl("/api/ai/auto-responder"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_reply",
          locale,
          ruleId: activeRule?.id,
          channel: activeRule?.channel || "facebook",
          comment: testComment,
          clientGeneratedReply: localDraft || undefined,
          dispatchWebhook,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatusMsg(
          data?.message ||
            (isAr
              ? "تعذر الاتصال بمزود السحابة وشغل أولاما محلياً لتوليد الرد."
              : "Cloud AI offline and Local Ollama unreachable.")
        );
        return;
      }

      if (data?.log) {
        setLogs((prev) => [data.log, ...prev]);
        // Record anonymized learning trace to X x Zebra
        void fetch(getApiUrl("/api/ai/zebra-trace"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "COMMENT_RESPONDER",
            outcomeStatus: "SUCCESS",
            modelUsed: usedModel,
            routeSource: localDraft ? "local_ollama" : "cloud_router",
            userPrompt: testComment,
            assistantResponse: data.log.replyDraft,
            toolNamesUsed: ["comment_link_responder"],
            qualityScore: 0.9,
          }),
        }).catch(() => {});
      }
    } finally {
      setRunningTest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-400 gap-2 text-xs">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
        <span>{isAr ? "جاري تحميل الكتالوج وقواعد الرد..." : "Loading auto-responder..."}</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquareReply className="w-4 h-4 text-emerald-400" />
            <span>
              {isAr
                ? "الرد التلقائي على العملاء والكومونتيرات وإرسال الروابط"
                : "Customer & Comment Auto-Responder + Link Dispatcher"}
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            {isAr
              ? "يربط موديل Qwen المحلي بمنتجات المتجر وقنواتك لإرسال الثمن والرابط المباشر لأي زبون علق أو راسلك."
              : "Connects local Qwen/Ollama with live POS catalog prices and sends direct storefront links automatically."}
          </p>
        </div>
        {storeBaseUrl && (
          <a
            href={storeBaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 shrink-0"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>{isAr ? "رابط متجرك المباشر" : "Live Store Link"}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {statusMsg && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Rules Editor */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200">
              {isAr ? "قواعد الرد والكلمات المفتاحية" : "Trigger Rules & Channels"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddRule}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-zinc-200 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{isAr ? "قاعدة" : "Add Rule"}</span>
              </button>
              <button
                type="button"
                disabled={savingRules}
                onClick={() => void handleSaveRules(rules)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold cursor-pointer disabled:opacity-50"
              >
                {savingRules ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                <span>{isAr ? "حفظ" : "Save"}</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {rules.map((rule, idx) => (
              <div
                key={rule.id}
                onClick={() => setSelectedRuleId(rule.id)}
                className={`rounded-xl border p-3 space-y-2.5 cursor-pointer transition-colors ${
                  selectedRuleId === rule.id
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-white/10 bg-zinc-950/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    value={rule.name}
                    onChange={(e) => {
                      const next = [...rules];
                      next[idx] = { ...rule, name: e.target.value };
                      setRules(next);
                    }}
                    className="bg-transparent text-xs font-semibold text-white outline-none flex-1 border-b border-transparent focus:border-emerald-500/40"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRules(rules.filter((r) => r.id !== rule.id));
                    }}
                    className="text-zinc-500 hover:text-rose-400 p-1"
                    title="Delete rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={rule.channel}
                    onChange={(e) => {
                      const next = [...rules];
                      next[idx] = { ...rule, channel: e.target.value as RuleItem["channel"] };
                      setRules(next);
                    }}
                    className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-[11px] text-zinc-200 outline-none"
                  >
                    <option value="facebook">Facebook Comments</option>
                    <option value="instagram">Instagram DM / Comments</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="tiktok">TikTok Comments</option>
                    <option value="storefront">Storefront Chat</option>
                  </select>

                  <select
                    value={rule.languageTone}
                    onChange={(e) => {
                      const next = [...rules];
                      next[idx] = { ...rule, languageTone: e.target.value as RuleItem["languageTone"] };
                      setRules(next);
                    }}
                    className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-[11px] text-zinc-200 outline-none"
                  >
                    <option value="darija">الدارجة المغربية</option>
                    <option value="ar">العربية الفصحى</option>
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <input
                  value={rule.keywords.join(", ")}
                  onChange={(e) => {
                    const next = [...rules];
                    next[idx] = {
                      ...rule,
                      keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    };
                    setRules(next);
                  }}
                  placeholder={isAr ? "كلمات مفتاحية مفصولة بفاصلة..." : "Trigger keywords..."}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-200 outline-none"
                />

                <textarea
                  rows={2}
                  value={rule.customInstruction}
                  onChange={(e) => {
                    const next = [...rules];
                    next[idx] = { ...rule, customInstruction: e.target.value };
                    setRules(next);
                  }}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-200 outline-none resize-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Test Comment + Live Reply with Store Link + Logs */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 space-y-3">
            <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? "تجربة وإرسال رد تلقائي لزبون" : "Test & Dispatch Comment Reply"}</span>
            </span>

            <textarea
              rows={3}
              value={testComment}
              onChange={(e) => setTestComment(e.target.value)}
              placeholder={isAr ? "اكتب تعليق زبون هنا..." : "Paste incoming customer comment..."}
              className="w-full rounded-xl bg-zinc-950/60 border border-white/10 p-3 text-xs text-white outline-none focus:border-emerald-500/50 resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dispatchWebhook}
                  onChange={(e) => setDispatchWebhook(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span>
                  {isAr ? "أرسل للـ Webhook المربوط فـ Plugins" : "Also dispatch to connected Webhook"}
                </span>
              </label>

              <button
                type="button"
                disabled={runningTest}
                onClick={() => void handleRunCommentTest()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {runningTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isAr ? "توليد الرد + الرابط" : "Generate Reply & Link"}</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 space-y-2.5 max-h-[290px] overflow-y-auto">
            <span className="text-xs font-bold text-zinc-300">
              {isAr ? "سجل الردود والروابط المرسلة" : "Recent Auto-Replies & Dispatches"} ({logs.length})
            </span>
            {logs.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">
                {isAr ? "جرب إرسال تعليق باش تشوف الرد المربوط برابط المنتج الحقيقي." : "Test a comment above to see real catalog pricing & link injection."}
              </p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="rounded-xl border border-white/10 bg-zinc-950/60 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="uppercase font-bold text-emerald-400">
                      {log.channel} {log.matchedProductName ? `• ${log.matchedProductName}` : ""}
                    </span>
                    <span>{log.dispatchStatus}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 italic">“{log.incomingComment}”</p>
                  <p className="text-xs text-zinc-100 whitespace-pre-wrap leading-relaxed">{log.replyDraft}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-emerald-400 truncate max-w-[75%]">{log.storefrontUrl}</span>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(log.replyDraft);
                        setCopiedId(log.id);
                        setTimeout(() => setCopiedId(null), 1500);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] text-zinc-300 hover:text-white cursor-pointer"
                    >
                      {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === log.id ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
