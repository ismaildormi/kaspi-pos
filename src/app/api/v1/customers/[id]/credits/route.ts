import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";
import { toDecimal, toPrismaDecimal, roundMoney } from "@/domain/money";

const CreateCreditSchema = z.object({
  type: z.enum(["charge", "payment", "adjustment"]),
  amount: z.union([z.string(), z.number()]),
  notes: z.string().optional(),
  saleId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  idempotencyKey: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getRequestContext();
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: {
        tenantId_id: {
          tenantId: ctx.tenantId,
          id,
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        currentCreditBalance: true,
        creditLimit: true,
      },
    });

    if (!customer) {
      throw new AppError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
    }

    const credits = await prisma.customerCredit.findMany({
      where: {
        tenantId: ctx.tenantId,
        customerId: id,
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({
      customer,
      credits,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getRequestContext();
    const { id } = await params;
    const body = await req.json();
    const parsed = CreateCreditSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0].message, 422, parsed.error.format());
    }

    const { type, amount, notes, saleId, invoiceId, idempotencyKey } = parsed.data;
    const txAmount = toDecimal(amount);

    if (txAmount.lessThanOrEqualTo(0)) {
      throw new AppError("INVALID_AMOUNT", "Credit amount must be strictly positive", 400);
    }

    // Execute atomic balance update and ledger entry
    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { tenantId_id: { tenantId: ctx.tenantId, id } },
      });

      if (!customer) {
        throw new AppError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
      }

      const currentBal = toDecimal(customer.currentCreditBalance);
      let newBal = currentBal;

      if (type === "charge") {
        newBal = currentBal.plus(txAmount);
        if (customer.creditLimit) {
          const limit = toDecimal(customer.creditLimit);
          if (newBal.greaterThan(limit)) {
            throw new AppError(
              "CREDIT_LIMIT_EXCEEDED",
              `Charge of ${txAmount.toFixed(2)} MAD exceeds customer credit limit of ${limit.toFixed(2)} MAD (New balance would be ${newBal.toFixed(2)} MAD)`,
              400
            );
          }
        }
      } else if (type === "payment") {
        newBal = currentBal.minus(txAmount);
      } else if (type === "adjustment") {
        newBal = txAmount; // in adjustment, amount is new balance
      }

      const balanceAfter = roundMoney(newBal);

      // Update customer balance
      await tx.customer.update({
        where: { id: customer.id },
        data: {
          currentCreditBalance: toPrismaDecimal(balanceAfter),
        },
      });

      // Insert credit ledger entry
      const creditEntry = await tx.customerCredit.create({
        data: {
          tenantId: ctx.tenantId,
          customerId: customer.id,
          saleId: saleId || null,
          invoiceId: invoiceId || null,
          type,
          amount: toPrismaDecimal(txAmount),
          balanceAfter: toPrismaDecimal(balanceAfter),
          notes: notes || null,
          idempotencyKey: idempotencyKey || null,
        },
      });

      return {
        creditEntry,
        balanceAfter: balanceAfter.toFixed(2),
      };
    });

    return jsonOk(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
