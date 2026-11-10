/**
 * WhatsApp Business & Store Owner Executive Intelligence Utility for KASPI POS
 * 
 * Strict V1000 Standards:
 * 1. Zero emojis across all templates.
 * 2. Purely single-language messages (Arabic, French, or English).
 * 3. Dedicated solely to the Store Owner's 24-Hour Nightly Executive Digest at 21:00 / 22:00.
 */

/**
 * Normalizes phone numbers to standard international format (defaulting to Morocco +212).
 */
export function cleanMoroccanPhone(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^\d+]/g, "");

  // If starts with 06 or 07 or 05 (standard Moroccan phone numbers)
  if (cleaned.startsWith("06") || cleaned.startsWith("07") || cleaned.startsWith("05")) {
    cleaned = `212${cleaned.slice(1)}`;
  } else if (cleaned.startsWith("+212")) {
    cleaned = cleaned.slice(1);
  } else if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Generates a direct WhatsApp Click-to-Chat URL
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanedNumber = cleanMoroccanPhone(phone);
  const encodedText = encodeURIComponent(message);
  if (!cleanedNumber) {
    return `https://wa.me/?text=${encodedText}`;
  }
  return `https://wa.me/${cleanedNumber}?text=${encodedText}`;
}

export interface SoldProductItem {
  name: string;
  quantity: number;
  revenue: number;
}

export interface LowStockDirective {
  productName: string;
  currentQty: number;
  suggestedReorder: number;
}

export interface MaturingCheckItem {
  supplierName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  paymentMethod: string;
  checkNumber?: string | null;
}

export interface NightlyExecutiveReportParams {
  locale?: "ar" | "fr" | "en";
  storeName: string;
  date: string;
  deliveryTime?: "21:00" | "22:00" | string;
  totalSales: number;
  transactionsCount: number;
  cashSales: number;
  cardSales: number;
  creditSales: number;
  itemsSold: SoldProductItem[];
  lowStockDirectives: LowStockDirective[];
  maturingChecks?: MaturingCheckItem[];
}

/**
 * Formats the Unified Store Owner 24-Hour Nightly Executive Summary & Smart Advisor Report
 * Dispatched automatically at 21:00 or 22:00 in pure single-language (ar, fr, en) without emojis.
 */
