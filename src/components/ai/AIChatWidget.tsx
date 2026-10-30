"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale, useTranslations } from "next-intl";
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
} from "lucide-react";

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("Ai");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    await sendMessage({ text: trimmed });
  };

  const handleQuickPrompt = async (promptText: string) => {
    if (isLoading) return;
    await sendMessage({ text: promptText });
  };

  const getMessageText = (m: any): string => {
    if (typeof m.content === "string" && m.content) return m.content;
    if (Array.isArray(m.parts)) {
      return m.parts
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("");
    }
    return "";
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50 print:hidden">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open KASPI AI Assistant"
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 font-medium cursor-pointer border border-emerald-400/30"
          >
            <div className="relative">
              <Bot className="w-5 h-5 transition-transform group-hover:rotate-12" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
            </div>
            <span className="text-sm font-semibold tracking-wide">
              {t("title")}
            </span>
            <Sparkles className="w-4 h-4 text-emerald-200" />
          </button>
        )}
      </div>

      {/* Floating Chat Window Modal / Sheet */}
      {isOpen && (
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[600px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 print:hidden font-sans"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm">
                <Bot className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-wide">
                    {t("title")}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                    <Zap className="w-2.5 h-2.5" />
                    Failover Active
                  </span>
                </div>
                <p className="text-xs text-emerald-200/80 font-normal">
                  {t("subtitle")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-inner">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">
                  {t("title")}
                </h4>
                <p className="text-xs text-slate-500 max-w-[260px] mb-4 leading-relaxed">
                  {t("subtitle")}
                </p>

                {/* Quick Suggestion Chips */}
                <div className="w-full space-y-2 text-start">
                  <button
                    type="button"
                    onClick={() => handleQuickPrompt(t("suggestedSales"))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50/60 hover:border-emerald-300 transition-all text-xs font-medium text-slate-700 flex items-center gap-2.5 shadow-xs cursor-pointer group"
                  >
                    <div className="p-1 rounded-md bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{t("suggestedSales")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickPrompt(t("suggestedStock"))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-amber-50/60 hover:border-amber-300 transition-all text-xs font-medium text-slate-700 flex items-center gap-2.5 shadow-xs cursor-pointer group"
                  >
                    <div className="p-1 rounded-md bg-amber-100 text-amber-700 group-hover:scale-110 transition-transform">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{t("suggestedStock")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickPrompt(t("suggestedTop"))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/60 hover:border-blue-300 transition-all text-xs font-medium text-slate-700 flex items-center gap-2.5 shadow-xs cursor-pointer group"
                  >
                    <div className="p-1 rounded-md bg-blue-100 text-blue-700 group-hover:scale-110 transition-transform">
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{t("suggestedTop")}</span>
                  </button>
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === "user";
                const textContent = getMessageText(m);
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-emerald-700" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none shadow-sm"
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs whitespace-pre-wrap"
                      }`}
                    >
                      {textContent}
                    </div>
                  </div>
                );
              })
            )}

            {isLoading && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                <div className="bg-white border border-slate-200 text-slate-500 px-3 py-2 rounded-2xl rounded-tl-none text-xs flex items-center gap-2 shadow-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>{t("thinking")}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
                <span>{t("error")}</span>
                <button
                  type="button"
                  onClick={() => regenerate()}
                  className="p-1 rounded-md hover:bg-red-100 transition-colors text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>إعادة</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800 placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer flex items-center justify-center"
              aria-label="Send Message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 rtl:-scale-x-100" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
