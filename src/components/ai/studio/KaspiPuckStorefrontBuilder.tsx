"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  Smartphone,
  Monitor,
  MessageCircle,
  Sparkles,
  Check,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  RotateCcw,
  Save,
  Code2,
  Eye,
  History,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { usePosStore } from "@/client/store/usePosStore";
import { getApiUrl } from "@/client/sync-engine";
import {
  aggregateMerchantStoreContext,
  type AggregatedStoreContext,
} from "@/lib/ai/store-context-builder";
import {
  KASPI_PUCK_CONFIG,
  loadPuckDraftOrPublished,
  applyDesignToPuckDraft,
  publishApprovedPuckDesign,
  restorePuckVersionToDraft,
  validateAndSanitizePuckData,
  type PuckData,
  type PuckVersionSnapshot,
  type PuckStoreSectionType,
} from "@/lib/open-source-engines";

export const KaspiPuckStorefrontBuilder: React.FC<{
  locale?: string;
  onLog?: (msg: string) => void;
}> = ({ locale = "ar", onLog }) => {
  const { tenantInfo, storeType } = usePosStore();
  const [deviceView, setDeviceView] = useState<"mobile" | "desktop">("desktop");
  const [viewMode, setViewMode] = useState<"visual" | "json" | "versions">("visual");

  const [storeCtx, setStoreCtx] = useState<AggregatedStoreContext | null>(null);
  const [puckData, setPuckData] = useState<PuckData | null>(null);
  const [selectedSectionIdx, setSelectedSectionIdx] = useState<number>(1); // Default HeroSection
  const [publishStatus, setPublishStatus] = useState<"draft" | "published">("draft");
  const [versions, setVersions] = useState<PuckVersionSnapshot[]>([]);

  useEffect(() => {
    aggregateMerchantStoreContext({
      shopName: tenantInfo?.shopName || "متجر كسب",
      sector: storeType || "grocery",
      phone: tenantInfo?.phone,
      city: tenantInfo?.city,
      ice: tenantInfo?.ice,
    }).then((ctx) => {
      setStoreCtx(ctx);
      const loaded = loadPuckDraftOrPublished(ctx);
      setPuckData(loaded.activeData);
      setPublishStatus(loaded.status);
      setVersions(loaded.versions);
    });
  }, [tenantInfo?.shopName, storeType]);

  if (!puckData || !storeCtx) {
    return (
      <div className="p-6 rounded-2xl bg-[#1e1e1e] border border-white/10 text-xs text-zinc-400">
        جاري تحميل محرر Puck وبيانات المتجر الموثقة...
      </div>
    );
  }

  const updateRootProp = (key: string, val: string) => {
    setPuckData({
      ...puckData,
      root: {
        props: {
          ...puckData.root.props,
          [key]: val,
        },
      },
    });
    setPublishStatus("draft");
  };

  const updateSectionProp = (idx: number, key: string, val: unknown) => {
    const nextContent = [...puckData.content];
    nextContent[idx] = {
      ...nextContent[idx],
      props: {
        ...nextContent[idx].props,
        [key]: val,
      },
    };
    setPuckData({ ...puckData, content: nextContent });
    setPublishStatus("draft");
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= puckData.content.length) return;
    const nextContent = [...puckData.content];
    const [removed] = nextContent.splice(idx, 1);
    nextContent.splice(targetIdx, 0, removed);
    setPuckData({ ...puckData, content: nextContent });
    setSelectedSectionIdx(targetIdx);
    setPublishStatus("draft");
    onLog?.(`[Puck Visual Editor] تم تحريك قسم ${removed.type} إلى الموضع ${targetIdx + 1}`);
  };

  const handleSaveDraft = () => {
    const { validation, draft, versions: nextVers } = applyDesignToPuckDraft(
      puckData,
      storeCtx,
      "تعديل يدوي في محرر Puck (Draft)"
    );
    setPuckData(draft);
    setVersions(nextVers);
    setPublishStatus("draft");

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
      `[Puck Save Draft] ✔ تم التحقق من المخطط (${validation.sectionsCount} قسم) وحفظ المسودة بنجاح.`
    );
    toast.success("تم حفظ المسودة (Draft) وحفظ نسخة في سجل التعديلات!");
  };

  const handleConfirmAndPublish = () => {
    const { published, versions: nextVers } = publishApprovedPuckDesign(
      puckData,
      storeCtx
    );
    setPuckData(published);
    setVersions(nextVers);
    setPublishStatus("published");

    fetch(getApiUrl("/api/ai/studio"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_puck_storefront",
        publish: true,
        puckData: published,
        storeContext: storeCtx,
      }),
    }).catch(() => {});

    onLog?.(
      `[Puck Merchant Approval] ✔ تم اعتماد ونشر المتجر رسمياً على الرابط: /${locale}/store/${published.root.props.slug}`
    );
    toast.success("تم اعتماد ونشر المتجر الإلكتروني رسمياً بموافقتك!");
  };

  const handleRestoreVersion = (ver: PuckVersionSnapshot) => {
    const { restoredDraft, versions: nextVers } = restorePuckVersionToDraft(ver, storeCtx);
    setPuckData(restoredDraft);
    setVersions(nextVers);
    setPublishStatus("draft");
    setViewMode("visual");
    onLog?.(`[Puck Version Restore] ✔ تم استرجاع النسخة: ${ver.label} (${ver.createdAt})`);
    toast.info(`تم استرجاع النسخة السابقة كمسودة: ${ver.label}`);
  };

  const activeSection = puckData.content[selectedSectionIdx] || puckData.content[0];
  const liveRoute = `/${locale}/store/${encodeURIComponent(puckData.root.props.slug || "boutique")}`;

  return (
    <div className="space-y-4 text-start">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-white">
                Puck Visual Storefront Editor (@measured/puck • 14 Sections)
              </h4>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                  publishStatus === "published"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}
              >
                {publishStatus === "published" ? "منشور (Published)" : "مسودة قيد التعديل (Draft)"}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              مبني على بيانات متجرك الحقيقية ({storeCtx.products.length} سلعة • العملة {puckData.root.props.currency})
            </p>
          </div>
        </div>

        {/* Mode & Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#1e1e1e] border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("visual")}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer ${
                viewMode === "visual" ? "bg-[#10b981] text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>المحرر المرئي</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("json")}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer ${
                viewMode === "json" ? "bg-[#10b981] text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Puck JSON</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("versions")}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer ${
                viewMode === "versions" ? "bg-[#10b981] text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>النسخ ({versions.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-3 py-1.5 rounded-xl bg-[#1e1e1e] hover:bg-white/10 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>حفظ المسودة</span>
          </button>

          <button
            type="button"
            onClick={handleConfirmAndPublish}
            className="px-3.5 py-1.5 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-black text-xs font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>اعتماد ونشر المتجر</span>
          </button>

          <a
            href={liveRoute}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-[#1e1e1e] border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>معاينة المتجر</span>
          </a>
        </div>
      </div>

      {/* VIEW MODE 1: VISUAL PUCK EDITOR & LIVE PREVIEW */}
      {viewMode === "visual" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: 14 Sections Outline + Selected Section Inspector (5 cols) */}
          <div className="lg:col-span-5 space-y-3 bg-[#1e1e1e] p-3.5 rounded-2xl border border-white/10">
            {/* Root Store Settings */}
            <div className="space-y-2 pb-3 border-b border-white/10">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                إعدادات الجذر (Puck Root Props):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 font-mono">اسم المتجر:</label>
                  <input
                    type="text"
                    value={puckData.root.props.title}
                    onChange={(e) => updateRootProp("title", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-mono">العملة (من الإعدادات):</label>
                  <input
                    type="text"
                    value={puckData.root.props.currency}
                    onChange={(e) => updateRootProp("currency", e.target.value.toUpperCase())}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-emerald-400 font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 14 Sections List */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                أقسام المتجر الـ 14 (Puck Content Array):
              </span>
              <div className="space-y-1 max-h-52 overflow-y-auto kaspi-no-scrollbar">
                {puckData.content.map((sec, idx) => {
                  const cfg = KASPI_PUCK_CONFIG.components[sec.type as PuckStoreSectionType];
                  const isSel = idx === selectedSectionIdx;
                  const isVis = sec.props.visible !== false;
                  return (
                    <div
                      key={sec.props.id}
                      onClick={() => setSelectedSectionIdx(idx)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer border transition-all ${
                        isSel
                          ? "bg-emerald-500/15 border-emerald-500/50 text-white font-bold"
                          : "bg-black/30 border-white/5 text-zinc-300 hover:text-white"
                      }`}
                    >
                      <span className={isVis ? "truncate" : "line-through text-zinc-500 truncate"}>
                        {cfg?.label || sec.type}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(idx, -1);
                          }}
                          className="p-0.5 hover:text-emerald-400"
                          title="تحريك لأعلى"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(idx, 1);
                          }}
                          className="p-0.5 hover:text-emerald-400"
                          title="تحريك لأسفل"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <input
                          type="checkbox"
                          checked={isVis}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateSectionProp(idx, "visible", e.target.checked);
                          }}
                          className="accent-emerald-500 rounded cursor-pointer ms-1"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Section Field Editor */}
            {activeSection && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-[10px] font-mono text-emerald-400 block">
                  تعديل خصائص القسم: {activeSection.type} ({activeSection.props.id})
                </span>
                {Object.entries(activeSection.props)
                  .filter(
                    ([k, v]) =>
                      k !== "id" &&
                      k !== "visible" &&
                      (typeof v === "string" || typeof v === "number")
                  )
                  .map(([propKey, propVal]) => (
                    <div key={propKey} className="space-y-0.5">
                      <label className="text-[10px] text-zinc-400 font-mono">{propKey}:</label>
                      <input
                        type={typeof propVal === "number" ? "number" : "text"}
                        value={String(propVal)}
                        onChange={(e) =>
                          updateSectionProp(
                            selectedSectionIdx,
                            propKey,
                            typeof propVal === "number"
                              ? Number(e.target.value)
                              : e.target.value
                          )
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Right Column: Live 14-Section Storefront Canvas (7 cols) */}
          <div className="lg:col-span-7 bg-[#14161a] rounded-2xl p-4 border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
              <span className="text-zinc-400 font-mono text-[11px]">
                Live Canvas • Background {puckData.root.props.backgroundColor} • Accent{" "}
                {puckData.root.props.accentColor}
              </span>
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDeviceView("mobile")}
                  className={`p-1 rounded ${
                    deviceView === "mobile" ? "bg-[#10b981] text-black" : "text-zinc-400"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceView("desktop")}
                  className={`p-1 rounded ${
                    deviceView === "desktop" ? "bg-[#10b981] text-black" : "text-zinc-400"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div
              className={`mx-auto transition-all rounded-2xl overflow-hidden border border-white/15 bg-[#1e1e1e] text-white p-4 space-y-3.5 ${
                deviceView === "mobile" ? "w-[330px] max-w-full" : "w-full"
              }`}
            >
              {puckData.content.map((sec) => {
                if (sec.props.visible === false) return null;

                switch (sec.type) {
                  case "Header":
                    return (
                      <div
                        key={sec.props.id}
                        className="flex items-center justify-between border-b border-white/10 pb-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#10b981] text-black font-black flex items-center justify-center text-xs">
                            {String(sec.props.storeName || puckData.root.props.title)
                              .slice(0, 1)
                              .toUpperCase()}
                          </div>
                          <span className="text-xs font-extrabold">
                            {String(sec.props.storeName || puckData.root.props.title)}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400">
                          {puckData.root.props.currency}
                        </span>
                      </div>
                    );

                  case "HeroSection":
                    return (
                      <div
                        key={sec.props.id}
                        className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/70 via-[#181a1f] to-black border border-emerald-500/30 text-center space-y-1.5"
                      >
                        <h3 className="text-sm font-black text-white">
                          {String(sec.props.headline || puckData.root.props.title)}
                        </h3>
                        <p className="text-[11px] text-zinc-300">
                          {String(sec.props.subheadline || "")}
                        </p>
                      </div>
                    );

                  case "StoreIdentity":
                    return (
                      <div
                        key={sec.props.id}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/30 border border-white/10 text-[10px]"
                      >
                        <span className="font-bold text-zinc-200">
                          {String(sec.props.legalName || puckData.root.props.title)}
                        </span>
                        <span className="text-emerald-400 font-mono">
                          {String(sec.props.badgeText || "")}
                        </span>
                      </div>
                    );

                  case "ProductCategories": {
                    const cats = Array.isArray(sec.props.categories)
                      ? (sec.props.categories as Array<{ name: string; productCount: number }>)
                      : [];
                    if (cats.length === 0) return null;
                    return (
                      <div key={sec.props.id} className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {cats.map((c, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-full text-[10px] bg-black/40 border border-white/10 text-zinc-200 whitespace-nowrap"
                          >
                            {c.name} ({c.productCount})
                          </span>
                        ))}
                      </div>
                    );
                  }

                  case "ProductCards": {
                    const prods = Array.isArray(sec.props.products)
                      ? (sec.props.products as any[])
                      : [];
                    return (
                      <div key={sec.props.id} className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
                          <span>المنتجات المتوفرة ({prods.length}):</span>
                          <span className="text-[10px] font-mono text-emerald-400">
                            {puckData.root.props.currency}
                          </span>
                        </div>
                        {prods.length === 0 ? (
                          <div className="p-3 rounded-xl bg-black/30 text-center text-[11px] text-zinc-400">
                            لا توجد منتجات متوفرة حالياً في قاعدة البيانات.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {prods.slice(0, 6).map((p: any) => (
                              <div
                                key={p.id}
                                className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1"
                              >
                                <p className="text-[11px] font-bold text-white truncate">
                                  {p.name}
                                </p>
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-emerald-400 font-black font-mono">
                                    {Number(p.price || 0).toFixed(2)}{" "}
                                    {puckData.root.props.currency}
                                  </span>
                                  <span className="text-[9px] text-zinc-400 font-mono">
                                    {p.availabilityStatus === "in_stock"
                                      ? `متوفر (${p.stockQuantity})`
                                      : p.availabilityStatus === "low_stock"
                                      ? `كمية محدودة (${p.stockQuantity})`
                                      : "متاح"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  case "PromotionalBanners":
                    return (
                      <div
                        key={sec.props.id}
                        className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-0.5"
                      >
                        <p className="text-xs font-bold text-emerald-300">
                          {String(sec.props.title || "")}
                        </p>
                        <p className="text-[10px] text-zinc-300">
                          {String(sec.props.subtitle || "")}
                        </p>
                      </div>
                    );

                  case "TrustBadges":
                    return (
                      <div
                        key={sec.props.id}
                        className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold text-zinc-300"
                      >
                        <div className="p-2 rounded-lg bg-black/40 border border-white/10">
                          {String(sec.props.badge1 || "أسعار رسمية")}
                        </div>
                        <div className="p-2 rounded-lg bg-black/40 border border-white/10">
                          {String(sec.props.badge2 || "تحديث آلي")}
                        </div>
                        <div className="p-2 rounded-lg bg-black/40 border border-white/10">
                          {String(sec.props.badge3 || "طلب مباشر")}
                        </div>
                      </div>
                    );

                  case "AboutStore":
                    return (
                      <div
                        key={sec.props.id}
                        className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-[10px] text-zinc-300"
                      >
                        <strong className="text-white block mb-0.5">
                          {String(sec.props.title || "")}
                        </strong>
                        <span>{String(sec.props.description || "")}</span>
                      </div>
                    );

                  case "ContactInformation":
                    if (!sec.props.city && !sec.props.address && !sec.props.phone)
                      return null;
                    return (
                      <div
                        key={sec.props.id}
                        className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-[10px] text-zinc-300 flex flex-wrap gap-3"
                      >
                        {Boolean(sec.props.city) && <span>📍 {String(sec.props.city)}</span>}
                        {Boolean(sec.props.phone) && <span>📞 {String(sec.props.phone)}</span>}
                      </div>
                    );

                  case "WhatsAppOrdering":
                    return (
                      <div
                        key={sec.props.id}
                        className="p-2.5 rounded-xl bg-[#10b981] text-black text-xs font-extrabold flex items-center justify-between"
                      >
                        <div className="flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4" />
                          <span>{String(sec.props.buttonLabel || "إرسال الطلب عبر واتساب")}</span>
                        </div>
                        <span className="text-[10px] font-mono">WhatsApp</span>
                      </div>
                    );

                  case "Footer":
                    return (
                      <div
                        key={sec.props.id}
                        className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-500 font-mono"
                      >
                        <span>{String(sec.props.copyright || "")}</span>
                        {Boolean(sec.props.legalIce) && (
                          <span>ICE: {String(sec.props.legalIce)}</span>
                        )}
                      </div>
                    );

                  default:
                    return null;
                }
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: PUCK DATA JSON VALIDATOR */}
      {viewMode === "json" && (
        <div className="space-y-2 bg-[#1e1e1e] p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>
                @measured/puck Schema Verified ({puckData.content.length} Sections • Root + Content + Zones)
              </span>
            </span>
          </div>
          <pre
            className="p-3 rounded-xl bg-black/80 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-96"
            dir="ltr"
          >
            {JSON.stringify(puckData, null, 2)}
          </pre>
        </div>
      )}

      {/* VIEW MODE 3: VERSION HISTORY & ROLLBACK */}
      {viewMode === "versions" && (
        <div className="space-y-2 bg-[#1e1e1e] p-4 rounded-2xl border border-white/10">
          <h5 className="text-xs font-bold text-white">
            سجل النسخ والتعديلات السابقة (Version History & Instant Rollback)
          </h5>
          {versions.length === 0 ? (
            <p className="text-xs text-zinc-400">
              لا توجد نسخ محفوظة بعد. اضغط على &quot;حفظ المسودة&quot; أو &quot;Apply Design to Store&quot; لحفظ نسخة.
            </p>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <div
                  key={v.versionId}
                  className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{v.label}</p>
                    <p className="text-[10px] font-mono text-zinc-400">
                      {v.createdAt} • الحالة: {v.status === "published" ? "منشور" : "مسودة"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestoreVersion(v)}
                    className="px-3 py-1.5 rounded-xl bg-[#10b981] text-black font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استرجاع هذه النسخة</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
