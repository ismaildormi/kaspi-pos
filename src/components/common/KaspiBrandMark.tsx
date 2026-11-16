import React from "react";

export interface KaspiBrandMarkProps {
  size?: "xs" | "sm" | "md" | "lg" | "auth";
  className?: string;
  alt?: string;
  glow?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<KaspiBrandMarkProps["size"]>, string> = {
  xs: "h-6 w-auto",
  sm: "h-7 w-auto",
  md: "h-8 w-auto",
  lg: "h-10 w-auto",
  auth: "h-11 sm:h-12 w-auto",
};

/**
 * KASPI POS authentic 3D brushed-chrome & pearlescent-ceramic infinity logo cutout.
 * Frameless transparent PNG (/logo-mark.png) extracted cleanly from /logo.png —
 * locked to 100% original 3D dark-chrome + ceramic-white contrast in both themes.
 */
export const KaspiBrandMark: React.FC<KaspiBrandMarkProps> = ({
  size = "md",
  className = "",
  alt = "KASPI POS",
  glow = true,
}) => {
  return (
    <img
      src="/logo-mark.png"
      alt={alt}
      data-kaspi-brand-mark="authentic-3d-cutout"
      draggable={false}
      style={{
        filter: glow ? "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.22))" : "none",
        WebkitFilter: glow ? "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.22))" : "none",
        opacity: 1,
        mixBlendMode: "normal",
      }}
      className={`inline-block shrink-0 select-none object-contain bg-transparent border-0 rounded-none p-0 ${SIZE_CLASSES[size]} ${className}`}
    />
  );
};

export default KaspiBrandMark;
