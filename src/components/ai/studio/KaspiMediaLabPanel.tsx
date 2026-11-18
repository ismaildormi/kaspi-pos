"use client";

import React, { useState } from "react";
import {
  Wand2,
  Image as ImageIcon,
  Search,
  Scissors,
  Download,
  Loader2,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { getApiUrl } from "@/client/sync-engine";
import { removeImageBackgroundLocal } from "@/lib/zebra-x/media-client";

interface WebPhotoItem {
  title: string;
  imageUrl: string;
  thumbUrl: string;
  source: string;
}

export const KaspiMediaLabPanel: React.FC<{ locale: string }> = ({ locale }) => {
  const isAr = locale === "ar";
  const [subTab, setSubTab] = useState<"generate" | "web" | "bg">("generate");

  // Generate
  const [genPrompt, setGenPrompt] = useState("Moroccan olive oil luxury glass bottle studio product photography");
  const [genBusy, setGenBusy] = useState(false);
  const [genImageUrl, setGenImageUrl] = useState<string | null>(null);

  // Web search
  const [searchQuery, setSearchQuery] = useState("smartphone flagship");
  const [searchBusy, setSearchBusy] = useState(false);
  const [webImages, setWebImages] = useState<WebPhotoItem[]>([]);

  // Background remover
  const [bgSourcePreview, setBgSourcePreview] = useState<string | null>(null);
  const [bgResultDataUrl, setBgResultDataUrl] = useState<string | null>(null);
  const [bgMethod, setBgMethod] = useState<string | null>(null);
  const [bgBusy, setBgBusy] = useState(false);
  const [bgError, setBgError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!genPrompt.trim() || genBusy) return;
    setGenBusy(true);
    try {
      const res = await fetch(getApiUrl("/api/ai/media-tools"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_image", prompt: genPrompt }),
      });
      const data = await res.json();
      if (res.ok && data?.imageUrl) {
        setGenImageUrl(data.proxyImageUrl || data.imageUrl);
        void fetch(getApiUrl("/api/ai/zebra-trace"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "MEDIA_OP",
            outcomeStatus: "SUCCESS",
            modelUsed: "pollinations-studio",
            userPrompt: genPrompt,
            assistantResponse: `Generated product image URL`,
            toolNamesUsed: ["generateProductImage"],
          }),
        }).catch(() => {});
      }
    } finally {
      setGenBusy(false);
    }
  };

  const handleWebSearch = async () => {
    if (!searchQuery.trim() || searchBusy) return;
    setSearchBusy(true);
    try {
      const res = await fetch(
        getApiUrl(`/api/ai/media-tools?action=web_images&q=${encodeURIComponent(searchQuery)}`)
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data?.results)) {
        setWebImages(data.results);
      }
    } finally {
      setSearchBusy(false);
    }
  };

  const runRemoveBg = async (source: Blob | string) => {
    setBgBusy(true);
    setBgError(null);
    setBgResultDataUrl(null);
    try {
      if (typeof source === "string") {
        setBgSourcePreview(source);
      } else {
        setBgSourcePreview(URL.createObjectURL(source));
      }
      const res = await removeImageBackgroundLocal(source);
      setBgResultDataUrl(res.dataUrl);
      setBgMethod(res.method === "imgly_onnx" ? "ONNX AI Neural Segmentation (Local)" : "Canvas Edge Cutout (Local)");
    } catch (err: any) {
      setBgError(String(err?.message || "Failed removing background"));
    } finally {
      setBgBusy(false);
    }
  };

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-6xl mx-auto">
      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "generate" as const, icon: Wand2, label: isAr ? "توليد صور المنتجات" : "AI Image Generator" },
          { id: "web" as const, icon: Search, label: isAr ? "جلب صور من الويب" : "Web Product Photos" },
          { id: "bg" as const, icon: Scissors, label: isAr ? "إزالة الخلفية (محلياً)" : "Background Remover (Local)" },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                active
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Generate AI Product Photo */}
      {subTab === "generate" && (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={genPrompt}
              onChange={(e) => setGenPrompt(e.target.value)}
              placeholder={isAr ? "صف صورة المنتج..." : "Describe commercial product image..."}
              className="flex-1 rounded-xl bg-zinc-950/60 border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
            />
            <button
              type="button"
              disabled={genBusy}
              onClick={() => void handleGenerate()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {genBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
              <span>{isAr ? "توليد الصورة" : "Generate"}</span>
            </button>
          </div>

          {genImageUrl && (
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <img
                src={genImageUrl}
                alt="Generated product"
                className="w-64 h-64 object-cover rounded-2xl border border-white/15 bg-zinc-950"
              />
              <div className="space-y-2">
                <a
                  href={genImageUrl}
                  download="kaspi-product.png"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isAr ? "تحميل الصورة" : "Download PNG"}</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSubTab("bg");
                    void runRemoveBg(genImageUrl);
                  }}
                  className="block px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 cursor-pointer"
                >
                  {isAr ? "إزالة الخلفية مباشرة ✂️" : "Send to Background Remover ✂️"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Real Web Product Search */}
      {subTab === "web" && (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleWebSearch()}
              placeholder={isAr ? "ابحث عن صور منتج من الويب..." : "Search web product photos..."}
              className="flex-1 rounded-xl bg-zinc-950/60 border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
            />
            <button
              type="button"
              disabled={searchBusy}
              onClick={() => void handleWebSearch()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {searchBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>{isAr ? "بحث فوري" : "Search Web"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {webImages.map((img, i) => (
              <div
                key={`${img.imageUrl}-${i}`}
                className="rounded-xl border border-white/10 bg-zinc-950/60 overflow-hidden flex flex-col"
              >
                <img
                  src={img.thumbUrl}
                  alt={img.title}
                  className="w-full h-36 object-cover bg-zinc-900"
                />
                <div className="p-2 flex flex-col gap-1.5 flex-1 justify-between">
                  <span className="text-[10px] text-zinc-300 line-clamp-1">{img.title}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSubTab("bg");
                      void runRemoveBg(img.imageUrl);
                    }}
                    className="w-full py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold cursor-pointer"
                  >
                    {isAr ? "إزالة الخلفية" : "Remove BG"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Local Real Background Removal */}
      {subTab === "bg" && (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-white">
                {isAr ? "إزالة الخلفية بالذكاء الاصطناعي داخل جهازك (مجاناً 100%)" : "Local In-Browser AI Background Remover ($0 API cost)"}
              </h4>
              <p className="text-[11px] text-zinc-400">
                {isAr
                  ? "يرفع صورة المنتج ويفرغ الخلفية إلى PNG شفاف مباشرة عبر WebAssembly بدون أي خادم خارجي."
                  : "Uploads a product photo and creates a transparent PNG locally using ONNX WebAssembly."}
              </p>
            </div>
            <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>{isAr ? "اختر صورة منتج" : "Upload Product Photo"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void runRemoveBg(file);
                }}
              />
            </label>
          </div>

          {bgBusy && (
            <div className="py-10 flex items-center justify-center gap-2 text-xs text-emerald-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isAr ? "جاري قص الخلفية بدقة محلياً..." : "Segmenting foreground locally..."}</span>
            </div>
          )}

          {bgError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {bgError}
            </div>
          )}

          {(bgSourcePreview || bgResultDataUrl) && !bgBusy && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bgSourcePreview && (
                <div className="rounded-xl border border-white/10 p-3 space-y-2">
                  <span className="text-[11px] text-zinc-400">{isAr ? "الأصل" : "Original"}</span>
                  <img src={bgSourcePreview} alt="Original" className="w-full h-56 object-contain rounded-lg bg-zinc-950" />
                </div>
              )}
              {bgResultDataUrl && (
                <div className="rounded-xl border border-emerald-500/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{bgMethod}</span>
                    </span>
                    <a
                      href={bgResultDataUrl}
                      download="kaspi-cutout.png"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold"
                    >
                      <Download className="w-3 h-3" />
                      <span>PNG</span>
                    </a>
                  </div>
                  <div
                    className="w-full h-56 rounded-lg flex items-center justify-center overflow-hidden"
                    style={{
                      backgroundImage:
                        "linear-gradient(45deg, #27272a 25%, transparent 25%), linear-gradient(-45deg, #27272a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #27272a 75%), linear-gradient(-45deg, transparent 75%, #27272a 75%)",
                      backgroundSize: "16px 16px",
                      backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                    }}
                  >
                    <img src={bgResultDataUrl} alt="Transparent cutout" className="max-h-full max-w-full object-contain" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
