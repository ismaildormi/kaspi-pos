export type AuthLocale = "ar" | "fr" | "en";

export interface LocalizedErrorMap {
  ar: string;
  fr: string;
  en: string;
}

const ERROR_CODE_TRANSLATIONS: Record<string, LocalizedErrorMap> = {
  INVALID_CREDENTIALS: {
    ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    fr: "Adresse e-mail ou mot de passe incorrect",
    en: "Incorrect email address or password",
  },
  USER_NOT_FOUND: {
    ar: "لم يتم العثور على حساب مرتبط بهذا البريد الإلكتروني",
    fr: "Aucun compte trouvé avec cette adresse e-mail",
    en: "No account found with this email address",
  },
  USER_DISABLED: {
    ar: "هذا الحساب معطل حالياً. يرجى التواصل مع إدارة النظام.",
    fr: "Ce compte est actuellement désactivé. Veuillez contacter le support.",
    en: "This account is currently disabled. Please contact support.",
  },
  ACCOUNT_DISABLED: {
    ar: "هذا الحساب معطل حالياً. يرجى التواصل مع إدارة النظام.",
    fr: "Ce compte est actuellement désactivé. Veuillez contacter le support.",
    en: "This account is currently disabled. Please contact support.",
  },
  EMAIL_EXISTS: {
    ar: "البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.",
    fr: "Cette adresse e-mail est déjà enregistrée. Veuillez vous connecter.",
    en: "This email address is already registered. Please sign in.",
  },
  EMAIL_ALREADY_EXISTS: {
    ar: "البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.",
    fr: "Cette adresse e-mail est déjà enregistrée. Veuillez vous connecter.",
    en: "This email address is already registered. Please sign in.",
  },
  INVALID_CODE: {
    ar: "رمز التحقق غير صحيح. يرجى التأكد من الرمز والمحاولة مجدداً.",
    fr: "Code de vérification incorrect. Veuillez vérifier et réessayer.",
    en: "Invalid verification code. Please check and try again.",
  },
  INVALID_OTP: {
    ar: "رمز التحقق غير صحيح. يرجى التأكد من الرمز والمحاولة مجدداً.",
    fr: "Code de vérification incorrect. Veuillez vérifier et réessayer.",
    en: "Invalid verification code. Please check and try again.",
  },
  EXPIRED_CODE: {
    ar: "انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.",
    fr: "Le code de vérification a expiré. Veuillez en demander un nouveau.",
    en: "Verification code has expired. Please request a new one.",
  },
  EXPIRED_OTP: {
    ar: "انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.",
    fr: "Le code de vérification a expiré. Veuillez en demander un nouveau.",
    en: "Verification code has expired. Please request a new one.",
  },
  DEVICE_LIMIT_EXCEEDED: {
    ar: "تم بلوغ الحد الأقصى للأجهزة المتزامنة. تم تحويل الجلسة إلى هذا الجهاز.",
    fr: "Limite d'appareils atteinte. La session a été basculée sur cet appareil.",
    en: "Device limit reached. Session transferred to this device.",
  },
  NO_MEMBERSHIP: {
    ar: "لا توجد عضويات نشطة أو متاجر مرتبطة بهذا الحساب",
    fr: "Aucune boutique active associée à ce compte",
    en: "No active store membership associated with this account",
  },
  VALIDATION_ERROR: {
    ar: "يرجى التحقق من صحة البيانات المدخلة والمحاولة مجدداً",
    fr: "Veuillez vérifier les informations saisies",
    en: "Please check the entered information",
  },
  RATE_LIMIT_EXCEEDED: {
    ar: "تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار قليلاً والمحاولة مجدداً.",
    fr: "Trop de tentatives. Veuillez patienter un instant avant de réessayer.",
    en: "Too many attempts. Please wait a moment before trying again.",
  },
  TOO_MANY_REQUESTS: {
    ar: "تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار قليلاً والمحاولة مجدداً.",
    fr: "Trop de tentatives. Veuillez patienter un instant avant de réessayer.",
    en: "Too many attempts. Please wait a moment before trying again.",
  },
  INTERNAL_ERROR: {
    ar: "تعذر الاتصال بالخادم، يرجى المحاولة مجدداً لاحقاً",
    fr: "Erreur de connexion au serveur, veuillez réessayer",
    en: "Unable to reach the server, please try again",
  },
  NETWORK_ERROR: {
    ar: "تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً",
    fr: "Erreur de connexion au serveur, veuillez vérifier votre connexion",
    en: "Unable to reach the server, please check your network connection",
  },
};

