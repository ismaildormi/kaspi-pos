"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Globe, ShieldCheck, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

export default function MockPaddleCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const txn = searchParams.get("txn") || "mock_txn_123";
  const tenant = searchParams.get("tenant") || "";
  const plan = searchParams.get("plan") || "pro";
  const returnUrl = searchParams.get("return") || "/dashboard/billing";

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      // Simulate Paddle Webhook Event
      const webhookPayload = {
        event_id: `evt_mock_${Date.now()}`,
        event_type: "subscription.activated",
        data: {
          id: `sub_${Date.now()}`,
          custom_data: { tenant_id: tenant, plan_id: plan },
          status: "active",
          currency_code: "USD",
          current_billing_period: {
            ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
          },
          details: { totals: { total: "1000" } },
        },
      };

      await fetch("/api/webhooks/paddle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "paddle-signature": "valid_test_signature",
        },
        body: JSON.stringify(webhookPayload),
      });

      setIsSuccess(true);
      setTimeout(() => {
        router.push(returnUrl);
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-2 mb-6 text-blue-400">
          <Globe className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Paddle Billing Sandbox (Merchant of Record)
          </span>
        </div>

        <h2 className="text-xl font-bold mb-2">Simulateur de Paiement Paddle</h2>
        <p className="text-xs text-slate-400 mb-6">
          Environnement bac à sable pour tester le paiement par Carte Internationale avec prise en charge automatique de la TVA.
        </p>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700 space-y-2 text-xs mb-6 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Plan:</span>
            <span className="text-white font-bold">{plan.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Montant:</span>
            <span className="text-emerald-400 font-bold">10.00 USD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Taxe / TVA:</span>
            <span className="text-blue-300 font-bold">Inclus (MoR)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Transaction ID:</span>
            <span className="text-slate-300 truncate max-w-[150px]">{txn}</span>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center gap-3 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Paiement réussi ! Redirection vers Kasbi POS...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={isProcessing}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validation du webhook en cours...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirmer le Paiement (10.00 USD)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push(returnUrl)}
              className="w-full py-2.5 rounded-2xl border border-slate-700 text-slate-400 hover:bg-slate-700/50 text-xs font-semibold cursor-pointer"
            >
              Annuler et retourner
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
