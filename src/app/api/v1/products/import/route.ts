import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import {
  executeCsvImportChunked,
  type ImportCsvTaskPayload,
} from "@/trigger/import-csv";

/**
 * GET /api/v1/products/import?jobId={id}
 * Checks the status of a background CSV import job.
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId")?.trim();

    if (!jobId) {
      return NextResponse.json(
        { error: "Parameter 'jobId' is required" },
        { status: 400 }
      );
    }

    const job = await prisma.productImportJob.findFirst({
      where: { id: jobId, tenantId: ctx.tenantId },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Import job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      totalRows: job.totalRows,
      validRows: job.validRows,
      errorRows: job.errorRows,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to check import job status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/products/import
 * Asynchronously triggers a background CSV import via Trigger.dev ("import-csv")
 * and immediately returns 202 Accepted with the jobId to eliminate serverless timeouts.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const tenantId = ctx.tenantId;
    const contentType = req.headers.get("content-type") || "";

    let fileUrl = "";
    let fileName = "catalog-import.csv";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No CSV file provided." },
          { status: 400 }
        );
      }
      fileName = file.name || fileName;
      const csvText = await file.text();
      fileUrl = `data:text/csv;base64,${Buffer.from(csvText, "utf-8").toString(
        "base64"
      )}`;
    } else if (contentType.includes("application/json")) {
      const json = await req.json();
      fileName = json.fileName || fileName;
      fileUrl =
        json.fileUrl ||
        (json.csvContent
          ? `data:text/csv;base64,${Buffer.from(
              json.csvContent,
              "utf-8"
            ).toString("base64")}`
          : "");
    }

    if (!fileUrl) {
      return NextResponse.json(
        { error: "CSV file content or fileUrl is required." },
        { status: 400 }
      );
    }

    // 1. Create ProductImportJob in database
    const importJob = await prisma.productImportJob.create({
      data: {
        tenantId,
        status: "previewing",
        fileRef: fileName,
        totalRows: 0,
        validRows: 0,
        createdBy: ctx.userId || null,
      },
    });

    const taskPayload: ImportCsvTaskPayload = {
      jobId: importJob.id,
      tenantId,
      fileUrl,
    };

    let triggerRunId = `local_${importJob.id}`;
    const isTriggerConfigured =
      Boolean(process.env.TRIGGER_SECRET_KEY) &&
      process.env.TRIGGER_SECRET_KEY !== "tr_dev_your_secret_key";

    // 2. Dispatch to Trigger.dev v3 background task
    if (isTriggerConfigured) {
      const handle = await tasks.trigger<
        typeof import("@/trigger/import-csv").importCsvTask
      >("import-csv", taskPayload);
      triggerRunId = handle.id;
    } else {
      // Non-blocking in-process fallback when running locally without external Trigger.dev Cloud key
      executeCsvImportChunked(taskPayload).catch((err) => {
        console.error("[Trigger.dev Local Fallback] Background execution error:", err);
      });
    }

    // 3. Return 202 Accepted immediately
    return NextResponse.json(
      {
        success: true,
        status: "accepted",
        jobId: importJob.id,
        triggerRunId,
        message:
          "Your CSV file is being imported in the background. You can continue working.",
      },
      { status: 202 }
    );
  } catch (err: any) {
    console.error("[CSV Import Dispatch Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to dispatch CSV import job." },
      { status: err?.code === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
