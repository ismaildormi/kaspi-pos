import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { DICTIONARY, type Locale } from "./schema";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "ar" | "fr" | "en")) {
    locale = routing.defaultLocale;
  }

  const cleanLocale = (locale === "ar" || locale === "en" ? locale : "fr") as Locale;
  let baseJson = {};
  try {
    baseJson = (await import(`../../messages/${cleanLocale}.json`)).default;
  } catch {
    // fallback if json file missing
  }

  const typedDict = DICTIONARY[cleanLocale] || DICTIONARY.fr;

  return {
    locale: cleanLocale,
    messages: {
      ...baseJson,
      ...typedDict,
    },
  };
});
