/**
 * KASPI POS (كسب) — Scoped, Permission-Respecting Device Discovery Engine (`DeviceDiscoveryEngine.ts`)
 *
 * Scans ONLY explicit permissioned local interfaces:
 * - WebSerial (`navigator.serial.getPorts()`)
 * - WebUSB (`navigator.usb.getDevices()`)
 * - WebBluetooth (`navigator.bluetooth.getDevices()`)
 * - Android Smart POS bridge detection (`window.KaspiSmartPosBridge`)
 * - Native Tauri Rust local bridge (`discover_local_tpe_devices`)
 * - Explicitly user-configured Local LAN / OPI / NEXO / mDNS endpoints (NEVER unpermitted subnet port scanning!)
 */

import { DeviceFingerprinting } from "./DeviceFingerprinting";
import type { TpeConnectionType, TpeDeviceFingerprint } from "./types";

export interface DiscoveryScopeOptions {
  explicitLanEndpoints?: Array<{ ip: string; port?: number; label?: string; protocol?: "OPI" | "NEXO_RETAILER" }>;
  includeBrowserPermissions?: boolean;
  includeTauriBridge?: boolean;
}

export interface DiscoveryScanReport {
  discoveredAt: string;
  channelsChecked: string[];
  devices: TpeDeviceFingerprint[];
  warnings: string[];
}

