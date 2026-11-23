/**
 * Dominance v90.4: Deep Science, Bio-Medical Safety, Solar PV Sizing & Precision Engineering CAD Tolerances.
 */

export function designSolarPvSystem(params: {
  dailyLoadKwh: number;
  peakSunHoursPerDay?: number;
  autonomyDays?: number;
  panelWattPeak?: number;
  systemEfficiency?: number;
  kwhTariffMad?: number;
}) {
  const load = Math.max(0.5, Number(params.dailyLoadKwh || 10));
  const psh = Math.max(2, Number(params.peakSunHoursPerDay ?? 5.4)); // Morocco avg ~5.4 kWh/m2/day
  const eta = Math.min(0.95, Math.max(0.55, Number(params.systemEfficiency ?? 0.8)));
  const panelWp = Math.max(100, Number(params.panelWattPeak ?? 550));
  const autonomyDays = Math.max(1, Number(params.autonomyDays ?? 1.5));

  const requiredArrayKwp = load / (psh * eta);
  const panelsCount = Math.ceil((requiredArrayKwp * 1000) / panelWp);
  const installedArrayKwp = Number(((panelsCount * panelWp) / 1000).toFixed(2));
  const batteryBankKwh = Number(((load * autonomyDays) / 0.85).toFixed(2)); // 85% DoD LiFePO4
  const inverterMinKw = Number((installedArrayKwp * 1.15).toFixed(2));
  const tariff = Number(params.kwhTariffMad ?? 1.45);
  const annualProductionKwh = Math.round(installedArrayKwp * psh * 365 * eta);
  const annualSavingsMad = Number((annualProductionKwh * tariff).toFixed(2));

  return {
    ok: true,
    engine: "pvlib_pattern_solar_v90_4",
    dailyLoadKwh: load,
    peakSunHours: psh,
    panelsCount,
    panelWattPeak: panelWp,
    installedArrayKwp,
    recommendedInverterKw: inverterMinKw,
    recommendedBatteryLiFePo4Kwh: batteryBankKwh,
    estimatedAnnualProductionKwh: annualProductionKwh,
    estimatedAnnualSavingsMad: annualSavingsMad,
  };
}

export function computeToleranceStackup(dimensions: Array<{ nominalMm: number; tolPlusMinusMm: number; direction?: 1 | -1 }>) {
  let nominalNet = 0;
  let worstCaseTol = 0;
  let rssVariance = 0;

  for (const d of dimensions || []) {
    const dir = d.direction === -1 ? -1 : 1;
    const tol = Math.abs(Number(d.tolPlusMinusMm || 0));
    nominalNet += dir * Number(d.nominalMm || 0);
    worstCaseTol += tol;
    rssVariance += tol * tol;
  }

  return {
    ok: true,
    partCount: (dimensions || []).length,
    nominalNetMm: Number(nominalNet.toFixed(4)),
    worstCasePlusMinusMm: Number(worstCaseTol.toFixed(4)),
    rssStatisticalPlusMinusMm: Number(Math.sqrt(rssVariance).toFixed(4)),
    minClearanceMm: Number((nominalNet - worstCaseTol).toFixed(4)),
    maxClearanceMm: Number((nominalNet + worstCaseTol).toFixed(4)),
  };
}

const KNOWN_INTERACTION_RULES: Array<{ a: RegExp; b: RegExp; warning: string }> = [
  {
    a: /\bwarfarin\b/i,
    b: /\b(aspirin|ibuprofen|naproxen)\b/i,
    warning: "Major bleeding risk when combining anticoagulants (warfarin) with NSAIDs/aspirin.",
  },
  {
    a: /\bmetformin\b/i,
    b: /\bcontrast\b/i,
    warning: "Hold/review metformin timing around iodinated contrast procedures per renal guidance.",
  },
  {
    a: /\bace\s*inhibitor|lisinopril|ramipril\b/i,
    b: /\b(spironolactone|potassium)\b/i,
    warning: "Hyperkalemia monitoring advised when combining ACE inhibitors with potassium-sparing agents.",
  },
];

export function checkMedicalDrugInteractionSafety(compounds: string[], locale: "ar" | "fr" | "en" = "ar") {
  const clean = (compounds || []).map((c) => String(c || "").trim()).filter(Boolean);
  const normalized = clean.join(" | ");
  const warnings: string[] = [];

  for (const rule of KNOWN_INTERACTION_RULES) {
    if (rule.a.test(normalized) && rule.b.test(normalized)) {
      warnings.push(rule.warning);
    }
  }

  const disclaimer =
    locale === "ar"
      ? "تنبيه سريري: هذه المخرجات مرجعية علمية فقط ولا تغني عن استشارة الطبيب أو الصيدلي المختص."
      : locale === "fr"
      ? "Avertissement clinique : ces résultats sont informatifs uniquement et ne remplacent pas l'avis d'un médecin."
      : "Clinical Disclaimer: Evidence-support reference only; always confirm medication regimens with a licensed physician or pharmacist.";

  return {
    ok: true,
    compoundsChecked: clean,
    interactionAlertsCount: warnings.length,
    interactionAlerts: warnings,
    safetyDisclaimer: disclaimer,
  };
}
