/**
 * KASPI POS (كسب) — Master 4-Tier Payment Processing & Fee Splitting Engine
 * 
 * Implements the exact Moroccan & International payment fee formulas:
 * 1. Stripe: 2.9% + $0.30 USD
 * 2. YouCanPay (Morocco Local): 3.9% + 2.00 MAD
 * 3. YouCanPay (International): 4.9% + 2.00 MAD
 * 4. CMI / TPE (Physical Terminal): 2.0%
 * 
 * Dynamic Splitting Rule (CMI / TPE Physical Terminal):
 * - 1 Device:  Customer pays 70% | Merchant pays 30%
 * - 2 Devices: Customer pays 60% | Merchant pays 40%
 * - 3+ Devices: Customer pays 50% | Merchant pays 50%
 * 
 * Arithmetic is strictly calculated using integer minor units (centimes) to guarantee:
 * customerFee + merchantFee === totalFee (zero missing centimes).
 */

export type PaymentMethodType =
  | "cash"
  | "stripe"
  | "youcanpay_local"
  | "youcanpay_intl"
  | "cmi_web"
  | "cmi_tpe"
  | "credit";

export interface FeeCalculationResult {
  paymentMethod: PaymentMethodType;
  subtotal: number;
  totalFee: number;
  customerFee: number;
  merchantFee: number;
  customerTotal: number;
  customerPercentage: number;
  merchantPercentage: number;
  breakdownText: string;
  currency: string;
}

/**
 * Formats a standardized human-readable breakdown text.
 * For CMI / TPE, produces the exact audit format:
 * "Sous-total: 100.00 DH | Frais TPE (2.00 DH) - Part Client (70%): + 1.40 DH | Total à payer (Client): 101.40 DH | Part Commerçant (30%): 0.60 DH"
 */
export function formatFeeBreakdown(result: FeeCalculationResult): string {
  if (result.paymentMethod === "cmi_tpe") {
    return `Sous-total: ${result.subtotal.toFixed(2)} DH | Frais TPE (${result.totalFee.toFixed(2)} DH) - Part Client (${result.customerPercentage}%): + ${result.customerFee.toFixed(2)} DH | Total à payer (Client): ${result.customerTotal.toFixed(2)} DH | Part Commerçant (${result.merchantPercentage}%): ${result.merchantFee.toFixed(2)} DH`;
  }

  if (result.paymentMethod === "cash" || result.paymentMethod === "credit") {
    return `Total à payer: ${result.subtotal.toFixed(2)} ${result.currency}`;
  }

  if (result.paymentMethod === "stripe") {
    return `Stripe (2.9% + 0.30): Frais ${result.totalFee.toFixed(2)} ${result.currency} (Pris en charge par le commerçant)`;
  }

  if (result.paymentMethod === "youcanpay_local") {
    return `YouCanPay Maroc (3.9% + 2 DH): Frais ${result.totalFee.toFixed(2)} MAD (Commerçant)`;
  }

  if (result.paymentMethod === "youcanpay_intl") {
    return `YouCanPay International (4.9% + 2 DH): Frais ${result.totalFee.toFixed(2)} MAD (Commerçant)`;
  }

  if (result.paymentMethod === "cmi_web") {
    return `CMI Web (2.0%): Frais ${result.totalFee.toFixed(2)} MAD`;
  }

  return `Total à payer: ${result.customerTotal.toFixed(2)} ${result.currency}`;
}

/**
 * Calculates the exact fee and dynamic split according to the device count and payment gateway.
 * All math uses integer minor units (cents / centimes) to eliminate IEEE-754 floating point inaccuracies.
 */
