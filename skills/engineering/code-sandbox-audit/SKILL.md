---
name: code-sandbox-audit
description: Isolated polyglot execution (Python, JS, TS, Go, PHP, C++, Bash), autonomous GitHub/NPM/PyPI library discovery, and AST diffs.
domain: engineering
version: 1.0.0
tags: [code, sandbox, python, typescript, discovery, debugging]
---

# Code Execution, Self-Discovery & Audit Skill (Engineering Domain)

## Level 2 Instructions (Loaded On-Demand)
1. Validate algorithmic solutions in isolated sandboxes (`executeCodeSandbox` / `/api/v1/sandbox/execute`).
2. When encountering an unfamiliar external library or task, search public GitHub/NPM/PyPI/HuggingFace metadata on-demand via `autonomousToolHunt` and test a minimal snippet before persisting as a `.yuka-skill`.
3. Enforce `assertPosCoreImmutable` on any file transformation request so KASPI POS core files are never altered.
