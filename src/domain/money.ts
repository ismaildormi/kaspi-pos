import { Decimal } from "decimal.js";
import { Prisma } from "@prisma/client";

// Configure Decimal for monetary operations
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -7,
  toExpPos: 21,
});

export type MoneyInput = string | number | Decimal | Prisma.Decimal;

export function toDecimal(val: MoneyInput): Decimal {
  if (val instanceof Decimal) return val;
  if (val instanceof Prisma.Decimal) return new Decimal(val.toString());
  if (typeof val === "number") {
    // Convert through string to avoid float precision artifacts
    return new Decimal(val.toString());
  }
  return new Decimal(val);
}

export function formatMoney(val: MoneyInput, currency: string = "MAD"): string {
  const dec = toDecimal(val);
  return `${dec.toFixed(2)} ${currency}`;
}

export function roundMoney(val: MoneyInput): Decimal {
  return toDecimal(val).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function roundQty(val: MoneyInput): Decimal {
  return toDecimal(val).toDecimalPlaces(3, Decimal.ROUND_HALF_UP);
}

export function addMoney(a: MoneyInput, b: MoneyInput): Decimal {
  return roundMoney(toDecimal(a).plus(toDecimal(b)));
}

export function subMoney(a: MoneyInput, b: MoneyInput): Decimal {
  return roundMoney(toDecimal(a).minus(toDecimal(b)));
}

export function mulMoney(a: MoneyInput, b: MoneyInput): Decimal {
  return roundMoney(toDecimal(a).times(toDecimal(b)));
}

export function toPrismaDecimal(val: MoneyInput): Prisma.Decimal {
  return new Prisma.Decimal(roundMoney(val).toFixed(2));
}

export function toPrismaQtyDecimal(val: MoneyInput): Prisma.Decimal {
  return new Prisma.Decimal(roundQty(val).toFixed(3));
}
