"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { getApiUrl } from "@/client/sync-engine";
import {
  Bot,
  Sparkles,
  X,
  Send,
  Loader2,
  TrendingUp,
  AlertTriangle,
  ShoppingBag,
  RotateCcw,
  Zap,
  Paperclip,
  FileText,
} from "lucide-react";

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<{
    name: string;
    type: string;
    url: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const locale = useLocale();
  const pathname = usePathname() || "";
  const isAdminView = pathname.includes("/admin");
  const isRtl = locale === "ar";
  const t = useTranslations("Ai");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Strictly hide AI Assistant Widget on authentication/public screens
  // Only render inside authenticated workspace routes (/dashboard/*, /pos/*, /admin/*)
  const isAuthPage =
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/forgot-password") ||
    pathname.includes("/reset-password") ||
    pathname.includes("/auth");

  const isAuthenticatedWorkspaceRoute =
    pathname.includes("/dashboard") ||
    pathname.includes("/pos") ||
    pathname.includes("/admin");

  useEffect(() => {
    if (!isAuthenticatedWorkspaceRoute || isAuthPage) {
      setIsAuthenticated(false);
      return;
    }
    let active = true;
    fetch(getApiUrl("/api/v1/me"))
      .then((res) => {
        if (active) setIsAuthenticated(res.ok);
      })
      .catch(() => {
        // If offline inside workspace, allow if cached session exists
        if (active) setIsAuthenticated(typeof navigator !== "undefined" && !navigator.onLine);
      });
    return () => {
      active = false;
    };
  }, [pathname, isAuthenticatedWorkspaceRoute, isAuthPage]);

  const shouldRenderWidget = !isAuthPage && isAuthenticatedWorkspaceRoute && isAuthenticated;

  // Listen for custom "open-master-ai" events triggered from the Super Admin dashboard
  useEffect(() => {
    const handleOpenMasterAi = (ev: Event) => {
      setIsOpen(true);
      const customEv = ev as CustomEvent<{ prompt?: string }>;
      if (customEv.detail?.prompt) {
        setInput(customEv.detail.prompt);
      }
    };
    window.addEventListener("open-master-ai", handleOpenMasterAi);
    return () =>
      window.removeEventListener("open-master-ai", handleOpenMasterAi);
  }, []);

  // Memoize transport with standard API endpoint
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/ai/chat" }),
    []
  );

  // Vercel AI SDK useChat hook with DefaultChatTransport
  const {
    messages,
    sendMessage,
    status,
    error,
    regenerate,
  } = useChat({
    transport,
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll to bottom of chat when new tokens or messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      setAttachment({
        name: file.name,
        type: file.type || "application/octet-stream",
        url: dataUrl,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !attachment) || isLoading) return;

    const messageText = input;
    const currentAttachment = attachment;
    setInput("");
    setAttachment(null);

    if (currentAttachment) {
      await sendMessage({
        text: messageText || "Analyze this attached file",
        files: [
          {
            type: "file",
            mediaType: currentAttachment.type,
            url: currentAttachment.url,
          },
        ],
      });
    } else {
      await sendMessage({ text: messageText });
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInput(promptText);
    sendMessage({ text: promptText });
  };

  const getMessageText = (m: any): string => {
    if (typeof m.content === "string") return m.content;
    if (Array.isArray(m.parts)) {
      return m.parts
        .map((p: any) => {
          if (p.type === "text") return p.text || "";
          return "";
        })
        .join("");
    }
    return "";
  };

  if (!shouldRenderWidget) {
    return null;
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50 print:hidden">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open KASPI AI Assistant"
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 font-medium cursor-pointer border border-zinc-700"
          >
            <div className="relative">
              <Bot className="w-5 h-5 transition-transform group-hover:rotate-12 text-white" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
            </div>
            <span className="text-sm font-semibold tracking-wide text-white">
              {isAdminView ? "Master AI • Chief Data Officer" : t("title")}
            </span>
            <Sparkles className="w-4 h-4 text-zinc-400" />
          </button>
        )}
      </div>

      {/* Floating Chat Window Modal / Sheet */}
      {isOpen && (
        <div
          dir="ltr"
          className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[600px] max-h-[85vh] bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 print:hidden font-sans"
        >
          {/* Header */}
          <div className="bg-zinc-900 border-b border-zinc-800 text-white p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-wide text-white">
                    {isAdminView ? "Master AI • Chief Data Officer" : t("title")}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white text-black">
                    <Zap className="w-2.5 h-2.5" />
                    {isAdminView ? "Full DB Access" : "Failover Active"}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-normal">
                  {t("subtitle")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-950">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white mb-3 shadow-inner">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-white text-sm mb-1">
                  {t("title")}
                </h4>
                <p className="text-xs text-zinc-400 max-w-[260px] mb-4 leading-relaxed">
                  {t("subtitle")}
                </p>

                {/* Quick Suggestion Chips */}
                <div className="w-full space-y-2 text-start">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickPrompt(
                        isAdminView
                          ? "What is our total platform MRR, GMV, and active subscriptions?"
                          : t("suggestedSales")
                      )
                    }
                    className="w-full p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 transition-all text-xs font-medium text-zinc-300 flex items-center gap-2.5 shadow-xs cursor-pointer group"
                  >
                    <div className="p-1 rounded-md bg-zinc-800 text-white group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">
                      {isAdminView
                        ? "Platform Revenue (MRR & GMV Breakdown)"
                        : t("suggestedSales")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickPrompt(
                        isAdminView
                          ? "List all registered tenants, their subscription status, and sales count."
                          : t("suggestedStock")
                      )
                    }
                    className="w-full p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 transition-all text-xs font-medium text-zinc-300 flex items-center gap-2.5 shadow-xs cursor-pointer group"
                  >
                    <div className="p-1 rounded-md bg-zinc-800 text-white group-hover:scale-110 transition-transform">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">
                      {isAdminView
                        ? "All Registered Tenants & Subscriptions"
                        : t("suggestedStock")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickPrompt(
                        isAdminView
                          ? "Show platform-wide AI usage stats and most active shops."
                          : t("suggestedTop")
                      )
                    }
                    className="w-full p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 transition-all text-xs font-medium text-zinc-300 flex items-center gap-2.5 shadow-xs cursor-pointer group"
                  >
                    <div className="p-1 rounded-md bg-zinc-800 text-white group-hover:scale-110 transition-transform">
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">
                      {isAdminView
                        ? "Platform-Wide AI Usage & Telemetry"
                        : t("suggestedTop")}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === "user";
                const textContent = getMessageText(m);
                const fileParts = Array.isArray((m as any).parts)
                  ? (m as any).parts.filter(
                      (p: any) => p.type === "file" || p.type === "image"
                    )
                  : [];

                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? "bg-white text-black font-medium rounded-tr-none shadow-xs"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none shadow-xs whitespace-pre-wrap"
                      }`}
                    >
                      {fileParts.map((f: any, fIdx: number) => {
                        const isImg =
                          f.type === "image" ||
                          f.mediaType?.startsWith("image/") ||
                          f.url?.startsWith("data:image/");
                        if (isImg) {
                          return (
                            <img
                              key={fIdx}
                              src={f.url || f.image}
                              alt={f.name || "Upload"}
                              className="max-h-36 rounded-lg mb-2 object-cover border border-zinc-700 shadow-xs"
                            />
                          );
                        }
                        return (
                          <div
                            key={fIdx}
                            className={`flex items-center gap-2 p-1.5 rounded-lg text-xs mb-2 ${
                              isUser
                                ? "bg-zinc-100 text-black"
                                : "bg-zinc-800 text-zinc-300"
                            }`}
                          >
                            <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                            <span className="truncate">{f.name || "Document PDF"}</span>
                          </div>
                        );
                      })}
                      {textContent}
                    </div>
                  </div>
                );
              })
            )}

            {isLoading && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-2 rounded-2xl rounded-tl-none text-xs flex items-center gap-2 shadow-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>{t("thinking")}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs flex items-center justify-between">
                <span>{t("error")}</span>
                <button
                  type="button"
                  onClick={() => regenerate()}
                  className="p-1 rounded-md hover:bg-zinc-800 transition-colors text-white font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isRtl ? "إعادة" : "Réessayer"}</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Preview Badge */}
          {attachment && (
            <div className="px-3 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden text-xs text-zinc-300">
                {attachment.type.startsWith("image/") ? (
                  <img
                    src={attachment.url}
                    alt="preview"
                    className="w-7 h-7 rounded-md object-cover border border-zinc-700 shrink-0"
                  />
                ) : (
                  <FileText className="w-5 h-5 text-zinc-400 shrink-0" />
                )}
                <span className="truncate max-w-[220px] font-medium text-xs">
                  {attachment.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-full cursor-pointer hover:bg-zinc-800"
                aria-label="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer flex items-center justify-center shrink-0"
              title="Upload image or PDF document"
              aria-label="Upload image or PDF"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-white transition-all text-white placeholder-zinc-500"
            />
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !attachment)}
              className="p-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer flex items-center justify-center shrink-0"
              aria-label="Send Message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <Send className="w-4 h-4 text-black" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
