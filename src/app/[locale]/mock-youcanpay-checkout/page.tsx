"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Building2, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";

export default function MockYouCanPayCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") || "mock_ycp_token_123";
  const tenant = searchParams.get("tenant") || "";
  const amount = searchParams.get("amount") || "100.00";
  const currency = searchParams.get("currency") || "MAD";
  const returnUrl = searchParams.get("return") || "/dashboard/billing";

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      // Simulate YouCan Pay Webhook Event
      const webhookPayload = {
        id: `ycp_evt_${Date.now()}`,
        order_id: token,
        status: 1, // Paid
        amount: 10000, // 100.00 MAD
        currency: "MAD",
        metadata: { tenant_id: tenant },
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
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-2 mb-6 text-emerald-400">
          <Building2 className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            YouCan Pay Sandbox (Passerelle Nationale Maroc)
          </span>
        </div>

        <h2 className="text-xl font-bold mb-2">Paiement par Carte Marocaine</h2>
        <p className="text-xs text-slate-400 mb-6">
          Simulation d&apos;autorisation CMI (CIH, Attijariwafa, BCP, BMCE, Barid Bank) pour Kasbi POS.
        </p>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700 space-y-2 text-xs mb-6 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Montant :</span>
            <span className="text-emerald-400 font-bold">{amount} {currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Période :</span>
            <span className="text-white font-bold">1 Mois</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Réseau :</span>
            <span className="text-emerald-300 font-bold">CMI National</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Token :</span>
            <span className="text-slate-300 truncate max-w-[150px]">{token}</span>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center gap-3 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Paiement CMI autorisé ! Redirection...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={isProcessing}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Traitement en cours...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Valider le Paiement (100.00 MAD)</span>
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
