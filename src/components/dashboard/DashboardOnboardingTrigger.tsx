"use client";

import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { StoreOnboardingModal } from "@/components/pos/StoreOnboardingModal";
import { StoreBusinessType } from "@/client/store/usePosStore";
import { useAppDictionary } from "@/i18n/schema";

export function DashboardOnboardingTrigger({
  initialShopName,
  autoOpen,
  currentStoreType = "grocery",
}: {
  initialShopName?: string;
  autoOpen?: boolean;
  currentStoreType?: StoreBusinessType;
}) {
  const router = useRouter();
  const { t } = useAppDictionary();
  const [isOpen, setIsOpen] = useState(Boolean(autoOpen));

  useEffect(() => {
    if (autoOpen) {
      setIsOpen(true);
    }
  }, [autoOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 hover:border-white/25 bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-2 text-xs font-bold text-zinc-200 hover:text-white transition cursor-pointer"
      >
        <Sparkles className="h-3.5 w-3.5 text-zinc-300" />
        <span>{t.onboarding.businessSectorBtn}</span>
      </button>

      <StoreOnboardingModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialShopName={initialShopName}
        initialStoreType={currentStoreType}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </>
  );
}
