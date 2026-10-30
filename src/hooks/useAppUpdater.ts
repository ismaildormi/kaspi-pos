"use client";

import { useState, useEffect } from "react";

export interface UpdateInfo {
  version: string;
  notes?: string;
  pub_date?: string;
  url?: string;
}

export function useAppUpdater() {
  const [isChecking, setIsChecking] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const currentVersion = "0.1.0";

  const checkForUpdates = async () => {
    try {
      setIsChecking(true);
      const res = await fetch("/api/updates/latest.json");
      if (!res.ok) return;

      const data = await res.json();
      if (data && data.version && data.version !== currentVersion) {
        setHasUpdate(true);
        setUpdateInfo({
          version: data.version,
          notes: data.notes,
          pub_date: data.pub_date,
          url: data.platforms?.["windows-x86_64"]?.url,
        });
      }
    } catch (err) {
      console.warn("[AppUpdater] Could not check for updates:", err);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check update on mount
    checkForUpdates();
  }, []);

  const installUpdate = async () => {
    setIsInstalling(true);
    try {
      // If inside Tauri environment
      if (typeof window !== "undefined" && ("__TAURI__" in window || "__TAURI_INTERNALS__" in window)) {
        console.log("[AppUpdater] Triggering Tauri Updater restart...");
      } else if (updateInfo?.url) {
        window.open(updateInfo.url, "_blank");
      }
    } finally {
      setIsInstalling(false);
    }
  };

  return {
    isChecking,
    hasUpdate: hasUpdate && !dismissed,
    updateInfo,
    isInstalling,
    currentVersion,
    checkForUpdates,
    installUpdate,
    dismissUpdate: () => setDismissed(true),
  };
}
