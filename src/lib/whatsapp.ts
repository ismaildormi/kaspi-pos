/**
 * WhatsApp Business & Direct Message Utility for KASPI POS
 */

/**
 * Normalizes phone numbers to standard international format (defaulting to Morocco +212).
 */
export function cleanMoroccanPhone(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^\d+]/g, "");

  // If starts with 06 or 07 (standard Moroccan mobile)
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

export interface ReceiptMessageParams {
  storeName: string;
  receiptNumber: string;
  createdAt: string;
  cashierName?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentMethod: string;
  paidTotal: number;
  changeDue: number;
  qrCodeUrl?: string;
}

/**
 * Formats a clean, readable digital receipt for WhatsApp
 */
export function formatReceiptForWhatsApp(receipt: ReceiptMessageParams): string {
  const dateFormatted = new Date(receipt.createdAt).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  let msg = `🧾 *TICKET DE CAISSE — ${receipt.storeName.toUpperCase()}*\n`;
  msg += `🔢 N°: *${receipt.receiptNumber}* | 🕒 ${dateFormatted}\n`;
  if (receipt.cashierName) {
    msg += `👤 Caissier: ${receipt.cashierName}\n`;
  }
  msg += `--------------------------------\n`;
  msg += `🛍️ *ARTICLES :*\n`;

  receipt.items.forEach((item) => {
    msg += `• ${item.quantity}x ${item.name} = *${item.lineTotal.toFixed(2)} MAD*\n`;
  });

  msg += `--------------------------------\n`;
  msg += `💵 Sous-total HT : ${receipt.subtotal.toFixed(2)} MAD\n`;
  msg += `📊 TVA : ${receipt.taxTotal.toFixed(2)} MAD\n`;
  msg += `💰 *TOTAL À PAYER : ${receipt.grandTotal.toFixed(2)} MAD*\n`;
  msg += `💳 Règlement : ${receipt.paymentMethod.toUpperCase()} (${receipt.paidTotal.toFixed(2)} MAD)\n`;

  if (receipt.changeDue > 0) {
    msg += `🪙 Monnaie rendue : ${receipt.changeDue.toFixed(2)} MAD\n`;
  }

  msg += `--------------------------------\n`;
  msg += `🙏 *Merci de votre visite et à très bientôt !*\n`;
  msg += `⚡ _Propulsé par Kasbi POS (www.kasbi.ma)_`;

  return msg;
}

export interface DailyReportParams {
  storeName: string;
  date: string;
  totalSales: number;
  transactionsCount: number;
  cashSales: number;
  cardSales: number;
  creditSales: number;
  topProducts: Array<{ name: string; quantity: number }>;
  lowStockAlerts: Array<{ name: string; quantity: number }>;
}

/**
 * Formats the daily End-of-Day Z-Report for business owners
 */
export function formatDailyReportForWhatsApp(report: DailyReportParams): string {
  let msg = `📊 *RAPPORT JOURNALIER (Z-REPORT) — ${report.storeName}*\n`;
  msg += `📅 Date : *${report.date}*\n`;
  msg += `--------------------------------\n`;
  msg += `💰 *Chiffre d'Affaires Global : ${report.totalSales.toFixed(2)} MAD*\n`;
  msg += `🧾 Transactions : *${report.transactionsCount} ventes*\n\n`;

  msg += `💳 *Détail des Encaissements :*\n`;
  msg += `• Espèces (Cash) : ${report.cashSales.toFixed(2)} MAD\n`;
  msg += `• Carte Bancaire : ${report.cardSales.toFixed(2)} MAD\n`;
  if (report.creditSales > 0) {
    msg += `• Crédit Client (Krediat) : ${report.creditSales.toFixed(2)} MAD\n`;
  }

  if (report.topProducts && report.topProducts.length > 0) {
    msg += `\n🏆 *Top Ventes du Jour :*\n`;
    report.topProducts.slice(0, 3).forEach((p, idx) => {
      msg += `${idx + 1}. ${p.name} (${p.quantity} unités)\n`;
    });
  }

  if (report.lowStockAlerts && report.lowStockAlerts.length > 0) {
    msg += `\n⚠️ *Alertes Rupture de Stock (<5) :*\n`;
    report.lowStockAlerts.slice(0, 3).forEach((p) => {
      msg += `• ${p.name} : reste ${p.quantity}\n`;
    });
  }

  msg += `\n--------------------------------\n`;
  msg += `✨ _Rapport automatique généré par Kasbi POS_`;

  return msg;
}

export * from "./whatsapp/index";

