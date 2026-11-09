/**
 * Shared trilingual copy for the KASPI POS verification card (web) and the OTP email (HTML).
 * Kept framework-free so it can be imported from both client components and server mailers.
 */

export type VerificationLang = "ar" | "fr" | "en";
export type VerificationPurpose = "login" | "reset";

export const VERIFICATION_LANGS: VerificationLang[] = ["ar", "fr", "en"];

export interface VerificationCopy {
  dir: "rtl" | "ltr";
  badge: string;
  name: string;
  subtitle: string;
  heading: Record<VerificationPurpose, string>;
  description: Record<VerificationPurpose, string>;
  copyBtn: string;
  copiedBtn: string;
  copyFailed: string;
  tapToCopy: string;
}

export const VERIFICATION_COPY: Record<VerificationLang, VerificationCopy> = {
  ar: {
    dir: "rtl",
    badge: "AR",
    name: "العربية",
    subtitle: "نظام إدارة نقاط البيع والمتاجر",
    heading: {
      login: "تسجيل الدخول إلى حسابك",
      reset: "إعادة تعيين كلمة المرور",
    },
    description: {
      login: "استخدم رمز التحقق السري أثناء تسجيل الدخول بأمان إلى النظام.",
      reset: "استخدم رمز التحقق السري لإعادة تعيين كلمة المرور بأمان.",
    },
    copyBtn: "نسخ الرمز",
    copiedBtn: "تم النسخ",
    copyFailed: "تعذر النسخ تلقائياً، حدد الرمز وانسخه يدوياً.",
    tapToCopy: "اضغط على الرمز أو الزر لنسخه.",
  },
  fr: {
    dir: "ltr",
    badge: "FR",
    name: "Français",
    subtitle: "Système de gestion de point de vente et magasins",
    heading: {
      login: "Connexion à votre compte",
      reset: "Réinitialisation du mot de passe",
    },
    description: {
      login:
        "Utilisez ce code de vérification secret pour vous connecter en toute sécurité au système.",
      reset:
        "Utilisez ce code de vérification secret pour réinitialiser votre mot de passe en toute sécurité.",
    },
    copyBtn: "Copier le code",
    copiedBtn: "Copié",
    copyFailed: "Copie automatique impossible, sélectionnez le code manuellement.",
    tapToCopy: "Touchez le code ou le bouton pour le copier.",
  },
  en: {
    dir: "ltr",
    badge: "EN",
    name: "English",
    subtitle: "Point of Sale & Store Management System",
    heading: {
      login: "Sign in to your account",
      reset: "Reset your password",
    },
    description: {
      login: "Use this secret verification code to securely sign in to the system.",
      reset: "Use this secret verification code to securely reset your password.",
    },
    copyBtn: "Copy code",
    copiedBtn: "Copied",
    copyFailed: "Automatic copy failed, please select the code manually.",
    tapToCopy: "Tap the code or the button to copy it.",
  },
};

export function normalizeVerificationLang(raw?: string | null): VerificationLang {
  return raw === "fr" || raw === "en" || raw === "ar" ? raw : "ar";
}

/** Strip everything except Western digits (Arabic-Indic digits are converted) and cap at 6. */
export function normalizeVerificationCode(raw?: string | null): string {
  return String(raw ?? "")
    .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "")
    .slice(0, 6);
}
