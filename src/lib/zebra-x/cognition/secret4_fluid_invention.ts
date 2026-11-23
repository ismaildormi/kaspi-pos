import { searchStudiedKnowledgeCorpus } from "@/lib/heyuka/training/knowledge-corpus-engine";

export type ArcGrid = number[][];

export interface ArcSolveResult {
  ok: boolean;
  solved: boolean;
  discoveredProgram: string;
  programSteps: string[];
  trainAccuracyPct: number;
  predictedOutput: ArcGrid | null;
  candidatesEvaluated: number;
  durationMs: number;
}

function cloneGrid(g: ArcGrid): ArcGrid {
  return g.map((row) => [...row]);
}

function gridsEqual(a: ArcGrid, b: ArcGrid): boolean {
  if (a.length !== b.length) return false;
  for (let r = 0; r < a.length; r++) {
    if (a[r].length !== b[r].length) return false;
    for (let c = 0; c < a[r].length; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

const ARC_PRIMITIVES: Array<{ name: string; fn: (g: ArcGrid) => ArcGrid }> = [
  { name: "identity", fn: (g) => cloneGrid(g) },
  {
    name: "flipHorizontal",
    fn: (g) => g.map((r) => [...r].reverse()),
  },
  {
    name: "flipVertical",
    fn: (g) => [...g].reverse().map((r) => [...r]),
  },
  {
    name: "transpose",
    fn: (g) => {
      if (g.length === 0 || g[0].length === 0) return [];
      const rows = g.length;
      const cols = g[0].length;
      const out: ArcGrid = Array.from({ length: cols }, () => new Array(rows).fill(0));
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[c][r] = g[r][c];
      return out;
    },
  },
  {
    name: "rotate90",
    fn: (g) => {
      if (g.length === 0 || g[0].length === 0) return [];
      const rows = g.length;
      const cols = g[0].length;
      const out: ArcGrid = Array.from({ length: cols }, () => new Array(rows).fill(0));
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[c][rows - 1 - r] = g[r][c];
      return out;
    },
  },
  {
    name: "rotate180",
    fn: (g) => [...g].reverse().map((r) => [...r].reverse()),
  },
  {
    name: "rotate270",
    fn: (g) => {
      if (g.length === 0 || g[0].length === 0) return [];
      const rows = g.length;
      const cols = g[0].length;
      const out: ArcGrid = Array.from({ length: cols }, () => new Array(rows).fill(0));
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[cols - 1 - c][r] = g[r][c];
      return out;
    },
  },
  {
    name: "gravityDropDown",
    fn: (g) => {
      if (g.length === 0 || g[0].length === 0) return [];
      const rows = g.length;
      const cols = g[0].length;
      const out: ArcGrid = Array.from({ length: rows }, () => new Array(cols).fill(0));
      for (let c = 0; c < cols; c++) {
        let writeR = rows - 1;
        for (let r = rows - 1; r >= 0; r--) {
          if (g[r][c] !== 0) out[writeR--][c] = g[r][c];
        }
      }
      return out;
    },
  },
  {
    name: "cropNonZeroBoundingBox",
    fn: (g) => {
      let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1;
      for (let r = 0; r < g.length; r++) {
        for (let c = 0; c < g[r].length; c++) {
          if (g[r][c] !== 0) {
            if (r < minR) minR = r;
            if (r > maxR) maxR = r;
            if (c < minC) minC = c;
            if (c > maxC) maxC = c;
          }
        }
      }
      if (maxR < 0) return cloneGrid(g);
      return g.slice(minR, maxR + 1).map((row) => row.slice(minC, maxC + 1));
    },
  },
  {
    name: "tile2x2",
    fn: (g) => {
      const top = g.map((r) => [...r, ...r]);
      return [...top, ...top.map((r) => [...r])];
    },
  },
];

function inferColorPermutation(pairs: Array<{ mid: ArcGrid; target: ArcGrid }>): Map<number, number> | null {
  const map = new Map<number, number>();
  for (const p of pairs) {
    if (p.mid.length !== p.target.length) return null;
    for (let r = 0; r < p.mid.length; r++) {
      if (p.mid[r].length !== p.target[r].length) return null;
      for (let c = 0; c < p.mid[r].length; c++) {
        const src = p.mid[r][c];
        const dst = p.target[r][c];
        const prev = map.get(src);
        if (prev !== undefined && prev !== dst) return null;
        map.set(src, dst);
      }
    }
  }
  return map;
}

function applyColorMap(g: ArcGrid, cmap: Map<number, number>): ArcGrid {
  return g.map((row) => row.map((v) => cmap.get(v) ?? v));
}

/**
 * Secret #4 (`v87.4`) Part A: Genuine Few-Shot ARC-AGI Grid Program Synthesizer (Occam DSL Search).
 * Searches 1-step, 2-step geometric compositions, and induced color bijections across train pairs.
 */
export function solveArcFewShotGrid(params: {
  trainPairs: Array<{ input: ArcGrid; output: ArcGrid }>;
  testInput: ArcGrid;
}): ArcSolveResult {
  const t0 = performance.now();
  const pairs = params.trainPairs || [];
  let candidatesEvaluated = 0;

  if (pairs.length === 0) {
    return {
      ok: false,
      solved: false,
      discoveredProgram: "none",
      programSteps: [],
      trainAccuracyPct: 0,
      predictedOutput: null,
      candidatesEvaluated: 0,
      durationMs: 0,
    };
  }

  // Pass 1: single primitive match
  for (const op of ARC_PRIMITIVES) {
    candidatesEvaluated++;
    if (pairs.every((p) => gridsEqual(op.fn(p.input), p.output))) {
      return {
        ok: true,
        solved: true,
        discoveredProgram: `${op.name}(grid)`,
        programSteps: [op.name],
        trainAccuracyPct: 100,
        predictedOutput: op.fn(params.testInput),
        candidatesEvaluated,
        durationMs: Number((performance.now() - t0).toFixed(2)),
      };
    }
  }

  // Pass 2: primitive + induced color bijection (e.g., flip + recolor)
  for (const op of ARC_PRIMITIVES) {
    candidatesEvaluated++;
    const transformed = pairs.map((p) => ({ mid: op.fn(p.input), target: p.output }));
    const cmap = inferColorPermutation(transformed);
    if (cmap && transformed.every((t) => gridsEqual(applyColorMap(t.mid, cmap), t.target))) {
      const mapDesc = Array.from(cmap.entries())
        .filter(([k, v]) => k !== v)
        .map(([k, v]) => `${k}->${v}`)
        .join(",");
      return {
        ok: true,
        solved: true,
        discoveredProgram: `recolor(${op.name}(grid), {${mapDesc}})`,
        programSteps: [op.name, `recolor(${mapDesc || "id"})`],
        trainAccuracyPct: 100,
        predictedOutput: applyColorMap(op.fn(params.testInput), cmap),
        candidatesEvaluated,
        durationMs: Number((performance.now() - t0).toFixed(2)),
      };
    }
  }

  // Pass 3: 2-step geometric/structural compositions (Occam depth=2)
  for (const op1 of ARC_PRIMITIVES) {
    for (const op2 of ARC_PRIMITIVES) {
      if (op1.name === "identity" || op2.name === "identity") continue;
      candidatesEvaluated++;
      if (pairs.every((p) => gridsEqual(op2.fn(op1.fn(p.input)), p.output))) {
        return {
          ok: true,
          solved: true,
          discoveredProgram: `${op2.name}(${op1.name}(grid))`,
          programSteps: [op1.name, op2.name],
          trainAccuracyPct: 100,
          predictedOutput: op2.fn(op1.fn(params.testInput)),
          candidatesEvaluated,
          durationMs: Number((performance.now() - t0).toFixed(2)),
        };
      }
    }
  }

  return {
    ok: true,
    solved: false,
    discoveredProgram: "unresolved",
    programSteps: [],
    trainAccuracyPct: 0,
    predictedOutput: null,
    candidatesEvaluated,
    durationMs: Number((performance.now() - t0).toFixed(2)),
  };
}

export interface SymbolicLawResult {
  ok: boolean;
  family: "linear" | "quadratic" | "exponential" | "power";
  equation: string;
  rSquared: number;
  rmse: number;
  predictNextX?: number;
  predictedNextY?: number;
  candidatesCompared: Array<{ family: string; equation: string; rSquared: number; rmse: number }>;
}

function solveLinear3x3(A: number[][], B: number[]): [number, number, number] | null {
  const m = A.map((r, i) => [...r, B[i]]);
  for (let i = 0; i < 3; i++) {
    let pivot = i;
    for (let r = i + 1; r < 3; r++) {
      if (Math.abs(m[r][i]) > Math.abs(m[pivot][i])) pivot = r;
    }
    if (Math.abs(m[pivot][i]) < 1e-12) return null;
    [m[i], m[pivot]] = [m[pivot], m[i]];
    const div = m[i][i];
    for (let j = i; j < 4; j++) m[i][j] /= div;
    for (let r = 0; r < 3; r++) {
      if (r === i) continue;
      const factor = m[r][i];
      for (let j = i; j < 4; j++) m[r][j] -= factor * m[i][j];
    }
  }
  return [m[0][3], m[1][3], m[2][3]];
}

function evalFit(ys: number[], preds: number[]): { rSquared: number; rmse: number } {
  const n = ys.length;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    ssRes += (ys[i] - preds[i]) ** 2;
    ssTot += (ys[i] - meanY) ** 2;
  }
  const rmse = Math.sqrt(ssRes / n);
  const r2 = ssTot < 1e-12 ? (ssRes < 1e-10 ? 1 : 0) : 1 - ssRes / ssTot;
  return { rSquared: Number(r2.toFixed(6)), rmse: Number(rmse.toFixed(6)) };
}

/**
 * Secret #4 (`v87.4`) Part B: PySR/AI-Feynman-inspired Symbolic Law Discoverer.
 * Compares Linear, Quadratic, Exponential, and Power-Law equations via exact least squares.
 */
export function discoverSymbolicLaw(points: Array<{ x: number; y: number }>, nextX?: number): SymbolicLawResult {
  const pts = (points || []).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (pts.length < 2) {
    return {
      ok: false,
      family: "linear",
      equation: "insufficient_data",
      rSquared: 0,
      rmse: 0,
      candidatesCompared: [],
    };
  }

  const n = pts.length;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  const candidates: Array<{
    family: SymbolicLawResult["family"];
    equation: string;
    rSquared: number;
    rmse: number;
    complexity: number;
    fn: (x: number) => number;
  }> = [];

  // 1. Linear y = a*x + b
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const aLin = Math.abs(den) < 1e-12 ? 0 : num / den;
  const bLin = meanY - aLin * meanX;
  const linFn = (x: number) => aLin * x + bLin;
  const linFit = evalFit(ys, xs.map(linFn));
  candidates.push({
    family: "linear",
    equation: `y = ${aLin.toFixed(4)}*x + ${bLin.toFixed(4)}`,
    ...linFit,
    complexity: 2,
    fn: linFn,
  });

  // 2. Quadratic y = a*x^2 + b*x + c
  if (n >= 3) {
    let s1 = 0, s2 = 0, s3 = 0, s4 = 0, sy = 0, sxy = 0, sx2y = 0;
    for (let i = 0; i < n; i++) {
      const x = xs[i], x2 = x * x, y = ys[i];
      s1 += x; s2 += x2; s3 += x2 * x; s4 += x2 * x2;
      sy += y; sxy += x * y; sx2y += x2 * y;
    }
    const sol = solveLinear3x3(
      [
        [s4, s3, s2],
        [s3, s2, s1],
        [s2, s1, n],
      ],
      [sx2y, sxy, sy]
    );
    if (sol) {
      const [qa, qb, qc] = sol;
      const quadFn = (x: number) => qa * x * x + qb * x + qc;
      const quadFit = evalFit(ys, xs.map(quadFn));
      candidates.push({
        family: "quadratic",
        equation: `y = ${qa.toFixed(4)}*x^2 + ${qb.toFixed(4)}*x + ${qc.toFixed(4)}`,
        ...quadFit,
        complexity: 3,
        fn: quadFn,
      });
    }
  }

  // 3. Exponential y = a * exp(b*x) (only if all y > 0)
  if (ys.every((y) => y > 0)) {
    const lnYs = ys.map((y) => Math.log(y));
    const meanLnY = lnYs.reduce((a, b) => a + b, 0) / n;
    let numE = 0;
    for (let i = 0; i < n; i++) numE += (xs[i] - meanX) * (lnYs[i] - meanLnY);
    const bExp = Math.abs(den) < 1e-12 ? 0 : numE / den;
    const aExp = Math.exp(meanLnY - bExp * meanX);
    const expFn = (x: number) => aExp * Math.exp(bExp * x);
    const expFit = evalFit(ys, xs.map(expFn));
    candidates.push({
      family: "exponential",
      equation: `y = ${aExp.toFixed(4)} * exp(${bExp.toFixed(4)} * x)`,
      ...expFit,
      complexity: 3,
      fn: expFn,
    });
  }

  // 4. Power law y = a * x^p (x > 0 && y > 0)
  if (xs.every((x) => x > 0) && ys.every((y) => y > 0)) {
    const lnXs = xs.map((x) => Math.log(x));
    const lnYs = ys.map((y) => Math.log(y));
    const mX = lnXs.reduce((a, b) => a + b, 0) / n;
    const mY = lnYs.reduce((a, b) => a + b, 0) / n;
    let numP = 0, denP = 0;
    for (let i = 0; i < n; i++) {
      numP += (lnXs[i] - mX) * (lnYs[i] - mY);
      denP += (lnXs[i] - mX) ** 2;
    }
    const pPow = Math.abs(denP) < 1e-12 ? 0 : numP / denP;
    const aPow = Math.exp(mY - pPow * mX);
    const powFn = (x: number) => aPow * Math.pow(x, pPow);
    const powFit = evalFit(ys, xs.map(powFn));
    candidates.push({
      family: "power",
      equation: `y = ${aPow.toFixed(4)} * x^(${pPow.toFixed(4)})`,
      ...powFit,
      complexity: 3,
      fn: powFn,
    });
  }

  // Prefer higher R^2; break ties <= 0.0002 in R^2 using Occam simplicity (fewer parameters)
  candidates.sort((a, b) => {
    if (Math.abs(b.rSquared - a.rSquared) > 0.0002) return b.rSquared - a.rSquared;
    return a.complexity - b.complexity;
  });

  const best = candidates[0];
  const predX = nextX ?? xs[xs.length - 1] + 1;
  return {
    ok: true,
    family: best.family,
    equation: best.equation,
    rSquared: best.rSquared,
    rmse: best.rmse,
    predictNextX: predX,
    predictedNextY: Number(best.fn(predX).toFixed(4)),
    candidatesCompared: candidates.map(({ family, equation, rSquared, rmse }) => ({
      family,
      equation,
      rSquared,
      rmse,
    })),
  };
}

export interface CrossDomainInventionResult {
  ok: true;
  problemSummary: string;
  firstPrinciplesRoots: string[];
  trizPrinciplesApplied: Array<{ number: number; name: string; application: string }>;
  crossDomainBridge: { sourceScience: string; transferredLaw: string; concreteDesign: string };
  vaultCorpusGrounding: Array<{ title: string; url: string }>;
  feasibilityScore: number;
}

const TRIZ_MATRIX = [
  {
    cue: /offline|network|speed|latency|cache|slow|إنترنت|أوفلاين|سرعة|تأخير/i,
    number: 10,
    name: "Prior Action (Pre-Computing & Local Mirroring)",
    application: "Pre-distill compact rules & index into local memory/OPFS so execution needs zero cloud roundtrip.",
  },
  {
    cue: /scale|cost|memory|ram|bloat|disk|حجم|ذاكرة|ضغط|مجاني|تكلفة/i,
    number: 2,
    name: "Taking Out / Extraction (Separate Pointer from Payload)",
    application: "Keep compressed Nano-Crystals & symbolic laws (<10KB), offloading heavy shards asynchronously.",
  },
  {
    cue: /bug|error|crash|fail|security|خطأ|أمان|ثغرة|عطل/i,
    number: 23,
    name: "Feedback Loop (Closed-Loop Verification & Self-Repair)",
    application: "Wrap every critical transition with executable property assertions before committing state.",
  },
  {
    cue: /sales|profit|price|pos|stock|مبيعات|متجر|سعر|ربح|مخزون/i,
    number: 15,
    name: "Dynamics (Adaptive Elasticity & Real-Time Equilibrium)",
    application: "Adjust reorder threshold and bundle pricing dynamically via observed lead-time & margin feedback.",
  },
];

/**
 * Secret #4 (`v87.4`) Part C: TRIZ + First-Principles + Cross-Domain Scientific Analogy Synthesizer.
 */
export function synthesizeCrossDomainInvention(params: {
  challenge: string;
  targetDomain?: string;
}): CrossDomainInventionResult {
  const challenge = String(params.challenge || "Autonomous modular software invention").trim();
  const matchedTriz = TRIZ_MATRIX.filter((t) => t.cue.test(challenge));
  if (matchedTriz.length === 0) {
    matchedTriz.push(TRIZ_MATRIX[0], TRIZ_MATRIX[2]);
  }

  const isCommerce = /(pos|kaspi|store|stock|price|مبيعات|متجر|ربح)/i.test(challenge);
  const crossDomainBridge = isCommerce
    ? {
        sourceScience: "Thermodynamics & Biological Homeostasis",
        transferredLaw: "PID Negative Feedback + Carrying Capacity Equilibrium",
        concreteDesign:
          "Model SKU inventory velocity like ATP reserves: auto-trigger micro-restock pulses before buffer crosses lead-time variance.",
      }
    : {
        sourceScience: "Immune System Clonal Selection & Information Compression",
        transferredLaw: "Minimum Description Length (Occam) + Affinity Maturation",
        concreteDesign:
          "Compress recurring execution solutions into verified DSL primitives and mutate only failing edge-case paths inside isolated sandboxes.",
      };

  const corpus = searchStudiedKnowledgeCorpus({ query: challenge, limit: 4, includeWebFirst: true });

  return {
    ok: true,
    problemSummary: challenge.slice(0, 180),
    firstPrinciplesRoots: [
      "1. Separate immutable invariants (truth/physics/centimes) from heuristic assumptions.",
      "2. Eliminate runtime dependency on costly remote bottlenecks via local deterministic kernels.",
      "3. Require executable proof (test/simulation pass) before promoting any generated artifact.",
    ],
    trizPrinciplesApplied: matchedTriz.map(({ number, name, application }) => ({ number, name, application })),
    crossDomainBridge,
    vaultCorpusGrounding: corpus.hits.slice(0, 4).map((h) => ({ title: h.title, url: h.url })),
    feasibilityScore: Number(Math.min(0.96, 0.82 + matchedTriz.length * 0.04).toFixed(2)),
  };
}
