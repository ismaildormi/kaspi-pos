import React from "react";

interface KaspiBrandMarkProps {
  className?: string;
  size?: number | string;
  alt?: string;
}

/**
 * Pure 3D Metallic KASPI Infinity Brand Mark
 * Guaranteed 100% frameless: No borders, no square cards, no background padding.
 */
export const KaspiBrandMark: React.FC<KaspiBrandMarkProps> = ({
  className = "w-8 h-8",
  alt = "KASPI POS",
}) => {
  return (
    <img
      src="/logo-mark.png"
      alt={alt}
      className={`object-contain drop-shadow-[0_2px_12px_rgba(255,255,255,0.18)] select-none bg-transparent border-0 shadow-none p-0 ${className}`}
      onError={(e) => {
        if (!e.currentTarget.src.endsWith("/logo.png")) {
          e.currentTarget.src = "/logo.png";
        }
      }}
    />
  );
};

export default KaspiBrandMark;
