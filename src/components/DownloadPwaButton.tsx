"use client";

import React, { useEffect, useState } from "react";
import { Download, Monitor, CheckCircle2, ExternalLink, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface DownloadPwaButtonProps {
  label?: string;
  size?: "md" | "lg";
  githubReleasesUrl?: string;
}

export function DownloadPwaButton({
  label = "Install Desktop App (PWA / .exe)",
  size = "lg",
  githubReleasesUrl = "https://github.com/ismaildormi/kaspi-pos/releases/latest",
}: DownloadPwaButtonProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(display-mode: standalone)").matches
    ) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowFallback(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
      return;
    }

    // Fallback when beforeinstallprompt is not supported or already installed
    setShowFallback(true);
  };

  return (
    <div className="inline-flex flex-col items-center">
      <button
        type="button"
        onClick={handleInstallClick}
        className={`inline-flex items-center justify-center gap-3 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-all cursor-pointer shadow-[0_0_40px_rgba(255,255,255,0.25)] ${
          size === "lg" ? "px-8 py-4 text-lg" : "px-8 py-4 text-base"
        }`}
      >
        {isInstalled ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            <span>KASPI POS Installed on Desktop</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            <span>{label}</span>
          </>
        )}
      </button>

      {showFallback && (
        <div className="mt-4 max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/95 p-5 text-left text-xs text-zinc-300 shadow-2xl space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Monitor className="h-4 w-4 text-white shrink-0" />
              <span>Install KASPI POS to Your Windows Desktop</span>
            </div>
            <button
              type="button"
              onClick={() => setShowFallback(false)}
              className="text-zinc-500 hover:text-white transition cursor-pointer"
              aria-label="Close instructions"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-zinc-400 leading-relaxed">
            Your browser didn&apos;t trigger the automatic install prompt (either
            KASPI POS is already installed or your browser requires manual
            installation):
          </p>

          <ol className="list-decimal list-inside space-y-1.5 text-zinc-300">
            <li>
              In <strong>Chrome / Edge</strong>, click the{" "}
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-white">
                Install App
              </span>{" "}
              icon on the right side of your address bar.
            </li>
            <li>
              Or open browser menu <strong>(⋮)</strong> →{" "}
              <strong>Save and Share / Apps</strong> →{" "}
              <strong>Install KASPI POS</strong> to pin it to your Desktop &amp;
              Start Menu.
            </li>
          </ol>

          <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
            <a
              href={githubReleasesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-white hover:underline"
            >
              <span>Download Native Windows (.exe / .msi) on GitHub Releases</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