export function calculatePaymentFees(
  subtotal: number,
  method: PaymentMethodType,
  deviceCount: number = 1,
  currency: string = "MAD"
): FeeCalculationResult {
  const safeSubtotal = Math.max(0, subtotal);
  const subtotalCents = Math.round(safeSubtotal * 100);

  // 1. CASH / CREDIT: Zero processing fees
  if (method === "cash" || method === "credit") {
    const res: FeeCalculationResult = {
      paymentMethod: method,
      subtotal: safeSubtotal,
      totalFee: 0,
      customerFee: 0,
      merchantFee: 0,
      customerTotal: safeSubtotal,
      customerPercentage: 0,
      merchantPercentage: 0,
      breakdownText: "",
      currency,
    };
    res.breakdownText = formatFeeBreakdown(res);
    return res;
  }

  // 2. STRIPE: 2.9% + $0.30 USD (or equivalent 3.00 MAD)
  if (method === "stripe") {
    const fixedCents = currency === "USD" ? 30 : 300;
    const percentageCents = Math.round(subtotalCents * 0.029);
    const totalFeeCents = percentageCents + fixedCents;
    const totalFee = totalFeeCents / 100;

    const res: FeeCalculationResult = {
      paymentMethod: "stripe",
      subtotal: safeSubtotal,
      totalFee,
      customerFee: 0,
      merchantFee: totalFee,
      customerTotal: safeSubtotal,
      customerPercentage: 0,
      merchantPercentage: 100,
      breakdownText: "",
      currency,
    };
    res.breakdownText = formatFeeBreakdown(res);
    return res;
  }

  // 3. YOUCANPAY LOCAL: 3.9% + 2.00 MAD
  if (method === "youcanpay_local") {
    const totalFeeCents = Math.round(subtotalCents * 0.039) + 200;
    const totalFee = totalFeeCents / 100;

    const res: FeeCalculationResult = {
      paymentMethod: "youcanpay_local",
      subtotal: safeSubtotal,
      totalFee,
      customerFee: 0,
      merchantFee: totalFee,
      customerTotal: safeSubtotal,
      customerPercentage: 0,
      merchantPercentage: 100,
      breakdownText: "",
      currency: "MAD",
    };
    res.breakdownText = formatFeeBreakdown(res);
    return res;
  }

  // 4. YOUCANPAY INTL: 4.9% + 2.00 MAD
  if (method === "youcanpay_intl") {
    const totalFeeCents = Math.round(subtotalCents * 0.049) + 200;
    const totalFee = totalFeeCents / 100;

    const res: FeeCalculationResult = {
      paymentMethod: "youcanpay_intl",
      subtotal: safeSubtotal,
      totalFee,
      customerFee: 0,
      merchantFee: totalFee,
      customerTotal: safeSubtotal,
      customerPercentage: 0,
      merchantPercentage: 100,
      breakdownText: "",
      currency: "MAD",
    };
    res.breakdownText = formatFeeBreakdown(res);
    return res;
  }

  // 5. CMI WEB: Flat 2.0% e-commerce
  if (method === "cmi_web") {
    const totalFeeCents = Math.round(subtotalCents * 0.02);
    const totalFee = totalFeeCents / 100;

    const res: FeeCalculationResult = {
      paymentMethod: "cmi_web",
      subtotal: safeSubtotal,
      totalFee,
      customerFee: 0,
      merchantFee: totalFee,
      customerTotal: safeSubtotal,
      customerPercentage: 0,
      merchantPercentage: 100,
      breakdownText: "",
      currency: "MAD",
    };
    res.breakdownText = formatFeeBreakdown(res);
    return res;
  }

  // 6. CMI / TPE (Physical): Flat 2.0% with Dynamic Splitting
  // - 1 Device:  Customer 70%, Merchant 30%
  // - 2 Devices: Customer 60%, Merchant 40%
  // - 3+ Devices: Customer 50%, Merchant 50%
  const totalFeeCents = Math.round(subtotalCents * 0.02);

  let customerPct = 0.70;
  let merchantPct = 0.30;

  if (deviceCount === 2) {
    customerPct = 0.60;
    merchantPct = 0.40;
  } else if (deviceCount >= 3) {
    customerPct = 0.50;
    merchantPct = 0.50;
  }

  const customerFeeCents = Math.round(totalFeeCents * customerPct);
  // Guarantee exact conservation: customerFee + merchantFee === totalFee
  const merchantFeeCents = totalFeeCents - customerFeeCents;
  const customerTotalCents = subtotalCents + customerFeeCents;

  const totalFee = totalFeeCents / 100;
  const customerFee = customerFeeCents / 100;
  const merchantFee = merchantFeeCents / 100;
  const customerTotal = customerTotalCents / 100;

  const res: FeeCalculationResult = {
    paymentMethod: "cmi_tpe",
    subtotal: safeSubtotal,
    totalFee,
    customerFee,
    merchantFee,
    customerTotal,
    customerPercentage: Math.round(customerPct * 100),
    merchantPercentage: Math.round(merchantPct * 100),
    breakdownText: "",
    currency: "MAD",
  };
  res.breakdownText = formatFeeBreakdown(res);
  return res;
}
