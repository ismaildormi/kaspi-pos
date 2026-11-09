import type { Metadata } from "next";

// The one-time code travels in the query string: keep this page out of search
// indexes and never leak the URL to third parties through the Referer header.
export const metadata: Metadata = {
  title: "KASPI POS — Verification code",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function VerifyCodeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
