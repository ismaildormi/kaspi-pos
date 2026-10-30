# KNOWN ISSUES & BLOCKERS

> Format: ID · severity (blocker/high/medium/low) · status (open/workaround/resolved) · first seen · details · next action.

| ID | Severity | Status | First seen | Issue | Next action / workaround |
|---|---|---|---|---|---|
| KI-001 | high | resolved | 2026-10-30 | Docker CLI installed but Docker Desktop daemon was not running. | Resolved: Docker Desktop running v29.9.2. `docker-compose.yml` created. |
| KI-002 | low | workaround | 2026-10-30 | `pnpm` not installed (Master Plan suggests pnpm workspaces). | Use npm, single package (ADR-002). |
| KI-003 | medium | open | 2026-10-30 | Rust/cargo not installed — required for Tauri (Phase 4). | Install rustup + MSVC build tools at P4-09 (needs user consent: system-level install). |
| KI-004 | low | noted | 2026-10-30 | User referred to a PDF; the uploaded file is a `.docx`. Content fully extracted; no data loss detected. Tables were flattened one cell per line. | For exact table layout, consult the original `.docx` in `docs/source/`. |
| KI-005 | medium | open | 2026-10-30 | No payment provider (Paddle/Lemon Squeezy) sandbox credentials; Moroccan seller eligibility unverified. | Phase 3 uses clearly labelled `MockBillingProvider`. P3-07 stays blocked until keys provided. |
| KI-006 | medium | open | 2026-10-30 | No external auth provider credentials (plan suggests Supabase/Firebase). | ADR-003: built-in argon2id session auth; revisit before launch. |
| KI-007 | info | open | 2026-10-30 | Legal items (CGI 2026 Art.145 invoice fields, CNDP declaration, Moroccan TVA rates seed 20/14/10/7/0) need accountant/lawyer validation. | Track in `docs/legal-open-items.md` (P3-10). Never claim DGI compliance. |
| KI-008 | low | open | 2026-10-30 | Node v26 is very new; some packages (Prisma engines, `@node-rs/argon2` prebuilt binaries) may lag. | If install fails, try alternatives (e.g. `argon2` / `bcryptjs`) and record; consider Node 22/24 LTS via nvm if blocking. |
