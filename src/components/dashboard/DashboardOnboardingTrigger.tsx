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
        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
      >
        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
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
