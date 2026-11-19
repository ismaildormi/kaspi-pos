"use client";

import React, { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Check, Copy, ExternalLink, PackagePlus, Power, Trash2 } from "lucide-react";
import {
  SPECIALIZED_PRODUCTS,
  type SpecializedProductId,
} from "@/lib/heyuka/ecosystem/products-catalog";
import type {
  CustomMiniProductRecord,
  ProductAccentColor,
} from "@/lib/heyuka/ecosystem/mini-products-store";
import type { PortalLocale } from "./platform-data";

export function PlatformProductsFactoryView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";

  const [products, setProducts] = useState<CustomMiniProductRecord[]>([]);
  const [baseId, setBaseId] = useState<SpecializedProductId>("background-studio");
  const [name, setName] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [accentColor, setAccentColor] = useState<ProductAccentColor>("emerald");
  const [dailyRateLimit, setDailyRateLimit] = useState(250);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [createdKeyOnce, setCreatedKeyOnce] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      const r = await fetch("/api/v1/heyuka/products", { cache: "no-store" });
      if (!r.ok) return;
      const json = await r.json();
      setProducts(Array.isArray(json.products) ? json.products : []);
    } catch {}
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const copyText = async (id: string, val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedId(id);
      setTimeout(() => setCopiedId((p) => (p === id ? null : p)), 1800);
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/v1/heyuka/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseProductId: baseId,
          name: name.trim() || `${baseId} Widget`,
          customInstructions: customInstructions.trim() || undefined,
          accentColor,
          dailyRateLimit,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json?.error?.message || "Sign in required to create specialized mini-products.");
        return;
      }
      setCreatedKeyOnce(json.secretKeyOnce || null);
      setName("");
      setCustomInstructions("");
      await loadProducts();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="kaspi-glass-card kaspi-polar-aurora-orbit relative rounded-3xl p-6 sm:p-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full kaspi-glass-surface text-xs font-semibold text-rose-500">
          <PackagePlus className="w-3.5 h-3.5" />
          <span>Tenant-Isolated Mini-Product Factory &amp; Website Embeds</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">
          Build Specialized HEYUKA Mini-Products &amp; Connect Websites
        </h1>
        <p className="text-xs sm:text-sm text-[var(--kaspi-text-secondary)] max-w-3xl">
          Create a focused version of any HEYUKA Studio (e.g. strictly Background Cutouts or Coding Support), issue its own scoped API Key (`hk-live-...`), customize instructions, embed cleanly via iframe, monitor usage, or pause anytime.
        </p>
      </section>

      <form onSubmit={handleCreate} className="kaspi-glass-card rounded-3xl p-5 sm:p-7 space-y-4">
        <div className="space-y-2">
          <div className="text-xs font-bold text-[var(--kaspi-text-secondary)]">
            1. Select Base HEYUKA Studio
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SPECIALIZED_PRODUCTS.map((sp) => (
              <button
                key={sp.id}
                type="button"
                onClick={() => setBaseId(sp.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  baseId === sp.id
                    ? "kaspi-orbit-active text-rose-500"
                    : "kaspi-glass-surface text-[var(--kaspi-text-secondary)]"
                }`}
              >
                {sp.name.replace("HEYUKA ", "")}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product Name (e.g. Store BG Cutout Service)"
            className="md:col-span-6 rounded-2xl kaspi-glass-surface px-4 py-2.5 text-xs focus:outline-none"
          />
          <div className="md:col-span-4 flex items-center gap-1.5">
            {(["emerald", "teal", "violet", "amber", "titanium"] as ProductAccentColor[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setAccentColor(c)}
                className={`flex-1 py-2 rounded-xl text-[11px] font-bold cursor-pointer ${
                  accentColor === c ? "kaspi-orbit-active text-rose-500" : "kaspi-glass-surface"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={10}
            max={5000}
            value={dailyRateLimit}
            onChange={(e) => setDailyRateLimit(Number(e.target.value) || 250)}
            className="md:col-span-2 rounded-2xl kaspi-glass-surface px-3 py-2 text-xs font-mono focus:outline-none"
          />
        </div>

        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          rows={3}
          placeholder="Optional specialized system directive (e.g. Answer only coding & TypeScript questions for Acme Store...)"
          className="w-full rounded-2xl kaspi-frosted-surface p-3.5 text-xs focus:outline-none"
        />

        {err && <div className="text-xs text-rose-500 font-semibold">{err}</div>}

        <button
          type="submit"
          disabled={busy}
          className="kaspi-primary-cta-btn rounded-2xl px-5 py-3 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
        >
          <PackagePlus className="w-4 h-4" />
          <span>{busy ? "Deploying Mini-Product..." : "Create Specialized Product + Key"}</span>
        </button>
      </form>

      {createdKeyOnce && (
        <section className="kaspi-glass-card rounded-3xl p-5 space-y-2">
          <div className="text-xs font-bold text-rose-500">
            Project-Scoped Secret API Key Created (Save Once):
          </div>
          <div className="flex items-center justify-between gap-2 kaspi-frosted-surface rounded-2xl p-3">
            <code dir="ltr" className="font-mono text-xs break-all">{createdKeyOnce}</code>
            <button
              type="button"
              onClick={() => void copyText("once-prd", createdKeyOnce)}
              className="kaspi-primary-cta-btn rounded-xl px-3 py-1.5 text-xs font-bold shrink-0 cursor-pointer"
            >
              {copiedId === "once-prd" ? "Copied OK" : "Copy Key"}
            </button>
          </div>
        </section>
      )}

      {/* Existing Tenant Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((p) => {
          const embedUrl = `https://kaspi-pos.vercel.app/${locale}/embed/${p.id}`;
          const iframeSnippet = `<iframe src="${embedUrl}" width="420" height="620" style="border:none;border-radius:20px;"></iframe>`;
          return (
            <div key={p.id} className="kaspi-glass-card rounded-3xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full kaspi-glass-surface text-rose-500 font-bold">
                      {p.baseProductId}
                    </span>
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        p.enabled ? "text-rose-500" : "text-rose-500"
                      }`}
                    >
                      {p.enabled ? "ACTIVE" : "PAUSED"}
                    </span>
                  </div>
                  <h2 className="text-base font-black mt-1">{p.name}</h2>
                  <div dir="ltr" className="text-[11px] font-mono text-[var(--kaspi-text-muted)]">
                    {p.id} • Key ID: {p.apiKeyId} • Usage: {p.usageCount}/{p.dailyRateLimit} • Errors: {p.errorCount}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch("/api/v1/heyuka/products", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ productId: p.id, enabled: !p.enabled }),
                      });
                      await loadProducts();
                    }}
                    className="kaspi-glass-btn rounded-xl p-1.5 cursor-pointer"
                    title={p.enabled ? "Pause Product" : "Enable Product"}
                  >
                    <Power className={`w-3.5 h-3.5 ${p.enabled ? "text-rose-500" : "text-rose-500"}`} />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch(`/api/v1/heyuka/products?id=${encodeURIComponent(p.id)}`, {
                        method: "DELETE",
                      });
                      await loadProducts();
                    }}
                    className="kaspi-glass-btn rounded-xl p-1.5 text-rose-500 cursor-pointer"
                    title="Delete & Revoke Key"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="kaspi-frosted-surface rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span>Embed Widget Code</span>
                  <div className="flex gap-2">
                    <a
                      href={`/${locale}/embed/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-500 hover:underline inline-flex items-center gap-1"
                    >
                      Preview <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => void copyText(`emb-${p.id}`, iframeSnippet)}
                      className="text-rose-500 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === `emb-${p.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copy iframe
                    </button>
                  </div>
                </div>
                <pre dir="ltr" className="text-[10px] font-mono overflow-x-auto whitespace-pre-wrap">
                  {iframeSnippet}
                </pre>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
