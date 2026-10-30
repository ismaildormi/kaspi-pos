import { toDecimal } from "@/domain/money";

export const POINTS_PER_MAD_SPENT = 0.1; // 1 point per 10 MAD (i.e. floor(amount / 10))
export const MAD_PER_POINT_REDEEMED = 0.1; // 10 points = 1 MAD discount (100 pts = 10 MAD)

export function calculatePointsEarned(totalSpentMAD: string | number): number {
  const dec = toDecimal(totalSpentMAD);
  if (dec.lessThan(10)) return 0;
  return dec.dividedBy(10).floor().toNumber();
}

export function calculateDiscountForPoints(points: number): string {
  const discountMAD = toDecimal(points).times(MAD_PER_POINT_REDEEMED);
  return discountMAD.toFixed(2);
}
