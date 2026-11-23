import {
  planAndRunElasticCouncilSwarm,
  type ElasticScaleMode,
  type StudioBrand,
  type SwarmCouncilNode,
} from "@/lib/heyuka/studio/studio-orchestrator-v55-v60";

export interface AdversarialCritiqueFinding {
  id: string;
  criticRole: string;
  severity: "critical" | "major" | "minor";
  category: "security" | "finance_tva" | "reliability" | "ux_rtl" | "performance";
  finding: string;
  constructivePatch: string;
}

export interface CouncilCandidateProposal {
  id: string;
  label: string;
  content: string;
  domainTags?: string[];
}

export interface CouncilDebateResult {
  ok: true;
  scaleMode: ElasticScaleMode;
  activeMindsCount: number;
  roster: Array<{
    seat: number;
    archetype: string;
    roleFocus: string;
    weight: number;
    status: SwarmCouncilNode["status"];
  }>;
  redTeamFindings: AdversarialCritiqueFinding[];
  securityVetoTriggered: boolean;
  rankedProposals: Array<{ id: string; label: string; rrfScore: number; netPass: boolean }>;
  consensusPct: number;
  summaryBadge: string;
  durationMs: number;
}

const TWELVE_TITAN_ARCHETYPES: ReadonlyArray<{
  seat: number;
  archetype: string;
  roleFocus: string;
  baseWeight: number;
}> = [
  { seat: 1, archetype: "Strategic Planner", roleFocus: "Problem decomposition & milestones", baseWeight: 1.15 },
  { seat: 2, archetype: "Systems Architect", roleFocus: "Modular structure & scalability", baseWeight: 1.2 },
  { seat: 3, archetype: "Surgical Coder", roleFocus: "Clean bug-free implementation", baseWeight: 1.25 },
  { seat: 4, archetype: "Data & SQL Expert", roleFocus: "Schema integrity & fast queries", baseWeight: 1.1 },
  { seat: 5, archetype: "UX & RTL Designer", roleFocus: "Arabic/LTR cohesion & clarity", baseWeight: 1.05 },
  { seat: 6, archetype: "3D & Media Director", roleFocus: "Three.js PBR, SVG & audiovisual fidelity", baseWeight: 1.0 },
  { seat: 7, archetype: "Scientific Analyst", roleFocus: "First-principles & empirical math", baseWeight: 1.15 },
  { seat: 8, archetype: "KASPI TVA & Finance Auditor", roleFocus: "Morocco DGI compliance & centime precision", baseWeight: 1.3 },
  { seat: 9, archetype: "Security Veto Guard", roleFocus: "SAST, secret-scan & SSRF defense", baseWeight: 1.5 },
  { seat: 10, archetype: "Red-Team Devil's Advocate", roleFocus: "Pre-mortem failure & edge-case attacks", baseWeight: 1.35 },
  { seat: 11, archetype: "QA Verification Engineer", roleFocus: "Unit/property assertions & regression", baseWeight: 1.2 },
  { seat: 12, archetype: "Maestro Synthesizer", roleFocus: "Weighted RRF fusion & unified clarity", baseWeight: 1.4 },
];

