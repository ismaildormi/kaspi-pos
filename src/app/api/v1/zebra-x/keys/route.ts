import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/server/auth/context";
import {
  ALL_X_ZEBRA_SCOPES,
  createTenantXZebraApiKey,
  listTenantXZebraApiKeys,
  revokeTenantXZebraApiKey,
} from "@/lib/zebra-x/api-auth";

export const dynamic = "force-dynamic";

const CreateKeySchema = z.object({
  label: z.string().min(1).max(64).optional(),
  scopes: z.array(z.enum(ALL_X_ZEBRA_SCOPES as [string, ...string[]])).optional(),
  tokenPrefix: z.enum(["hk-live", "yk-live", "zx-live"]).optional(),
});

export async function GET() {
  try {
    const ctx = await getRequestContext();
    const keys = await listTenantXZebraApiKeys(ctx.tenantId);
    return NextResponse.json({
      authenticated: true,
      tenantId: ctx.tenantId,
      userEmail: ctx.userEmail,
      keys,
      availableScopes: ALL_X_ZEBRA_SCOPES,
    });
  } catch {
    return NextResponse.json({
      authenticated: false,
      tenantId: null,
      keys: [],
      availableScopes: ALL_X_ZEBRA_SCOPES,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json().catch(() => ({}));
    const parsed = CreateKeySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid key creation parameters", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const created = await createTenantXZebraApiKey({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      label: parsed.data.label,
      scopes: parsed.data.scopes as any,
      tokenPrefix: parsed.data.tokenPrefix || "hk-live",
    });

    return NextResponse.json(
      {
        ok: true,
        keyId: created.keyId,
        secretKeyOnce: created.secretKeyOnce,
        tenantId: ctx.tenantId,
        key: created.meta,
        warning:
          "Copy your Secret API Key & Key ID now; keys are stored strictly as SHA-256 hashes and secret values cannot be recovered later.",
      },
      { status: 201 }
    );
  } catch (err: any) {
    const isUnauth =
      err?.status === 401 ||
      err?.code === "UNAUTHORIZED" ||
      String(err?.message || "").includes("AUTHENTICATED_TENANT_REQUIRED");
    return NextResponse.json(
      { error: err?.message || "Authentication required to generate API keys." },
      { status: isUnauth ? 401 : 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const idFromQuery = req.nextUrl.searchParams.get("id");
    const body = idFromQuery ? {} : await req.json().catch(() => ({}));
    const keyId = String(idFromQuery || body?.id || "").trim();
    if (!keyId) {
      return NextResponse.json({ error: "API Key ID is required" }, { status: 400 });
    }
    const revoked = await revokeTenantXZebraApiKey(ctx.tenantId, keyId);
    if (!revoked) {
      return NextResponse.json({ error: "API Key ID not found for this tenant" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id: keyId, revoked: true });
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
}
