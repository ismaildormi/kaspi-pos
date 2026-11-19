import {
  HEYUKA_ARCHITECTURAL_STACK,
  HEYUKA_CHARACTER_PROFILES,
  HEYUKA_CLOUD_FLEET_GATEWAYS,
  HEYUKA_COSMIC_DOMAINS,
  HEYUKA_CYBER_DEFENSE_FEEDS,
  HEYUKA_LIGHTING_PRESETS,
} from "../../src/lib/heyuka/heyuka-universe";

/**
 * @kaspi/heyuka-os — Standalone Desktop Companion & OS Automation Bridge Package
 * Strictly isolated from KASPI POS deterministic cashier web routes.
 * Owned & maintained by KASPI.
 */

export const HEYUKA_DESTRUCTIVE_TOOLS_GATE = [
  "write_file",
  "delete_file",
  "rename_file",
  "execute_terminal",
  "run_powershell",
  "git_push",
  "git_commit",
  "pip_install",
  "npm_install",
  "system_cleanup",
  "registry_edit",
  "service_restart",
  "pyautogui_click",
  "pyautogui_type",
  "ui_automation_invoke",
  "adobe_jsx_exec",
  "blender_bpy_exec",
  "system_audio_record",
  "kill_process",
  "download_binary",
  "unzip_archive",
  "firewall_rule",
  "scheduled_task",
  "env_write",
] as const;

export interface HeyukaDesktopStatus {
  product: "HEYUKA Desktop OS";
  owner: "KASPI";
  apiBaseUrl: string;
  triposrPort: number;
  systemAudioWsPath: string;
  charactersAvailable: number;
  lightingPresets: number;
  zeroKeyGateways: number;
  cyberDefenseFeeds: number;
  destructiveGateTools: number;
}

export function getHeyukaDesktopManifest(apiBaseUrl = "https://kaspi-pos.vercel.app"): HeyukaDesktopStatus {
  return {
    product: "HEYUKA Desktop OS",
    owner: "KASPI",
    apiBaseUrl: apiBaseUrl.replace(/\/$/, ""),
    triposrPort: 8188,
    systemAudioWsPath: "/ws/system-audio",
    charactersAvailable: HEYUKA_CHARACTER_PROFILES.length,
    lightingPresets: HEYUKA_LIGHTING_PRESETS.length,
    zeroKeyGateways: HEYUKA_CLOUD_FLEET_GATEWAYS.length,
    cyberDefenseFeeds: HEYUKA_CYBER_DEFENSE_FEEDS.length,
    destructiveGateTools: HEYUKA_DESTRUCTIVE_TOOLS_GATE.length,
  };
}

export {
  HEYUKA_ARCHITECTURAL_STACK,
  HEYUKA_CHARACTER_PROFILES,
  HEYUKA_CLOUD_FLEET_GATEWAYS,
  HEYUKA_COSMIC_DOMAINS,
  HEYUKA_CYBER_DEFENSE_FEEDS,
  HEYUKA_LIGHTING_PRESETS,
};
