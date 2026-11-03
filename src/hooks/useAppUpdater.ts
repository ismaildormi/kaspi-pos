"use client";

import { useState, useEffect, useCallback } from "react";

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

  const checkForUpdates = useCallback(async () => {
    try {
      setIsChecking(true);

      // 1. Check if running inside desktop Tauri runtime via direct IPC
      if (typeof window !== "undefined" && ("__TAURI__" in window || "__TAURI_INTERNALS__" in window)) {
        try {
          const tauriWindow = window as any;
          const invoke = tauriWindow.__TAURI_INTERNALS__?.invoke || tauriWindow.__TAURI__?.invoke;
          if (typeof invoke === "function") {
            const update = await invoke("plugin:updater|check").catch(() => null);
            if (update && update.available) {
              setHasUpdate(true);
              setUpdateInfo({
                version: update.version || "2.0.0",
                notes: update.body || "New version available. Restart to update.",
                pub_date: update.date,
              });
              return;
            }
          }
        } catch {
          // Fall back to HTTP endpoint
        }
      }

      // 2. Fall back to /api/updates/latest.json endpoint
      const res = await fetch("/api/updates/latest.json");
      if (!res.ok) return;

      const data = await res.json();
      if (data && data.version && data.version !== currentVersion) {
        setHasUpdate(true);
        setUpdateInfo({
          version: data.version,
          notes: data.notes || "New version available. Restart to update.",
          pub_date: data.pub_date,
          url: data.platforms?.["windows-x86_64"]?.url,
        });
      }
    } catch (err) {
      console.warn("[AppUpdater] Could not check for updates:", err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Check update on mount
    checkForUpdates();
  }, [checkForUpdates]);

  const installUpdate = async () => {
    setIsInstalling(true);
    try {
      // If inside Tauri environment
      if (typeof window !== "undefined" && ("__TAURI__" in window || "__TAURI_INTERNALS__" in window)) {
        try {
          const tauriWindow = window as any;
          const invoke = tauriWindow.__TAURI_INTERNALS__?.invoke || tauriWindow.__TAURI__?.invoke;
          if (typeof invoke === "function") {
            await invoke("plugin:updater|download_and_install").catch(() => null);
            await invoke("plugin:process|restart").catch(() => {
              window.location.reload();
            });
            return;
          }
        } catch (tauriErr) {
          console.warn("[AppUpdater] Tauri updater error:", tauriErr);
        }
      }

      // Fallback: If URL is provided or web app
      if (updateInfo?.url) {
        window.open(updateInfo.url, "_blank");
      } else {
        window.location.reload();
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
