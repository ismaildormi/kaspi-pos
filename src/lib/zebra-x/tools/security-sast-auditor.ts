/**
 * HEYUKA / YUKA — Defensive Security & Static Vulnerability Auditor (`v20.2`)
 *
 * Implements offline SAST & Secret-Leak analysis modeled after OWASP ASVS, MITRE CWE,
 * Semgrep, OSV.dev, and Gitleaks — detecting real SQLi, DOM XSS, SSRF, Command Injection,
 * and hardcoded secret leaks, returning line locations and safe remediation patches.
 */

export interface SecurityFinding {
  ruleId: string;
  cwe: string;
  severity: "critical" | "high" | "medium";
  line: number;
  title: string;
  excerpt: string;
  remediationPatch: string;
  standardRef: string;
}

export interface SecurityAuditReport {
  ok: boolean;
  scannedLines: number;
  clean: boolean;
  riskScore: number;
  findings: SecurityFinding[];
}

interface SastPatternRule {
  ruleId: string;
  cwe: string;
  severity: SecurityFinding["severity"];
  title: string;
  regex: RegExp;
  remediationPatch: string;
  standardRef: string;
}

const SAST_RULES: readonly SastPatternRule[] = [
  {
    ruleId: "owasp-sqli-string-concat",
    cwe: "CWE-89",
    severity: "critical",
    title: "Dynamic SQL query string interpolation/concatenation",
    regex: /\b(?:SELECT|INSERT|UPDATE|DELETE)\b[^;]*(?:\$\{[^}]+\}|['"]\s*\+\s*[a-zA-Z_$])/i,
    remediationPatch:
      "Use parameterized Prisma/prepared queries (e.g. `prisma.$queryRaw\\`SELECT ... WHERE id = ${id}\\`` or `db.query('SELECT ... WHERE id = $1', [id])`).",
    standardRef: "OWASP SQL Injection Prevention Cheat Sheet",
  },
  {
    ruleId: "owasp-dom-xss-sink",
    cwe: "CWE-79",
    severity: "high",
    title: "Unsanitized DOM HTML injection sink (`innerHTML` / `dangerouslySetInnerHTML`)",
    regex: /\.innerHTML\s*=|dangerouslySetInnerHTML\s*=\s*\{\{/,
    remediationPatch:
      "Render plain text via JSX `{value}` or `element.textContent = value`, or sanitize HTML strictly with DOMPurify before rendering.",
    standardRef: "OWASP DOM-based XSS Prevention Cheat Sheet",
  },
  {
    ruleId: "owasp-ssrf-unvalidated-fetch",
    cwe: "CWE-918",
    severity: "critical",
    title: "Outbound `fetch()` using unvalidated external request input",
    regex: /fetch\(\s*(?:req\.|request\.|params\.|query\.|body\.|url\b)/i,
    remediationPatch:
      "Parse with `new URL(input)`, allow only https/http, block RFC1918/loopback/metadata hosts (127.0.0.1, 10.x, 169.254.169.254), and reconstruct URL from origin + pathname.",
    standardRef: "OWASP Server-Side Request Forgery (SSRF) Prevention",
  },
  {
    ruleId: "cwe78-command-injection",
    cwe: "CWE-78",
    severity: "critical",
    title: "Shell command execution with interpolated variables (`exec` / `execSync`)",
    regex: /\b(?:exec|execSync)\s*\(\s*`[^`]*\$\{[^}]+\}/,
    remediationPatch:
      "Replace `exec(...)` shell interpolation with `execFileSync(bin, [arg1, arg2], { shell: false })`.",
    standardRef: "MITRE CWE-78 / CERT Command Injection",
  },
  {
    ruleId: "gitleaks-hardcoded-credential",
    cwe: "CWE-798",
    severity: "critical",
    title: "Hardcoded API key or private credential token detected",
    regex: /(?:sk-(?:live|proj|test)-[A-Za-z0-9]{16,}|AIza[0-9A-Za-z_-]{35}|ghp_[0-9A-Za-z]{36}|AKIA[0-9A-Z]{16}|hk-live-[0-9a-f]{24,})/,
    remediationPatch:
      "Move credentials exclusively to server environment variables (`process.env.API_KEY`) and rotate the exposed token immediately.",
    standardRef: "Gitleaks / TruffleHog / OWASP Secrets Management",
  },
  {
    ruleId: "owasp-cleartext-localstorage-secret",
    cwe: "CWE-312",
    severity: "high",
    title: "Sensitive secret/token written in plaintext to browser `localStorage`",
    regex: /localStorage\.setItem\([^)]*(?:secret|token|password|api[_-]?key)/i,
    remediationPatch:
      "Never store raw secrets in persistent `localStorage`; use `HttpOnly; Secure; SameSite=Lax` cookies or in-memory state.",
    standardRef: "OWASP HTML5 Security Cheat Sheet",
  },
];

export function scanSourceCodeForVulnerabilities(sourceCode: string): SecurityAuditReport {
  const lines = String(sourceCode || "").split(/\r?\n/);
  const findings: SecurityFinding[] = [];

  lines.forEach((lineText, idx) => {
    const trimmed = lineText.trim();
    if (!trimmed) return;
    for (const rule of SAST_RULES) {
      if (rule.regex.test(lineText)) {
        findings.push({
          ruleId: rule.ruleId,
          cwe: rule.cwe,
          severity: rule.severity,
          line: idx + 1,
          title: rule.title,
          excerpt: trimmed.slice(0, 140),
          remediationPatch: rule.remediationPatch,
          standardRef: rule.standardRef,
        });
      }
    }
  });

  const riskScore = Math.min(
    100,
    findings.reduce((sum, f) => sum + (f.severity === "critical" ? 35 : f.severity === "high" ? 20 : 10), 0)
  );

  return {
    ok: true,
    scannedLines: lines.length,
    clean: findings.length === 0,
    riskScore,
    findings,
  };
}