export class DeviceDiscoveryEngine {
  static async discoverDevices(scope: DiscoveryScopeOptions = {}): Promise<DiscoveryScanReport> {
    const channelsChecked: string[] = [];
    const warnings: string[] = [];
    const devices: TpeDeviceFingerprint[] = [];

    // 1. Browser Permissioned USB / Serial / Bluetooth / Android Smart POS
    if (typeof window !== "undefined" && scope.includeBrowserPermissions !== false) {
      const nav = window.navigator as any;

      // WebSerial
      if (nav?.serial?.getPorts) {
        channelsChecked.push("WebSerial/RS232");
        try {
          const ports = await nav.serial.getPorts();
          ports.forEach((port: any, idx: number) => {
            const info = port?.getInfo?.() || {};
            devices.push(
              DeviceFingerprinting.buildFingerprint({
                deviceId: `serial_${info.usbVendorId || "com"}_${idx}`,
                manufacturer:
                  info.usbVendorId === 0x0b00
                    ? "Ingenico"
                    : info.usbVendorId === 0x11ca
                    ? "Verifone"
                    : "Serial ECR Terminal",
                model: info.usbProductId ? `USB-PID:${info.usbProductId.toString(16)}` : "COM Port Device",
                firmwareVersion: "unknown",
                os: "unknown",
                connectionType: "SERIAL_RS232",
                supportedProtocols: ["OPI", "CONCERT_V3"],
                serialPort: `COM-SERIAL-${idx + 1}`,
              })
            );
          });
        } catch {
          warnings.push("WebSerial permission not yet granted.");
        }
      }

      // WebUSB
      if (nav?.usb?.getDevices) {
        channelsChecked.push("WebUSB");
        try {
          const usbDevices = await nav.usb.getDevices();
          usbDevices.forEach((dev: any, idx: number) => {
            devices.push(
              DeviceFingerprinting.buildFingerprint({
                deviceId: `usb_${dev.vendorId || 0}_${dev.productId || idx}`,
                manufacturer: dev.manufacturerName || "USB Payment Terminal",
                model: dev.productName || `PID:${dev.productId}`,
                firmwareVersion: dev.deviceVersionMajor !== undefined
                  ? `${dev.deviceVersionMajor}.${dev.deviceVersionMinor}.${dev.deviceVersionSubminor}`
                  : "unknown",
                connectionType: "USB",
                supportedProtocols: ["OPI", "CONCERT_V3"],
              })
            );
          });
        } catch {
          warnings.push("WebUSB permission check skipped.");
        }
      }

      // WebBluetooth
      if (nav?.bluetooth?.getDevices) {
        channelsChecked.push("Bluetooth");
        try {
          const btDevices = await nav.bluetooth.getDevices();
          btDevices.forEach((dev: any, idx: number) => {
            devices.push(
              DeviceFingerprinting.buildFingerprint({
                deviceId: `bt_${dev.id || idx}`,
                manufacturer: dev.name?.split(" ")[0] || "Bluetooth mPOS",
                model: dev.name || "BLE Terminal",
                firmwareVersion: "unknown",
                connectionType: "BLUETOOTH",
                supportedProtocols: ["NEXO_RETAILER", "OFFICIAL_MANUFACTURER_SDK"],
              })
            );
          });
        } catch {
          warnings.push("Bluetooth peripheral access requires explicit user pair.");
        }
      }

      // Android Smart POS Intent Bridge detection
      const smartPosBridge = (window as any).KaspiSmartPosBridge || (window as any).AndroidPaymentBridge;
      if (smartPosBridge) {
        channelsChecked.push("Android Smart POS");
        devices.push(
          DeviceFingerprinting.buildFingerprint({
            deviceId: "android_smart_pos_local",
            manufacturer: smartPosBridge.vendor || "PAX",
            model: smartPosBridge.model || "SmartPOS Android",
            firmwareVersion: smartPosBridge.firmware || "unknown",
            os: "Android PayDroid",
            connectionType: "ANDROID_SMART_POS",
            supportedProtocols: ["OFFICIAL_MANUFACTURER_SDK", "NEXO_RETAILER"],
          })
        );
      }
    }

    // 2. Native Tauri Rust Bridge (src-tauri/src/tpe_bridge.rs)
    if (typeof window !== "undefined" && scope.includeTauriBridge !== false) {
      const tauriWindow = window as any;
      const invoke =
        tauriWindow.__TAURI_INTERNALS__?.invoke ||
        tauriWindow.__TAURI__?.core?.invoke ||
        tauriWindow.__TAURI__?.invoke;

      if (typeof invoke === "function") {
        channelsChecked.push("Tauri Desktop Rust Bridge");
        try {
          const raw = await invoke("discover_local_tpe_devices", { payload: "{}" });
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          if (Array.isArray(parsed?.devices)) {
            for (const d of parsed.devices) {
              devices.push(
                DeviceFingerprinting.buildFingerprint({
                  deviceId: d.deviceId,
                  manufacturer: d.manufacturer,
                  model: d.model,
                  firmwareVersion: d.firmwareVersion || "unknown",
                  connectionType: (d.connectionType as TpeConnectionType) || "ETHERNET_TCPIP",
                  endpointAddress: d.endpointAddress || null,
                  port: d.port || null,
                  serialPort: d.serialPort || null,
                })
              );
            }
          }
        } catch {
          warnings.push("Tauri local TPE bridge scan returned no local hardware.");
        }
      }
    }

    // 3. Explicitly Configured Store LAN / OPI / NEXO Endpoints (Zero offensive port scanning)
    if (scope.explicitLanEndpoints && scope.explicitLanEndpoints.length > 0) {
      channelsChecked.push("Explicit LAN OPI/NEXO Endpoints");
      for (const ep of scope.explicitLanEndpoints) {
        devices.push(
          DeviceFingerprinting.buildFingerprint({
            deviceId: `lan_${ep.ip.replace(/[^a-z0-9]/gi, "_")}_${ep.port || 20002}`,
            manufacturer: ep.label?.split(" ")[0] || "Ingenico",
            model: ep.label || "LAN OPI/NEXO Terminal",
            firmwareVersion: "unknown",
            os: "unknown",
            connectionType: "ETHERNET_TCPIP",
            supportedProtocols: [ep.protocol || "OPI", "NEXO_RETAILER"],
            endpointAddress: ep.ip,
            port: ep.port || 20002,
          })
        );
      }
    }

    return {
      discoveredAt: new Date().toISOString(),
      channelsChecked,
      devices,
      warnings,
    };
  }
}
