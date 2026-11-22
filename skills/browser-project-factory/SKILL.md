---
name: browser-project-factory
description: Autonomous real browser autopilot, Human-in-the-Loop OAuth/Gmail handshake, multi-tab GitHub/Vercel/Supabase/Docker provisioning, and SOP project factory (v57.0).
---

# Browser & Cloud Project Factory (v57.0)

1. Use [`/api/v1/studio/browser-factory`](../../src/app/api/v1/studio/browser-factory/route.ts) to generate Playwright persistent OAuth handshakes, multi-tab project plans, and provisioning scripts (`GitHub CLI`, `Vercel CLI`, `Supabase CLI`, `Cloudflare Wrangler`).
2. Pause autonomously for user credentials/2FA during Gmail/GitHub/Cloud login without logging plaintext secrets (Presidio privacy shield), then resume across tabs.
3. Combine with `/api/v1/studio/council` (`3x/6x/12x` elastic swarm) inside [`HeyukaUnifiedStudioWorkspace`](../../src/components/studio/HeyukaUnifiedStudioWorkspace.tsx).