const CRITIQUE_DETECTORS: ReadonlyArray<{
  id: string;
  criticRole: string;
  severity: AdversarialCritiqueFinding["severity"];
  category: AdversarialCritiqueFinding["category"];
  pattern: RegExp;
  finding: string;
  constructivePatch: string;
}> = [
  {
    id: "crit_secret_leak",
    criticRole: "Security Veto Guard",
    severity: "critical",
    category: "security",
    pattern: /(?:sk_live_|ghp_[A-Za-z0-9]{20,}|BEGIN (?:RSA )?PRIVATE KEY|hf_[A-Za-z0-9]{20,})/,
    finding: "Potential hardcoded credential/private key pattern detected in text/code.",
    constructivePatch: "Replace literal credential with environment variable reference (e.g. process.env.SECRET_KEY).",
  },
  {
    id: "crit_code_eval_sink",
    criticRole: "Security Veto Guard",
    severity: "critical",
    category: "security",
    pattern: /\beval\s*\(|dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:|innerHTML\s*=\s*[^"'`]/,
    finding: "Unsafe dynamic execution/DOM injection sink detected (`eval` or unescaped `innerHTML`).",
    constructivePatch: "Use pure structured rendering or isolated V8 `vm` execution instead of dynamic DOM/eval sinks.",
  },
  {
    id: "crit_sql_concat",
    criticRole: "Data & SQL Expert",
    severity: "critical",
    category: "security",
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE)\b[^;\n]{0,80}\$\{|\+\s*req\./i,
    finding: "Potential string-interpolated SQL query vulnerable to injection.",
    constructivePatch: "Switch to parameterized prepared statements (`db.$queryRaw` / bound placeholders).",
  },
  {
    id: "crit_float_money",
    criticRole: "KASPI TVA & Finance Auditor",
    severity: "major",
    category: "finance_tva",
    pattern: /(?:price|total|tva|ttc|vat|margin|invoice).{0,50}(?:parseFloat|toFixed\s*\(\s*2\s*\).*[*+]|Math\.round)/i,
    finding: "Floating-point arithmetic used near monetary/TVA fields may cause centime rounding drift.",
    constructivePatch: "Compute all MAD/centimes amounts using `Decimal` (`decimal.js`) or integer centimes.",
  },
  {
    id: "crit_placeholder_todo",
    criticRole: "QA Verification Engineer",
    severity: "major",
    category: "reliability",
    pattern: /\b(?:TODO|FIXME|PLACEHOLDER)\b|\.\.\.\s*(?:rest of|remaining code)/i,
    finding: "Incomplete placeholder (`TODO` or truncated comment) spotted in artifact.",
    constructivePatch: "Emit complete executable logic before final approval.",
  },
  {
    id: "crit_rtl_missing",
    criticRole: "UX & RTL Designer",
    severity: "minor",
    category: "ux_rtl",
    pattern: /<html(?![^>]*\bdir=)[^>]*>[\s\S]{0,600}[\u0600-\u06FF]/i,
    finding: "Arabic HTML template missing explicit `dir=\"rtl\"` direction attribute.",
    constructivePatch: "Add `dir=\"rtl\"` on `<html>` or `<bdi>` around mixed Arabic/LTR labels.",
  },
];

export function runAdversarialRedTeamPass(artifactText: string): AdversarialCritiqueFinding[] {
  const txt = String(artifactText || "");
  if (!txt.trim()) return [];
  const findings: AdversarialCritiqueFinding[] = [];
  for (const det of CRITIQUE_DETECTORS) {
    if (det.pattern.test(txt)) {
      findings.push({
        id: det.id,
        criticRole: det.criticRole,
        severity: det.severity,
        category: det.category,
        finding: det.finding,
        constructivePatch: det.constructivePatch,
      });
    }
  }
  return findings;
}

/**
 * Secret #6 (`v87.6`): Collective Multi-Mind Adversarial Council (3 -> 6 -> 12 Minds + RRF + Security Veto).
 */
export function runAdversarialSwarmCouncil(params: {
  prompt: string;
  draftArtifact?: string;
  scale?: ElasticScaleMode;
  brand?: StudioBrand;
  locale?: "ar" | "fr" | "en";
  proposals?: CouncilCandidateProposal[];
}): CouncilDebateResult {
  const t0 = performance.now();
  const baseSwarm = planAndRunElasticCouncilSwarm({
    prompt: params.prompt,
    scale: params.scale ?? "auto",
    brand: params.brand ?? "heyuka",
    locale: params.locale ?? "ar",
  });

  const activeCount = Math.min(12, Math.max(3, baseSwarm.modelCount));
  const activeArchetypes = TWELVE_TITAN_ARCHETYPES.slice(0, activeCount);

  // Ensure Security Veto & Red-Team Devil's Advocate always participate even in 3x_fast via escalation if code/finance detected
  const needsCriticalAuditors =
    /(sql|auth|token|secret|password|tva|ttc|invoice|eval|html|script|كود|ضريبة|فاتورة|أمان)/i.test(
      `${params.prompt} ${params.draftArtifact || ""}`
    );
  const effectiveArchetypes =
    needsCriticalAuditors && activeCount < 10
      ? [
          ...activeArchetypes.slice(0, Math.max(1, activeCount - 2)),
          TWELVE_TITAN_ARCHETYPES[8], // Security Veto
          TWELVE_TITAN_ARCHETYPES[9], // Red-Team Advocate
        ]
      : activeArchetypes;

  const auditTarget = `${params.prompt}\n${params.draftArtifact || ""}`;
  const redTeamFindings = runAdversarialRedTeamPass(auditTarget);
  const securityVetoTriggered = redTeamFindings.some((f) => f.severity === "critical");

  const defaultProposals: CouncilCandidateProposal[] =
    params.proposals && params.proposals.length > 0
      ? params.proposals
      : [
          {
            id: "prop_verified_modular",
            label: "Verified Modular Architecture + Deterministic Assertions",
            content: params.draftArtifact || params.prompt,
            domainTags: ["verified", "modular", "decimal", "clean"],
          },
          {
            id: "prop_fast_minimal",
            label: "Minimal Fast-Path Implementation",
            content: params.prompt.slice(0, 140),
            domainTags: ["fast"],
          },
        ];

  // Genuine Weighted Reciprocal Rank Fusion (RRF k=60) across participating experts
  const rrfScores = new Map<string, number>();
  for (const prop of defaultProposals) rrfScores.set(prop.id, 0);

  for (const expert of effectiveArchetypes) {
    const sorted = [...defaultProposals]
      .map((p) => {
        const findings = runAdversarialRedTeamPass(p.content);
        const critPenalty = findings.filter((f) => f.severity === "critical").length * 50;
        const majPenalty = findings.filter((f) => f.severity === "major").length * 15;
        const tagBonus = (p.domainTags?.length || 0) * 6 + Math.min(20, p.content.length / 40);
        return { id: p.id, utility: tagBonus - critPenalty - majPenalty + expert.seat * 0.1 };
      })
      .sort((a, b) => b.utility - a.utility);

    sorted.forEach((item, rankZeroIdx) => {
      const rrfDelta = expert.baseWeight / (60 + rankZeroIdx + 1);
      rrfScores.set(item.id, (rrfScores.get(item.id) || 0) + rrfDelta);
    });
  }

  const rankedProposals = defaultProposals
    .map((p) => {
      const f = runAdversarialRedTeamPass(p.content);
      return {
        id: p.id,
        label: p.label,
        rrfScore: Number((rrfScores.get(p.id) || 0).toFixed(4)),
        netPass: !f.some((x) => x.severity === "critical"),
      };
    })
    .sort((a, b) => b.rrfScore - a.rrfScore);

  const penaltyPct = redTeamFindings.reduce(
    (s, f) => s + (f.severity === "critical" ? 32 : f.severity === "major" ? 12 : 4),
    0
  );
  const consensusPct = Math.max(25, Math.min(99, 97 - penaltyPct));

  const summaryBadge =
    redTeamFindings.length === 0
      ? `Council Consensus: ${effectiveArchetypes.length}/${effectiveArchetypes.length} (${consensusPct}% • 0 Security/Logic Objections)`
      : `${redTeamFindings.length} Issue(s) Caught by Adversarial Red-Team (Veto=${securityVetoTriggered})`;

  return {
    ok: true,
    scaleMode: params.scale ?? "auto",
    activeMindsCount: effectiveArchetypes.length,
    roster: effectiveArchetypes.map((a, idx) => ({
      seat: a.seat,
      archetype: a.archetype,
      roleFocus: a.roleFocus,
      weight: a.baseWeight,
      status: baseSwarm.nodes[idx]?.status ?? "completed",
    })),
    redTeamFindings,
    securityVetoTriggered,
    rankedProposals,
    consensusPct,
    summaryBadge,
    durationMs: Number((performance.now() - t0).toFixed(2)),
  };
}
