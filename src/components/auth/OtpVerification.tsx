"use client";

import React, { useRef, useEffect } from "react";

interface OtpVerificationProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  length?: number;
}

/**
 * Normalize Arabic-Indic (٠-٩) and Extended Arabic-Indic (۰-۹) digits to Western (0-9)
 * and strip any non-digit characters.
 */
export function normalizeOtpDigits(raw: string): string {
  return raw
    .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "");
}

export const OtpVerification: React.FC<OtpVerificationProps> = ({
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  length = 6,
}) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const cleanValue = normalizeOtpDigits(value).slice(0, length);

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  const applyDigitsFromIndex = (startIndex: number, pastedOrTyped: string) => {
    const digits = normalizeOtpDigits(pastedOrTyped);
    if (!digits) return;

    const chars = Array.from({ length }, (_, idx) => cleanValue[idx] || "");

    // If user pastes a full or multi-digit code, fill from index 0 if it's length >= 4, otherwise from startIndex
    const targetStart = digits.length >= 4 ? 0 : startIndex;
    for (let i = 0; i < digits.length && targetStart + i < length; i++) {
      chars[targetStart + i] = digits[i];
    }

    const nextCode = chars.join("").slice(0, length);
    onChange(nextCode);

    const nextFocusIdx = Math.min(length - 1, targetStart + digits.length);
    inputRefs.current[nextFocusIdx]?.focus();

    if (nextCode.length === length && onComplete) {
      onComplete(nextCode);
    }
  };

  const handleBoxChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = normalizeOtpDigits(raw);

    if (!digits) {
      const chars = Array.from({ length }, (_, idx) => cleanValue[idx] || "");
      chars[index] = "";
      onChange(chars.join(""));
      return;
    }

    if (digits.length > 1) {
      applyDigitsFromIndex(index, digits);
      return;
    }

    const chars = Array.from({ length }, (_, idx) => cleanValue[idx] || "");
    chars[index] = digits[0];
    const nextCode = chars.join("");
    onChange(nextCode);

    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (nextCode.length === length && onComplete) {
      onComplete(nextCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (cleanValue[index]) {
        const chars = Array.from({ length }, (_, idx) => cleanValue[idx] || "");
        chars[index] = "";
        onChange(chars.join(""));
      } else if (index > 0) {
        const chars = Array.from({ length }, (_, idx) => cleanValue[idx] || "");
        chars[index - 1] = "";
        onChange(chars.join(""));
        inputRefs.current[index - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData("text/plain") || e.clipboardData?.getData("text") || "";
    const digits = normalizeOtpDigits(pastedText);
    if (digits) {
      applyDigitsFromIndex(index, digits);
    }
  };

  return (
    <div dir="ltr" className="flex items-center justify-center gap-2 sm:gap-2.5 select-none">
      {Array.from({ length }).map((_, idx) => {
        const digit = cleanValue[idx] || "";
        return (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={idx === 0 ? "one-time-code" : "off"}
            maxLength={length}
            disabled={disabled}
            value={digit}
            onChange={(e) => handleBoxChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={(e) => handlePaste(idx, e)}
            onFocus={(e) => e.currentTarget.select()}
            aria-label={`Digit ${idx + 1}`}
            className={`w-11 h-14 sm:w-12 sm:h-14 rounded-xl bg-zinc-950 border text-center text-2xl font-mono font-bold text-white transition-all focus:outline-none focus:ring-2 focus:ring-white ${
              digit
                ? "border-white/80 bg-zinc-900 shadow-inner"
                : "border-zinc-800 hover:border-zinc-700"
            } disabled:opacity-50`}
          />
        );
      })}
    </div>
  );
};

export default OtpVerification;
