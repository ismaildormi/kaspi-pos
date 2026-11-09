/**
 * Shared trilingual copy and data definitions for the KASPI POS Welcome & Successful Sign-In Email.
 * Zero emojis rule enforced: typography, geometric indicators, and inline SVGs only.
 */

export type WelcomeLang = "ar" | "fr" | "en";

export const WELCOME_LANGS: WelcomeLang[] = ["ar", "fr", "en"];

export interface WelcomeEmailData {
  userName?: string;
  storeName?: string;
  storeCategory?: string;
  userEmail?: string;
  loginDate?: string;
}

export interface WelcomeCopy {
  dir: "rtl" | "ltr";
  badge: string;
  name: string;
  subject: string;
  subtitle: string;
  heroHeading: (userName: string) => string;
  heroDescription: string;
  storePass: {
    liveStatus: string;
    statusBadge: string;
    categoryLabel: string;
    ownerLabel: string;
    dateLabel: string;
  };
  onboarding: {
    sectionTitle: string;
    steps: [string, string, string];
  };
  primaryButton: string;
  footerNote: string;
  defaultStoreName: string;
  defaultCategory: string;
}

export const CATEGORY_LABELS: Record<
  "grocery" | "restaurant" | "fashion" | "electronics",
  Record<WelcomeLang, string>
> = {
  grocery: {
    ar: "سوبرماركت وبقالة",
    fr: "Supermarché & Épicerie",
    en: "Supermarket & Grocery",
  },
  restaurant: {
    ar: "مطعم ومقهى",
    fr: "Restaurant & Café",
    en: "Restaurant & Cafe",
  },
  fashion: {
    ar: "ملابس وأزياء",
    fr: "Mode & Vêtements",
    en: "Clothing & Fashion",
  },
  electronics: {
    ar: "إلكترونيات وتجارة",
    fr: "Électronique & Commerce",
    en: "Electronics & Retail",
  },
};

export const WELCOME_COPY: Record<WelcomeLang, WelcomeCopy> = {
  ar: {
    dir: "rtl",
    badge: "AR",
    name: "العربية",
    subject: "مرحباً بك في KASPI POS — متجرك جاهز للانطلاق",
    subtitle: "نظام إدارة نقاط البيع والمتاجر",
    heroHeading: (userName: string) => `مرحباً بك في عائلة KASPI POS، ${userName}`,
    heroDescription:
      "تم تسجيل دخولك وتفعيل حسابك بنجاح. مساحتك التجارية جاهزة الآن لإدارة المبيعات، المخزون، والفواتير بكل احترافية.",
    storePass: {
      liveStatus: "نشط",
      statusBadge: "نشط وجاهز",
      categoryLabel: "النشاط التجاري",
      ownerLabel: "صاحب الحساب",
      dateLabel: "التاريخ",
    },
    onboarding: {
      sectionTitle: "خطواتك الأولى للانطلاق",
      steps: [
        "أضف منتجاتك وأقسام متجرك بسهولة",
        "اضبط إعدادات الفاتورة ونقطة البيع ( الكاشير )",
        "ابدأ أول عملية بيع وتابع أرباحك لحظة بلحظة",
      ],
    },
    primaryButton: "الدخول إلى لوحة التحكم",
    footerNote: "وصلتك هذه الرسالة لتأكيد تسجيل دخولك بنجاح إلى نظام KASPI POS.",
    defaultStoreName: "متجري",
    defaultCategory: "سوبرماركت وبقالة",
  },
  fr: {
    dir: "ltr",
    badge: "FR",
    name: "Français",
    subject: "Bienvenue sur KASPI POS — Votre magasin est prêt",
    subtitle: "Système de gestion de point de vente et magasins",
    heroHeading: (userName: string) => `Bienvenue sur KASPI POS, ${userName}`,
    heroDescription:
      "Votre connexion est confirmée et votre espace marchand est désormais actif. Gérez vos ventes, votre stock et votre caisse en toute simplicité.",
    storePass: {
      liveStatus: "Actif",
      statusBadge: "Actif & Prêt",
      categoryLabel: "Activité",
      ownerLabel: "Responsable",
      dateLabel: "Date",
    },
    onboarding: {
      sectionTitle: "Vos premières étapes",
      steps: [
        "Ajoutez vos premiers produits et catégories",
        "Personnalisez votre caisse et vos reçus",
        "Lancez votre première vente en temps réel",
      ],
    },
    primaryButton: "Accéder au tableau de bord",
    footerNote:
      "Cet e-mail confirme l'activation et la connexion réussie à votre compte KASPI POS.",
    defaultStoreName: "Mon Magasin",
    defaultCategory: "Supermarché & Épicerie",
  },
  en: {
    dir: "ltr",
    badge: "EN",
    name: "English",
    subject: "Welcome to KASPI POS — Your store is ready",
    subtitle: "Point of Sale & Store Management System",
    heroHeading: (userName: string) => `Welcome to KASPI POS, ${userName}`,
    heroDescription:
      "You have successfully signed in and your merchant workspace is now live. Manage your sales, inventory, and checkout seamlessly.",
    storePass: {
      liveStatus: "Active",
      statusBadge: "Active & Ready",
      categoryLabel: "Business Type",
      ownerLabel: "Account Owner",
      dateLabel: "Date",
    },
    onboarding: {
      sectionTitle: "Quick start guide",
      steps: [
        "Add your products and inventory categories",
        "Configure your POS register and receipt settings",
        "Start your first sale and track live revenue",
      ],
    },
    primaryButton: "Open POS Dashboard",
    footerNote: "You received this email confirming your successful sign-in to KASPI POS.",
    defaultStoreName: "My Store",
    defaultCategory: "Supermarket & Grocery",
  },
};

export function normalizeWelcomeLang(raw?: string | null): WelcomeLang {
  return raw === "fr" || raw === "en" || raw === "ar" ? raw : "ar";
}

export function resolveStoreCategory(rawCategory: string | undefined, lang: WelcomeLang): string {
  if (!rawCategory) return WELCOME_COPY[lang].defaultCategory;
  const lower = rawCategory.trim().toLowerCase();
  if (lower.includes("groc") || lower.includes("بقالة") || lower.includes("super")) {
    return CATEGORY_LABELS.grocery[lang];
  }
  if (lower.includes("rest") || lower.includes("مطعم") || lower.includes("caf")) {
    return CATEGORY_LABELS.restaurant[lang];
  }
  if (lower.includes("fash") || lower.includes("ملابس") || lower.includes("mode") || lower.includes("أزياء")) {
    return CATEGORY_LABELS.fashion[lang];
  }
  if (lower.includes("elec") || lower.includes("إلكتروني") || lower.includes("retail")) {
    return CATEGORY_LABELS.electronics[lang];
  }
  return rawCategory;
}

export function formatWelcomeDate(dateInput?: string | Date, lang: WelcomeLang = "ar"): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;

  const localeCode = lang === "ar" ? "ar-MA" : lang === "fr" ? "fr-FR" : "en-US";
  try {
    return validDate.toLocaleDateString(localeCode, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Africa/Casablanca",
    });
  } catch {
    return validDate.toISOString().split("T")[0] || "";
  }
}
