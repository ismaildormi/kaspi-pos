"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTransition } from "react";

const LOCALES = [
  { code: "ar", label: "العربية", short: "AR" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "en", label: "English", short: "EN" },
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
    <div
      dir="ltr"
      className="inline-flex items-center gap-0.5 p-1 bg-zinc-900/90 rounded-lg border border-white/10 text-xs font-medium select-none"
    >
      {LOCALES.map((loc) => {
        const isActive = loc.code === currentLocale;
        return (
          <button
            key={loc.code}
            type="button"
            disabled={isPending}
            onClick={() => handleSelect(loc.code)}
            className={`px-2 py-1 rounded-md transition-all flex items-center justify-center text-[11px] cursor-pointer ${
              isActive
                ? "bg-white text-zinc-950 font-bold shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            }`}
            title={loc.label}
          >
            <span>{loc.label}</span>
          </button>
        );
      })}
    </div>
  );
}
