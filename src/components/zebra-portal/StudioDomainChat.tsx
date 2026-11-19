"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowUpRight, Bot, Send, ShieldCheck, Sparkles, User } from "lucide-react";
import type { PortalLocale } from "@/components/zebra-portal/platform-data";
import type { SpecializedProductDefinition } from "@/lib/heyuka/ecosystem/products-catalog";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  meta?: { model?: string; tier?: string; durationMs?: number };
  recommended?: { id: string; name: string; shortTag: string } | null;
}

interface StudioDomainChatProps {
  productId: string;
  product?: SpecializedProductDefinition;
  workspaceContext?: string;
  quickPrompts?: string[];
  onSaveOutputText?: (text: string) => void;
}

export function StudioDomainChat({
  productId,
  product,
  workspaceContext,
  quickPrompts,
  onSaveOutputText,
}: StudioDomainChatProps) {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";

  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prompts =
    quickPrompts ||
    product?.quickPrompts[locale] || [
      "Summarize active capabilities and propose next steps.",
      "Compare HEYUKA workflow tools cleanly.",
    ];

  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || busy) return;
    setError(null);
    const nextTurns: ChatTurn[] = [...turns, { role: "user", content: text }];
    setTurns(nextTurns);
    if (!textOverride) setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/v1/heyuka/studio-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          workspaceContext,
          messages: nextTurns.map((t) => ({ role: t.role, content: t.content })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message || "Sign in or check zero-cost quota.");
        return;
      }
      setTurns((prev) => [
        ...prev,
        {
          role: "assistant",
          content: String(json.reply || ""),
          meta: {
            model: json.sharedEngineModel,
            tier: json.executionTier,
            durationMs: json.durationMs,
          },
          recommended: json.recommendedProduct || null,
        },
      ]);
    } catch (err: any) {
      setError(err?.message || "Network error contacting studio intelligence");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="kaspi-glass-card rounded-3xl p-4 sm:p-5 flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--kaspi-border)] pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl kaspi-glass-surface flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-rose-500" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-extrabold text-[var(--kaspi-text-primary)] truncate">
              {product ? `${product.name} Specialist` : "HEYUKA Command Router Chat"}
            </div>
            <div className="text-[11px] text-[var(--kaspi-text-muted)] truncate flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-rose-500 shrink-0" />
              <span>
                {product
                  ? product.sharedEngineDisclosure[locale]
                  : "Unified HEYUKA intelligence with optional Studio routing"}
              </span>
            </div>
          </div>
        </div>

        {productId !== "command-center" && (
          <Link
            href={`/${locale}/zebra-x`}
            className="text-[11px] font-bold text-rose-500 hover:underline shrink-0"
          >
            {locale === "ar" ? "المحادثة العامة →" : "Universal Chat →"}
          </Link>
        )}
      </div>

      {/* Domain Quick Prompts */}
      <div className="flex flex-wrap gap-1.5">
        {prompts.map((qp) => (
          <button
            key={qp}
            type="button"
            onClick={() => void sendMessage(qp)}
            disabled={busy}
            className="kaspi-frosted-surface hover:scale-[1.01] rounded-full px-3 py-1.5 text-[11px] font-medium text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)] transition-all cursor-pointer text-start"
          >
            <Sparkles className="w-3 h-3 inline me-1 text-rose-500" />
            {qp}
          </button>
        ))}
      </div>

      {/* Thread History */}
      <div className="kaspi-frosted-surface rounded-2xl p-3.5 min-h-[210px] max-h-[340px] overflow-y-auto space-y-3">
        {turns.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-xs text-[var(--kaspi-text-muted)] text-center px-4">
            {product
              ? product.tagline[locale]
              : "Ask any technical, creative, data, 3D, audio, or coding question cleanly."}
          </div>
        ) : (
          turns.map((turn, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-3 text-xs leading-relaxed space-y-2 ${
                turn.role === "user"
                  ? "kaspi-glass-surface ms-6"
                  : "kaspi-glass-card me-4"
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-[var(--kaspi-text-muted)]">
                <span className="inline-flex items-center gap-1">
                  {turn.role === "user" ? (
                    <User className="w-3 h-3" />
                  ) : (
                    <Bot className="w-3 h-3 text-rose-500" />
                  )}
                  {turn.role === "user" ? "You" : product?.shortTag || "HEYUKA"}
                </span>
                {turn.meta && (
                  <span dir="ltr" className="font-mono">
                    {turn.meta.model} • {turn.meta.tier} • {turn.meta.durationMs}ms
                  </span>
                )}
              </div>

              <div className="whitespace-pre-wrap text-[var(--kaspi-text-primary)]">
                {turn.content}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {turn.role === "assistant" && onSaveOutputText && (
                  <button
                    type="button"
                    onClick={() => onSaveOutputText(turn.content)}
                    className="kaspi-glass-btn rounded-xl px-2.5 py-1 text-[10px] font-bold text-rose-500 cursor-pointer"
                  >
                    Save to Output Vault
                  </button>
                )}

                {turn.recommended && (
                  <Link
                    href={`/${locale}/zebra-x/studios/${turn.recommended.id}`}
                    className="kaspi-glass-btn rounded-xl px-2.5 py-1 text-[10px] font-bold inline-flex items-center gap-1 text-rose-500"
                  >
                    <span>Open {turn.recommended.name}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {error && (
        <div className="text-xs text-rose-500 kaspi-frosted-surface rounded-xl px-3 py-2 font-semibold">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            locale === "ar"
              ? "اكتب طلبك المتخصص هنا..."
              : locale === "fr"
              ? "Écrivez votre requête spécialisée..."
              : "Ask your domain specialist..."
          }
          className="flex-1 rounded-2xl kaspi-glass-surface px-4 py-2.5 text-xs text-[var(--kaspi-text-primary)] placeholder:text-[var(--kaspi-text-muted)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="kaspi-primary-cta-btn rounded-2xl px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{busy ? "..." : "Send"}</span>
        </button>
      </form>
    </div>
  );
}