export function formatNightlyExecutiveReportForWhatsApp(report: NightlyExecutiveReportParams): string {
  const lang = report.locale === "ar" || report.locale === "en" ? report.locale : "fr";
  const deliveryHour = report.deliveryTime || "21:00";

  if (lang === "ar") {
    let msg = `[التقرير التنفيذي اليومي لمالك المتجر — 24 ساعة]\n`;
    msg += `المتجر: ${report.storeName}\n`;
    msg += `التاريخ: ${report.date} | توقيت الإرسال: ${deliveryHour}\n`;
    msg += `================================\n\n`;

    // القسم 1 — ملخص المبيعات والزبائن لآخر 24 ساعة
    msg += `[1] ملخص المبيعات والزبائن (24 ساعة الأخيرة):\n`;
    msg += `• إجمالي المعاملات والزبائن: ${report.transactionsCount} زبون\n`;
    msg += `• رقم المعاملات الإجمالي: ${report.totalSales.toFixed(2)} درهم مغربي (MAD)\n`;
    msg += `• الأداء نقداً (Espèces): ${report.cashSales.toFixed(2)} MAD\n`;
    msg += `• الأداء بالبطاقة البنكية (TPE): ${report.cardSales.toFixed(2)} MAD\n`;
    if (report.creditSales > 0) {
      msg += `• الكريدي المسجل (الديون الجارية): ${report.creditSales.toFixed(2)} MAD\n`;
    }
    msg += `\n`;

    // القسم 2 — تفاصيل مبيعات المنتجات اليوم
    msg += `[2] تفاصيل مبيعات المنتجات اليوم:\n`;
    if (report.itemsSold && report.itemsSold.length > 0) {
      report.itemsSold.forEach((item) => {
        msg += `• ${item.name} | الكمية: ${item.quantity} | الإيراد: ${item.revenue.toFixed(2)} MAD\n`;
      });
    } else {
      msg += `• لم يتم تسجيل مبيعات منتجات فردية اليوم.\n`;
    }
    msg += `\n`;

    // القسم 3 — توجيهات المخزون والتزويد الضرورية للمالك
    msg += `[3] توجيهات المخزون والتزويد الضرورية للمالك:\n`;
    if (report.lowStockDirectives && report.lowStockDirectives.length > 0) {
      report.lowStockDirectives.forEach((dir) => {
        msg += `• تنبيه المخزون: تبقى من المنتج (${dir.productName}) عدد (${dir.currentQty}) فقط — يجب عليك طلب (${dir.suggestedReorder} وحدة) من المورد لتفادي نفاد السلعة.\n`;
      });
    } else {
      msg += `• حالة المخزون مثالية — لا توجد نواقص حرجة تتطلب طلبيات عاجلة.\n`;
    }

    // استحقاقات شيكات وكمبيالات الموردين خلال 48 ساعة
    if (report.maturingChecks && report.maturingChecks.length > 0) {
      msg += `\n• استحقاقات الشيكات والكمبيالات المستحقة للموردين خلال 48 ساعة:\n`;
      report.maturingChecks.forEach((chk) => {
        const piece = chk.checkNumber ? ` #${chk.checkNumber}` : "";
        msg += `  - المورد: ${chk.supplierName} | الفاتورة: ${chk.invoiceNumber} | المبلغ: ${chk.amount.toFixed(2)} MAD | الاستحقاق: ${chk.dueDate} (${chk.paymentMethod.toUpperCase()}${piece})\n`;
      });
    }

    msg += `\n================================\n`;
    msg += `نظام كسب POS — لوحة تحكم المالك الذكية (www.kaspipos.com)`;
    return msg;
  }

  if (lang === "en") {
    let msg = `[STORE OWNER 24-HOUR EXECUTIVE REPORT]\n`;
    msg += `Store: ${report.storeName}\n`;
    msg += `Date: ${report.date} | Dispatch Time: ${deliveryHour}\n`;
    msg += `================================\n\n`;

    // Section 1 — Daily Sales & Customers Overview
    msg += `[1] Daily Sales & Customers Overview (Past 24 Hours):\n`;
    msg += `• Total transactions & customers served: ${report.transactionsCount} sales\n`;
    msg += `• Total Net Revenue: ${report.totalSales.toFixed(2)} MAD\n`;
    msg += `• Cash: ${report.cashSales.toFixed(2)} MAD\n`;
    msg += `• Bank Card (POS): ${report.cardSales.toFixed(2)} MAD\n`;
    if (report.creditSales > 0) {
      msg += `• Store Credit (Krediat): ${report.creditSales.toFixed(2)} MAD\n`;
    }
    msg += `\n`;

    // Section 2 — Itemized Products Sold Table
    msg += `[2] Itemized Products Sold Today:\n`;
    if (report.itemsSold && report.itemsSold.length > 0) {
      report.itemsSold.forEach((item) => {
        msg += `• ${item.name} | Qty: ${item.quantity} | Total: ${item.revenue.toFixed(2)} MAD\n`;
      });
    } else {
      msg += `• No individual item sales recorded today.\n`;
    }
    msg += `\n`;

    // Section 3 — Mandatory Actionable Inventory & Supplier Directives
    msg += `[3] Critical Inventory & Reorder Directives for Owner:\n`;
    if (report.lowStockDirectives && report.lowStockDirectives.length > 0) {
      report.lowStockDirectives.forEach((dir) => {
        msg += `• Stock Alert: Only (${dir.currentQty}) left of (${dir.productName}) — You must order (${dir.suggestedReorder} units) from your supplier.\n`;
      });
    } else {
      msg += `• All stock levels are healthy — No urgent purchase orders required.\n`;
    }

    // Supplier checks maturing within 48 hours
    if (report.maturingChecks && report.maturingChecks.length > 0) {
      msg += `\n• Supplier Checks & Commercial Bills maturing within 48 hours:\n`;
      report.maturingChecks.forEach((chk) => {
        const piece = chk.checkNumber ? ` #${chk.checkNumber}` : "";
        msg += `  - Supplier: ${chk.supplierName} | Invoice: ${chk.invoiceNumber} | Amount: ${chk.amount.toFixed(2)} MAD | Due: ${chk.dueDate} (${chk.paymentMethod.toUpperCase()}${piece})\n`;
      });
    }

    msg += `\n================================\n`;
    msg += `KASPI POS — Store Owner Executive Intelligence (www.kaspipos.com)`;
    return msg;
  }

  // Default: French (fr)
  let msg = `[RAPPORT EXÉCUTIF JOURNALIER DU PROPRIÉTAIRE — 24H]\n`;
  msg += `Commerce : ${report.storeName}\n`;
  msg += `Date : ${report.date} | Heure d'envoi : ${deliveryHour}\n`;
  msg += `================================\n\n`;

  // Section 1 — Synthèse des Ventes et Clients des Dernières 24h
  msg += `[1] Synthèse des Ventes & Clients (Dernières 24h) :\n`;
  msg += `• Nombre de transactions & clients servis : ${report.transactionsCount} ventes\n`;
  msg += `• Chiffre d'affaires net global : ${report.totalSales.toFixed(2)} MAD\n`;
  msg += `• Espèces (Cash) : ${report.cashSales.toFixed(2)} MAD\n`;
  msg += `• Carte Bancaire (TPE CMI) : ${report.cardSales.toFixed(2)} MAD\n`;
  if (report.creditSales > 0) {
    msg += `• Crédit Client (Krediat) : ${report.creditSales.toFixed(2)} MAD\n`;
  }
  msg += `\n`;

  // Section 2 — Détail des Articles Vendus Aujourd'hui
  msg += `[2] Détail des Articles Vendus Aujourd'hui :\n`;
  if (report.itemsSold && report.itemsSold.length > 0) {
    report.itemsSold.forEach((item) => {
      msg += `• ${item.name} | Qté : ${item.quantity} | Total : ${item.revenue.toFixed(2)} MAD\n`;
    });
  } else {
    msg += `• Aucune vente d'article enregistrée aujourd'hui.\n`;
  }
  msg += `\n`;

  // Section 3 — Directives Achats & Réapprovisionnement du Propriétaire
  msg += `[3] Directives Achats & Réapprovisionnement du Propriétaire :\n`;
  if (report.lowStockDirectives && report.lowStockDirectives.length > 0) {
    report.lowStockDirectives.forEach((dir) => {
      msg += `• Alerte Stock : Il ne reste que (${dir.currentQty}) de (${dir.productName}) — Vous devez commander (${dir.suggestedReorder} unités) auprès du fournisseur.\n`;
    });
  } else {
    msg += `• Niveaux de stock optimaux — Aucun réapprovisionnement urgent requis.\n`;
  }

  // Échéances Chèques & Effets Fournisseurs dues sous 48 heures
  if (report.maturingChecks && report.maturingChecks.length > 0) {
    msg += `\n• Échéances Chèques & Effets Fournisseurs dues sous 48 heures :\n`;
    report.maturingChecks.forEach((chk) => {
      const piece = chk.checkNumber ? ` #${chk.checkNumber}` : "";
      msg += `  - Fournisseur : ${chk.supplierName} | Facture : ${chk.invoiceNumber} | Montant : ${chk.amount.toFixed(2)} MAD | Échéance : ${chk.dueDate} (${chk.paymentMethod.toUpperCase()}${piece})\n`;
    });
  }

  msg += `\n================================\n`;
  msg += `KASPI POS — Intelligence Caisse Propriétaire (www.kaspipos.com)`;
  return msg;
}

