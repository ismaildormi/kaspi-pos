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
});

export async function GET() {
  try {
    const ctx = await getRequestContext();
    const keys = await listTenantXZebraApiKeys(ctx.tenantId);
    return NextResponse.json({
      authenticated: true,
      tenantId: ctx.tenantId,
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
    });

    return NextResponse.json(
      {
        ok: true,
        secretKeyOnce: created.secretKeyOnce,
        key: created.meta,
        warning: "Copy your zx-live secret key now; for security it is stored strictly as SHA-256 and will not be shown again.",
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
      return NextResponse.json({ error: "API key id is required" }, { status: 400 });
    }
    const revoked = await revokeTenantXZebraApiKey(ctx.tenantId, keyId);
    if (!revoked) {
      return NextResponse.json({ error: "API key not found for this tenant" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id: keyId, revoked: true });
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
}
