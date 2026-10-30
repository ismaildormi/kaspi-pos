import "@/app/globals.css";
import React from "react";

export const metadata = {
  title: "Super Admin Dashboard | Kasbi POS Platform Owner",
  description: "Platform Administration and Tenant Management for Kasbi POS SaaS",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-slate-900 text-slate-100 antialiased font-sans">
        <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-lg">
              ك
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">Kasbi POS</span>
                <span className="bg-red-500/10 text-red-400 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-red-500/20 uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">Platform Owner Console • لوحة تحكم مالك المنصة</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-400 hidden sm:inline">Owner Security Context</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="System Operational" />
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
