"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Bot,
  MessageSquareReply,
  Image as ImageIcon,
  PlugZap,
  Store,
  Activity,
  ShieldCheck,
  Send,
  Loader2,
  Terminal,
  Copy,
  Check,
  Cpu,
  MapPin,
  Library,
  RefreshCw,
} from "lucide-react";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";
import { AppleBackButton } from "@/components/common/AppleBackButton";
import { getApiUrl } from "@/client/sync-engine";
import {
  loadKaspiLibrary,
  saveKaspiLibrary,
  saveLocationToLibrary,
  saveSkillToLibrary,
  buildUnifiedLibraryContextSummary,
  type KaspiLocalLibraryState,
} from "@/lib/ai/kaspi-library-memory";
import {
  buildMerchantOllamaPowershellSetup,
  classifyComplexityRoute,
  probeAndChatLocalOllama,
  probeLocalOllamaModels,
  selectSafeOllamaModelForDevice,
} from "@/lib/zebra-x/sovereign-brain";
import {
  KaspiPluginsCenter,
  type VaultConnectionItem,
} from "./os/KaspiPluginsCenter";
import { KaspiBusinessOsPanel } from "./os/KaspiBusinessOsPanel";
import { KaspiMapsLocationPanel } from "./os/KaspiMapsLocationPanel";
import { KaspiLibraryView } from "./os/KaspiLibraryView";
import { KaspiPuckStorefrontBuilder } from "./studio/KaspiPuckStorefrontBuilder";
import { KaspiAutoResponderPanel } from "./studio/KaspiAutoResponderPanel";
import { KaspiMediaLabPanel } from "./studio/KaspiMediaLabPanel";
import { KaspiZebraOwnerConsole } from "./studio/KaspiZebraOwnerConsole";

interface KaspiAiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  initialTab?: WorkspaceTab;
}

export type WorkspaceTab =
  | "chat"
  | "responder"
  | "media"
  | "channels"
  | "storefront"
  | "ops"
  | "zebra_owner";

interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sourceLabel?: string;
}

