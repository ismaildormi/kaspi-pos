"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Globe, MessageSquare, ShieldCheck } from "lucide-react";
import { HeyukaLoopMark } from "./HeyukaLoopMark";
import { HEYUKAGmailAccessCard } from "./HEYUKAGmailAccessCard";

interface SharedTurn {
  id?: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  thinkingSec?: number;
  sources?: Array<{ title: string; url: string }>;
}

interface ShareRecord {
  shareId: string;
  title: string;
  model: string;
  authorLabel: string;
  turns: SharedTurn[];
  createdAt: string;
}

export function SharedConversationEntryClient({
  locale,
  shareId,
}: {
  locale: string;
  shareId: string;
}) {
  const safeLocale: "ar" | "fr" | "en" =
    locale === "ar" ? "ar" : locale === "fr" ? "fr" : "en";
  const isRtl = safeLocale === "ar";
  const router = useRouter();

  const [share, setShare] = useState<ShareRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/heyuka/share?id=${encodeURIComponent(shareId)}`, {
        cache: "no-store",
      }).then((r) => r.json()),
      fetch("/api/v1/zebra-x/profile", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => null),
    ])
      .then(([shareJson, profileJson]) => {
        if (shareJson?.ok && shareJson.share) {
          setShare(shareJson.share);
        } else {
          setError(shareJson?.error || "Shared conversation not found.");
        }
        setAuthenticated(Boolean(profileJson?.authenticated));
      })
      .catch(() => setError("Failed to load shared conversation."))
      .finally(() => setLoading(false));
  }, [shareId]);

  const enterConversation = () => {
    router.push(`/${safeLocale}/chat?fromShare=${encodeURIComponent(shareId)}`);
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-[var(--kaspi-bg)] text-[var(--kaspi-text-primary)] flex flex-col selection:bg-rose-600 selection:text-white"
    >
      <header className="px-4 sm:px-8 py-4 border-b border-[var(--kaspi-border)] flex items-center justify-between gap-3">
        <Link href={`/${safeLocale}/heyuka`} className="flex items-center gap-2.5">
          <HeyukaLoopMark size="sm" variant="crimson" />
          <span className="text-lg font-black tracking-tight">heyuka</span>
        </Link>
        <button
          type="button"
          onClick={enterConversation}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>
            {isRtl
              ? "الدخول مباشرة إلى المحادثة"
              : safeLocale === "fr"
              ? "Continuer dans HEYUKA"
              : "Continue in HEYUKA"}
          </span>
        </button>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="py-16 text-center text-xs text-[var(--kaspi-text-muted)]">
            Loading shared conversation...
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl kaspi-glass-surface text-center space-y-3">
            <p className="text-sm font-bold text-rose-400">{error}</p>
            <Link
              href={`/${safeLocale}/chat`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-zinc-900 text-xs font-bold"
            >
              Start a new HEYUKA chat
            </Link>
          </div>
        ) : (
          share && (
            <>
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-rose-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    Shared by {share.authorLabel} • {share.model}
                  </span>
                </span>
                <h1 className="text-xl sm:text-2xl font-bold">{share.title}</h1>
              </div>

              <div className="space-y-4">
                {share.turns.map((turn, idx) => (
                  <div
                    key={turn.id || idx}
                    className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${
                      turn.role === "user"
                        ? "kaspi-glass-surface border border-[var(--kaspi-border)] ml-auto max-w-[85%]"
                        : "space-y-2"
                    }`}
                  >
                    {turn.reasoning && (
                      <div className="border-l-2 border-rose-500/40 pl-3 text-xs text-[var(--kaspi-text-muted)] mb-2">
                        Thought for {turn.thinkingSec || 2}s — {turn.reasoning}
                      </div>
                    )}
                    {turn.sources && turn.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {turn.sources.map((s, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full kaspi-glass-surface text-[10px] text-rose-400"
                          >
                            <Globe className="w-3 h-3" />
                            <span>{s.title}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    <div>{turn.content}</div>
                  </div>
                ))}
              </div>

              {/* Instant Gmail Gate / Direct Entry to Continue This Exact Conversation */}
              <div className="rounded-3xl kaspi-glass-surface border border-rose-500/35 p-6 space-y-4">
                <h2 className="text-base font-bold">
                  {isRtl
                    ? "اكمل هذه المحادثة مباشرة باستخدام بريدك Gmail"
                    : safeLocale === "fr"
                    ? "Choisissez votre Gmail pour poursuivre cette discussion"
                    : "Choose your Gmail to continue directly inside this conversation"}
                </h2>
                {authenticated ? (
                  <button
                    type="button"
                    onClick={enterConversation}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                  >
                    <span>
                      {isRtl
                        ? "متابعة في HEYUKA Chat الآن"
                        : "Continue inside this thread now"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <HEYUKAGmailAccessCard
                    locale={safeLocale}
                    compact
                    source="heyuka_share"
                    onAuthenticated={async () => {
                      enterConversation();
                    }}
                  />
                )}
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
}
