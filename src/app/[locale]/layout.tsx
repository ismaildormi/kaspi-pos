import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "@/app/globals.css";
import { AIChatWidget } from "@/components/ai/AIChatWidget";
import { UpdateBanner } from "@/components/UpdateBanner";

export const dynamic = "force-dynamic";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "ar" | "fr" | "en")) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div
      lang={locale}
      dir={dir}
      className={`bg-zinc-950 text-white min-h-screen antialiased ${
        locale === "ar" ? "font-['Cairo',sans-serif]" : "font-['Inter',sans-serif]"
      }`}
    >
      <NextIntlClientProvider messages={messages}>
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
