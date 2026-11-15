import React from "react";

export interface KaspiBrandMarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "auth";
  alt?: string;
}

/**
 * Official KASPI POS Brand Logo
 * Displays the full-bleed logo.png edge-to-edge without any outer frame/border box.
 */
export const KaspiBrandMark: React.FC<KaspiBrandMarkProps> = ({
  className = "",
  size = "sm",
  alt = "KASPI POS",
}) => {
  let defaultSizeClass = "w-8 h-8 rounded-xl";
  if (size === "auth" || size === "lg") {
    defaultSizeClass = "w-14 h-14 rounded-2xl shadow-lg";
  } else if (size === "md") {
    defaultSizeClass = "w-10 h-10 rounded-xl shadow-md";
  }

  return (
    <div className={`${defaultSizeClass} ${className} overflow-hidden shrink-0 select-none`}>
      <img
        src="/logo.png"
        alt={alt}
        className="w-full h-full object-cover scale-[1.24] select-none bg-transparent"
      />
    </div>
  );
};

export default KaspiBrandMark;
