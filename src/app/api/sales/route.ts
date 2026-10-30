import { NextRequest } from "next/server";
import { POST as handlePostSale } from "@/app/api/v1/sales/route";

export async function POST(req: NextRequest) {
  return handlePostSale(req);
}
