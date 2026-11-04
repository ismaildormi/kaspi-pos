/**
 * Unit Test Suite for KASPI POS Master Fee Engine (src/lib/fees.ts)
 * 
 * Verifies:
 * 1. 1 Device: 70% customer, 30% merchant split on 100 DH
 * 2. 2 Devices: 60% customer, 40% merchant split on 100 DH
 * 3. 3+ Devices: 50% customer, 50% merchant split on 100 DH
 * 4. Zero Centime Loss Conservation: customerFee + merchantFee === totalFee
 * 5. String formatting matching exact audit spec
 * 6. Stripe, YouCanPay Local, YouCanPay International, Cash, Credit
 */

import { calculatePaymentFees, formatFeeBreakdown } from "../fees";
import assert from "node:assert/strict";

function runTests() {
  console.log("=== Running KASPI POS Master Fee Engine Tests ===");

  // 1. TPE 1 Device: 100 DH subtotal
  {
    const res = calculatePaymentFees(100, "cmi_tpe", 1);
    assert.equal(res.subtotal, 100);
    assert.equal(res.totalFee, 2.00, "Total TPE fee on 100 DH must be 2.00 DH");
    assert.equal(res.customerFee, 1.40, "Customer fee (70%) must be 1.40 DH");
    assert.equal(res.merchantFee, 0.60, "Merchant fee (30%) must be 0.60 DH");
    assert.equal(res.customerTotal, 101.40, "Customer total must be 101.40 DH");
    assert.equal(
      res.customerFee + res.merchantFee,
      res.totalFee,
      "Conservation: customerFee + merchantFee === totalFee"
    );

    const expectedString =
      "Sous-total: 100.00 DH | Frais TPE (2.00 DH) - Part Client (70%): + 1.40 DH | Total à payer (Client): 101.40 DH | Part Commerçant (30%): 0.60 DH";
    assert.equal(res.breakdownText, expectedString, "Breakdown text must match audit spec exactly");
    console.log("✓ Test 1 Passed: 1 Device (70/30 split)");
  }

  // 2. TPE 2 Devices: 100 DH subtotal
  {
    const res = calculatePaymentFees(100, "cmi_tpe", 2);
    assert.equal(res.subtotal, 100);
    assert.equal(res.totalFee, 2.00);
    assert.equal(res.customerFee, 1.20, "Customer fee (60%) must be 1.20 DH");
    assert.equal(res.merchantFee, 0.80, "Merchant fee (40%) must be 0.80 DH");
    assert.equal(res.customerTotal, 101.20, "Customer total must be 101.20 DH");
    assert.equal(res.customerFee + res.merchantFee, res.totalFee);
    console.log("✓ Test 2 Passed: 2 Devices (60/40 split)");
  }

  // 3. TPE 3+ Devices: 100 DH subtotal
  {
    const res = calculatePaymentFees(100, "cmi_tpe", 3);
    assert.equal(res.subtotal, 100);
    assert.equal(res.totalFee, 2.00);
    assert.equal(res.customerFee, 1.00, "Customer fee (50%) must be 1.00 DH");
    assert.equal(res.merchantFee, 1.00, "Merchant fee (50%) must be 1.00 DH");
    assert.equal(res.customerTotal, 101.00, "Customer total must be 101.00 DH");
    assert.equal(res.customerFee + res.merchantFee, res.totalFee);
    console.log("✓ Test 3 Passed: 3+ Devices (50/50 split)");
  }

  // 4. Odd amounts & centime precision test
  {
    const oddAmounts = [33.33, 17.55, 99.99, 1.25, 0, 10542.80];
    for (const amt of oddAmounts) {
      for (const devices of [1, 2, 5]) {
        const res = calculatePaymentFees(amt, "cmi_tpe", devices);
        const sumFees = Math.round((res.customerFee + res.merchantFee) * 100);
        const totalFeeCents = Math.round(res.totalFee * 100);
        assert.equal(
          sumFees,
          totalFeeCents,
          `Centime conservation failed for amt ${amt} on ${devices} devices`
        );
        const expectedCustomerTotal = Math.round((amt + res.customerFee) * 100);
        const actualCustomerTotal = Math.round(res.customerTotal * 100);
        assert.equal(
          actualCustomerTotal,
          expectedCustomerTotal,
          `Customer total calculation error for amt ${amt}`
        );
      }
    }
    console.log("✓ Test 4 Passed: Zero Centime Loss on odd amounts");
  }

  // 5. Stripe fee calculation
  {
    const res = calculatePaymentFees(100, "stripe", 1, "USD");
    // 2.9% of 100 = 2.90 + 0.30 fixed = 3.20 USD
    assert.equal(res.totalFee, 3.20);
    assert.equal(res.merchantFee, 3.20);
    assert.equal(res.customerFee, 0);
    assert.equal(res.customerTotal, 100);
    console.log("✓ Test 5 Passed: Stripe USD gateway calculation");
  }

  // 6. YouCanPay Local (3.9% + 2.00 MAD)
  {
    const res = calculatePaymentFees(100, "youcanpay_local", 1);
    // 3.9% of 100 = 3.90 + 2.00 = 5.90 MAD
    assert.equal(res.totalFee, 5.90);
    assert.equal(res.merchantFee, 5.90);
    assert.equal(res.customerFee, 0);
    assert.equal(res.customerTotal, 100);
    console.log("✓ Test 6 Passed: YouCanPay Local calculation");
  }

  // 7. YouCanPay Intl (4.9% + 2.00 MAD)
  {
    const res = calculatePaymentFees(100, "youcanpay_intl", 1);
    // 4.9% of 100 = 4.90 + 2.00 = 6.90 MAD
    assert.equal(res.totalFee, 6.90);
    assert.equal(res.merchantFee, 6.90);
    assert.equal(res.customerFee, 0);
    assert.equal(res.customerTotal, 100);
    console.log("✓ Test 7 Passed: YouCanPay International calculation");
  }

  // 8. Cash & Credit: Zero fee
  {
    const resCash = calculatePaymentFees(250, "cash");
    assert.equal(resCash.totalFee, 0);
    assert.equal(resCash.customerTotal, 250);

    const resCredit = calculatePaymentFees(500, "credit");
    assert.equal(resCredit.totalFee, 0);
    assert.equal(resCredit.customerTotal, 500);
    console.log("✓ Test 8 Passed: Cash & Credit zero fee");
  }

  console.log("\n>>> ALL FEE ENGINE UNIT TESTS PASSED SUCCESSFULLY! <<<\n");
}

runTests();
