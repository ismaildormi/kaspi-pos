import { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError } from "@/server/http/response";

export async function GET(_req: NextRequest) {
  try {
    const ctx = await getRequestContext();

    const categories = await prisma.category.findMany({
      where: {
        tenantId: ctx.tenantId,
        isActive: true,
      },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const formatted = categories.map((c) => ({
      id: c.id,
      name: c.name,
      productCount: c._count.products,
    }));

    return jsonOk({ categories: formatted });
  } catch (err) {
    return handleApiError(err);
  }
}
