import { redirect } from "next/navigation";

export default async function YukaAliasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = locale === "ar" || locale === "en" || locale === "fr" ? locale : "fr";
  redirect(`/${safeLocale}/heyuka`);
}
