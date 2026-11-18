"use client";

import React, { useState } from "react";
import { Layout, Globe, Smartphone, Monitor, ShoppingBag, MessageCircle, Sparkles, Check, MoveVertical, Eye, Share2 } from "lucide-react";
import { toast } from "sonner";
import { usePosStore } from "@/client/store/usePosStore";

interface StoreBlock {
  id: string;
  type: "hero" | "categories" | "products" | "badges" | "whatsapp_cta";
  title: string;
  subtitle?: string;
  visible: boolean;
}

export const KaspiPuckStorefrontBuilder: React.FC<{ locale?: string }> = ({ locale = "ar" }) => {
  const { tenantInfo, storeType } = usePosStore();
  const [deviceView, setDeviceView] = useState<"mobile" | "desktop">("mobile");
  const [storeSector, setStoreSector] = useState<string>(storeType || "grocery");
  const [storeSlogan, setStoreSlogan] = useState("أجود السلع بأفضل الأسعار مع التوصيل السريع لباب دارك");
  const [storeName, setStoreName] = useState(tenantInfo?.shopName || "متجر كسب أونلاين");
  const [whatsAppNumber, setWhatsAppNumber] = useState("+212600000000");
  const [isPublished, setIsPublished] = useState(false);

  const [blocks, setBlocks] = useState<StoreBlock[]>([
    { id: "b1", type: "hero", title: "واجهة المتجر الرئيسية والبانر الترحيبي", visible: true },
    { id: "b2", type: "badges", title: "شريط الثقة: الدفع عند الاستلام والتوصيل السريع", visible: true },
    { id: "b3", type: "categories", title: "أقسام المتجر والتصنيفات الدائرية", visible: true },
    { id: "b4", type: "products", title: "شبكة المنتجات الأكثر طلباً (مربوطة مع الكاسة)", visible: true },
    { id: "b5", type: "whatsapp_cta", title: "زر الطلب المباشر عبر واتساب (WhatsApp Checkout)", visible: true },
  ]);

  const toggleBlockVisibility = (id: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b))
    );
  };

  const handlePublishStore = () => {
    setIsPublished(true);
    toast.success("تم نشر متجرك الإلكتروني أونلاين بنجاح! الرابط نشط وجاهز للزبائن.");
  };

  const storeUrl = `https://kaspi.store/${tenantInfo?.shopName?.toLowerCase().replace(/[^a-z0-9]/g, "-") || "boutique"}`;

  return (
    <div className="space-y-4 text-start">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl kaspi-glass-btn flex items-center justify-center">
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--kaspi-text-primary)]">
              محرر المواقع والمتاجر الإلكترونية (Puck Visual Storefront Builder)
            </h4>
            <p className="text-[11px] text-[var(--kaspi-text-muted)]">
              ابنِ متجرك الإلكتروني بستايل شوبيفاي مع سحب وإفلات وطلب مباشر عبر واتساب
            </p>
          </div>
        </div>

        {/* Device Switcher & Publish */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl kaspi-glass-surface border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setDeviceView("mobile")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                deviceView === "mobile" ? "kaspi-glass-btn text-white" : "text-zinc-400 hover:text-white"
              }`}
              title="عرض شاشة الهاتف"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceView("desktop")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                deviceView === "desktop" ? "kaspi-glass-btn text-white" : "text-zinc-400 hover:text-white"
              }`}
              title="عرض شاشة الحاسوب"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handlePublishStore}
            className="px-3.5 py-1.5 rounded-xl kaspi-glass-btn text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>نشر المتجر أونلاين</span>
          </button>
        </div>
      </div>

      {isPublished && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 truncate">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-zinc-300">رابط متجرك النشط:</span>
            <a href={storeUrl} target="_blank" rel="noreferrer" className="text-emerald-400 underline font-mono truncate">
              {storeUrl}
            </a>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(storeUrl);
              toast.success("تم نسخ الرابط!");
            }}
            className="px-2.5 py-1 rounded-lg kaspi-glass-btn text-[11px] font-bold text-white shrink-0 cursor-pointer"
          >
            نسخ الرابط
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Visual Controls / Layout Stack (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5 kaspi-glass-surface p-4 rounded-2xl border border-white/10">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
            إعدادات وهوية المتجر الإلكتروني:
          </span>

          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 font-mono">اسم المتجر التجاري:</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 font-mono">الشعار / السلوغان التسويقي:</label>
            <input
              type="text"
              value={storeSlogan}
              onChange={(e) => setStoreSlogan(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 font-mono">رقم واتساب لاستقبال الطلبات:</label>
            <input
              type="text"
              value={whatsAppNumber}
              onChange={(e) => setWhatsAppNumber(e.target.value)}
              placeholder="+212600000000"
              className="w-full px-3 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Sector selection */}
          <div className="space-y-1 pt-1">
            <label className="text-[10px] text-zinc-400 font-mono">قطاع النشاط (قالب مهيأ تلقائياً):</label>
            <select
              value={storeSector}
              onChange={(e) => setStoreSector(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            >
              <option value="grocery">بقالة وسوبرماركت (Supermarché & Epicerie)</option>
              <option value="fashion">ألبسة وموضة (Mode & Prêt-à-porter)</option>
              <option value="restaurant">مطعم ومقهى (Snack, Restaurant, Café)</option>
              <option value="electronics">إلكترونيات وتكنولوجيا (High-Tech & Accessoires)</option>
              <option value="butchery">جزارة ولحوم طازجة (Boucherie & Volaille)</option>
            </select>
          </div>

          {/* Blocks visual reordering & visibility */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
              مكونات الصفحة المرئية (Visual Blocks):
            </span>
            <div className="space-y-1.5">
              {blocks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-2 rounded-xl kaspi-glass-surface border border-white/10 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <MoveVertical className="w-3.5 h-3.5 text-zinc-500 cursor-grab" />
                    <span className={b.visible ? "text-white" : "text-zinc-500 line-through"}>
                      {b.title}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={b.visible}
                    onChange={() => toggleBlockVisibility(b.id)}
                    className="accent-emerald-500 rounded cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Visual Canvas Preview (7 cols) */}
        <div className="lg:col-span-7 flex justify-center items-start bg-black/40 rounded-2xl p-4 border border-white/10 min-h-[480px]">
          <div
            className={`transition-all duration-300 rounded-3xl overflow-hidden shadow-2xl border-4 border-zinc-800 bg-[#0f1115] text-white ${
              deviceView === "mobile" ? "w-[340px] max-w-full" : "w-full"
            }`}
          >
            {/* Mobile Status Bar */}
            {deviceView === "mobile" && (
              <div className="h-6 bg-zinc-950 px-4 flex items-center justify-between text-[10px] font-mono text-zinc-500 border-b border-zinc-800">
                <span>9:41</span>
                <span className="text-emerald-400 font-bold">5G • 100%</span>
              </div>
            )}

            {/* Storefront Live Body */}
            <div className="space-y-4 p-4 text-start font-sans">
              {/* Block 1: Hero */}
              {blocks.find((b) => b.id === "b1")?.visible && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-zinc-900 to-black border border-emerald-500/30 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-black font-extrabold flex items-center justify-center mx-auto text-sm shadow-lg shadow-emerald-500/30">
                    K
                  </div>
                  <h3 className="text-sm font-bold text-white">{storeName}</h3>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">{storeSlogan}</p>
                  <button
                    type="button"
                    className="h-8 px-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-md"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>تصفح المنتجات واطلب</span>
                  </button>
                </div>
              )}

              {/* Block 2: Trust Badges */}
              {blocks.find((b) => b.id === "b2")?.visible && (
                <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] text-zinc-300 font-mono">
                  <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <p className="text-emerald-400 font-bold">🚚 سريع</p>
                    <p>توصيل لباب دارك</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <p className="text-emerald-400 font-bold">💵 نقداً</p>
                    <p>الدفع عند الاستلام</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <p className="text-emerald-400 font-bold">✨ جودة</p>
                    <p>سلع مرخصة ومضمونة</p>
                  </div>
                </div>
              )}

              {/* Block 3: Categories */}
              {blocks.find((b) => b.id === "b3")?.visible && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-400">التصنيفات:</span>
                  <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
                    {["الكل", "العروض الخاصة", "الأكثر مبيعاً", "وصل حديثاً"].map((cat, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1 rounded-full text-[11px] whitespace-nowrap ${
                          i === 0 ? "bg-emerald-500 text-black font-bold" : "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Block 4: Products Grid */}
              {blocks.find((b) => b.id === "b4")?.visible && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400">السلع المميزة:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: "باك التوفير العائلي", price: "120.00 MAD" },
                      { name: "سلعة استهلاكية ممتازة", price: "45.00 MAD" },
                    ].map((p, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                        <div className="h-16 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                        <p className="text-[11px] font-bold text-white truncate">{p.name}</p>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-emerald-400 font-bold font-mono">{p.price}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                            + إضافة
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Block 5: WhatsApp CTA */}
              {blocks.find((b) => b.id === "b5")?.visible && (
                <div className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-between text-xs font-bold shadow-lg transition-all cursor-pointer">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>طلب فوري ومباشر عبر واتساب</span>
                  </div>
                  <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-mono">WhatsApp 24/7</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
