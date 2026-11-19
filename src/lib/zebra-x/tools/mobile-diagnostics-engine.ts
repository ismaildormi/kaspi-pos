/**
 * HEYUKA & KASPI POS — Smartphone Diagnostics, Malware IOC Triage & Repair Shop Engine (`v22.0`–`v22.1`)
 *
 * Parses real Android `ADB` (`dumpsys battery`, `pm list packages`, `meminfo`) & Apple iOS
 * (`ideviceinfo` / GasGauge battery telemetry) outputs locally, detects suspicious adware/IOCs,
 * computes overall device health score (0-100), and builds thermal 58/80mm repair shop tickets.
 */

export interface MobileBatteryTelemetry {
  levelPercent: number | null;
  temperatureC: number | null;
  voltageMv: number | null;
  cycleCount: number | null;
  designCapacityMah: number | null;
  actualCapacityMah: number | null;
  estimatedHealthPercent: number | null;
}

export interface MobileMalwareFinding {
  packageId: string;
  risk: "high" | "medium";
  category: string;
  recommendation: string;
}

export interface MobileDiagnosticReport {
  platform: "android" | "ios";
  model: string;
  osVersion: string;
  serialOrUdid: string;
  battery: MobileBatteryTelemetry;
  suspiciousPackages: MobileMalwareFinding[];
  overallHealthScore: number;
  summary: string;
}

const KNOWN_SUSPICIOUS_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /cleaner\.boost\.ad|superclean\.popup|junkbooster/i, category: "Popup Adware" },
  { pattern: /spy\.tracker|stalkerware|hidden\.keylog|rat\.client/i, category: "Suspected Spyware / IOC" },
  { pattern: /flashlight\.ads|battery\.saver\.fake/i, category: "Aggressive Bloat / Overlay Ads" },
];

export function analyzeAndroidAdbTelemetry(params: {
  modelProp?: string;
  androidVersion?: string;
  serial?: string;
  dumpsysBatteryText: string;
  installedPackagesText: string;
}): MobileDiagnosticReport {
  const batText = String(params.dumpsysBatteryText || "");
  const extractNum = (re: RegExp): number | null => {
    const m = batText.match(re);
    return m ? Number(m[1]) : null;
  };

  const level = extractNum(/level:\s*(\d+)/i);
  const rawTemp = extractNum(/temperature:\s*(\d+)/i);
  const voltage = extractNum(/voltage:\s*(\d+)/i);
  const chargeCounter = extractNum(/charge counter:\s*(\d+)/i);

  // Android charge counter often reports uAh
  const actualMah = chargeCounter ? Math.round(chargeCounter / 1000) : null;
  const designMah = actualMah && level && level > 15 ? Math.round((actualMah / (level / 100)) * 1.05) : 4500;
  const healthPct =
    actualMah && level && level > 15 && designMah > 0
      ? Math.min(100, Math.round(((actualMah / (level / 100)) / designMah) * 100))
      : null;

  const pkgLines = String(params.installedPackagesText || "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^package:/i, "").trim())
    .filter(Boolean);

  const findings: MobileMalwareFinding[] = [];
  for (const pkg of pkgLines) {
    for (const sig of KNOWN_SUSPICIOUS_PATTERNS) {
      if (sig.pattern.test(pkg)) {
        findings.push({
          packageId: pkg,
          risk: sig.category.includes("Spyware") ? "high" : "medium",
          category: sig.category,
          recommendation: `Back up data first, then run: adb uninstall --user 0 ${pkg}`,
        });
      }
    }
  }

  let score = 95;
  if (rawTemp && rawTemp / 10 > 42) score -= 12;
  if (healthPct !== null && healthPct < 80) score -= 18;
  score -= findings.length * 14;
  score = Math.max(10, Math.min(100, score));

  return {
    platform: "android",
    model: params.modelProp || "Android Device",
    osVersion: params.androidVersion || "Android",
    serialOrUdid: params.serial || "USB-ADB",
    battery: {
      levelPercent: level,
      temperatureC: rawTemp !== null ? Number((rawTemp / 10).toFixed(1)) : null,
      voltageMv: voltage,
      cycleCount: null,
      designCapacityMah: designMah,
      actualCapacityMah: actualMah,
      estimatedHealthPercent: healthPct,
    },
    suspiciousPackages: findings,
    overallHealthScore: score,
    summary: `Android Diagnostics: Score ${score}/100, ${findings.length} flagged package(s).`,
  };
}

export function analyzeIosIdeviceTelemetry(params: {
  ideviceInfoText: string;
  cycleCount?: number;
  designCapacityMah?: number;
  nominalCapacityMah?: number;
  panicLogSnippet?: string;
}): MobileDiagnosticReport {
  const info = String(params.ideviceInfoText || "");
  const getVal = (key: string) => {
    const m = info.match(new RegExp(`^${key}:\\s*(.+)$`, "im"));
    return m ? m[1].trim() : "";
  };

  const model = getVal("ProductType") || getVal("DeviceName") || "iPhone";
  const osVer = getVal("ProductVersion") || "iOS";
  const udid = getVal("UniqueDeviceID") || "USB-USBMUXD";

  const design = params.designCapacityMah || 3200;
  const nominal = params.nominalCapacityMah || design;
  const healthPct = Math.min(100, Math.max(10, Math.round((nominal / design) * 100)));
  const cycles = params.cycleCount ?? 0;

  const findings: MobileMalwareFinding[] = [];
  const panicText = String(params.panicLogSnippet || "");
  if (/userspace watchdog timeout|thermalmonitord|AOP PANIC|i2c/i.test(panicText)) {
    findings.push({
      packageId: "ios.hardware.panic",
      risk: "high",
      category: "iOS Hardware / Sensor Panic Log",
      recommendation: "Inspect charging port flex, barometer, or sensor flex per iDevicePanicLogAnalyzer.",
    });
  }

  let score = 96;
  if (healthPct < 80) score -= 18;
  if (cycles > 500) score -= 8;
  score -= findings.length * 15;
  score = Math.max(15, Math.min(100, score));

  return {
    platform: "ios",
    model,
    osVersion: `iOS ${osVer}`,
    serialOrUdid: udid,
    battery: {
      levelPercent: null,
      temperatureC: null,
      voltageMv: null,
      cycleCount: cycles,
      designCapacityMah: design,
      actualCapacityMah: nominal,
      estimatedHealthPercent: healthPct,
    },
    suspiciousPackages: findings,
    overallHealthScore: score,
    summary: `iOS Diagnostics (${model}): Battery Health ${healthPct}% (${cycles} cycles), Score ${score}/100.`,
  };
}

export function buildMobileRepairReceiptTicket(params: {
  shopName: string;
  ticketCode: string;
  report: MobileDiagnosticReport;
  trackingUrl: string;
}): {
  lines: string[];
  qrPayload: string;
} {
  const { report } = params;
  return {
    qrPayload: params.trackingUrl,
    lines: [
      `================================`,
      `  ${params.shopName.toUpperCase()}`,
      `  REPAIR & DIAGNOSTIC RECEIPT`,
      `================================`,
      `Ticket : ${params.ticketCode}`,
      `Device : ${report.model} (${report.osVersion})`,
      `Health : ${report.overallHealthScore}/100`,
      report.battery.estimatedHealthPercent !== null
        ? `Battery: ${report.battery.estimatedHealthPercent}%`
        : `Battery: Checked`,
      `Flags  : ${report.suspiciousPackages.length} issue(s)`,
      `Track  : ${params.trackingUrl}`,
      `================================`,
    ],
  };
}
