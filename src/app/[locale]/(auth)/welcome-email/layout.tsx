import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KASPI POS — Welcome Email Preview",
  robots: { index: false, follow: false },
};

export default function WelcomeEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
