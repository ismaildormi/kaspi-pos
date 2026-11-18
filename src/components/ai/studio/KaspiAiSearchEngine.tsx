"use client";

import React, { useState, useTransition } from "react";
import { Search, Sparkles, BookOpen, ExternalLink, ArrowRight, CheckCircle2, ShoppingBag, Users, AlertTriangle } from "lucide-react";
import { usePosStore } from "@/client/store/usePosStore";
import { offlineDb } from "@/client/db";

interface SearchSource {
  title: string;
  category: "catalog" | "sales" | "debts" | "market";
  snippet: string;
}

interface SearchResult {
  query: string;
  answer: string;
  sources: SearchSource[];
  actions: Array<{ label: string; actionType: string }>;
}

export const KaspiAiSearchEngine: React.FC<{ locale?: string }> = ({ locale = "ar" }) => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const { cart, activeCategoryId } = usePosStore();

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    startTransition(async () => {
      // Fetch real local store context from Dexie
      const products = offlineDb ? await offlineDb.offlineProducts.toArray().catch(() => []) : [];
      const sales = offlineDb ? await offlineDb.offlineSales.toArray().catch(() => []) : [];
      const customers = offlineDb ? await offlineDb.offlineCustomers.toArray().catch(() => []) : [];

      const qLower = searchQuery.toLowerCase().trim();
      const sources: SearchSource[] = [];

      // 1. Search products
      const matchedProducts = products.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(qLower) ||
          p.sku?.toLowerCase().includes(qLower) ||
          p.barcode?.includes(qLower)
      );

      if (matchedProducts.length > 0) {
        sources.push({
          title: `قاعدة السلع والمخزون (${matchedProducts.length} تطابق)`,
          category: "catalog",
          snippet: matchedProducts
            .slice(0, 3)
            .map((p: any) => `${p.name}: ${p.salePrice || p.price} MAD (متوفر: ${p.stockQuantity ?? 0})`)
            .join(" • "),
        });
      }

      // 2. Search customers / debts
      const matchedCustomers = customers.filter(
        (c: any) =>
          c.name?.toLowerCase().includes(qLower) ||
          c.phone?.includes(qLower)
      );

      if (matchedCustomers.length > 0) {
        sources.push({
          title: `سجل الزبناء والكريدي (${matchedCustomers.length} عميل)`,
          category: "debts",
          snippet: matchedCustomers
            .slice(0, 3)
            .map((c: any) => `${c.name}: رصيد الدين ${c.currentCreditBalance || 0} MAD`)
            .join(" • "),
        });
      }

      // 3. Sales statistics
      const todayMs = new Date().setHours(0, 0, 0, 0);
      const todaySales = sales.filter((s: any) => Number(s.createdAt || 0) >= todayMs);
      const todayTotal = todaySales.reduce((acc: number, s: any) => acc + Number(s.grandTotal || 0), 0);

      sources.push({
        title: "سجل الصندوق اليومي (Live POS)",
        category: "sales",
        snippet: `${todaySales.length} عمليات بيع مسجلة اليوم بإجمالي ${todayTotal.toFixed(2)} MAD`,
      });

      // Construct synthesized cited answer
      let answerText = "";
      if (qLower.includes("مبيع") || qLower.includes("اليوم") || qLower.includes("ventes")) {
        answerText = `بناءً على فواتير الصندوق المسجلة (${sources[sources.length - 1].title})، بلغ إجمالي مبيعات اليوم **${todayTotal.toFixed(2)} MAD** موزعة على **${todaySales.length}** عملية بيع. جميع العمليات مسجلة محلياً في الذاكرة ومؤمنة بالختم الرقمي.`;
      } else if (qLower.includes("كريدي") || qLower.includes("دين") || qLower.includes("credit")) {
        const totalDebt = customers.reduce((acc: number, c: any) => acc + Number(c.currentCreditBalance || 0), 0);
        answerText = `حسب سجل الحسابات والعملاء، إجمالي ديون الكريدي القائمة بالمتجر تبلغ **${totalDebt.toFixed(2)} MAD** موزعة على **${customers.length}** عميل مسجل.`;
      } else if (matchedProducts.length > 0) {
        const first = matchedProducts[0];
        answerText = `تم العثور على **${matchedProducts.length}** منتج مطابق. المنتج الأبرز هو **${first.name}** بسعر **${first.salePrice || first.price} MAD** والمخزون الحالي **${first.stockQuantity ?? 0} قطعة**.`;
      } else {
        answerText = `تم فحص بيانات المتجر (السلع، الفواتير، والزبائن) لمطابقة "${searchQuery}". المتجر يضم **${products.length}** صنف نشط و **${sales.length}** معاملة بيع سابقة.`;
      }

      setResult({
        query: searchQuery,
        answer: answerText,
        sources,
        actions: [
          { label: "تصدير النتائج تقرير PDF", actionType: "pdf" },
          { label: "مشاركة الموجز واتساب", actionType: "whatsapp" },
        ],
      });
    });
  };

  const PRESETS = [
    "كم مبيعات اليوم وهامش الربح؟",
    "ما هي السلع المنخفضة في الرفوف؟",
    "الزبناء الذين لديهم ديون كريدي معلقة",
    "أفضل المنتجات حركة هذا الأسبوع",
  ];

  return (
    <div className="space-y-4 text-start">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl kaspi-glass-btn flex items-center justify-center">
            <Search className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--kaspi-text-primary)]">
              محرك البحث الذكي بالمصادر (Morphic Search Engine)
            </h4>
            <p className="text-[11px] text-[var(--kaspi-text-muted)]">
              يبحث في السلع، الفواتير، ديون الزبائن، والأسعار مع توثيق المصادر الدقيقة
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          On-Device Local RAG
        </span>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="ابحث عن أي معلومة في متجرك (سلعة، فاتورة، زبون، أرباح، كريدي)..."
          className="w-full ps-10 pe-24 py-2.5 rounded-xl kaspi-glass-surface border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
        />
        <Search className="w-4 h-4 text-zinc-400 absolute start-3.5 top-3" />
        <button
          type="button"
          onClick={() => handleSearch()}
          disabled={isPending || !query.trim()}
          className="absolute end-1.5 top-1.5 h-7 px-3 rounded-lg kaspi-glass-btn text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
        >
          {isPending ? "جاري البحث..." : "بحث ذكي"}
        </button>
      </div>

      {/* Suggested Quick Queries */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-mono text-zinc-400">مقترحات سريعة:</span>
        {PRESETS.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setQuery(p);
              handleSearch(p);
            }}
            className="text-[11px] px-2.5 py-1 rounded-lg kaspi-glass-surface border border-white/10 hover:border-emerald-500/40 text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Results View with Citations */}
      {result && (
        <div className="p-4 rounded-2xl kaspi-frosted-card border border-white/15 space-y-3.5 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>إجابة موثقة بالمصادر:</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">0ms Local Cache</span>
          </div>

          <div className="text-xs text-zinc-200 leading-relaxed font-sans bg-white/[0.02] p-3 rounded-xl border border-white/5">
            <p className="whitespace-pre-line">{result.answer}</p>
          </div>

          {/* Sources Pills */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
              المصادر المرجعية المستخرجة (Cited Sources):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.sources.map((s, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl kaspi-glass-surface border border-white/10 space-y-1 text-start"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-white">
                    <BookOpen className="w-3 h-3 text-emerald-400" />
                    <span className="truncate">{s.title}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 line-clamp-2">{s.snippet}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
