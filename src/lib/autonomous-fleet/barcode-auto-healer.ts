/**
 * KASPI POS — Agent #08: Moroccan AZERTY / QWERTY / Arabic Barcode Auto-Healer
 *
 * In Morocco, ~90% of retail PCs use French AZERTY keyboards where USB/Bluetooth
 * HID barcode scanners output `&é"'(-è_çà` instead of `1234567890` when CapsLock is off.
 * This utility translates AZERTY unshifted top-row characters and Arabic-Indic numerals
 * into clean EAN-13/UPC digits in 0ms without affecting normal French/Arabic text searches.
 */

const AZERTY_TO_DIGIT: Record<string, string> = {
  "&": "1",
  "é": "2",
  "É": "2",
  '"': "3",
  "'": "4",
  "(": "5",
  "-": "6",
  "è": "7",
  "È": "7",
  "_": "8",
  "ç": "9",
  "Ç": "9",
  "à": "0",
  "À": "0",
};

const ARABIC_INDIC_TO_DIGIT: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

const BARCODE_LIKE_AZERTY_OR_DIGITS = /^[&éÉ"'(\-èÈ_çÇàÀ0-9٠-٩\s]+$/;
const HAS_AZERTY_CHAR = /[&éÉ"'(\-èÈ_çÇàÀ]/;
const HAS_ARABIC_INDIC = /[٠-٩]/;

export interface BarcodeHealResult {
  normalized: string;
  wasHealed: boolean;
  detectedLayout?: "AZERTY" | "ARABIC_INDIC" | "MIXED";
}

export function normalizeMoroccanBarcode(rawInput: string): BarcodeHealResult {
  const trimmed = (rawInput || "").trim();
  if (!trimmed) {
    return { normalized: "", wasHealed: false };
  }

  // Only heal if the input consists exclusively of barcode-compatible digits/AZERTY/Arabic-Indic chars
  // and is at least 3 chars long (prevents altering normal French/Arabic product name searches).
  if (trimmed.length < 3 || !BARCODE_LIKE_AZERTY_OR_DIGITS.test(trimmed)) {
    return { normalized: trimmed, wasHealed: false };
  }

  const hasAzerty = HAS_AZERTY_CHAR.test(trimmed);
  const hasArabic = HAS_ARABIC_INDIC.test(trimmed);

  if (!hasAzerty && !hasArabic) {
    return { normalized: trimmed.replace(/\s+/g, ""), wasHealed: false };
  }

  let healed = "";
  for (const ch of trimmed) {
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") continue;
    if (AZERTY_TO_DIGIT[ch]) {
      healed += AZERTY_TO_DIGIT[ch];
    } else if (ARABIC_INDIC_TO_DIGIT[ch]) {
      healed += ARABIC_INDIC_TO_DIGIT[ch];
    } else {
      healed += ch;
    }
  }

  const detectedLayout =
    hasAzerty && hasArabic
      ? "MIXED"
      : hasAzerty
      ? "AZERTY"
      : "ARABIC_INDIC";

  return {
    normalized: healed,
    wasHealed: healed !== trimmed,
    detectedLayout,
  };
}
