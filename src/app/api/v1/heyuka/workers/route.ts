import { NextRequest } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/server/auth/context";
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
} from "@/lib/zebra-x/api-response";
import {
  listTenantWorkers,
  probeTenantWorker,
  registerTenantWorker,
  revokeTenantWorker,
} from "@/lib/heyuka/compute/workers-registry";

export const dynamic = "force-dynamic";

const RegisterWorkerSchema = z.object({
  name: z.string().min(1).max(64),
  osTarget: z.enum(["windows", "linux", "macos", "docker", "android", "ios", "cloud_gpu"]),
  endpointUrl: z.string().url().max(300),
  workerToken: z.string().max(200).optional(),
  explicitConsentAccepted: z.literal(true),
  capabilities: z.array(z.string().max(64)).max(32).optional(),
});

export async function OPTIONS() {
  return createApiOptionsResponse();
}

export async function GET() {
  const requestId = createRequestId();
  try {
    const ctx = await getRequestContext();
    const workers = await listTenantWorkers(ctx.tenantId);
    return apiJsonResponse({ ok: true, requestId, workers }, 200, { "X-Request-Id": requestId });
  } catch {
    return apiErrorResponse({
      status: 401,
      message: "Sign in required to inspect tenant distributed compute workers.",
      type: "authentication_error",
      requestId,
    });
  }
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId();
  try {
    const ctx = await getRequestContext();
    const body = await req.json().catch(() => ({}));

    if (body?.action === "probe" && body?.workerId) {
      const worker = await probeTenantWorker({
        tenantId: ctx.tenantId,
        workerId: String(body.workerId),
      });
      return apiJsonResponse({ ok: true, requestId, worker }, 200, { "X-Request-Id": requestId });
    }

    const parsed = RegisterWorkerSchema.safeParse(body);
    if (!parsed.success) {
      return apiErrorResponse({
        status: 400,
        message: "Valid name, HTTPS endpointUrl, osTarget, and explicitConsentAccepted=true are required.",
        type: "invalid_request_error",
        requestId,
      });
    }

    const worker = await registerTenantWorker({
      tenantId: ctx.tenantId,
      ...parsed.data,
    });
    return apiJsonResponse({ ok: true, requestId, worker }, 201, { "X-Request-Id": requestId });
  } catch (err: any) {
    const msg = String(err?.message || "Failed managing worker");
    const status = msg.includes("AUTHENTICATED") ? 401 : 400;
    return apiErrorResponse({
      status,
      message: msg,
      type: status === 401 ? "authentication_error" : "invalid_request_error",
      requestId,
    });
  }
}

export async function DELETE(req: NextRequest) {
  const requestId = createRequestId();
  try {
    const ctx = await getRequestContext();
    const id = req.nextUrl.searchParams.get("id") || "";
    if (!id) {
      return apiErrorResponse({
        status: 400,
        message: "Worker 'id' query parameter is required.",
        type: "invalid_request_error",
        requestId,
      });
    }
    const revoked = await revokeTenantWorker(ctx.tenantId, id);
    if (!revoked) {
      return apiErrorResponse({
        status: 404,
        message: "Worker ID not found for this tenant.",
        type: "invalid_request_error",
        requestId,
      });
    }
    return apiJsonResponse({ ok: true, requestId, revoked: true, id }, 200, {
      "X-Request-Id": requestId,
    });
  } catch {
    return apiErrorResponse({
      status: 401,
      message: "Authentication required",
      type: "authentication_error",
      requestId,
    });
  }
}
