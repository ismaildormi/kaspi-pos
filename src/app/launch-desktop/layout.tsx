import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KASPI POS — Desktop Launcher",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function LaunchDesktopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
