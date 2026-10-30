import { redirect } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  redirect({ href: "/pos", locale });
}
