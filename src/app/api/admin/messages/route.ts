import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getSuperAdminUser } from "@/server/admin/guard";

export async function GET() {
  try {
    await getSuperAdminUser();

    const messages = await prisma.supportMessage.findMany({
      include: {
        tenant: {
          include: {
            settings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, messages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unauthorized" }, { status: 403 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await getSuperAdminUser();
    const body = await req.json();
    const { id, status, adminReply } = body;

    if (!id) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }

    const updated = await prisma.supportMessage.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(adminReply !== undefined ? { adminReply } : {}),
      },
    });

    return NextResponse.json({ success: true, message: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update" }, { status: 500 });
  }
}
