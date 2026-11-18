"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  Smartphone,
  Monitor,
  ShoppingBag,
  MessageCircle,
  Sparkles,
  Check,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { usePosStore } from "@/client/store/usePosStore";
import { offlineDb } from "@/client/db";
import {
  loadPuckStorefront,
  savePuckStorefront,
  type PuckStorefrontData,
} from "@/lib/open-source-engines";

export const KaspiPuckStorefrontBuilder: React.FC<{
  locale?: string;
  onLog?: (msg: string) => void;
}> = ({ locale = "ar", onLog }) => {
  const { tenantInfo, storeType } = usePosStore();
  const [deviceView, setDeviceView] = useState<"mobile" | "desktop">("mobile");
  const [config, setConfig] = useState<PuckStorefrontData>(() =>
    loadPuckStorefront(tenantInfo?.shopName || "ASIMA", storeType || "grocery")
  );
  const [realProducts, setRealProducts] = useState<any[]>([]);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    const loaded = loadPuckStorefront(tenantInfo?.shopName || "ASIMA", storeType || "grocery");
    setConfig(loaded);

    if (offlineDb) {
      offlineDb.offlineProducts
        .toArray()
        .then((prods) => {
          if (prods && prods.length > 0) setRealProducts(prods.slice(0, 6));
        })
        .catch(() => {});
    }
  }, [tenantInfo?.shopName, storeType]);

  const toggleBlockVisibility = (id: string) => {
    const next = {
      ...config,
      blocks: config.blocks.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b)),
    };
    setConfig(savePuckStorefront(next));
  };

  const moveBlock = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= config.blocks.length) return;
    const copy = [...config.blocks];
    const [removed] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, removed);
    const next = { ...config, blocks: copy };
    setConfig(savePuckStorefront(next));
    onLog?.(`[Puck Editor] تم تحريك مكون ${removed.type} وحفظ التخطيط الجديد`);
  };

  const handlePublishStore = () => {
    const saved = savePuckStorefront(config);
    setConfig(saved);
    setIsPublished(true);
    onLog?.(
      `[Puck Storefront Engine] ✔ تم حفظ ونشر المتجر الإلكتروني على المسار الحي: /${locale}/store/${saved.slug}`
    );
    toast.success("تم حفظ ونشر متجرك الإلكتروني بنجاح! يمكنك فتحه الآن.");
  };

  const liveRoute = `/${locale}/store/${encodeURIComponent(config.slug || "boutique")}`;

  return (
    <div className="space-y-4 text-start">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl kaspi-glass-btn flex items-center justify-center">
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--kaspi-text-primary)]">
              Puck — محرر المواقع والمتاجر الإلكترونية المرئي (Shopify-Grade Builder)
            </h4>
            <p className="text-[11px] text-[var(--kaspi-text-muted)]">
              github.com/puckeditor/puck • مربوط مباشرة مع سلع الكاسة الحية ومسار المتجر الفعلي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl kaspi-glass-surface border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setDeviceView("mobile")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                deviceView === "mobile" ? "kaspi-glass-btn text-white" : "text-zinc-400 hover:text-white"
              }`}
              title="عرض الهاتف"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceView("desktop")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                deviceView === "desktop" ? "kaspi-glass-btn text-white" : "text-zinc-400 hover:text-white"
              }`}
              title="عرض الحاسوب"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handlePublishStore}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>حفظ ونشر المتجر</span>
          </button>

          <a
            href={liveRoute}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl kaspi-glass-btn text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span>فتح المتجر الحي</span>
          </a>
        </div>
      </div>

      {isPublished && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 truncate">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-zinc-300">رابط متجرك الحي الجاهز للزبائن:</span>
            <a href={liveRoute} target="_blank" rel="noreferrer" className="text-emerald-400 underline font-mono truncate">
              {liveRoute}
            </a>
          </div>
          <a
            href={liveRoute}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black text-[11px] font-bold shrink-0"
          >
            معاينة المتجر الكامل ↗
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 space-y-3 kaspi-glass-surface p-3.5 rounded-2xl border border-white/10">
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 font-mono">اسم المتجر التجاري:</label>
            <input
              type="text"
              value={config.storeName}
              onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
              className="w-full px-3 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 font-mono">الشعار التسويقي:</label>
            <input
              type="text"
              value={config.slogan}
              onChange={(e) => setConfig({ ...config, slogan: e.target.value })}
              className="w-full px-3 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 font-mono">رقم واتساب لاستقبال الطلبات:</label>
            <input
              type="text"
              value={config.whatsAppPhone}
              onChange={(e) => setConfig({ ...config, whatsAppPhone: e.target.value })}
              className="w-full px-3 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-white font-mono focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 font-mono">قطاع النشاط (قالب القطاع المعتمد):</label>
            <select
              value={config.sector}
              onChange={(e) => setConfig({ ...config, sector: e.target.value as any })}
              className="w-full px-3 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-white focus:outline-none"
            >
              <option value="grocery">بقالة وسوبرماركت (Supermarché & Epicerie)</option>
              <option value="fashion">ألبسة وموضة (Mode & Prêt-à-porter)</option>
              <option value="restaurant">مطعم ومقهى (Snack, Restaurant, Café)</option>
              <option value="electronics">إلكترونيات وتكنولوجيا (High-Tech & Accessoires)</option>
              <option value="butchery">جزارة ولحوم طازجة (Boucherie & Volaille)</option>
              <option value="wholesale">تجارة الجملة والتوزيع (Grossiste & B2B)</option>
            </select>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
              ترتيب وتخصيص المكونات (Drag & Reorder Blocks):
            </span>
            <div className="space-y-1.5">
              {config.blocks.map((b, idx) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-2 rounded-xl kaspi-glass-surface border border-white/10 text-xs"
                >
                  <span className={b.visible ? "text-white font-medium" : "text-zinc-500 line-through"}>
                    {b.type}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveBlock(idx, -1)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                      title="لأعلى"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(idx, 1)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                      title="لأسفل"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <input
                      type="checkbox"
                      checked={b.visible}
                      onChange={() => toggleBlockVisibility(b.id)}
                      className="accent-emerald-500 rounded cursor-pointer ms-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Canvas Preview (7 cols) */}
        <div className="lg:col-span-7 flex justify-center items-start bg-black/40 rounded-2xl p-4 border border-white/10 min-h-[440px]">
          <div
            className={`transition-all duration-300 rounded-3xl overflow-hidden shadow-2xl border-4 border-zinc-800 bg-[#0f1115] text-white ${
              deviceView === "mobile" ? "w-[330px] max-w-full" : "w-full"
            }`}
          >
            <div className="space-y-3.5 p-4 text-start font-sans">
              {config.blocks.map((b) => {
                if (!b.visible) return null;
                if (b.type === "HeroBanner") {
                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-zinc-900 to-black border border-emerald-500/30 text-center space-y-2"
                    >
                      <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-black font-extrabold flex items-center justify-center mx-auto text-sm">
                        {config.storeName.slice(0, 1).toUpperCase()}
                      </div>
                      <h3 className="text-sm font-bold text-white">{config.storeName}</h3>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">{config.slogan}</p>
                    </div>
                  );
                }
                if (b.type === "TrustBadges") {
                  return (
                    <div key={b.id} className="grid grid-cols-3 gap-1.5 text-center text-[9px] text-zinc-300 font-mono">
                      <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                        <p className="text-emerald-400 font-bold">🚚 سريع</p>
                        <p>توصيل فوري</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                        <p className="text-emerald-400 font-bold">💵 نقداً</p>
                        <p>عند الاستلام</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                        <p className="text-emerald-400 font-bold">✨ أصلي</p>
                        <p>جودة مضمونة</p>
                      </div>
                    </div>
                  );
                }
                if (b.type === "ProductGrid") {
                  const displayList =
                    realProducts.length > 0
                      ? realProducts.slice(0, 4)
                      : [
                          { name: "منتج المتجر الأول", salePrice: 120 },
                          { name: "منتج المتجر الثاني", salePrice: 45 },
                        ];
                  return (
                    <div key={b.id} className="space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-400">
                        منتجات الكاسة الحية ({displayList.length}):
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {displayList.map((p, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                            <p className="text-[11px] font-bold text-white truncate">{p.name}</p>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-emerald-400 font-bold font-mono">
                                {Number(p.salePrice ?? p.price ?? 0).toFixed(2)} MAD
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                                + سلة
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                if (b.type === "WhatsAppCheckout") {
                  return (
                    <div
                      key={b.id}
                      className="p-2.5 rounded-xl bg-emerald-600 text-white flex items-center justify-between text-xs font-bold"
                    >
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4" />
                        <span>طلب مباشر عبر واتساب</span>
                      </div>
                      <span className="text-[10px] font-mono">24/7</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
