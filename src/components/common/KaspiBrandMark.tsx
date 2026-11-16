import React from "react";

export interface KaspiBrandMarkProps {
  size?: "xs" | "sm" | "md" | "lg" | "auth";
  className?: string;
  alt?: string;
  glow?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<KaspiBrandMarkProps["size"]>, string> = {
  xs: "h-6 w-auto",
  sm: "h-9 w-auto",
  md: "h-11 w-auto",
  lg: "h-14 w-auto",
  auth: "h-20 sm:h-24 w-auto",
};

/**
 * KASPI POS authentic 3D brushed-chrome & pearlescent-ceramic infinity logo cutout.
 * Frameless transparent PNG (/logo-mark.png) extracted cleanly from /logo.png —
 * zero background plate, zero square box, zero border wrapper.
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
      className={`inline-block shrink-0 select-none object-contain ${SIZE_CLASSES[size]} ${
        glow
          ? "drop-shadow-[0_12px_28px_rgba(0,0,0,0.28)]"
          : ""
      } ${className}`}
    />
  );
};

export default KaspiBrandMark;
