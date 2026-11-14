"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ShoppingBag,
  Download,
  Settings,
  User as UserIcon,
  ShoppingBasket,
  UtensilsCrossed,
  Shirt,
  Smartphone,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { KaspiThemeToggle } from "@/components/theme/KaspiThemeToggle";
import { OwnerProfileModal } from "@/components/layout/OwnerProfileModal";
import { StoreOnboardingModal } from "@/components/pos/StoreOnboardingModal";
import { InAppPaywallModal } from "@/components/billing/InAppPaywallModal";
import { usePosStore, type StoreBusinessType } from "@/client/store/usePosStore";
import { getApiUrl } from "@/client/sync-engine";
import { useAppDictionary } from "@/i18n/schema";
import { AutonomousSelfHealingBoundary } from "@/components/security/AutonomousSelfHealingBoundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t, locale } = useAppDictionary();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const isPlaceholderName = (n?: string | null) =>
    !n ||
    n.trim() === "" ||
    n.trim().toUpperCase() === "KASPI POS" ||
    n.trim() === "كسب POS" ||
    n.trim() === "Magasin Principal";

  const [shopName, setShopName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kaspi_store_name");
      if (saved && !isPlaceholderName(saved)) return saved.trim();
    }
    return "ASIMA";
  });
  const [storeLogoUrl, setStoreLogoUrl] = useState<string>("");
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const { storeType, setStoreProfile } = usePosStore();

  const localizeHref = (path: string) => `/${locale}${path}`;

  useEffect(() => {
    const handleVaultEvent = () => setIsOwnerModalOpen(true);
    const handleSectorEvent = () => setIsSectorModalOpen(true);
    const handleProfileUpdate = (e: any) => {
      if (e.detail?.shopName && !isPlaceholderName(e.detail.shopName)) {
        setShopName(e.detail.shopName.trim());
      }
      if (e.detail?.logoUrl !== undefined) setStoreLogoUrl(e.detail.logoUrl);
    };

    window.addEventListener("open-owner-vault", handleVaultEvent);
    window.addEventListener("open-industry-modal", handleSectorEvent);
    window.addEventListener("kaspi_store_profile_updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("open-owner-vault", handleVaultEvent);
      window.removeEventListener("open-industry-modal", handleSectorEvent);
      window.removeEventListener("kaspi_store_profile_updated", handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(getApiUrl("/api/v1/me")).then((r) => (r.ok ? r.json() : null)),
      fetch(getApiUrl("/api/v1/settings")).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([meData, settingsData]) => {
        const activeTenantId =
          meData?.data?.currentTenant?.id || meData?.data?.user?.tenantId;
        if (activeTenantId && typeof window !== "undefined") {
          window.localStorage.setItem("kaspi_active_tenant_id", activeTenantId);
        }
        if (meData?.data?.user?.fullName || meData?.data?.user?.email) {
          setUserName(
            meData.data.user.fullName ||
              meData.data.user.email.split("@")[0]
          );
        }
        const tenantDisplayName = meData?.data?.currentTenant?.displayName;
        const candidateShop = settingsData?.settings?.shopName;
        if (!isPlaceholderName(candidateShop)) {
          setShopName(candidateShop!.trim());
        } else if (!isPlaceholderName(tenantDisplayName)) {
          setShopName(tenantDisplayName!.trim());
        } else {
          setShopName("ASIMA");
        }
        if (settingsData?.settings?.logoUrl) {
          setStoreLogoUrl(settingsData.settings.logoUrl);
        }
        if (settingsData?.settings?.storeType) {
          setStoreProfile(
            settingsData.settings.storeType,
            Boolean(settingsData.settings.onboardingCompleted)
          );
        }
      })
      .catch(() => {});
  }, [setStoreProfile]);

  return (
    <div dir="ltr" className="min-h-screen bg-[#0D1014] text-white flex flex-col md:flex-row">
      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        onNavigate={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="sticky top-0 z-30 h-14 backdrop-blur-xl bg-[#0D1014]/80 border-b border-white/[0.08] px-6 flex items-center justify-between md:justify-end gap-3 select-none">
          {/* Mobile menu button ONLY on small screens (md:hidden) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl kaspi-frosted-glass text-zinc-200 hover:text-white cursor-pointer"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Right-hand frosted glass utility pills */}
          <div className="flex items-center gap-2.5">
            <Link
              href={localizeHref("/pos")}
              className="group sheen-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 group-hover:-translate-y-0.5 group-hover:scale-105 transition-transform duration-200" />
              <span>{t.topbar.posRegister}</span>
            </Link>

            <Link
              href={localizeHref("/download")}
              className="group hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg kaspi-frosted-glass hover:bg-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white transition-all"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-y-0.5 transition-transform duration-200" />
              <span className="hidden xl:inline">{t.topbar.desktopApp}</span>
            </Link>

            <KaspiThemeToggle locale={locale} />

            <LanguageSwitcher />

            <Link
              href={localizeHref("/dashboard/settings")}
              className="group inline-flex items-center justify-center w-8 h-8 rounded-lg kaspi-frosted-glass hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-all"
              title={t.topbar.settings}
            >
              <Settings className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-500 ease-out" />
            </Link>

            {/* Top-Right Store Profile Button with Crisp Circular Avatar & Store Name */}
            <button
              type="button"
              onClick={() => setIsOwnerModalOpen(true)}
              className="hidden md:inline-flex items-center gap-2 h-9 px-2.5 rounded-xl kaspi-frosted-glass hover:bg-white/[0.08] text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
              title={locale === "ar" ? "خزنة المالك والملف الشخصي" : "Profil Propriétaire & Coffre-Fort"}
            >
              <div className="w-7 h-7 rounded-full overflow-hidden border border-white/25 bg-zinc-800 shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
                {storeLogoUrl ? (
                  <img
                    src={storeLogoUrl}
                    alt={shopName || "Store"}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span>{(shopName || userName || "K").slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <span className="truncate max-w-[120px] font-bold text-white">
                {shopName || userName || t.topbar.activeAccount}
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          <AutonomousSelfHealingBoundary scope="DASHBOARD">
            {children}
          </AutonomousSelfHealingBoundary>
        </main>
      </div>

      {/* Owner Profile & Security Vault Modal */}
      <OwnerProfileModal
        isOpen={isOwnerModalOpen}
        onClose={() => setIsOwnerModalOpen(false)}
        onProfileUpdated={({ shopName: updatedShop, logoUrl: updatedLogo }) => {
          if (updatedShop) setShopName(updatedShop);
          if (updatedLogo) setStoreLogoUrl(updatedLogo);
        }}
      />

      {/* Sector Switch Onboarding Modal */}
      <StoreOnboardingModal
        isOpen={isSectorModalOpen}
        onClose={() => setIsSectorModalOpen(false)}
        initialStoreType={storeType}
        initialShopName={shopName}
        canDismiss={true}
        onSuccess={(newType) => {
          setStoreProfile(newType, true);
        }}
      />

      {/* Enterprise In-App Paywall & Device Handover Modal */}
      <InAppPaywallModal />
    </div>
  );
}
