import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export interface ApiErrorPayload {
  code: string;
  message: string;
  request_id: string;
  details?: unknown;
}

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function jsonOk<T>(data: T, status: number = 200, headers?: HeadersInit) {
  return NextResponse.json({ data }, { status, headers });
}

export function jsonError(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown,
  requestId?: string
) {
  const reqId = requestId || randomUUID();
  const payload: { error: ApiErrorPayload } = {
    error: {
      code,
      message,
      request_id: reqId,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return NextResponse.json(payload, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof AppError) {
    return jsonError(err.code, err.message, err.status, err.details);
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  return jsonError("INTERNAL_ERROR", message, 500);
}
