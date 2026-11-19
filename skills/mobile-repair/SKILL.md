---
name: mobile-repair
domain: mobile-repair
version: 22.1.0
description: 100-Tool Android ADB / Fastboot & Apple iOS libimobiledevice Diagnostics, Malware IOC Triage, Battery Health Scoring & Thermal Repair Shop Tickets.
tags: [android, adb, ios, libimobiledevice, mobile-repair, battery, malware, tickets, pos]
---

# YUKA & KASPI POS Mobile Repair & Diagnostics Lab

## 1. Real Telemetry Parsing (`mobile-diagnostics-engine.ts`)
- **Android (`analyzeAndroidAdbTelemetry`):** Parse real `dumpsys battery`, voltage, temperature, estimated health %, and scan `pm list packages -3` against spyware/adware IOCs.
- **Apple iOS (`analyzeIosIdeviceTelemetry`):** Parse `ideviceinfo`, GasGauge cycle counts, FCC vs design `mAh`, and `iDevicePanicLogAnalyzer` sensor panic patterns.
- **KASPI POS Thermal Ticket:** Produce a 58mm/80mm customer intake receipt + health score (`0–100`) and track URL QR via `buildMobileRepairReceiptTicket`.
