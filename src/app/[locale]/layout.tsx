import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "@/app/globals.css";
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

  let messages = {};
  try {
    messages = await getMessages();
  } catch {
    // Fallback to empty messages map if next-intl server context is unavailable
  }
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
        <UpdateBanner />
      </NextIntlClientProvider>
    </div>
  );
}
