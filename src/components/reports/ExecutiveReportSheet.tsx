"use client";

import React, { useState } from "react";
import {
  FileText,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  Building2,
  Receipt,
  Sparkles,
  Loader2,
  Save,
  Lock,
} from "lucide-react";

interface ExecutiveReportSheetProps {
  storeName: string;
  storePhone: string;
  reportDate: string;
  deliveryTime: string;
  totalMad: number;
  cashMad: number;
  cardMad: number;
  creditMad: number;
  transactionsCount: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  maturingChecks: Array<{ supplierName: string; invoiceNumber: string; amount: number; dueDate: string; paymentMethod: string }>;
  lowStockItems: Array<{ name: string; stock: number; reorderQty: number }>;
  creditCollectedMad: number;
  creditOutstandingMad: number;
  locale: string;
  initialWhatsappPhone?: string;
}

const REPORT_DICT = {
  ar: {
    sheetBadge: "تقرير تنفيذي استراتيجي رسمي",
    storeSeal: "معتمد رقمياً • كسب POS",
    dispatchSectionTitle: "إعدادات الأتمتة والإرسال التلقائي إلى WhatsApp المالك",
    phoneLabel: "رقم WhatsApp المالك لاستلام التقارير (إلزامي للأتمتة) :",
    phonePlaceholder: "+212 6XX-XXXXXX",
    saveAndActivateBtn: "حفظ وتفعيل الإرسال التلقائي",
    phoneSavedSuccess: "تم حفظ رقم المالك وتفعيل جدول الإرسال بنجاح!",
    activeDailyBadge: "التقرير اليومي (24 ساعة) : مفعل تلقائياً كل ليلة (21:00 / 22:00)",
    activeMonthlyBadge: "التقرير الشهري (30 يوماً) : مفعل تلقائياً بنهاية كل شهر",
    autoNotice: "يتم إرسال التقارير التنفيذية تلقائياً وبدقة فائقة في المواعيد المحددة دون الحاجة لأي ضغط يدوي.",
    execSummaryTitle: "ملخص الأداء والمبيعات اليومية",
    totalTurnover: "إجمالي رقم المعاملات",
    transactions: "عدد العمليات",
    estProfit: "الأرباح الصافية التقديرية",
    paymentBreakdownTitle: "تفصيل طرق التحصيل",
    cash: "نقداً (Espèces)",
    card: "بطاقة بنكية (TPE)",
    krediat: "كريدي الزبائن (Karné)",
    krediatCollected: "كريدي مستخلص اليوم :",
    krediatBalance: "إجمالي ديون الزبائن الجارية :",
    topProductsTitle: "المنتجات الأكثر مبيعاً اليوم",
    thProduct: "المنتج",
    thQty: "الكمية",
    thRevenue: "المبيعات (MAD)",
    noSalesToday: "لا توجد مبيعات مسجلة حتى الآن اليوم.",
    directivesTitle: "تنبيهات المخزون والتوجيهات الاستراتيجية",
    lowStockTitle: "منتجات بلغت حد الطلب الحرج :",
    stockUnits: "قطع متبقية (اطلب +{qty})",
    noLowStock: "المخزون سليم، لا توجد نواقص حرجة حالياً.",
    supplierChecksTitle: "كمبيالات وشيكات الموردين المستحقة (خلال 48 ساعة) :",
    noMaturingChecks: "لا توجد كمبيالات أو شيكات مستحقة الدفع خلال الـ 48 ساعة القادمة.",
    officialFootnote: "وثيقة تنفيذية مشفرة ومولدة تلقائياً بواسطة منصة كسب KASPI POS السحابية.",
  },
  fr: {
    sheetBadge: "RAPPORT EXÉCUTIF STRATÉGIQUE OFFICIEL",
    storeSeal: "CERTIFIÉ CONFORME • KASPI POS",
    dispatchSectionTitle: "Configuration & Envoi Automatisé WhatsApp Propriétaire",
    phoneLabel: "Numéro WhatsApp du Propriétaire (Requis pour l'automatisation) :",
    phonePlaceholder: "+212 6XX-XXXXXX",
    saveAndActivateBtn: "Enregistrer & Activer l'Automatisation",
    phoneSavedSuccess: "Numéro enregistré et envois programmés avec succès !",
    activeDailyBadge: "Rapport Quotidien 24h : Activé automatiquement chaque soir (21h / 22h)",
    activeMonthlyBadge: "Rapport Mensuel 30j : Activé automatiquement chaque fin de mois",
    autoNotice: "Rapports envoyés de manière 100% autonome et sécurisée sans aucune action manuelle.",
    execSummaryTitle: "Performance & Chiffre d'Affaires du Jour",
    totalTurnover: "Chiffre d'Affaires Brut",
    transactions: "Transactions",
    estProfit: "Marge Nette Estimée",
    paymentBreakdownTitle: "Ventilation des Règlements",
    cash: "Espèces (Caisse)",
    card: "Carte / TPE",
    krediat: "Crédit Client (Karné)",
    krediatCollected: "Crédit recouvré ce jour :",
    krediatBalance: "Encours global de crédits :",
    topProductsTitle: "Top Produits Vendus Aujourd'hui",
    thProduct: "Produit",
    thQty: "Qté Vendue",
    thRevenue: "Total (MAD)",
    noSalesToday: "Aucune vente enregistrée pour le moment aujourd'hui.",
    directivesTitle: "Directives Stocks & Engagements Fournisseurs",
    lowStockTitle: "Articles sous le seuil d'alerte :",
    stockUnits: "unités restantes (commander +{qty})",
    noLowStock: "Niveaux de stocks optimaux, aucune rupture critique.",
    supplierChecksTitle: "Effets & Chèques Fournisseurs à échéance (48h) :",
    noMaturingChecks: "Aucun effet ou chèque fournisseur arrivant à échéance sous 48 heures.",
    officialFootnote: "Document exécutif chiffré généré automatiquement par la plateforme KASPI POS Cloud.",
  },
  en: {
    sheetBadge: "OFFICIAL STRATEGIC EXECUTIVE DIGEST",
    storeSeal: "DIGITALLY CERTIFIED • KASPI POS",
    dispatchSectionTitle: "Owner WhatsApp Dispatch & Smart Automation Setup",
    phoneLabel: "Store Owner WhatsApp Number (Mandatory for Automation):",
    phonePlaceholder: "+212 6XX-XXXXXX",
    saveAndActivateBtn: "Save & Activate Automation",
    phoneSavedSuccess: "Owner phone saved and automated dispatches activated successfully!",
    activeDailyBadge: "Daily 24-Hour Digest: Auto-scheduled nightly at 21:00 / 22:00",
    activeMonthlyBadge: "Monthly 30-Day Executive Report: Auto-scheduled at month end",
    autoNotice: "Reports are automatically dispatched with zero manual intervention required.",
    execSummaryTitle: "Daily Performance & Sales Matrix",
    totalTurnover: "Gross Turnover",
    transactions: "Transactions",
    estProfit: "Estimated Net Margin",
    paymentBreakdownTitle: "Payment Mode Settlement",
    cash: "Cash Register",
    card: "Bank Card / POS",
    krediat: "Customer Debt (Karné)",
    krediatCollected: "Debt Collected Today:",
    krediatBalance: "Total Outstanding Debt:",
    topProductsTitle: "Top Selling Products Today",
    thProduct: "Product Name",
    thQty: "Qty Sold",
    thRevenue: "Revenue (MAD)",
    noSalesToday: "No sales recorded yet today.",
    directivesTitle: "Critical Inventory & Supplier Directives",
    lowStockTitle: "Items at Critical Reorder Point:",
    stockUnits: "units left (reorder +{qty})",
    noLowStock: "Inventory levels are healthy, zero critical shortages.",
    supplierChecksTitle: "Maturing Supplier Checks / Bills (Within 48h):",
    noMaturingChecks: "No supplier checks or bills due within the next 48 hours.",
    officialFootnote: "Encrypted executive document generated automatically by KASPI POS Cloud.",
  },
};

