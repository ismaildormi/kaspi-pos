"use client";

import React, { useEffect, useState } from "react";
import { Send, ShieldCheck, Sparkles } from "lucide-react";

export function PublicEmbedWidgetClient({ productId }: { productId: string }) {
  const [info, setInfo] = useState<{
    name: string;
    tagline: string;
    widgetTitle: string;
    accentColor: string;
    enabled: boolean;
    baseProductId: string;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/heyuka/widget?widgetId=${encodeURIComponent(productId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.widget) setInfo(j.widget);
        else setErr(j?.error?.message || "Widget unavailable");
      })
      .catch(() => setErr("Failed loading widget"));
  }, [productId]);

  const sendMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    const txt = input.trim();
    if (!txt || busy) return;
    setMessages((prev) => [...prev, { role: "user", content: txt }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/v1/heyuka/widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgetId: productId, message: txt }),
      });
      const json = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.ok
            ? String(json.reply || "")
            : json?.error?.message || "Request rejected cleanly.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  if (err) {
    return (
      <div className="min-h-screen bg-[var(--kaspi-bg)] text-[var(--kaspi-text-primary)] p-6 flex items-center justify-center">
        <div className="kaspi-glass-card rounded-3xl p-6 text-xs font-semibold text-rose-500">{err}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--kaspi-bg)] text-[var(--kaspi-text-primary)] p-3 flex flex-col">
      <div className="flex-1 kaspi-glass-card kaspi-polar-aurora-orbit relative rounded-3xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--kaspi-border)] pb-2.5">
          <div>
            <div className="text-sm font-black flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>{info?.widgetTitle || "HEYUKA Embedded Studio"}</span>
            </div>
            <div className="text-[11px] text-[var(--kaspi-text-muted)]">
              {info?.tagline || info?.baseProductId || ""}
            </div>
          </div>
          <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
        </div>

        <div className="flex-1 kaspi-frosted-surface rounded-2xl p-3 overflow-y-auto space-y-2 min-h-[260px]">
          {messages.length === 0 ? (
            <div className="text-xs text-[var(--kaspi-text-muted)] text-center pt-10">
              Ask a question within {info?.name || "this product"} scope.
            </div>
          ) : (
            messages.map((m, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-2.5 text-xs whitespace-pre-wrap ${
                  m.role === "user" ? "kaspi-glass-surface ms-6" : "kaspi-glass-card me-4"
                }`}
              >
                {m.content}
              </div>
            ))
          )}
        </div>

        <form onSubmit={sendMsg} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={info?.enabled === false}
            placeholder={info?.enabled === false ? "Widget paused by owner" : "Type message..."}
            className="flex-1 rounded-2xl kaspi-glass-surface px-3.5 py-2 text-xs focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || info?.enabled === false}
            className="kaspi-primary-cta-btn rounded-2xl px-4 py-2 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