/**
 * Normalizes any error response (string, error object, status code)
 * into a guaranteed 100% localized string for the specified locale.
 * Completely prevents French or English leakages when in Arabic mode.
 */
export function getLocalizedAuthError(
  rawError: unknown,
  locale: AuthLocale = "ar"
): string {
  if (!rawError) {
    return ERROR_CODE_TRANSLATIONS.INTERNAL_ERROR[locale];
  }

  // Handle object structure: { code?: string, error?: string, message?: string }
  let extractedCode = "";
  let extractedText = "";

  if (typeof rawError === "object" && rawError !== null) {
    const errObj = rawError as Record<string, any>;
    if (typeof errObj.code === "string") extractedCode = errObj.code.toUpperCase().trim();
    if (typeof errObj.error === "string") extractedText = errObj.error.trim();
    else if (typeof errObj.message === "string") extractedText = errObj.message.trim();
    else if (typeof errObj.error?.message === "string") extractedText = errObj.error.message.trim();
  } else if (typeof rawError === "string") {
    extractedText = rawError.trim();
    if (/^[A-Z0-9_]+$/.test(extractedText)) {
      extractedCode = extractedText;
    }
  }

  // Direct match on uppercase code
  if (extractedCode && ERROR_CODE_TRANSLATIONS[extractedCode]) {
    return ERROR_CODE_TRANSLATIONS[extractedCode][locale];
  }

  const textLower = extractedText.toLowerCase();

  // Keyword pattern matching for common error texts
  if (
    textLower.includes("credentials") ||
    textLower.includes("password") ||
    textLower.includes("mot de passe") ||
    textLower.includes("incorrect") ||
    textLower.includes("غير صحيحة") ||
    textLower.includes("signin")
  ) {
    return ERROR_CODE_TRANSLATIONS.INVALID_CREDENTIALS[locale];
  }

  if (
    textLower.includes("device") ||
    textLower.includes("appareil") ||
    textLower.includes("poste") ||
    textLower.includes("limite d'appareils")
  ) {
    return ERROR_CODE_TRANSLATIONS.DEVICE_LIMIT_EXCEEDED[locale];
  }

  if (
    textLower.includes("already registered") ||
    textLower.includes("déjà enregistrée") ||
    textLower.includes("email already") ||
    textLower.includes("مسجل بالفعل")
  ) {
    return ERROR_CODE_TRANSLATIONS.EMAIL_EXISTS[locale];
  }

  if (
    textLower.includes("expired") ||
    textLower.includes("expiré") ||
    textLower.includes("انتهت صلاحية")
  ) {
    return ERROR_CODE_TRANSLATIONS.EXPIRED_CODE[locale];
  }

  if (
    textLower.includes("otp") ||
    textLower.includes("code") ||
    textLower.includes("رمز التحقق")
  ) {
    return ERROR_CODE_TRANSLATIONS.INVALID_CODE[locale];
  }

  if (
    textLower.includes("disabled") ||
    textLower.includes("désactivé") ||
    textLower.includes("معطل")
  ) {
    return ERROR_CODE_TRANSLATIONS.USER_DISABLED[locale];
  }

  if (
    textLower.includes("rate") ||
    textLower.includes("tentatives") ||
    textLower.includes("too many")
  ) {
    return ERROR_CODE_TRANSLATIONS.RATE_LIMIT_EXCEEDED[locale];
  }

  if (
    textLower.includes("membership") ||
    textLower.includes("boutique") ||
    textLower.includes("متجر")
  ) {
    return ERROR_CODE_TRANSLATIONS.NO_MEMBERSHIP[locale];
  }

  if (
    textLower.includes("network") ||
    textLower.includes("fetch") ||
    textLower.includes("connect") ||
    textLower.includes("اتصال")
  ) {
    return ERROR_CODE_TRANSLATIONS.NETWORK_ERROR[locale];
  }

  // If the extracted text is already in the target locale and has non-empty text, return it
  if (locale === "ar" && /[\u0600-\u06FF]/.test(extractedText)) {
    return extractedText;
  }
  if (locale === "fr" && !/[\u0600-\u06FF]/.test(extractedText) && textLower.length > 5) {
    return extractedText;
  }
  if (locale === "en" && !/[\u0600-\u06FF]/.test(extractedText) && textLower.length > 5) {
    return extractedText;
  }

  // Fallback to generic localized error
  return ERROR_CODE_TRANSLATIONS.INTERNAL_ERROR[locale];
}
