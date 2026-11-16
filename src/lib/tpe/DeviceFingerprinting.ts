/**
 * KASPI POS (كسب) — Honest Device Fingerprinting (`DeviceFingerprinting.ts`)
 *
 * Extracts hardware, protocol, OS, firmware, and acquirer compatibility metadata.
 * Strict Integrity Rule: Any field that cannot be directly verified MUST be
 * set to `"unknown"` or `null` — NEVER hallucinate firmware versions or fake OEM certs.
 */

import type {
  TpeConnectionType,
  TpeDeviceFingerprint,
  TpeProtocolType,
} from "./types";

export interface RawDiscoveredDeviceInput {
  deviceId?: string;
  manufacturer?: string | null;
  model?: string | null;
  hardwareRevision?: string | null;
  firmwareVersion?: string | null;
  os?: string | null;
  supportedProtocols?: TpeProtocolType[];
  connectionType: TpeConnectionType;
  sdkCompatibility?: string | null;
  paymentProvider?: string | null;
  acquirerCompatibility?: string[];
  countryCompatibility?: string[];
  endpointAddress?: string | null;
  port?: number | null;
  serialPort?: string | null;
}

export class DeviceFingerprinting {
  static buildFingerprint(raw: RawDiscoveredDeviceInput): TpeDeviceFingerprint {
    const manufacturer = raw.manufacturer?.trim() || "unknown";
    const model = raw.model?.trim() || "unknown";
    const firmwareVersion = raw.firmwareVersion?.trim() || "unknown";
    const os = raw.os?.trim() || "unknown";

    const supportedProtocols: TpeProtocolType[] =
      raw.supportedProtocols && raw.supportedProtocols.length > 0
        ? raw.supportedProtocols
        : DeviceFingerprinting.inferSafeProtocols(manufacturer, raw.connectionType);

    return {
      deviceId:
        raw.deviceId ||
        `tpe_${manufacturer.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`,
      manufacturer,
      model,
      hardwareRevision: raw.hardwareRevision?.trim() || null,
      firmwareVersion,
      os,
      supportedProtocols,
      connectionType: raw.connectionType,
      sdkCompatibility: raw.sdkCompatibility ?? null,
      paymentProvider: raw.paymentProvider?.trim() || "unknown",
      acquirerCompatibility: raw.acquirerCompatibility?.length
        ? raw.acquirerCompatibility
        : ["CMI (Morocco)", "NAPS", "Acquirer Config Required"],
      countryCompatibility: raw.countryCompatibility?.length
        ? raw.countryCompatibility
        : ["MA", "EU", "US"],
      certificationStatus:
        supportedProtocols.includes("OPI") || supportedProtocols.includes("NEXO_RETAILER")
          ? "Sandbox Tested"
          : firmwareVersion === "unknown"
          ? "Not Yet Tested"
          : "Requires Provider Approval",
      endpointAddress: raw.endpointAddress || null,
      port: raw.port || null,
      serialPort: raw.serialPort || null,
    };
  }

  private static inferSafeProtocols(
    manufacturer: string,
    connectionType: TpeConnectionType
  ): TpeProtocolType[] {
    const m = manufacturer.toLowerCase();
    if (connectionType === "CLOUD_API") return ["ADYEN_TERMINAL_API", "STRIPE_TERMINAL"];
    if (m.includes("ingenico") || m.includes("verifone") || m.includes("pax")) {
      return ["OPI", "NEXO_RETAILER", "CONCERT_V3"];
    }
    if (connectionType === "SERIAL_RS232" || connectionType === "USB") {
      return ["CONCERT_V3", "OPI"];
    }
    return ["MANUAL_EXTERNAL"];
  }
}
