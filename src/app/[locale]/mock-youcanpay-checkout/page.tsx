"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Building2, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";

export default function MockYouCanPayCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") || "mock_token_123";
  const tenant = searchParams.get("tenant") || "";
  const plan = searchParams.get("plan") || "pro";
  const returnUrl = searchParams.get("return") || "/dashboard/billing";

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      const webhookPayload = {
        event_id: `ycp_mock_${Date.now()}`,
        event_type: "transaction.paid",
        data: {
          transaction_id: `txn_${Date.now()}`,
          order_id: `order_${Date.now()}`,
          amount: 10000,
          currency: "MAD",
          status: "paid",
          metadata: { tenant_id: tenant, plan_id: plan },
        },
      };

      await fetch("/api/webhooks/youcanpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-youcanpay-signature": "valid_test_signature",
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
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 select-none">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-2 mb-6 text-zinc-400">
          <Building2 className="w-5 h-5 text-white" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            YouCan Pay Sandbox (Moroccan Cards)
          </span>
        </div>

        <h2 className="text-xl font-bold mb-2 text-white">Simulateur YouCan Pay Maroc</h2>
        <p className="text-xs text-zinc-400 mb-6">
          Environnement bac à sable pour tester le règlement en Dirhams marocains (cartes CMI, Attijari, CIH, BCP, BMCE).
        </p>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs mb-6 font-mono">
          <div className="flex justify-between">
            <span className="text-zinc-500">Plan:</span>
            <span className="text-white font-bold">{plan.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Montant:</span>
            <span className="text-white font-bold">100.00 MAD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Token Session:</span>
            <span className="text-zinc-400 truncate max-w-[150px]">{token}</span>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-4 rounded-xl bg-zinc-800 border border-zinc-700 text-white flex items-center gap-3 text-xs">
            <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
            <span>Transaction validée avec succès ! Redirection...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={isProcessing}
              className="w-full py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Validation du webhook en cours...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Simuler le Paiement (100.00 MAD)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push(returnUrl)}
              className="w-full py-2.5 rounded-2xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-semibold cursor-pointer transition-colors"
            >
              Annuler et retourner
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