export const KaspiAiStudioModal: React.FC<KaspiAiStudioModalProps> = ({
  isOpen,
  onClose,
  locale,
  initialTab = "chat",
}) => {
  const isAr = locale === "ar";
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userScopeKey, setUserScopeKey] = useState("merchant");

  // Local Ollama state
  const [ollamaReachable, setOllamaReachable] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [ollamaVia, setOllamaVia] = useState<"tauri" | "http" | "none">("none");
  const [showSetupBox, setShowSetupBox] = useState(false);
  const [copiedPs, setCopiedPs] = useState(false);
  const [tauriSetupBusy, setTauriSetupBusy] = useState(false);

  // Full Copilot Chat state
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);

  // Vault / Library / Ops subviews
  const [vaultConnections, setVaultConnections] = useState<VaultConnectionItem[]>([]);
  const [libraryState, setLibraryState] = useState<KaspiLocalLibraryState>(() =>
    loadKaspiLibrary("merchant")
  );
  const [opsSubTab, setOpsSubTab] = useState<"os" | "maps" | "library">("os");

  const refreshLocalOllama = useCallback(async () => {
    const probe = await probeLocalOllamaModels();
    setOllamaReachable(probe.reachable);
    setOllamaModels(probe.models);
    setOllamaVia(probe.via);
    if (probe.models.length > 0 && (!selectedModel || !probe.models.includes(selectedModel))) {
      setSelectedModel(selectSafeOllamaModelForDevice({ installedModels: probe.models }));
    }
  }, [selectedModel]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    void refreshLocalOllama();

    fetch(getApiUrl("/api/v1/me"))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const user = d?.user || d?.data || d;
        const adminFlag = Boolean(user?.isSuperAdmin || user?.role === "SUPER_ADMIN");
        setIsSuperAdmin(adminFlag);
        const key = String(user?.email || user?.tenantId || "merchant").slice(0, 40);
        setUserScopeKey(key);
        setLibraryState(loadKaspiLibrary(key));
      })
      .catch(() => {});

    fetch(getApiUrl("/api/ai/integrations"))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.connections)) setVaultConnections(d.connections);
      })
      .catch(() => {});
  }, [isOpen, initialTab, refreshLocalOllama]);

  const handleTauriBackgroundInstall = async () => {
    const tauriInvoke =
      typeof window !== "undefined"
        ? (window as any).__TAURI_INTERNALS__?.invoke || (window as any).__TAURI__?.core?.invoke
        : null;
    if (typeof tauriInvoke !== "function") {
      setShowSetupBox(true);
      return;
    }
    setTauriSetupBusy(true);
    try {
      const msg = await tauriInvoke("setup_local_ollama_background", { modelTag: "auto" });
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: "assistant",
          content: String(msg),
          sourceLabel: "Tauri Installer",
        },
      ]);
      setTimeout(() => void refreshLocalOllama(), 6000);
    } catch (e: any) {
      setShowSetupBox(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: String(e?.message || e),
          sourceLabel: "Setup Info",
        },
      ]);
    } finally {
      setTauriSetupBusy(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt || sending) return;

    setChatInput("");
    const userMsg: CopilotMessage = { id: `u-${Date.now()}`, role: "user", content: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const routeInfo = classifyComplexityRoute(prompt, isSuperAdmin);
      const libraryCtx = buildUnifiedLibraryContextSummary(userScopeKey);
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // 1. Try merchant's local Ollama cell first (0 server token cost, works in AR/Darija/FR/EN)
      const localRes = await probeAndChatLocalOllama({
        preferredModel: selectedModel || undefined,
        messages: [
          {
            role: "system",
            content: `You are KASPI AI Merchant Copilot (Local Qwen Cell). Assist fluently in the customer's language (Moroccan Darija, Arabic, French, or English) with store sales, customer replies, comment links, inventory & commerce operations.${libraryCtx}`,
          },
          ...historyPayload,
          { role: "user", content: prompt },
        ],
      });

      if (localRes.ok && localRes.text) {
        setOllamaReachable(true);
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: localRes.text,
            sourceLabel: `${localRes.model} (${localRes.backend})`,
          },
        ]);
        void fetch(getApiUrl("/api/ai/zebra-trace"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: isSuperAdmin && routeInfo.tier === "OWNER_X_ZEBRA" ? "OWNER_CORRECTION" : "MODEL_ROUTE",
            outcomeStatus: "SUCCESS",
            modelUsed: localRes.model,
            routeSource: localRes.backend === "tauri_ollama" ? "tauri_local" : "local_ollama",
            userPrompt: prompt,
            assistantResponse: localRes.text,
          }),
        }).catch(() => {});
        return;
      }

      // 2. Fallback to Cloud POS /api/ai/chat router (no fabricated fallback answers!)
      const res = await fetch(getApiUrl("/api/ai/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-app-locale": locale },
        body: JSON.stringify({
          locale,
          messages: [...historyPayload, { role: "user", content: prompt }],
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        setShowSetupBox(true);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content:
              errJson?.message ||
              (isAr
                ? "أولاما المحلي غير متصل حالياً على هذا الجهاز والمزود السحابي متوقف. شغّل أولاما محلياً بالأمر أسفله."
                : "Local Ollama is not reachable on 127.0.0.1:11434 and cloud gateways are unavailable. Run local Ollama setup below."),
            sourceLabel: "Offline Notice",
          },
        ]);
        return;
      }

      // Read plain SSE / text stream output from /api/ai/chat
      const raw = await res.text();
      let assembled = "";
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const parsed = JSON.parse(payload);
          if (typeof parsed?.delta === "string") assembled += parsed.delta;
          else if (typeof parsed?.textDelta === "string") assembled += parsed.textDelta;
        } catch {}
      }
      const replyText = assembled.trim() || raw.trim();
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: replyText,
          sourceLabel: "Cloud POS Router",
        },
      ]);
      void fetch(getApiUrl("/api/ai/zebra-trace"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "POS_ANALYTICS",
          outcomeStatus: "SUCCESS",
          modelUsed: "cloud-router",
          routeSource: "cloud_router",
          userPrompt: prompt,
          assistantResponse: replyText,
        }),
      }).catch(() => {});
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const navTabs: Array<{
    id: WorkspaceTab;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    ownerOnly?: boolean;
  }> = [
    { id: "chat", icon: Bot, label: isAr ? "الشات المحلي (Qwen)" : "Local Qwen Chat" },
    { id: "responder", icon: MessageSquareReply, label: isAr ? "الرد على الكومونتيرات" : "Comment & Link Responder" },
    { id: "media", icon: ImageIcon, label: isAr ? "الصور وإزالة الخلفية" : "Media & BG Remover" },
    { id: "channels", icon: PlugZap, label: isAr ? "ربط المواقع والقنوات" : "Channels & Plugins" },
    { id: "storefront", icon: Store, label: isAr ? "متجر Puck" : "Puck Storefront" },
    { id: "ops", icon: Activity, label: isAr ? "المراقبة والخرائط" : "Business OS & Maps" },
    ...(isSuperAdmin
      ? [{ id: "zebra_owner" as const, icon: ShieldCheck, label: "X × Zebra Owner", ownerOnly: true }]
      : []),
  ];

  return (
    <KaspiGlassModalPortal
      isOpen={isOpen}
      onClose={onClose}
      dir={isAr ? "rtl" : "ltr"}
      className="max-w-7xl w-full"
    >
      <div className="flex flex-col h-[90vh] w-full overflow-hidden rounded-3xl text-zinc-100">
        {/* Top Bar */}
        <header className="border-b border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <AppleBackButton onClick={onClose} locale={locale} />
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{isAr ? "منظومة كسب للذكاء المحلي والتجارة" : "KASPI AI — Local Qwen & Store Automation"}</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    ollamaReachable
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                      : "bg-amber-500/15 border-amber-500/30 text-amber-200"
                  }`}
                >
                  <Cpu className="w-3 h-3" />
                  <span>
                    {ollamaReachable
                      ? `Ollama (${selectedModel || ollamaModels[0] || "ready"})`
                      : isAr
                      ? "Ollama غير متصل"
                      : "Ollama Offline"}
                  </span>
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {ollamaModels.length > 0 && (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="rounded-xl bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs text-zinc-200 outline-none"
              >
                {ollamaModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => void refreshLocalOllama()}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 cursor-pointer"
              title={isAr ? "تحديث حالة أولاما المحلي" : "Refresh local Ollama"}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={tauriSetupBusy}
              onClick={() => void handleTauriBackgroundInstall()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold cursor-pointer"
            >
              {tauriSetupBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
              <span>{isAr ? "تثبيت/تشغيل أولاما" : "Setup Local Ollama"}</span>
            </button>
          </div>
        </header>

        {/* Navigation Strip */}
        <nav className="border-b border-white/10 px-4 py-2 flex items-center gap-1.5 overflow-x-auto kaspi-no-scrollbar shrink-0">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                  active
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : tab.ownerOnly
                    ? "bg-amber-500/10 border-amber-500/25 text-amber-200 hover:bg-amber-500/20"
                    : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Body */}
        <div className="flex-1 overflow-y-auto kaspi-no-scrollbar">
          {showSetupBox && (
            <div className="m-4 rounded-2xl border border-emerald-500/30 bg-zinc-900/70 p-4 space-y-2.5 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  <span>
                    {isAr
                      ? "تشغيل موديل Qwen المحلي على جهازك (PowerShell — آمن ويفحص المساحة والرام):"
                      : "One-Command Hardware-Safe Local Ollama Setup (Windows PowerShell):"}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(buildMerchantOllamaPowershellSetup("auto"));
                      setCopiedPs(true);
                      setTimeout(() => setCopiedPs(false), 1800);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    {copiedPs ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPs ? "Copied" : "Copy Script"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSetupBox(false)}
                    className="text-xs text-zinc-400 hover:text-white px-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <pre className="rounded-xl bg-zinc-950/90 border border-white/10 p-3 text-[10px] text-emerald-300 overflow-x-auto">
                {buildMerchantOllamaPowershellSetup("auto")}
              </pre>
            </div>
          )}

          {activeTab === "chat" && (
            <div className="flex flex-col h-full max-w-4xl mx-auto p-4 md:p-6">
              <div className="flex-1 space-y-3 overflow-y-auto pb-4">
                {messages.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <Bot className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h3 className="text-sm font-bold text-white">
                      {isAr
                        ? "مساعد كسب المحلي — جاهز للشات، الردود، وإدارة المتجر"
                        : "KASPI Local Qwen Copilot — Commerce, Chat & Analytics"}
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto">
                      {ollamaReachable
                        ? isAr
                          ? `متصل مباشرة بجهازك (${ollamaVia}) عبر الموديل ${selectedModel}. كل المحادثات خاصة وسريعة وبلا حدود توكنز.`
                          : `Connected directly to your PC (${ollamaVia}) via ${selectedModel}. Private, unlimited, multilingual.`
                        : isAr
                        ? "شغّل أولاما محلياً لتعمل النماذج بسرعة على جهازك بدون استهلاك السيرفر."
                        : "Run Local Ollama setup above so multilingual Qwen executes directly on your machine."}
                    </p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                          m.role === "user"
                            ? "bg-white text-black font-medium"
                            : "bg-zinc-900/70 border border-white/10 text-zinc-100"
                        }`}
                      >
                        {m.sourceLabel && (
                          <div className="text-[10px] text-emerald-400 font-semibold mb-1">
                            {m.sourceLabel}
                          </div>
                        )}
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={(e) => void handleSendChat(e)} className="flex gap-2 pt-2 border-t border-white/10">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={isAr ? "اسأل عن المبيعات، صياغة رد لزبون، أو استراتيجية متجرك..." : "Ask about store sales, customer replies, or stock..."}
                  className="flex-1 rounded-xl bg-zinc-900/80 border border-white/15 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500/50"
                />
                <button
                  type="submit"
                  disabled={sending || !chatInput.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{isAr ? "إرسال" : "Send"}</span>
                </button>
              </form>
            </div>
          )}

          {activeTab === "responder" && (
            <KaspiAutoResponderPanel locale={locale} localOllamaModel={selectedModel || undefined} />
          )}

          {activeTab === "media" && <KaspiMediaLabPanel locale={locale} />}

          {activeTab === "channels" && (
            <div className="p-4 md:p-6">
              <KaspiPluginsCenter
                connections={vaultConnections}
                libraryState={libraryState}
                onConnectionsUpdated={(next) => setVaultConnections(next)}
                onSaveSkill={(sk) => {
                  const updated = saveSkillToLibrary(userScopeKey, sk);
                  setLibraryState(updated);
                }}
                onOpenMapsPanel={() => {
                  setActiveTab("ops");
                  setOpsSubTab("maps");
                }}
              />
            </div>
          )}

          {activeTab === "storefront" && (
            <div className="p-4 md:p-6">
              <KaspiPuckStorefrontBuilder locale={locale} />
            </div>
          )}

          {activeTab === "ops" && (
            <div className="p-4 md:p-6 space-y-4">
              <div className="flex items-center gap-2">
                {[
                  { id: "os" as const, icon: Activity, label: isAr ? "مراقبة المتجر والأتمتة" : "Business OS Monitor" },
                  { id: "maps" as const, icon: MapPin, label: isAr ? "موقع المتجر والخرائط" : "Store Maps GPS" },
                  { id: "library" as const, icon: Library, label: isAr ? "ذاكرة المتجر والمهارات" : "Library & Knowledge" },
                ].map((sub) => {
                  const Icon = sub.icon;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setOpsSubTab(sub.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                        opsSubTab === sub.id
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                          : "bg-white/5 border-white/10 text-zinc-300"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{sub.label}</span>
                    </button>
                  );
                })}
              </div>

              {opsSubTab === "os" && <KaspiBusinessOsPanel />}
              {opsSubTab === "maps" && (
                <KaspiMapsLocationPanel
                  currentLocation={libraryState.location}
                  onSaveLocation={(loc) => {
                    const updated = saveLocationToLibrary(userScopeKey, loc);
                    setLibraryState(updated);
                  }}
                />
              )}
              {opsSubTab === "library" && (
                <KaspiLibraryView
                  libraryState={libraryState}
                  onUpdateKnowledge={(knowledge) => {
                    const next = { ...libraryState, knowledge };
                    saveKaspiLibrary(userScopeKey, next);
                    setLibraryState(next);
                  }}
                  onDeleteArtifact={(id) => {
                    const next = {
                      ...libraryState,
                      artifacts: libraryState.artifacts.filter((a) => a.id !== id),
                    };
                    saveKaspiLibrary(userScopeKey, next);
                    setLibraryState(next);
                  }}
                  onOpenArtifactInCanvas={() => setActiveTab("storefront")}
                  onOpenMapsPanel={() => setOpsSubTab("maps")}
                />
              )}
            </div>
          )}

          {activeTab === "zebra_owner" && isSuperAdmin && (
            <KaspiZebraOwnerConsole locale={locale} isSuperAdmin={isSuperAdmin} />
          )}
        </div>
      </div>
    </KaspiGlassModalPortal>
  );
};

export default KaspiAiStudioModal;
