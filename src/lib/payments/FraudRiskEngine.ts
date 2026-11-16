/**
 * KASPI POS (كسب) — Fraud & Velocity Risk Engine (`FraudRiskEngine.ts`)
 *
 * Evaluates transaction velocity, 3D Secure 2 requirement, and card BIN country alignment.
 */

export interface FraudRiskAssessment {
  riskScore: number; // 0 (low) to 100 (critical)
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  requireThreeDSecure2: boolean;
  decision: "ALLOW" | "CHALLENGE_3DS2" | "BLOCK";
  reasons: string[];
}

export class FraudRiskEngine {
  static evaluate(params: {
    amountMad: number;
    isRecurringSetup?: boolean;
    attemptsLastHour?: number;
    isMoroccanBin?: boolean;
    ipCountryCode?: string;
  }): FraudRiskAssessment {
    let score = 5;
    const reasons: string[] = [];

    if (params.isRecurringSetup) {
      reasons.push("Recurring mandate enrollment requires mandatory 3DS2 CIT authentication");
    }

    if ((params.attemptsLastHour || 0) >= 4) {
      score += 45;
      reasons.push("Elevated card attempt velocity in last 60 minutes");
    }

    if (params.amountMad > 10_000) {
      score += 20;
      reasons.push("High-value ticket > 10,000 MAD");
    }

    if (
      params.isMoroccanBin === false &&
      params.ipCountryCode &&
      params.ipCountryCode.toUpperCase() === "MA"
    ) {
      score += 15;
      reasons.push("Foreign card BIN used from domestic IP — 3DS2 enforced");
    }

    const riskLevel = score >= 70 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW";
    const requireThreeDSecure2 = Boolean(params.isRecurringSetup || score >= 20);
    const decision =
      score >= 85 ? "BLOCK" : requireThreeDSecure2 ? "CHALLENGE_3DS2" : "ALLOW";

    return {
      riskScore: Math.min(100, score),
      riskLevel,
      requireThreeDSecure2,
      decision,
      reasons,
    };
  }
}
