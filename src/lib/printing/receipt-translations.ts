/**
 * Global Multi-Language Thermal Receipt Translation & Formatting Engine
 * Supports:
 * - ar: Arabic (العربية) — Strict Western Arabic numerals (0123456789)
 * - fr: French (Français)
 * - en: English (English)
 * - tr: Turkish (Türkçe)
 * - es: Spanish (Español)
 * - de: German (Deutsch)
 */

export type ReceiptLanguage = "ar" | "fr" | "en" | "tr" | "es" | "de";

export type PrinterConnectionMode = "auto" | "usb_serial" | "network" | "browser";

export interface ReceiptLanguageMeta {
  code: ReceiptLanguage;
  label: string;
  nativeName: string;
  flag: string;
  dir: "rtl" | "ltr";
}

export const SUPPORTED_RECEIPT_LANGUAGES: ReceiptLanguageMeta[] = [
  {
    code: "ar",
    label: "العربية (أرقام 0-9 Western)",
    nativeName: "العربية",
    flag: "MA",
    dir: "rtl",
  },
  {
    code: "fr",
    label: "Français (French)",
    nativeName: "Français",
    flag: "FR",
    dir: "ltr",
  },
  {
    code: "en",
    label: "English (International)",
    nativeName: "English",
    flag: "EN",
    dir: "ltr",
  },
];

/**
 * CRITICAL RULE FOR ARABIC RECEIPTS:
 * Converts any Eastern Arabic (٠١٢٣٤٥٦٧٨٩) or Extended Arabic/Persian (۰۱۲۳۴۵۶۷۸۹) numerals
 * into standard Western Arabic numerals (0123456789).
 */
export function toWesternNumerals(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  const str = String(input);
  return str
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");
}

/**
 * Formats numbers using strict Western numerals (0-9).
 */
export function formatReceiptAmount(amount: number | string | undefined | null, decimals = 2): string {
  const num = Number(amount || 0);
  if (Number.isNaN(num)) return "0.00";
  return toWesternNumerals(num.toFixed(decimals));
}

/**
 * Formats receipt timestamp in the target receipt language while enforcing 0-9 Western digits.
 */
