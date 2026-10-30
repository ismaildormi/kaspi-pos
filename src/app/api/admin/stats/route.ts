import { NextRequest } from "next/server";
import { getSuperAdminUser } from "@/server/admin/guard";
import { getAdminDashboardStats } from "@/server/admin/stats";
import { jsonOk, handleApiError } from "@/server/http/response";

export async function GET(_req: NextRequest) {
  try {
    await getSuperAdminUser();
    const stats = await getAdminDashboardStats();
    return jsonOk({ stats });
  } catch (err) {
    return handleApiError(err);
  }
}
