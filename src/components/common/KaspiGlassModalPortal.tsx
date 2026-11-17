"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface KaspiGlassModalPortalProps {
  isOpen?: boolean;
  onClose?: () => void;
  dir?: "ltr" | "rtl" | "auto";
  className?: string;
  children: React.ReactNode;
}

/**
 * Shared visionOS Modal Portal (`z-[9999]`) mounted directly on `document.body`.
 * Prevents parent `backdrop-filter`, `transform`, or `overflow-y-auto` containers
 * from trapping `position: fixed` overlays or leaking sibling elements (like
 * the Sidebar `KASPI AI` button or POS `إتمام البيع (F10)` CTA) above the backdrop.
 */
export const KaspiGlassModalPortal: React.FC<KaspiGlassModalPortalProps> = ({
  isOpen = true,
  onClose,
  dir = "ltr",
  className = "",
  children,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      dir={dir}
      data-kaspi-modal-portal="true"
      onClick={onClose ? () => onClose() : undefined}
      className={`kaspi-modal-portal-backdrop kaspi-no-scrollbar fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto overflow-x-hidden select-none backdrop-blur-2xl bg-black/55 animate-in fade-in duration-200 ${className}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full flex items-center justify-center my-auto"
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default KaspiGlassModalPortal;
