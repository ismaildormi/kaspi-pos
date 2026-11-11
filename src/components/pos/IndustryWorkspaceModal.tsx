"use client";

import React from "react";
import { StoreOnboardingModal } from "@/components/pos/StoreOnboardingModal";
import { usePosStore } from "@/client/store/usePosStore";

interface IndustryWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOnboardingSwitch?: () => void;
}

export function IndustryWorkspaceModal({
  isOpen,
  onClose,
}: IndustryWorkspaceModalProps) {
  const { tenantInfo, storeType } = usePosStore();

  if (!isOpen) return null;

  return (
    <StoreOnboardingModal
      isOpen={isOpen}
      onClose={onClose}
      initialShopName={tenantInfo?.shopName || ""}
      initialStoreType={storeType}
    />
  );
}
