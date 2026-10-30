import { NextRequest } from "next/server";
import { POST as handleImport } from "@/app/api/products/import/route";

export async function POST(req: NextRequest) {
  return handleImport(req);
}
