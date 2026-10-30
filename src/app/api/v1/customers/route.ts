import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";
import { toPrismaDecimal } from "@/domain/money";

const CreateCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  ice: z.string().optional(),
  taxIdentifier: z.string().optional(),
  address: z.string().optional(),
  creditLimit: z.union([z.string(), z.number()]).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();

    const customers = await prisma.customer.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { ice: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        loyaltyPoints: {
          select: { deltaPoints: true },
        },
      },
      orderBy: { name: "asc" },
      take: 20,
    });

    const formatted = customers.map((c) => {
      const totalPoints = c.loyaltyPoints.reduce(
        (sum, p) => sum + p.deltaPoints,
        0
      );
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        ice: c.ice,
        taxIdentifier: c.taxIdentifier,
        address: c.address,
        currentCreditBalance: Number(c.currentCreditBalance),
        creditLimit: c.creditLimit ? Number(c.creditLimit) : null,
        loyaltyPoints: totalPoints,
      };
    });

    return jsonOk({ customers: formatted });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const parsed = CreateCustomerSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0].message, 422, parsed.error.format());
    }

    const { name, phone, email, ice, taxIdentifier, address, creditLimit } = parsed.data;

    const customer = await prisma.customer.create({
      data: {
        tenantId: ctx.tenantId,
        name,
        phone: phone || null,
        email: email || null,
        ice: ice || null,
        taxIdentifier: taxIdentifier || null,
        address: address || null,
        creditLimit: creditLimit ? toPrismaDecimal(creditLimit) : null,
        currentCreditBalance: 0.00,
      },
    });

    return jsonOk(
      {
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          ice: customer.ice,
          currentCreditBalance: Number(customer.currentCreditBalance),
          creditLimit: customer.creditLimit ? Number(customer.creditLimit) : null,
          loyaltyPoints: 0,
        },
      },
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}
