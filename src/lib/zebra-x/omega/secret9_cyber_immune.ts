import crypto from "node:crypto";

export interface CyberShieldInspectionResult {
  ok: true;
  verdict: "allow" | "quarantine_untrusted" | "block";
  riskScore: number; // 0..100
  threatsDetected: Array<{ code: string; detail: string; weight: number }>;
  latencyMs: number;
}

export interface PiiScrubResult {
  scrubbedText: string;
  redactedCount: number;
  redactedTypes: string[];
}

export interface AuditLedgerBlock {
  seq: number;
  timestamp: string;
  eventType: string;
  actor: string;
  payloadDigest: string;
  prevHash: string;
  blockHash: string;
}

const INJECTION_RULES: ReadonlyArray<{ code: string; weight: number; pattern: RegExp; detail: string }> = [
  {
    code: "PROMPT_INJECTION_OVERRIDE",
    weight: 60,
    pattern: /\b(?:ignore|disregard|forget)\b.{0,40}\b(?:all\s+)?(?:previous|prior|above|system)\s+(?:instructions?|rules?|prompts?)/i,
    detail: "Prompt override / instruction hijacking attempt",
  },
  {
    code: "SYSTEM_TAG_SMUGGLING",
    weight: 50,
    pattern: /<\s*\/?\s*(?:system|developer|tool_call|override)\s*>|\[SYSTEM OVERRIDE\]/i,
    detail: "Forged system/developer delimiter injection",
  },
  {
    code: "EXFIL_ENV_OR_KEY",
    weight: 70,
    pattern: /\b(?:print|reveal|dump|exfiltrate|echo|cat)\b.{0,40}(?:\.env|process\.env|api[_\s]?key|secret[_\s]?key|private[_\s]?key|DATABASE_URL)/i,
    detail: "Secret / environment variable exfiltration attempt",
  },
  {
    code: "SHELL_ESCAPE_OR_TRAVERSAL",
    weight: 65,
    pattern: /(?:\.\.\/){3,}|;\s*(?:rm\s+-rf|curl\s+[^|\n]+\|\s*(?:bash|sh))|\$\(\s*cat\s+\/etc\/passwd/i,
    detail: "Path traversal or destructive shell command injection",
  },
  {
    code: "UNTRUSTED_XSS_SCRIPT",
    weight: 45,
    pattern: /<script[^>]*>[\s\S]{0,120}(?:document\.cookie|localStorage|fetch\s*\()/i,
    detail: "Client-side credential exfiltration script tag",
  },
];

const auditLedgerChain: AuditLedgerBlock[] = [];

/**
 * Secret #9 (`v88.0`) Part A: Active Sub-2ms Prompt-Injection & Cyber-Immune Firewall.
 */
export function inspectInputWithCyberImmuneShield(
  text: string,
  opts?: { sourceTrust?: "user" | "untrusted_web" }
): CyberShieldInspectionResult {
  const t0 = performance.now();
  const content = String(text || "");
  const threatsDetected: CyberShieldInspectionResult["threatsDetected"] = [];
  let riskScore = 0;

  for (const rule of INJECTION_RULES) {
    if (rule.pattern.test(content)) {
      riskScore += rule.weight;
      threatsDetected.push({ code: rule.code, detail: rule.detail, weight: rule.weight });
    }
  }

  riskScore = Math.min(100, riskScore);
  const verdict: CyberShieldInspectionResult["verdict"] =
    riskScore >= 60 ? "block" : riskScore >= 35 || opts?.sourceTrust === "untrusted_web" ? "quarantine_untrusted" : "allow";

  return {
    ok: true,
    verdict,
    riskScore,
    threatsDetected,
    latencyMs: Number((performance.now() - t0).toFixed(3)),
  };
}

/**
 * Secret #9 (`v88.0`) Part B: Presidio-style PII & Credential Redactor (Morocco CIN, Cards, Tokens, Emails, Phones).
 */
export function scrubSensitivePiiAndTaxIds(text: string): PiiScrubResult {
  let out = String(text || "");
  let redactedCount = 0;
  const types = new Set<string>();

  const applyMask = (pat: RegExp, replacement: string, kind: string) => {
    out = out.replace(pat, () => {
      redactedCount++;
      types.add(kind);
      return replacement;
    });
  };

  applyMask(/\b(?:sk_live_|ghp_|hf_)[A-Za-z0-9_\-]{12,}/g, "[REDACTED_SECRET]", "secret_token");
  applyMask(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]", "email");
  applyMask(/(?:\+?212[\s.-]?|0)(?:5|6|7)\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}\b/g, "[REDACTED_PHONE_MA]", "phone_ma");
  applyMask(/\b(?:4\d{12}(?:\d{3})?|5[1-5]\d{14})\b/g, "[REDACTED_CARD]", "payment_card");
  applyMask(/(?:\bCIN\s*[:#]?\s*)([A-Z]{1,2}\d{4,7})\b/gi, "CIN:[REDACTED_CIN]", "morocco_cin");

  return {
    scrubbedText: out,
    redactedCount,
    redactedTypes: Array.from(types),
  };
}

/**
 * Secret #9 (`v88.0`) Part C: Cryptographic Tamper-Proof Hash-Chained Security Audit Ledger.
 */
export function appendTamperProofAuditEntry(eventType: string, actor: string, payload: unknown): AuditLedgerBlock {
  const prevHash =
    auditLedgerChain.length > 0
      ? auditLedgerChain[auditLedgerChain.length - 1].blockHash
      : "0".repeat(64);
  const seq = auditLedgerChain.length + 1;
  const timestamp = new Date().toISOString();
  const payloadDigest = crypto.createHash("sha256").update(JSON.stringify(payload ?? {}), "utf8").digest("hex");
  const blockHash = crypto
    .createHash("sha256")
    .update(`${seq}|${timestamp}|${eventType}|${actor}|${payloadDigest}|${prevHash}`, "utf8")
    .digest("hex");

  const block: AuditLedgerBlock = { seq, timestamp, eventType, actor, payloadDigest, prevHash, blockHash };
  if (auditLedgerChain.length >= 200) auditLedgerChain.shift();
  auditLedgerChain.push(block);
  return block;
}

export function verifyAuditChainIntegrity(): { ok: boolean; blocksCount: number; tipHash: string } {
  let expectedPrev = auditLedgerChain.length > 0 ? auditLedgerChain[0].prevHash : "0".repeat(64);
  for (const blk of auditLedgerChain) {
    if (blk.prevHash !== expectedPrev) {
      return { ok: false, blocksCount: auditLedgerChain.length, tipHash: blk.blockHash };
    }
    const recomputed = crypto
      .createHash("sha256")
      .update(`${blk.seq}|${blk.timestamp}|${blk.eventType}|${blk.actor}|${blk.payloadDigest}|${blk.prevHash}`, "utf8")
      .digest("hex");
    if (recomputed !== blk.blockHash) {
      return { ok: false, blocksCount: auditLedgerChain.length, tipHash: blk.blockHash };
    }
    expectedPrev = blk.blockHash;
  }
  return {
    ok: true,
    blocksCount: auditLedgerChain.length,
    tipHash: auditLedgerChain[auditLedgerChain.length - 1]?.blockHash || "genesis",
  };
}
