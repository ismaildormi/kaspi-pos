"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ShoppingBag,
  MessageCircle,
  Truck,
  ShieldCheck,
  Banknote,
  Plus,
  Minus,
  Search,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import {
  aggregateMerchantStoreContext,
  type AggregatedStoreContext,
} from "@/lib/ai/store-context-builder";
import {
  loadPuckDraftOrPublished,
  type PuckData,
} from "@/lib/open-source-engines";
import { toast, Toaster } from "sonner";

export default function MerchantPublicStorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "ar";
  const slug = (params?.slug as string) || "boutique";

  const [storeCtx, setStoreCtx] = useState<AggregatedStoreContext | null>(null);
  const [puckData, setPuckData] = useState<PuckData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [cart, setCart] = useState<
    Record<string, { product: { id: string; name: string; price: number; sku: string }; qty: number }>
  >({});

  useEffect(() => {
    aggregateMerchantStoreContext({
      shopName: decodeURIComponent(slug),
    }).then((ctx) => {
      setStoreCtx(ctx);
      const loaded = loadPuckDraftOrPublished(ctx);
      setPuckData(loaded.activeData);
    });
  }, [slug]);

  const currency = puckData?.root?.props?.currency || storeCtx?.currency || "MAD";
  const storeTitle = puckData?.root?.props?.title || storeCtx?.storeName || decodeURIComponent(slug);
  const whatsAppPhone = puckData?.root?.props?.whatsAppPhone || storeCtx?.contactInfo?.whatsAppPhone || "";

  const heroSec = puckData?.content.find((c) => c.type === "HeroSection");
  const cardsSec = puckData?.content.find((c) => c.type === "ProductCards");
  const promoSec = puckData?.content.find((c) => c.type === "PromotionalBanners");
  const badgesSec = puckData?.content.find((c) => c.type === "TrustBadges");
  const aboutSec = puckData?.content.find((c) => c.type === "AboutStore");
  const contactSec = puckData?.content.find((c) => c.type === "ContactInformation");
  const footerSec = puckData?.content.find((c) => c.type === "Footer");

  const products = Array.isArray(cardsSec?.props?.products)
    ? (cardsSec.props.products as any[])
    : storeCtx?.products || [];

  const categories = ["الكل", ...(storeCtx?.categories || [])];

  const addToCart = (prod: any) => {
    const price = Math.max(0, Number(prod.price ?? prod.priceMAD ?? 0));
    setCart((prev) => {
      const existing = prev[prod.id];
      return {
        ...prev,
        [prod.id]: {
          product: { id: prod.id, name: prod.name, price, sku: prod.sku || "SKU" },
          qty: (existing?.qty || 0) + 1,
        },
      };
    });
    toast.success(`تمت إضافة ${prod.name} إلى السلة`);
  };

  const updateQty = (prodId: string, delta: number) => {
    setCart((prev) => {
      const existing = prev[prodId];
      if (!existing) return prev;
      const nextQty = existing.qty + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[prodId];
        return copy;
      }
      return {
        ...prev,
        [prodId]: { ...existing, qty: nextQty },
      };
    });
  };

  const cartEntries = Object.values(cart);
  const totalAmount = cartEntries.reduce(
    (acc, item) => acc + item.product.price * item.qty,
    0
  );

  const handleWhatsAppCheckout = () => {
    if (cartEntries.length === 0) {
      toast.error("السلة فارغة، اختر بعض المنتجات أولاً");
      return;
    }
    const lines = cartEntries.map(
      (it, idx) =>
        `${idx + 1}. ${it.product.name} (×${it.qty}) = ${(it.product.price * it.qty).toFixed(2)} ${currency}`
    );
    const msg = `🛍️ *طلبية جديدة من متجر ${storeTitle}*\n\n${lines.join(
      "\n"
    )}\n\n💰 *المجموع الإجمالي: ${totalAmount.toFixed(2)} ${currency}*`;
    const cleanPhone = whatsAppPhone.replace(/[^0-9]/g, "");
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "الكل" && p.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  return (
    <div
      className="min-h-screen bg-[#1e1e1e] text-white font-sans pb-28"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <Toaster position="top-center" />

      {/* 1. Header Section */}
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-black/70 border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-3 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>العودة</span>
          </button>
          <div className="w-9 h-9 rounded-xl bg-[#10b981] text-black font-black flex items-center justify-center text-sm">
            {storeTitle.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-white">{storeTitle}</h1>
            <p className="text-[11px] text-emerald-400 font-mono">
              Powered by KASPI POS × @measured/puck
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleWhatsAppCheckout}
          className="px-4 py-2 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>
            السلة ({cartEntries.length}) • {totalAmount.toFixed(2)} {currency}
          </span>
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* 2. Hero Section */}
        {heroSec?.props.visible !== false && (
          <section className="rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-emerald-950/70 via-[#181a1f] to-black border border-emerald-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>كتالوج المتجر الموثق</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {String(heroSec?.props?.headline || storeTitle)}
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {String(heroSec?.props?.subheadline || "")}
              </p>
            </div>

            <div className="w-full md:w-80">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن سلعة أو منتج..."
                  className="w-full ps-10 pe-4 py-3 rounded-2xl bg-black/60 border border-white/15 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute start-3.5 top-3.5" />
              </div>
            </div>
          </section>
        )}

        {/* 10. Trust Badges */}
        {badgesSec?.props.visible !== false && (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3">
              <Truck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-white">
                {String(badgesSec?.props?.badge1 || "أسعار المتجر الفعلية")}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3">
              <Banknote className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-white">
                {String(badgesSec?.props?.badge2 || "تحديث آلي للمخزون")}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-white">
                {String(badgesSec?.props?.badge3 || "طلب مباشر ومؤكد")}
              </span>
            </div>
          </section>
        )}

        {/* 4. Product Categories */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === cat
                  ? "bg-[#10b981] text-black shadow-md"
                  : "bg-black/40 text-zinc-300 border border-white/10 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 5, 6, 7, 8. Product Grid, Product Cards, Product Images & Prices */}
        <section className="space-y-4">
          <h3 className="text-base font-bold text-white">
            المنتجات المتوفرة ({filteredProducts.length})
          </h3>

          {filteredProducts.length === 0 ? (
            <div className="p-10 rounded-3xl bg-black/40 border border-white/10 text-center space-y-2">
              <ShoppingBag className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">لا توجد سلع مطابقة</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredProducts.map((prod) => {
                const price = Math.max(0, Number(prod.price ?? prod.priceMAD ?? 0));
                const inCart = cart[prod.id]?.qty || 0;
                return (
                  <div
                    key={prod.id}
                    className="rounded-2xl bg-black/40 border border-white/10 p-3.5 flex flex-col justify-between gap-3 hover:border-emerald-500/40 transition-all"
                  >
                    <div>
                      <div className="h-32 rounded-xl bg-white/95 flex items-center justify-center p-2 mb-3 overflow-hidden">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <ShoppingBag className="w-10 h-10 text-zinc-400" />
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2">
                        {prod.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        {prod.sku || "SKU"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {price.toFixed(2)} {currency}
                      </span>

                      {inCart > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateQty(prod.id, -1)}
                            className="w-7 h-7 rounded-lg bg-zinc-800 text-white flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-mono font-bold w-5 text-center">
                            {inCart}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(prod.id, 1)}
                            className="w-7 h-7 rounded-lg bg-[#10b981] text-black flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(prod)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-[#10b981] text-emerald-300 hover:text-black text-xs font-bold border border-emerald-500/40 transition-all cursor-pointer"
                        >
                          + أضف للسلة
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 9. Promotional Banners */}
        {promoSec?.props.visible !== false && (
          <section className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
            <h4 className="text-sm font-bold text-emerald-300">
              {String(promoSec?.props?.title || "")}
            </h4>
            <p className="text-xs text-zinc-300">
              {String(promoSec?.props?.subtitle || "")}
            </p>
          </section>
        )}

        {/* 11 & 12. About Store & Contact Information */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aboutSec?.props.visible !== false && (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <h4 className="text-xs font-bold text-white">
                {String(aboutSec?.props?.title || `عن ${storeTitle}`)}
              </h4>
              <p className="text-xs text-zinc-300">
                {String(aboutSec?.props?.description || "")}
              </p>
            </div>
          )}
          {contactSec?.props.visible !== false &&
            Boolean(contactSec?.props?.city || contactSec?.props?.phone) && (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1 text-xs text-zinc-300">
                <h4 className="font-bold text-white">معلومات الاتصال</h4>
                {Boolean(contactSec?.props?.city) && (
                  <p>📍 {String(contactSec?.props?.city)}</p>
                )}
                {Boolean(contactSec?.props?.phone) && (
                  <p>📞 {String(contactSec?.props?.phone)}</p>
                )}
              </div>
            )}
        </section>

        {/* 14. Footer */}
        {footerSec?.props.visible !== false && (
          <footer className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>{String(footerSec?.props?.copyright || `© ${storeTitle}`)}</span>
            {Boolean(footerSec?.props?.legalIce) && (
              <span>ICE: {String(footerSec?.props?.legalIce)}</span>
            )}
          </footer>
        )}
      </main>

      {/* 13. WhatsApp Ordering Floating Bar */}
      {cartEntries.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 max-w-xl mx-auto z-40 p-3.5 rounded-2xl bg-[#10b981] text-black shadow-2xl flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold">
              سلة المشتريات ({cartEntries.reduce((a, i) => a + i.qty, 0)} قطع)
            </p>
            <p className="text-sm font-black font-mono">
              {totalAmount.toFixed(2)} {currency}
            </p>
          </div>
          <button
            type="button"
            onClick={handleWhatsAppCheckout}
            className="px-4 py-2 rounded-xl bg-black text-emerald-400 font-bold text-xs flex items-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>إرسال الطلبية عبر واتساب</span>
          </button>
        </div>
      )}
    </div>
  );
}
