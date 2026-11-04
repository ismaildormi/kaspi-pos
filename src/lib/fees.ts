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
 * Calculates the exact fee and dynamic split according to the device count and payment gateway.
 */
export function calculatePaymentFees(
  subtotal: number,
  method: PaymentMethodType,
  deviceCount: number = 1,
  currency: string = "MAD"
): FeeCalculationResult {
  const safeSubtotal = Math.max(0, subtotal);

  // 1. CASH / CREDIT: Zero processing fees
  if (method === "cash" || method === "credit") {
    return {
      paymentMethod: method,
      subtotal: safeSubtotal,
      totalFee: 0,
      customerFee: 0,
      merchantFee: 0,
      customerTotal: safeSubtotal,
      customerPercentage: 0,
      merchantPercentage: 0,
      breakdownText: `Total à payer: ${safeSubtotal.toFixed(2)} ${currency}`,
      currency,
    };
  }

  // 2. STRIPE: 2.9% + $0.30 USD
  if (method === "stripe") {
    const percentageFee = safeSubtotal * 0.029;
    const fixedFee = currency === "USD" ? 0.30 : 3.00; // 3.00 MAD equivalent of $0.30
    const totalFee = Number((percentageFee + fixedFee).toFixed(2));
    
    // Merchant covers online gateway fees by default
    return {
      paymentMethod: "stripe",
      subtotal: safeSubtotal,
      totalFee,
      customerFee: 0,
      merchantFee: totalFee,
      customerTotal: safeSubtotal,
      customerPercentage: 0,
      merchantPercentage: 100,
      breakdownText: `Stripe (2.9% + 0.30): Frais ${totalFee.toFixed(2)} ${currency} (Pris en charge par le commerçant)`,
      currency,
    };
  }

  // 3. YOUCANPAY LOCAL: 3.9% + 2.00 MAD
  if (method === "youcanpay_local") {
    const totalFee = Number((safeSubtotal * 0.039 + 2.0).toFixed(2));
    return {
      paymentMethod: "youcanpay_local",
      subtotal: safeSubtotal,
      totalFee,
      customerFee: 0,
      merchantFee: totalFee,
      customerTotal: safeSubtotal,
      customerPercentage: 0,
      merchantPercentage: 100,
      breakdownText: `YouCanPay Maroc (3.9% + 2 DH): Frais ${totalFee.toFixed(2)} MAD (Commerçant)`,
      currency: "MAD",
    };
  }

  // 4. YOUCANPAY INTL: 4.9% + 2.00 MAD
  if (method === "youcanpay_intl") {
    const totalFee = Number((safeSubtotal * 0.049 + 2.0).toFixed(2));
    return {
      paymentMethod: "youcanpay_intl",
      subtotal: safeSubtotal,
      totalFee,
      customerFee: 0,
      merchantFee: totalFee,
      customerTotal: safeSubtotal,
      customerPercentage: 0,
      merchantPercentage: 100,
      breakdownText: `YouCanPay International (4.9% + 2 DH): Frais ${totalFee.toFixed(2)} MAD (Commerçant)`,
      currency: "MAD",
    };
  }

  // 5. CMI WEB: Flat 2.0% e-commerce
  if (method === "cmi_web") {
    const totalFee = Number((safeSubtotal * 0.02).toFixed(2));
    return {
      paymentMethod: "cmi_web",
      subtotal: safeSubtotal,
      totalFee,
      customerFee: 0,
      merchantFee: totalFee,
      customerTotal: safeSubtotal,
      customerPercentage: 0,
      merchantPercentage: 100,
      breakdownText: `CMI Web (2.0%): Frais ${totalFee.toFixed(2)} MAD`,
      currency: "MAD",
    };
  }

  // 6. CMI / TPE (Physical): Flat 2.0% with Dynamic Splitting
  // - 1 Device:  Customer 70%, Merchant 30%
  // - 2 Devices: Customer 60%, Merchant 40%
  // - 3+ Devices: Customer 50%, Merchant 50%
  const totalTpeFee = Number((safeSubtotal * 0.02).toFixed(2));

  let customerPct = 0.70;
  let merchantPct = 0.30;

  if (deviceCount === 2) {
    customerPct = 0.60;
    merchantPct = 0.40;
  } else if (deviceCount >= 3) {
    customerPct = 0.50;
    merchantPct = 0.50;
  }

  const customerFee = Number((totalTpeFee * customerPct).toFixed(2));
  const merchantFee = Number((totalTpeFee - customerFee).toFixed(2));
  const customerTotal = Number((safeSubtotal + customerFee).toFixed(2));

  const breakdownText = `Subtotal: ${safeSubtotal.toFixed(2)} DH | Frais TPE (Client ${(customerPct * 100).toFixed(0)}%): +${customerFee.toFixed(2)} DH | Total à payer: ${customerTotal.toFixed(2)} DH | Part Commerçant (${(merchantPct * 100).toFixed(0)}%): ${merchantFee.toFixed(2)} DH`;

  return {
    paymentMethod: "cmi_tpe",
    subtotal: safeSubtotal,
    totalFee: totalTpeFee,
    customerFee,
    merchantFee,
    customerTotal,
    customerPercentage: Math.round(customerPct * 100),
    merchantPercentage: Math.round(merchantPct * 100),
    breakdownText,
    currency: "MAD",
  };
}