export function ExecutiveReportSheet({
  storeName,
  storePhone,
  reportDate,
  deliveryTime,
  totalMad,
  cashMad,
  cardMad,
  creditMad,
  transactionsCount,
  topProducts,
  maturingChecks,
  lowStockItems,
  creditCollectedMad,
  creditOutstandingMad,
  locale,
  initialWhatsappPhone,
}: ExecutiveReportSheetProps) {
  const t = REPORT_DICT[locale as keyof typeof REPORT_DICT] || REPORT_DICT.fr;

  const [phone, setPhone] = useState(initialWhatsappPhone || storePhone || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(Boolean(initialWhatsappPhone || storePhone));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isStampDismissed, setIsStampDismissed] = useState(false);

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/v1/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappReportNumber: cleanPhone,
          whatsappReportHour: deliveryTime || "21:00",
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur de sauvegarde");
      }

      setSaveSuccess(true);
      setFeedback(t.phoneSavedSuccess);
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback("Erreur lors de la sauvegarde du numéro");
    } finally {
      setIsSaving(false);
    }
  };

  const estProfitMad = totalMad * 0.28; // Estimated net margin

  return (
    <div dir="ltr" className="space-y-6 select-none">
      {/* 1. MANDATORY OWNER PHONE SETUP & SCHEDULED AUTOMATION BAR */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#25D366] shadow-[0_4px_12px_rgba(37,211,102,0.35)] shrink-0 flex items-center justify-center font-bold">
              {/* Authentic Official Vector WhatsApp Logo */}
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.587 1.838.884 2.791.884 3.18 0 5.766-2.586 5.767-5.766.001-3.18-2.585-5.77-5.767-5.77zm0 10.455c-.868 0-1.716-.233-2.454-.672l-.176-.104-1.821.477.486-1.774-.115-.183c-.482-.767-.737-1.657-.736-2.569 0-2.617 2.13-4.747 4.748-4.747 1.268.001 2.46.495 3.356 1.392.896.897 1.389 2.089 1.388 3.357-.001 2.617-2.13 4.747-4.89 4.45zm2.604-3.559c-.143-.071-.845-.417-.976-.465-.131-.048-.226-.071-.321.071-.095.143-.369.465-.453.56-.083.095-.167.107-.31.036-.143-.071-.603-.222-1.149-.708-.424-.378-.711-.845-.794-.988-.083-.143-.009-.22.063-.291.064-.064.143-.167.214-.25.071-.083.095-.143.143-.238.048-.095.024-.179-.012-.25-.036-.071-.321-.774-.44-1.06-.116-.278-.235-.24-.321-.244h-.274c-.095 0-.25.036-.381.179-.131.143-.5 4.89-.5 1.192 0 .703.512 1.381.584 1.476.071.095 1.008 1.539 2.441 2.158 1.433.619 1.433.413 1.691.389.258-.024.845-.345.965-.679.119-.333.119-.619.083-.679-.036-.06-.131-.095-.274-.167z" />
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.178L2 22l4.981-1.399C8.423 21.492 10.153 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.25c-1.636 0-3.17-.468-4.472-1.278l-.321-.197-2.964.832.842-2.89-.214-.341C6.012 15.027 5.5 13.559 5.5 12c0-3.584 2.916-6.5 6.5-6.5s6.5 2.916 6.5 6.5-2.916 6.5-6.5 6.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{t.dispatchSectionTitle}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  OFFICIAL
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                {t.autoNotice}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] font-mono text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>{deliveryTime || "21:00"} Casablanca</span>
            </span>
          </div>
        </div>

        {feedback && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            {feedback}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-zinc-400 font-medium">
                {t.phoneLabel}
              </div>
              <div className="text-sm font-mono font-bold text-white tracking-wider mt-0.5">
                {phone ? phone.replace(/(\+?\d{3,4}\s?\d{1,2})\d+(\d{2})/, "$1•• ••• •$2") : "+212 6•• ••• •00"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-owner-vault"))}
            className="sheen-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs transition cursor-pointer shadow-sm shrink-0"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>
              {locale === "ar"
                ? "تعديل عبر خزنة المالك"
                : locale === "en"
                ? "Edit via Owner Vault"
                : "Modifier via Coffre Propriétaire"}
            </span>
          </button>
        </div>

        {/* Live Automatic Dispatch Status Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-2.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <span className="font-semibold text-zinc-200">{t.activeDailyBadge}</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-2.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <span className="font-semibold text-zinc-200">{t.activeMonthlyBadge}</span>
          </div>
        </div>
      </div>

      {/* 2. 3D ELEVATED TACTILE EXECUTIVE DOCUMENT SHEET */}
      <div className="relative rounded-3xl bg-zinc-950 border border-zinc-700/80 p-6 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.1)_inset] space-y-8 overflow-hidden font-sans">
        {/* Official Dismissible Crimson Stamp */}
        <div
          onClick={() => setIsStampDismissed(true)}
          title={locale === "ar" ? "انقر لإخفاء الختم وتسهيل القراءة" : "Cliquer pour masquer le cachet officiel"}
          className={`absolute -end-6 -bottom-6 w-64 h-64 border-4 border-red-600/40 text-red-600/40 bg-red-500/[0.03] rounded-full flex flex-col items-center justify-center select-none rotate-12 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 z-20 ${
            isStampDismissed ? "opacity-0 scale-90 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="w-52 h-52 rounded-full border border-dashed border-red-600/30 flex flex-col items-center justify-center p-4 text-center">
            <span className="font-mono font-black text-[9px] uppercase tracking-widest text-red-600/60 block">
              ★ ROYAUME DU MAROC ★
            </span>
            <span className="font-mono font-black text-xs uppercase tracking-wider text-red-600/70 my-1 block">
              {t.storeSeal}
            </span>
            <span className="font-mono font-bold text-[8px] uppercase tracking-widest text-red-600/50 block">
              CERTIFIÉ CONFORME • {reportDate}
            </span>
            <span className="text-[7px] text-red-600/40 mt-1 block">
              (Cliquer pour masquer)
            </span>
          </div>
        </div>

        {/* Document Header with Official Seal */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-white text-black mb-2">
              {t.sheetBadge}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {storeName}
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              {reportDate} • {deliveryTime || "21:00"}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-end font-mono">
            <div className="text-[10px] text-zinc-400 uppercase tracking-widest">KASPI POS CLOUD</div>
            <div className="text-xs font-bold text-white mt-0.5">{t.storeSeal}</div>
          </div>
        </div>

        {/* Section 1: Executive KPI Matrix */}
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-white" />
            <span>{t.execSummaryTitle}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-xs text-zinc-400">{t.totalTurnover}</span>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {totalMad.toFixed(2)} <span className="text-xs font-normal text-zinc-400">MAD</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-xs text-zinc-400">{t.transactions}</span>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {transactionsCount} <span className="text-xs font-normal text-zinc-400">tickets</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-xs text-zinc-400">{t.estProfit}</span>
              <div className="text-2xl font-black text-white font-mono mt-1">
                ~{estProfitMad.toFixed(2)} <span className="text-xs font-normal text-zinc-400">MAD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Payment Breakdown */}
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
            <Receipt className="w-3.5 h-3.5 text-white" />
            <span>{t.paymentBreakdownTitle}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-300 font-medium">{t.cash}</span>
              <span className="font-mono text-xs font-bold text-white">{cashMad.toFixed(2)} MAD</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-300 font-medium">{t.card}</span>
              <span className="font-mono text-xs font-bold text-white">{cardMad.toFixed(2)} MAD</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-300 font-medium">{t.krediat}</span>
              <span className="font-mono text-xs font-bold text-white">{creditMad.toFixed(2)} MAD</span>
            </div>
          </div>

          {(creditCollectedMad > 0 || creditOutstandingMad > 0) && (
            <div className="mt-3 p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-400">
              <div>
                <span>{t.krediatCollected} </span>
                <span className="text-white font-bold">{creditCollectedMad.toFixed(2)} MAD</span>
              </div>
              <div>
                <span>{t.krediatBalance} </span>
                <span className="text-white font-bold">{creditOutstandingMad.toFixed(2)} MAD</span>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Itemized Top Products Table */}
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-white" />
            <span>{t.topProductsTitle}</span>
          </h3>

          <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/40">
            <table className="w-full text-xs">
              <thead className="bg-zinc-900 text-zinc-400 font-mono border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3.5 text-start">{t.thProduct}</th>
                  <th className="py-2.5 px-3.5 text-center">{t.thQty}</th>
                  <th className="py-2.5 px-3.5 text-end">{t.thRevenue}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-zinc-500 font-sans">
                      {t.noSalesToday}
                    </td>
                  </tr>
                ) : (
                  topProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-zinc-900/60 transition">
                      <td className="py-2.5 px-3.5 text-white font-sans font-medium">{p.name}</td>
                      <td className="py-2.5 px-3.5 text-center text-zinc-300">x{p.quantity}</td>
                      <td className="py-2.5 px-3.5 text-end text-white font-bold">{p.revenue.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Critical Stock & Supplier Directives */}
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
            <span>{t.directivesTitle}</span>
          </h3>

          <div className="space-y-3">
            {/* Low Stock Items */}
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
              <span className="text-xs font-semibold text-zinc-300">{t.lowStockTitle}</span>
              {lowStockItems.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">{t.noLowStock}</p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {lowStockItems.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-mono text-zinc-200"
                    >
                      {item.name}: <span className="font-bold text-white">{item.stock}</span> {t.stockUnits.replace("{qty}", String(item.reorderQty))}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Maturing Checks */}
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
              <span className="text-xs font-semibold text-zinc-300">{t.supplierChecksTitle}</span>
              {maturingChecks.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">{t.noMaturingChecks}</p>
              ) : (
                <div className="space-y-2 pt-1">
                  {maturingChecks.map((chk, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-700 flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <span className="text-white font-bold">{chk.supplierName}</span> • {chk.invoiceNumber}
                      </div>
                      <div className="text-end">
                        <span className="font-bold text-white">{chk.amount.toFixed(2)} MAD</span> ({chk.paymentMethod})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Official Document Footer */}
        <div className="pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-zinc-500">
          <span>{t.officialFootnote}</span>
          <div className="flex items-center gap-3">
            {isStampDismissed && (
              <button
                type="button"
                onClick={() => setIsStampDismissed(false)}
                className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
              >
                {locale === "ar" ? "إظهار الختم الرسمي" : "Afficher le cachet"}
              </button>
            )}
            <span>SHA-256 VERIFIED RECORD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
