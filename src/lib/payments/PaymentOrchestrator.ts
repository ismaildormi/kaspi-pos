/**
 * KASPI POS (كسب) — Smart Payment Orchestrator & Failover Router (`PaymentOrchestrator.ts`)
 *
 * Enforces:
 * 1. Strict Financial & Legal Separation (Bank Al-Maghrib Law 103-12):
 *    - `flow === "SUBSCRIPTION"` -> settles exclusively to `KASPI_SAAS_ACCOUNT` for software licensing.
 *    - `flow === "MERCHANT_POS"` -> settles directly to `MERCHANT_DIRECT_ACCOUNT` via merchant's own TPE/PSP.
 *    - NEVER commingles merchant POS proceeds inside KASPI's SaaS billing account!
 * 2. Intelligent routing by `country`, `currency` (`MAD`, `EUR`, `USD`), card BIN origin, and automatic failover.
 */

import type {
  PaymentFlowType,
  PaymentGatewayId,
  PaymentInitiationResult,
  PaymentIntentOptions,
  SupportedCurrency,
} from "./types";
import { PaymentGatewayManager } from "./PaymentGatewayManager";
import { PaymentAuditLogger } from "./AuditLogger";

export interface OrchestrationRouteDecision {
  primaryGateway: PaymentGatewayId;
  fallbackGateways: PaymentGatewayId[];
  flow: PaymentFlowType;
  settlementTarget: "KASPI_SAAS_ACCOUNT" | "MERCHANT_DIRECT_ACCOUNT";
  reason: string;
}

export class PaymentOrchestrator {
  static decideRoute(params: {
    countryCode: string;
    currency: SupportedCurrency;
    flow: PaymentFlowType;
    preferredGateway?: PaymentGatewayId;
    isMoroccanCardBin?: boolean;
    requiresRecurringMandate?: boolean;
  }): OrchestrationRouteDecision {
    const settlementTarget =
      params.flow === "SUBSCRIPTION" ? "KASPI_SAAS_ACCOUNT" : "MERCHANT_DIRECT_ACCOUNT";

    if (params.flow === "MERCHANT_POS") {
      return {
        primaryGateway: params.preferredGateway || "cmi_tpe",
        fallbackGateways: ["naps", "youcanpay", "cmi_web"],
        flow: "MERCHANT_POS",
        settlementTarget: "MERCHANT_DIRECT_ACCOUNT",
        reason:
          "Direct Merchant POS settlement (Law 103-12 compliant — 0% commingling with KASPI SaaS)",
      };
    }

    // SUBSCRIPTION FLOW (KASPI SaaS Billing)
    const isMorocco =
      params.countryCode.toUpperCase() === "MA" ||
      params.currency === "MAD" ||
      Boolean(params.isMoroccanCardBin);

    if (params.preferredGateway) {
      const fallbacks: PaymentGatewayId[] = isMorocco
        ? ["naps", "youcanpay", "cmi_web", "stripe"]
        : ["stripe", "youcanpay", "naps"];
      return {
        primaryGateway: params.preferredGateway,
        fallbackGateways: fallbacks.filter((g) => g !== params.preferredGateway),
        flow: "SUBSCRIPTION",
        settlementTarget: "KASPI_SAAS_ACCOUNT",
        reason: `Merchant-selected subscription gateway (${params.preferredGateway}) with recurring auto-renew mandate`,
      };
    }

    if (isMorocco) {
      return {
        primaryGateway: params.requiresRecurringMandate ? "naps" : "youcanpay",
        fallbackGateways: ["youcanpay", "cmi_web", "payzone", "stripe"],
        flow: "SUBSCRIPTION",
        settlementTarget: "KASPI_SAAS_ACCOUNT",
        reason: "Moroccan Dirham (MAD) Card-on-File Recurring Route (NAPS ePay -> YouCanPay -> CMI)",
      };
    }

    return {
      primaryGateway: "stripe",
      fallbackGateways: ["youcanpay", "naps"],
      flow: "SUBSCRIPTION",
      settlementTarget: "KASPI_SAAS_ACCOUNT",
      reason: "International Global Recurring Route (Stripe Billing SetupIntent / PaymentIntent)",
    };
  }

  static async executeOrchestratedPayment(
    options: PaymentIntentOptions & {
      countryCode?: string;
      preferredGateway?: PaymentGatewayId;
      isMoroccanCardBin?: boolean;
    }
  ): Promise<PaymentInitiationResult & { routeDecision: OrchestrationRouteDecision }> {
    const decision = PaymentOrchestrator.decideRoute({
      countryCode: options.countryCode || "MA",
      currency: (options.currency as SupportedCurrency) || "MAD",
      flow: options.flow || "SUBSCRIPTION",
      preferredGateway: options.preferredGateway,
      isMoroccanCardBin: options.isMoroccanCardBin,
      requiresRecurringMandate: options.setupRecurringMandate,
    });

    const candidates: PaymentGatewayId[] = [
      decision.primaryGateway,
      ...decision.fallbackGateways,
    ];

    for (const gw of candidates) {
      const adapter = PaymentGatewayManager.getAdapter(gw);
      const res = await adapter.initiatePayment({
        ...options,
        flow: decision.flow,
      });

      if (res.success) {
        PaymentAuditLogger.createAuditRecord({
          tenantId: options.tenantId || "default-tenant",
          flow: decision.flow,
          action:
            decision.flow === "SUBSCRIPTION"
              ? "SUBSCRIPTION_MANDATE_CREATED"
              : "POS_TPE_INITIATED",
          provider: gw,
          idempotencyKey: options.idempotencyKey || options.orderId,
          metadata: {
            amount: options.amount,
            currency: options.currency,
            settlementTarget: decision.settlementTarget,
            setupRecurringMandate: Boolean(options.setupRecurringMandate),
          },
        });

        return {
          ...res,
          settlementTarget: decision.settlementTarget,
          routeDecision: decision,
        };
      }
    }

    return {
      success: false,
      gateway: decision.primaryGateway,
      transactionId: "",
      settlementTarget: decision.settlementTarget,
      error: "All configured payment gateways in failover chain were unreachable",
      routeDecision: decision,
    };
  }
}
