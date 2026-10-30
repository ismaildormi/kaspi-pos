"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTransition } from "react";

const LOCALES = [
  { code: "ar", label: "العربية", flag: "🇲🇦", dir: "rtl" },
  { code: "fr", label: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "en", label: "English", flag: "🇬🇧", dir: "ltr" },
] as const;

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSelect = (nextLocale: "ar" | "fr" | "en") => {
    if (nextLocale === currentLocale) return;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-zinc-900 rounded-lg border border-zinc-800 text-xs font-medium">
      {LOCALES.map((loc) => {
        const isActive = loc.code === currentLocale;
        return (
          <button
            key={loc.code}
            type="button"
            disabled={isPending}
            onClick={() => handleSelect(loc.code)}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              isActive
                ? "bg-white text-black shadow-xs font-bold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
            title={loc.label}
          >
            <span>{loc.flag}</span>
            <span>{loc.label}</span>
          </button>
        );
      })}
    </div>
  );
}
