import Decimal from "decimal.js";
import type { DiagramPayload } from "@/lib/zebra-x/core/bridge-schema";

/**
 * X × Zebra — Phase 2 Mathematical, Algebraic, Financial (Dinero) & DAG Planning Engine
 * All heavy libraries load lazily via `dynamic import()` so baseline bundle stays <50 KB.
 */

export interface MathEvaluationResult {
  ok: boolean;
  mode: "numeric" | "algebra" | "finance" | "dag";
  expression: string;
  result: string;
  latex?: string;
  katexMathMl?: string;
  inlineMarker?: string;
  error?: string;
}

function encodeBase64Utf8(jsonStr: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(jsonStr, "utf-8").toString("base64");
  }
  const bytes = new TextEncoder().encode(jsonStr);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/**
 * Renders any LaTeX expression to crisp self-contained MathML/HTML via dynamic KaTeX.
 */
export async function renderKatexSafe(latex: string, displayMode = true): Promise<string> {
  const katexMod = await import("katex");
  const katex = (katexMod as any).default ?? katexMod;
  return katex.renderToString(latex, {
    throwOnError: false,
    strict: false,
    trust: false,
    displayMode,
    output: "mathml",
  });
}

/**
 * Evaluates numerical, unit-aware, matrix, statistical, OR symbolic equations/calculus
 * lazily using `mathjs` and `nerdamer`.
 */
