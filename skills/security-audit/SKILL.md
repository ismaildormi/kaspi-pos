---
name: security-audit
domain: security-audit
version: 20.2.0
description: Defensive Cybersecurity Intelligence (1M+ CVE/OSV/NVD/FormAI Corpus) & Static SAST + Secret-Leak Scanner with Concrete OWASP Remediation Patches.
tags: [security, sast, owasp, cve, cwe, osv, gitleaks, ssrf, xss, sqli]
---

# YUKA Defensive Security & Code Auditing Skill

## 1. Static Vulnerability Scanning (`security-sast-auditor.ts`)
- Run `scanSourceCodeForVulnerabilities(code)` to detect SQL string interpolation (`CWE-89`), DOM XSS sinks (`CWE-79`), unvalidated outbound `fetch` (`CWE-918`), shell command injection (`CWE-78`), hardcoded secrets (`CWE-798`), and plaintext `localStorage` credentials (`CWE-312`).
- Return exact line numbers, severity (`critical`/`high`), OWASP standards reference, and concrete drop-in remediation patches without generating offensive exploit payloads.