export function formatReceiptDate(dateInput?: Date | string, lang: ReceiptLanguage = "fr"): string {
  const dateObj = dateInput ? (typeof dateInput === "string" ? new Date(dateInput) : dateInput) : new Date();
  if (Number.isNaN(dateObj.getTime())) {
    return toWesternNumerals(String(dateInput || ""));
  }

  const localeMap: Record<ReceiptLanguage, string> = {
    ar: "ar-MA-u-nu-latn",
    fr: "fr-FR",
    en: "en-GB",
    tr: "tr-TR",
    es: "es-ES",
    de: "de-DE",
  };

  try {
    const formatted = new Intl.DateTimeFormat(localeMap[lang] || "fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(dateObj);
    return toWesternNumerals(formatted);
  } catch {
    return toWesternNumerals(dateObj.toISOString().slice(0, 16).replace("T", " "));
  }
}

export interface ReceiptDictionary {
  dir: "rtl" | "ltr";
  printButton: string;
  invoiceNo: string;
  date: string;
  cashier: string;
  customer: string;
  customerTaxId: string;
  item: string;
  qty: string;
  price: string;
  lineTotal: string;
  subtotal: string;
  tax: string;
  discount: string;
  grandTotal: string;
  tpeFeeCustomer: string;
  tpeFeeMerchant: string;
  totalPaidTpe: string;
  paymentMethod: string;
  paid: string;
  change: string;
  thankYou: string;
  welcomeHeader: string;
  paymentMethods: {
    cash: string;
    card: string;
    credit: string;
    transfer: string;
  };
}

export const RECEIPT_TRANSLATIONS: Record<ReceiptLanguage, ReceiptDictionary> = {
  ar: {
    dir: "rtl",
    printButton: "طباعة الفاتورة",
    invoiceNo: "رقم الفاتورة",
    date: "التاريخ",
    cashier: "الكاشير",
    customer: "الزبون",
    customerTaxId: "التعريف الضريبي للزبون",
    item: "الصنف",
    qty: "الكمية",
    price: "السعر",
    lineTotal: "المجموع",
    subtotal: "المجموع بدون ضريبة",
    tax: "الضريبة (TVA)",
    discount: "التخفيض",
    grandTotal: "المجموع الإجمالي",
    tpeFeeCustomer: "رسوم الدفع بالبطاقة",
    tpeFeeMerchant: "حصة المتجر",
    totalPaidTpe: "الإجمالي المدفوع بالبطاقة",
    paymentMethod: "طريقة الدفع",
    paid: "المبلغ المدفوع",
    change: "الباقي",
    thankYou: "شكراً لزيارتكم، نراكم قريباً!",
    welcomeHeader: "مرحباً بكم في متجرنا",
    paymentMethods: {
      cash: "نقداً (Cash)",
      card: "بطاقة بنكية (TPE)",
      credit: "آجل / كريدي",
      transfer: "تحويل بنكي",
    },
  },
  fr: {
    dir: "ltr",
    printButton: "Imprimer Ticket",
    invoiceNo: "Ticket N°",
    date: "Date",
    cashier: "Caissier",
    customer: "Client",
    customerTaxId: "ICE Client",
    item: "Désignation",
    qty: "Qté",
    price: "Prix",
    lineTotal: "Total",
    subtotal: "Total HT",
    tax: "Total TVA",
    discount: "Remise",
    grandTotal: "TOTAL TTC",
    tpeFeeCustomer: "Frais TPE (Client)",
    tpeFeeMerchant: "Part Commerçant",
    totalPaidTpe: "TOTAL PAYÉ TPE",
    paymentMethod: "Mode Règlement",
    paid: "Reçu",
    change: "Rendu",
    thankYou: "Merci de votre visite et à bientôt !",
    welcomeHeader: "Bienvenue dans notre magasin",
    paymentMethods: {
      cash: "ESPÈCES",
      card: "CARTE BANCAIRE",
      credit: "CRÉDIT CLIENT",
      transfer: "VIREMENT",
    },
  },
  en: {
    dir: "ltr",
    printButton: "Print Receipt",
    invoiceNo: "Receipt No",
    date: "Date",
    cashier: "Cashier",
    customer: "Customer",
    customerTaxId: "Customer Tax ID",
    item: "Item",
    qty: "Qty",
    price: "Price",
    lineTotal: "Total",
    subtotal: "Subtotal",
    tax: "Tax / VAT",
    discount: "Discount",
    grandTotal: "GRAND TOTAL",
    tpeFeeCustomer: "Card Terminal Fee",
    tpeFeeMerchant: "Merchant Share",
    totalPaidTpe: "TOTAL PAID (CARD)",
    paymentMethod: "Payment Method",
    paid: "Amount Paid",
    change: "Change Due",
    thankYou: "Thank you for your visit! See you soon.",
    welcomeHeader: "Welcome to our store",
    paymentMethods: {
      cash: "CASH",
      card: "CARD",
      credit: "STORE CREDIT",
      transfer: "BANK TRANSFER",
    },
  },
  tr: {
    dir: "ltr",
    printButton: "Fişi Yazdır",
    invoiceNo: "Fiş No",
    date: "Tarih",
    cashier: "Kasiyer",
    customer: "Müşteri",
    customerTaxId: "Müşteri VKN/TCKN",
    item: "Ürün",
    qty: "Adet",
    price: "Birim Fiyat",
    lineTotal: "Tutar",
    subtotal: "Ara Toplam",
    tax: "Toplam KDV",
    discount: "İndirim",
    grandTotal: "GENEL TOPLAM",
    tpeFeeCustomer: "POS Komisyonu",
    tpeFeeMerchant: "İşyeri Payı",
    totalPaidTpe: "KARTLA ÖDENEN TOPLAM",
    paymentMethod: "Ödeme Yöntemi",
    paid: "Alınan Tutar",
    change: "Para Üstü",
    thankYou: "Bizi tercih ettiğiniz için teşekkür ederiz!",
    welcomeHeader: "Mağazamıza hoş geldiniz",
    paymentMethods: {
      cash: "NAKİT",
      card: "KREDİ KARTI",
      credit: "VERESİYE / AÇIK HESAP",
      transfer: "HAVALE / EFT",
    },
  },
  es: {
    dir: "ltr",
    printButton: "Imprimir Ticket",
    invoiceNo: "Ticket N.º",
    date: "Fecha",
    cashier: "Cajero",
    customer: "Cliente",
    customerTaxId: "NIF Cliente",
    item: "Artículo",
    qty: "Cant.",
    price: "Precio",
    lineTotal: "Total",
    subtotal: "Subtotal",
    tax: "IVA Total",
    discount: "Descuento",
    grandTotal: "TOTAL A PAGAR",
    tpeFeeCustomer: "Comisión TPV",
    tpeFeeMerchant: "Cuota Comercio",
    totalPaidTpe: "TOTAL PAGADO TPV",
    paymentMethod: "Método de Pago",
    paid: "Recibido",
    change: "Cambio",
    thankYou: "¡Gracias por su visita, hasta pronto!",
    welcomeHeader: "Bienvenido a nuestra tienda",
    paymentMethods: {
      cash: "EFECTIVO",
      card: "TARJETA",
      credit: "CRÉDITO",
      transfer: "TRANSFERENCIA",
    },
  },
  de: {
    dir: "ltr",
    printButton: "Kassenbon drucken",
    invoiceNo: "Beleg-Nr.",
    date: "Datum",
    cashier: "Kassierer",
    customer: "Kunde",
    customerTaxId: "Kunden-USt-IdNr.",
    item: "Artikel",
    qty: "Menge",
    price: "Preis",
    lineTotal: "Gesamt",
    subtotal: "Zwischensumme",
    tax: "MwSt. Gesamt",
    discount: "Rabatt",
    grandTotal: "GESAMTBETRAG",
    tpeFeeCustomer: "Kartengebühr",
    tpeFeeMerchant: "Händleranteil",
    totalPaidTpe: "GESAMT KARTE",
    paymentMethod: "Zahlungsart",
    paid: "Gegeben",
    change: "Rückgeld",
    thankYou: "Vielen Dank für Ihren Einkauf!",
    welcomeHeader: "Willkommen in unserem Geschäft",
    paymentMethods: {
      cash: "BARGELD",
      card: "KARTENZAHLUNG",
      credit: "KUNDENKREDIT",
      transfer: "ÜBERWEISUNG",
    },
  },
};

export function getReceiptTranslation(lang?: string): ReceiptDictionary {
  const normalized = (lang || "fr").toLowerCase().slice(0, 2) as ReceiptLanguage;
  return RECEIPT_TRANSLATIONS[normalized] || RECEIPT_TRANSLATIONS.fr;
}

export function translatePaymentMethod(method: string, lang?: string): string {
  const dict = getReceiptTranslation(lang);
  const key = method.toLowerCase() as keyof ReceiptDictionary["paymentMethods"];
  return dict.paymentMethods[key] || method.toUpperCase();
}