export async function evaluateMathOrAlgebra(
  expression: string,
  preferAlgebra = false
): Promise<MathEvaluationResult> {
  const expr = (expression || "").trim();
  if (!expr) {
    return { ok: false, mode: "numeric", expression: "", result: "", error: "Empty expression" };
  }

  const looksSymbolic =
    preferAlgebra || /\b(solve|diff|integrate|expand|factor|simplify)\s*\(|[a-zA-Z]\s*=/i.test(expr);

  if (looksSymbolic) {
    try {
      const nerdMod = await import("nerdamer");
      const nerdamer = ((nerdMod as any).default ?? nerdMod) as any;
      const evaluated = nerdamer(expr);
      const resultText = evaluated.text ? evaluated.text("fractions") : evaluated.toString();
      const latex = typeof evaluated.toTeX === "function" ? evaluated.toTeX() : resultText;
      const katexMathMl = await renderKatexSafe(latex).catch(() => undefined);
      const diagramPayload: DiagramPayload = {
        kind: "katex",
        title: expr.slice(0, 60),
        code: `${expr} \\Rightarrow ${latex}`,
      };
      return {
        ok: true,
        mode: "algebra",
        expression: expr,
        result: String(resultText),
        latex,
        katexMathMl,
        inlineMarker: `[KASPI_DIAGRAM:${encodeBase64Utf8(JSON.stringify(diagramPayload))}]`,
      };
    } catch {
      // Fall through cleanly to mathjs numerical engine
    }
  }

  try {
    const math = await import("mathjs");
    const raw = math.evaluate(expr);
    const resultStr =
      typeof raw === "number" || typeof raw === "bigint"
        ? math.format(raw, { precision: 12 })
        : math.format(raw, { precision: 10 });
    const latex = `${expr} = ${resultStr}`;
    const katexMathMl = await renderKatexSafe(latex).catch(() => undefined);
    const diagramPayload: DiagramPayload = {
      kind: "katex",
      title: expr.slice(0, 60),
      code: latex,
    };
    return {
      ok: true,
      mode: "numeric",
      expression: expr,
      result: resultStr,
      latex,
      katexMathMl,
      inlineMarker: `[KASPI_DIAGRAM:${encodeBase64Utf8(JSON.stringify(diagramPayload))}]`,
    };
  } catch (err: any) {
    return {
      ok: false,
      mode: "numeric",
      expression: expr,
      result: "",
      error: err?.message || "Invalid mathematical expression",
    };
  }
}

/**
 * Exact POS / Commerce pricing calculation using Dinero.js + Decimal.js (zero float cent errors).
 */
export async function computeExactRetailFinance(params: {
  unitPrice: number;
  quantity?: number;
  vatPercent?: number;
  discountPercent?: number;
  currencyCode?: "MAD" | "USD" | "EUR" | "GBP" | "SAR" | "AED";
  fxToMadRate?: number;
}) {
  const qty = new Decimal(params.quantity ?? 1);
  const price = new Decimal(params.unitPrice);
  const discPct = new Decimal(params.discountPercent ?? 0).clamp(0, 100);
  const vatPct = new Decimal(params.vatPercent ?? 20).clamp(0, 100);
  const curCode = params.currencyCode || "MAD";

  // Dinero precision verification in minor units (centimes = x100)
  const dMod = await import("dinero.js");
  const curMap = {
    MAD: dMod.MAD,
    USD: dMod.USD,
    EUR: dMod.EUR,
    GBP: dMod.GBP,
    SAR: dMod.SAR,
    AED: dMod.AED,
  };
  const unitCents = Math.round(price.mul(100).toNumber());
  const dineroGross = dMod.multiply(dMod.dinero({ amount: unitCents, currency: curMap[curCode] }), {
    amount: Math.round(qty.mul(100).toNumber()),
    scale: 2,
  });

  const gross = price.mul(qty);
  const discountAmount = gross.mul(discPct.div(100));
  const netExVat = gross.sub(discountAmount);
  const vatAmount = netExVat.mul(vatPct.div(100));
  const totalTtc = netExVat.add(vatAmount);

  return {
    currency: curCode,
    quantity: qty.toNumber(),
    unitPrice: price.toFixed(2),
    dineroExactSubtotal: dMod.toDecimal(dineroGross),
    discountPercent: discPct.toNumber(),
    discountAmount: discountAmount.toFixed(2),
    subtotalHT: netExVat.toFixed(2),
    vatPercent: vatPct.toNumber(),
    vatAmount: vatAmount.toFixed(2),
    totalTTC: totalTtc.toFixed(2),
    totalInMAD:
      curCode === "MAD" || !params.fxToMadRate
        ? undefined
        : totalTtc.mul(new Decimal(params.fxToMadRate)).toFixed(2),
  };
}

/**
 * Topological DAG sorting & parallel wave grouping via `@dagrejs/graphlib` (Master Planning).
 */
export async function planParallelDagWaves(
  tasks: Array<{ id: string; label?: string; dependsOn?: string[] }>
): Promise<{
  acyclic: boolean;
  order: string[];
  waves: Array<{ wave: number; tasks: string[] }>;
  mermaidDiagram: string;
}> {
  const { Graph, alg } = await import("@dagrejs/graphlib");
  const g = new Graph({ directed: true });
  for (const t of tasks) g.setNode(t.id, t.label || t.id);
  for (const t of tasks) {
    for (const dep of t.dependsOn || []) {
      if (g.hasNode(dep)) g.setEdge(dep, t.id);
    }
  }

  const acyclic = alg.isAcyclic(g);
  if (!acyclic) {
    return { acyclic: false, order: [], waves: [], mermaidDiagram: "flowchart LR\n  CycleDetected[Circular Dependency]" };
  }

  const order = alg.topsort(g);
  const depthMap = new Map<string, number>();
  for (const id of order) {
    const preds = (g.predecessors(id) || []) as string[];
    const level = preds.length === 0 ? 0 : Math.max(...preds.map((p) => (depthMap.get(p) ?? 0) + 1));
    depthMap.set(id, level);
  }

  const maxWave = Math.max(0, ...Array.from(depthMap.values()));
  const waves: Array<{ wave: number; tasks: string[] }> = [];
  for (let w = 0; w <= maxWave; w++) {
    waves.push({
      wave: w + 1,
      tasks: order.filter((id) => depthMap.get(id) === w),
    });
  }

  const lines = ["flowchart LR"];
  for (const t of tasks) {
    const cleanLabel = (t.label || t.id).replace(/["\[\]]/g, "");
    lines.push(`  ${t.id}["${cleanLabel}"]`);
  }
  for (const e of g.edges()) {
    lines.push(`  ${e.v} --> ${e.w}`);
  }

  return {
    acyclic: true,
    order,
    waves,
    mermaidDiagram: lines.join("\n"),
  };
}

/**
 * Validates international & Moroccan phone numbers cleanly (prevents fake COD return orders).
 */
export async function validatePhoneNumberSafe(phone: string, defaultCountry: any = "MA") {
  const { parsePhoneNumberFromString } = await import("libphonenumber-js");
  const parsed = parsePhoneNumberFromString(phone, defaultCountry);
  if (!parsed) {
    return { valid: false, input: phone, reason: "Unrecognized format" };
  }
  return {
    valid: parsed.isValid(),
    possible: parsed.isPossible(),
    e164: parsed.number,
    international: parsed.formatInternational(),
    national: parsed.formatNational(),
    country: parsed.country || null,
    type: parsed.getType() || null,
  };
}

/**
 * Computes Umm al-Qura Hijri date + SunCalc sunrise/sunset/solar noon & moon phase for any coordinates.
 */
export async function getHijriAndSolarAstronomy(params?: {
  dateIso?: string;
  lat?: number;
  lon?: number;
}) {
  const date = params?.dateIso ? new Date(params.dateIso) : new Date();
  const validDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const lat = params?.lat ?? 33.5731; // Casablanca default
  const lon = params?.lon ?? -7.5898;

  const hijriAr = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(validDate);

  const hijriNumeric = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(validDate);

  const suncalcMod = await import("suncalc");
  const suncalc = (suncalcMod as any).default ?? suncalcMod;
  const sunTimes = suncalc.getTimes(validDate, lat, lon);
  const moonIllum = suncalc.getMoonIllumination(validDate);

  return {
    gregorianIso: validDate.toISOString(),
    hijriArabic: hijriAr,
    hijriNumeric,
    coordinates: { lat, lon },
    sunriseIso: sunTimes.sunrise?.toISOString?.(),
    solarNoonIso: sunTimes.solarNoon?.toISOString?.(),
    sunsetIso: sunTimes.sunset?.toISOString?.(),
    dawnIso: sunTimes.dawn?.toISOString?.(),
    duskIso: sunTimes.dusk?.toISOString?.(),
    moonPhaseFraction: Number(moonIllum.phase.toFixed(3)),
    moonIlluminationFraction: Number(moonIllum.fraction.toFixed(3)),
  };
}

/**
 * Evaluates a standard cron schedule cleanly via `croner` without spawning background timers.
 */
export async function inspectCronExpression(expr: string, count = 5) {
  const { Cron } = await import("croner");
  const job = new Cron(expr, { paused: true });
  const runs = job.nextRuns(Math.min(Math.max(count, 1), 10));
  job.stop();
  return {
    expression: expr,
    nextRunsIso: runs.map((d) => d.toISOString()),
  };
}
