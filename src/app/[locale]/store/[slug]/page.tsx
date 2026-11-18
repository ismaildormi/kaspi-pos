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
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { offlineDb } from "@/client/db";
import { loadPuckStorefront, type PuckStorefrontData } from "@/lib/open-source-engines";
import { toast, Toaster } from "sonner";

export default function MerchantPublicStorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "ar";
  const slug = (params?.slug as string) || "boutique";

  const [storeConfig, setStoreConfig] = useState<PuckStorefrontData>(() =>
    loadPuckStorefront(decodeURIComponent(slug))
  );
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [cart, setCart] = useState<Record<string, { product: any; qty: number }>>({});

  useEffect(() => {
    const loaded = loadPuckStorefront(decodeURIComponent(slug));
    setStoreConfig(loaded);

    async function loadStoreProducts() {
      if (offlineDb) {
        try {
          const localProds = await offlineDb.offlineProducts.toArray();
          if (localProds && localProds.length > 0) {
            setProducts(localProds);
            return;
          }
        } catch {}
      }
      try {
        const res = await fetch("/api/v1/products");
        if (res.ok) {
          const json = await res.json();
          const list = json?.data?.products || json?.products || [];
          if (Array.isArray(list) && list.length > 0) {
            setProducts(list);
          }
        }
      } catch {}
    }
    loadStoreProducts();
  }, [slug]);

  const addToCart = (prod: any) => {
    setCart((prev) => {
      const existing = prev[prod.id];
      return {
        ...prev,
        [prod.id]: {
          product: prod,
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
    (acc, item) => acc + Number(item.product.salePrice ?? item.product.price ?? 0) * item.qty,
    0
  );

  const handleWhatsAppCheckout = () => {
    if (cartEntries.length === 0) {
      toast.error("السلة فارغة، اختر بعض المنتجات أولاً");
      return;
    }
    const lines = cartEntries.map(
      (it, idx) =>
        `${idx + 1}. ${it.product.name} (×${it.qty}) = ${(
          Number(it.product.salePrice ?? it.product.price ?? 0) * it.qty
        ).toFixed(2)} MAD`
    );
    const msg = `🛍️ *طلبية جديدة من متجر ${storeConfig.storeName}*\n\n${lines.join(
      "\n"
    )}\n\n💰 *المجموع الإجمالي: ${totalAmount.toFixed(2)} MAD*\n📍 يرجى تأكيد التوصيل.`;
    const cleanPhone = (storeConfig.whatsAppPhone || "").replace(/[^0-9]/g, "");
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#0c0e12] text-white font-sans pb-28" dir={locale === "ar" ? "rtl" : "ltr"}>
      <Toaster position="top-center" />

      {/* Top Sticky Store Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-black/60 border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-3 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>العودة للاستوديو</span>
          </button>
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-black font-black flex items-center justify-center text-sm shadow-lg shadow-emerald-500/25">
            {storeConfig.storeName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-white">{storeConfig.storeName}</h1>
            <p className="text-[11px] text-emerald-400 font-mono">Powered by Kaspi Puck Storefront Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleWhatsAppCheckout}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>السلة ({cartEntries.length}) • {totalAmount.toFixed(2)} MAD</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-8">
        {/* Hero Block */}
        {storeConfig.blocks.find((b) => b.type === "HeroBanner")?.visible !== false && (
          <section className="rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-emerald-950/70 via-zinc-900/90 to-black border border-emerald-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>متجر إلكتروني رسمي معتمد</span>
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                {storeConfig.storeName}
              </h2>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                {storeConfig.slogan}
              </p>
            </div>

            <div className="w-full md:w-80">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن سلعة أو منتج في المتجر..."
                  className="w-full ps-10 pe-4 py-3 rounded-2xl bg-black/60 border border-white/15 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute start-3.5 top-3.5" />
              </div>
            </div>
          </section>
        )}

        {/* Trust Badges Block */}
        {storeConfig.blocks.find((b) => b.type === "TrustBadges")?.visible !== false && (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl kaspi-glass-surface border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">توصيل سريع لباب دارك</h3>
                <p className="text-[11px] text-zinc-400">خدمة توصيل فورية لجميع الأحياء</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl kaspi-glass-surface border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">الدفع عند الاستلام</h3>
                <p className="text-[11px] text-zinc-400">خلص حتى توصلك السلعة وتفحصها</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl kaspi-glass-surface border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">جودة وأثمنة مضمونة</h3>
                <p className="text-[11px] text-zinc-400">مرتبط مباشرة بمخزون الكاسة الحي</p>
              </div>
            </div>
          </section>
        )}

        {/* Categories Block */}
        {storeConfig.blocks.find((b) => b.type === "CategoryPills")?.visible !== false && (
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {["الكل", "الأكثر مبيعاً", "العروض الخاصة", "وصل حديثاً"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === cat
                    ? "bg-emerald-500 text-black shadow-md"
                    : "kaspi-glass-surface text-zinc-300 border border-white/10 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Live Products Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">
              كتالوج المنتجات المتوفرة ({filteredProducts.length})
            </h3>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-10 rounded-3xl kaspi-glass-surface border border-white/10 text-center space-y-2">
              <ShoppingBag className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">لا توجد سلع مطابقة للبحث حالياً</p>
              <p className="text-xs text-zinc-400">كل سلعة تضيفها في الكاسة تظهر هنا تلقائياً لزبنائك.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredProducts.map((prod) => {
                const price = Number(prod.salePrice ?? prod.price ?? 0);
                const inCart = cart[prod.id]?.qty || 0;
                return (
                  <div
                    key={prod.id}
                    className="rounded-2xl kaspi-glass-surface border border-white/10 p-3.5 flex flex-col justify-between gap-3 hover:border-emerald-500/40 transition-all"
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
                      <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2">{prod.name}</h4>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{prod.sku || "SKU"}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {price.toFixed(2)} MAD
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
                          <span className="text-xs font-mono font-bold w-5 text-center">{inCart}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(prod.id, 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-500 text-black flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(prod)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black text-xs font-bold border border-emerald-500/40 transition-all cursor-pointer"
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
      </main>

      {/* Floating Bottom WhatsApp Checkout Bar */}
      {cartEntries.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 max-w-xl mx-auto z-40 p-3.5 rounded-2xl bg-emerald-600 text-white shadow-2xl flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold">
              سلة المشتريات ({cartEntries.reduce((a, i) => a + i.qty, 0)} قطع)
            </p>
            <p className="text-sm font-black font-mono">{totalAmount.toFixed(2)} MAD</p>
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