/**
 * Backwards-compatibility wrapper for DailyReportParams
 */
export interface DailyReportParams {
  storeName: string;
  date: string;
  totalSales: number;
  transactionsCount: number;
  cashSales: number;
  cardSales: number;
  creditSales: number;
  topProducts?: Array<{ name: string; quantity: number }>;
  lowStockAlerts?: Array<{ name: string; quantity: number }>;
  locale?: "ar" | "fr" | "en";
}

export function formatDailyReportForWhatsApp(report: DailyReportParams): string {
  return formatNightlyExecutiveReportForWhatsApp({
    locale: report.locale || "fr",
    storeName: report.storeName,
    date: report.date,
    deliveryTime: "21:00",
    totalSales: report.totalSales,
    transactionsCount: report.transactionsCount,
    cashSales: report.cashSales,
    cardSales: report.cardSales,
    creditSales: report.creditSales,
    itemsSold: (report.topProducts || []).map((p) => ({
      name: p.name,
      quantity: p.quantity,
      revenue: p.quantity * 25,
    })),
    lowStockDirectives: (report.lowStockAlerts || []).map((l) => ({
      productName: l.name,
      currentQty: l.quantity,
      suggestedReorder: Math.max(12, (5 - l.quantity) * 4),
    })),
  });
}

export * from "./whatsapp/index";
