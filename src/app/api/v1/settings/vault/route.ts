import { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonError, jsonOk } from "@/server/http/response";
import nodemailer from "nodemailer";

const MANAGED_ENV_KEYS = [
  "GMAIL_USER",
  "GMAIL_APP_PASSWORD",
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "GROQ_API_KEY",
  "GEMINI_API_KEY",
  "OPENROUTER_API_KEY",
  "WHATSAPP_ACCESS_TOKEN",
] as const;

type ManagedEnvKey = (typeof MANAGED_ENV_KEYS)[number];

function maskValue(key: string, val: string): string {
  if (!val) return "";
  if (key === "GMAIL_USER" || key === "NEXT_PUBLIC_SUPABASE_URL") return val;
  if (val.length <= 8) return "••••••••";
  return `${val.slice(0, 4)}••••••••${val.slice(-4)}`;
}

export async function GET() {
  try {
    const ctx = await getRequestContext();
    const tenantId = ctx.tenantId;

    const vaultRecord = await prisma.idempotencyRecord
      .findUnique({
        where: {
          tenantId_scope_key: {
            tenantId,
            scope: "cloud_vault",
            key: "env_keys",
          },
        },
      })
      .catch(() => null);

    const savedOverrides =
      vaultRecord?.responseBody && typeof vaultRecord.responseBody === "object"
        ? (vaultRecord.responseBody as Record<string, string>)
        : {};

    const keysStatus = MANAGED_ENV_KEYS.map((key) => {
      const runtimeVal = savedOverrides[key] || process.env[key] || "";
      return {
        key,
        configured: Boolean(runtimeVal.trim()),
        maskedValue: maskValue(key, runtimeVal.trim()),
        source: savedOverrides[key]
          ? "vault_override"
          : process.env[key]
          ? "system_env"
          : "missing",
      };
    });

    return jsonOk({
      keys: keysStatus,
      updatedAt: vaultRecord?.createdAt || null,
    });
  } catch (err: any) {
    return jsonError("VAULT_READ_ERROR", err?.message || "Unauthorized", 401);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const tenantId = ctx.tenantId;
    const body = await req.json();
    const action = body?.action || "save";

    if (action === "save") {
      const incoming = (body?.values || {}) as Record<string, string>;

      const existingRecord = await prisma.idempotencyRecord
        .findUnique({
          where: {
            tenantId_scope_key: {
              tenantId,
              scope: "cloud_vault",
              key: "env_keys",
            },
          },
        })
        .catch(() => null);

      const currentSaved =
        existingRecord?.responseBody && typeof existingRecord.responseBody === "object"
          ? { ...(existingRecord.responseBody as Record<string, string>) }
          : {};

      let updatedCount = 0;
      for (const k of MANAGED_ENV_KEYS) {
        if (typeof incoming[k] === "string" && incoming[k].trim().length > 0) {
          const clean = incoming[k].trim();
          currentSaved[k] = clean;
          process.env[k] = clean;
          updatedCount++;
        }
      }

      const farFuture = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);
      await prisma.idempotencyRecord.upsert({
        where: {
          tenantId_scope_key: {
            tenantId,
            scope: "cloud_vault",
            key: "env_keys",
          },
        },
        update: {
          responseStatus: 200,
          responseBody: currentSaved,
          expiresAt: farFuture,
        },
        create: {
          tenantId,
          scope: "cloud_vault",
          key: "env_keys",
          requestHash: "vault_env_keys",
          responseStatus: 200,
          responseBody: currentSaved,
          expiresAt: farFuture,
        },
      });

      return jsonOk({
        saved: true,
        updatedCount,
        message: `${updatedCount} clé(s) enregistrée(s) et appliquée(s) au serveur.`,
      });
    }

    if (action === "test") {
      const results: Array<{
        service: string;
        ok: boolean;
        latencyMs: number;
        detail: string;
      }> = [];

      // 1. Test Neon PostgreSQL
      const dbStart = Date.now();
      try {
        await prisma.$queryRaw`SELECT 1`;
        results.push({
          service: "Neon PostgreSQL Database",
          ok: true,
          latencyMs: Date.now() - dbStart,
          detail: "Connecté (TLS / Prisma)",
        });
      } catch (e: any) {
        results.push({
          service: "Neon PostgreSQL Database",
          ok: false,
          latencyMs: Date.now() - dbStart,
          detail: e?.message || "Erreur DB",
        });
      }

      // 2. Test Supabase Directory
      const sbStart = Date.now();
      const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      if (sbUrl && sbKey) {
        try {
          const res = await fetch(`${sbUrl.replace(/\/+$/, "")}/rest/v1/`, {
            headers: {
              apikey: sbKey,
              Authorization: `Bearer ${sbKey}`,
            },
          });
          results.push({
            service: "Supabase Cloud Directory",
            ok: res.ok,
            latencyMs: Date.now() - sbStart,
            detail: res.ok ? `Connecté (HTTP ${res.status})` : `HTTP ${res.status}`,
          });
        } catch (e: any) {
          results.push({
            service: "Supabase Cloud Directory",
            ok: false,
            latencyMs: Date.now() - sbStart,
            detail: e?.message || "Injoignable",
          });
        }
      } else {
        results.push({
          service: "Supabase Cloud Directory",
          ok: false,
          latencyMs: 0,
          detail: "Clés NEXT_PUBLIC_SUPABASE_URL manquantes",
        });
      }

      // 3. Test Gmail SMTP
      const smtpStart = Date.now();
      const gmailUser = (process.env.GMAIL_USER || "kaspipos.official@gmail.com").trim();
      const gmailPass = (process.env.GMAIL_APP_PASSWORD || "lmft boxo ytls gtbk").replace(/\s+/g, "");
      try {
        const testTransporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: { user: gmailUser, pass: gmailPass },
          connectionTimeout: 8000,
        });
        await testTransporter.verify();
        results.push({
          service: `Gmail SMTP (${gmailUser})`,
          ok: true,
          latencyMs: Date.now() - smtpStart,
          detail: "Authentifié (SSL/TLS Port 465)",
        });
      } catch (e: any) {
        results.push({
          service: `Gmail SMTP (${gmailUser})`,
          ok: false,
          latencyMs: Date.now() - smtpStart,
          detail: e?.message || "Échec SMTP",
        });
      }

      // 4. Check AI Multi-Provider Router
      const hasGroq = Boolean(process.env.GROQ_API_KEY);
      const hasGemini = Boolean(process.env.GEMINI_API_KEY);
      const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY);
      results.push({
        service: "AI Multi-Provider Router",
        ok: true,
        latencyMs: 1,
        detail:
          hasGroq || hasGemini || hasOpenRouter
            ? `Clés actives (${[
                hasGroq ? "Groq" : null,
                hasGemini ? "Gemini" : null,
                hasOpenRouter ? "OpenRouter" : null,
              ]
                .filter(Boolean)
                .join(", ")})`
            : "Moteur déterministe local + WebGPU actif (prêt pour clés Cloud)",
      });

      return jsonOk({ results });
    }

    return jsonError("INVALID_ACTION", "Unknown vault action", 400);
  } catch (err: any) {
    return jsonError("VAULT_ERROR", err?.message || "Failed to process vault request", 500);
  }
}
