import React from "react";

export interface KaspiBrandMarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "auth";
  alt?: string;
}

/**
 * Official KASPI POS Brand Logo
 * Displays the original uncropped logo.png with zero outer wrapper/border box.
 * Image itself carries rounded-xl or rounded-2xl and object-cover.
 */
export const KaspiBrandMark: React.FC<KaspiBrandMarkProps> = ({
  className = "",
  size = "sm",
  alt = "KASPI POS",
}) => {
  let defaultSizeClass = "w-8 h-8 rounded-xl object-cover";
  if (size === "auth" || size === "lg") {
    defaultSizeClass = "w-14 h-14 rounded-2xl object-cover shadow-lg";
  } else if (size === "md") {
    defaultSizeClass = "w-10 h-10 rounded-xl object-cover shadow-md";
  }

  return (
    <img
      src="/logo.png"
      alt={alt}
      className={`${defaultSizeClass} ${className} shrink-0 select-none`}
    />
  );
};

export default KaspiBrandMark;
