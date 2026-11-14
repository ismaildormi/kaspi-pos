#!/usr/bin/env node
/**
 * KASPI POS — Automated Secret & NEXT_PUBLIC_ Key Leak Scanner (Layer 7)
 *
 * Scans tracked source files for hardcoded credentials or accidental exposure of
 * server-only keys via NEXT_PUBLIC_ prefix. Exits with code 1 on any finding.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "electron", "scripts"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".sql"]);

const SECRET_PATTERNS = [
  { name: "Google/Gemini API Key", regex: /AIza[0-9A-Za-z_-]{35}/g },
  { name: "Stripe Live Secret Key", regex: /sk_live_[0-9A-Za-z]{20,}/g },
  { name: "GitHub Personal Access Token", regex: /ghp_[0-9A-Za-z]{30,}/g },
  { name: "Hardcoded Postgres Connection URI", regex: /postgres(?:ql)?:\/\/[a-zA-Z0-9_.-]+:[^$\s'"@]{6,}@/g },
  {
    name: "Forbidden NEXT_PUBLIC_ Secret Exposure",
    regex: /NEXT_PUBLIC_(?:GEMINI_API_KEY|GROQ_API_KEY|WHATSAPP_API_TOKEN|DATABASE_URL|FORENSIC_AUDIT_SECRET|STRIPE_SECRET_KEY)/g,
  },
];

const findings = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
      walk(fullPath);
    } else if (entry.isFile()) {
      const rel = path.relative(ROOT, fullPath).replace(/\\/g, "/");
      if (rel === "scripts/security/secret-scan.mjs") continue;
      if (!EXTENSIONS.has(path.extname(entry.name))) continue;

      const content = fs.readFileSync(fullPath, "utf8");
      const lines = content.split(/\r?\n/);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pat of SECRET_PATTERNS) {
          pat.regex.lastIndex = 0;
          if (pat.regex.test(line)) {
            findings.push({
              file: rel,
              line: i + 1,
              rule: pat.name,
            });
          }
        }
      }
    }
  }
}

for (const d of SCAN_DIRS) {
  walk(path.join(ROOT, d));
}

if (findings.length > 0) {
  console.error("[KASPI Secret Scan] FAILED — Potential secret leaks detected:");
  for (const f of findings) {
    console.error(`  - ${f.file}:${f.line} [${f.rule}]`);
  }
  process.exit(1);
}

console.log("[KASPI Secret Scan] PASSED — 0 hardcoded secrets or NEXT_PUBLIC_ leaks detected.");
