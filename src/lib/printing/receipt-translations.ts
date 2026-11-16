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
 * Formats receipt timestamp in strict Western YYYY/MM/DD HH:mm:ss numerals,
 * eliminating all RTL/LTR bidi punctuation and wrapping errors.
 */
export function formatReceiptIsoDateTime(dateInput?: Date | string | null): string {
  const d = dateInput
    ? typeof dateInput === "string"
      ? new Date(dateInput)
      : dateInput
    : new Date();
  if (!d || Number.isNaN(d.getTime())) return "2026/11/16 00:00:00";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${min}:${ss}`;
}

/**
 * Formats receipt timestamp in the target receipt language while enforcing 0-9 Western digits.
 */
export function formatReceiptDate(dateInput?: Date | string, lang: ReceiptLanguage = "fr"): string {
  return formatReceiptIsoDateTime(dateInput);
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
  totalClean: string;
  orderNumber: string;
  serviceMode: string;
  dineIn: string;
  takeaway: string;
  delivery: string;
  retail: string;
  wholesale: string;
  modifiers: string;
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
    printButton: "طباعة التذكرة",
    invoiceNo: "رقم التذكرة",
    date: "التاريخ والوقت",
    cashier: "الكاشير",
    customer: "الزبون",
    customerTaxId: "التعريف الضريبي",
    item: "المنتج",
    qty: "الكمية",
    price: "الثمن",
    lineTotal: "المجموع",
    subtotal: "المجموع بدون ضريبة",
    tax: "الضريبة",
    discount: "التخفيض",
    grandTotal: "المجموع الإجمالي",
    totalClean: "الإجمالي",
    orderNumber: "رقم طلبك",
    serviceMode: "نوع الطلب",
    dineIn: "محلي",
    takeaway: "سفري",
    delivery: "توصيل",
    retail: "بيع بالتقسيط",
    wholesale: "بيع بالجملة",
    modifiers: "الإضافات",
    tpeFeeCustomer: "رسوم الأداء بالبطاقة",
    tpeFeeMerchant: "حصة المتجر",
    totalPaidTpe: "المبلغ المؤدى بالبطاقة",
    paymentMethod: "طريقة الأداء",
    paid: "المبلغ المقبوض",
    change: "الباقي",
    thankYou: "شكراً لزيارتكم ونتمنى رؤيتكم قريباً",
    welcomeHeader: "مرحباً بكم في متجرنا",
    paymentMethods: {
      cash: "نقداً",
      card: "بطاقة بنكية",
      credit: "كريدي",
      transfer: "تحويل بنكي",
    },
  },
  fr: {
    dir: "ltr",
    printButton: "Imprimer Ticket",
    invoiceNo: "Ticket N°",
    date: "Date & Heure",
    cashier: "Caissier",
    customer: "Client",
    customerTaxId: "ICE Client",
    item: "Désignation",
    qty: "Qté",
    price: "Prix",
    lineTotal: "Total",
    subtotal: "Total HT",
    tax: "TVA",
    discount: "Remise",
    grandTotal: "TOTAL TTC",
    totalClean: "TOTAL",
    orderNumber: "VOTRE COMMANDE",
    serviceMode: "Mode Service",
    dineIn: "Sur Place",
    takeaway: "À Emporter",
    delivery: "Livraison",
    retail: "Vente Détail",
    wholesale: "Vente Gros",
    modifiers: "Suppléments",
    tpeFeeCustomer: "Frais TPE (Client)",
    tpeFeeMerchant: "Part Commerçant",
    totalPaidTpe: "TOTAL PAYÉ TPE",
    paymentMethod: "Règlement",
    paid: "Reçu",
    change: "Rendu",
    thankYou: "Merci de votre visite et à bientôt !",
    welcomeHeader: "Bienvenue dans notre établissement",
    paymentMethods: {
      cash: "ESPÈCES",
      card: "CARTE BANCAIRE",
      credit: "CRÉDIT",
      transfer: "VIREMENT",
    },
  },
  en: {
    dir: "ltr",
    printButton: "Print Receipt",
    invoiceNo: "Receipt #",
    date: "Date & Time",
    cashier: "Cashier",
    customer: "Customer",
    customerTaxId: "Customer Tax ID",
    item: "Item",
    qty: "Qty",
    price: "Price",
    lineTotal: "Total",
    subtotal: "Subtotal",
    tax: "Tax",
    discount: "Discount",
    grandTotal: "GRAND TOTAL",
    totalClean: "TOTAL",
    orderNumber: "YOUR ORDER",
    serviceMode: "Service Mode",
    dineIn: "Dine-In",
    takeaway: "Takeaway",
    delivery: "Delivery",
    retail: "Retail",
    wholesale: "Wholesale",
    modifiers: "Modifiers",
    tpeFeeCustomer: "Card Fee (Customer)",
    tpeFeeMerchant: "Merchant Share",
    totalPaidTpe: "TOTAL PAID CARD",
    paymentMethod: "Payment Method",
    paid: "Paid",
    change: "Change",
    thankYou: "Thank you for your visit, see you soon!",
    welcomeHeader: "Welcome to our store",
    paymentMethods: {
      cash: "CASH",
      card: "CARD",
      credit: "CREDIT",
      transfer: "TRANSFER",
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
    totalClean: "TOPLAM",
    orderNumber: "SİPARİŞ NO",
    serviceMode: "Servis Türü",
    dineIn: "Masa",
    takeaway: "Paket",
    delivery: "Teslimat",
    retail: "Perakende",
    wholesale: "Toptan",
    modifiers: "Ek Seçenekler",
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
    totalClean: "TOTAL",
    orderNumber: "SU PEDIDO",
    serviceMode: "Modo de Servicio",
    dineIn: "En Sala",
    takeaway: "Para Llevar",
    delivery: "Entrega",
    retail: "Venta Detalle",
    wholesale: "Venta Mayor",
    modifiers: "Suplementos",
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
    totalClean: "GESAMT",
    orderNumber: "IHRE BESTELLUNG",
    serviceMode: "Service-Art",
    dineIn: "Im Haus",
    takeaway: "Zum Mitnehmen",
    delivery: "Lieferung",
    retail: "Einzelhandel",
    wholesale: "Großhandel",
    modifiers: "Zusätze",
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
