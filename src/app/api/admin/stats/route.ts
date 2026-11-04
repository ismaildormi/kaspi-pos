import { NextRequest } from "next/server";
import { checkSuperAdminUser } from "@/server/admin/guard";
import { getAdminDashboardStats } from "@/server/admin/stats";
import { jsonOk, jsonError } from "@/server/http/response";

export async function GET(_req: NextRequest) {
  try {
    const user = await checkSuperAdminUser();
    if (!user) {
      return jsonError("UNAUTHORIZED", "Super Admin authentication required", 401);
    }

    try {
      const stats = await getAdminDashboardStats();
      return jsonOk({ stats });
    } catch (dbErr) {
      console.error("[Stats API DB Error]:", dbErr);
      return jsonOk({
        stats: {
          totalTenants: 0,
          totalDownloads: 0,
          activeSubscriptions: 0,
          mrrUsd: "0.00",
          mrrMad: "0.00",
          totalGmvMad: "0.00",
          newTenantsThisMonth: 0,
          totalAiMessages: 0,
          revenueHistory: [],
          tenants: [],
        },
      });
    }
  } catch (err: any) {
    console.error("[Stats API Exception]:", err);
    return jsonError("INTERNAL_ERROR", err?.message || "Failed to retrieve stats", 500);
  }
}
