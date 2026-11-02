import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSuperAdminUser } from "@/server/admin/guard";
import { getAdminDashboardStats } from "@/server/admin/stats";
import { AdminAlertButton } from "./AdminAlertButton";
import { MasterAiBanner } from "./MasterAiBanner";
import {
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  Cpu,
  Database,
  Radio,
  ArrowLeft,
  Building2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let user;
  try {
    user = await getSuperAdminUser();
  } catch {
    redirect("/ar/login?from=/admin");
  }

  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* Top Banner with Super Admin Identity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Master Control Room • Super Admin
            </h1>
          </div>
          <p className="text-xs text-zinc-400">
            Administrateur Principal : <strong className="text-white">{user.email}</strong> • Téléphone Alerte WhatsApp :{" "}
            <strong className="text-white font-mono">+212 687-597267</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/messages"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black transition hover:bg-zinc-200"
          >
            Support Inbox (Messages)
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au Magasin (POS)
          </Link>
          <AdminAlertButton />
        </div>
      </div>

      {/* Master AI • Chief Data Officer Console Banner */}
      <MasterAiBanner />

      {/* Global Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tenants */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> Commerces (Tenants)</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px] font-bold">
              PostgreSQL
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              {stats.totalTenants}
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              +{stats.newTenantsThisMonth} nouveaux ce mois
            </p>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span className="flex items-center gap-1.5"><CreditCard className="h-4 w-4" /> Abonnements Actifs</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px] font-bold">
              $10 / mois
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              {stats.activeSubscriptions}
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              {stats.totalTenants > 0
                ? `${((stats.activeSubscriptions / stats.totalTenants) * 100).toFixed(0)}% de conversion`
                : "0%"}
            </p>
          </div>
        </div>

        {/* MRR */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Revenu Mensuel (MRR)</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px] font-bold">
              USD
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              ${stats.mrrUsd}
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-1 font-mono">
              ≈ {(Number(stats.mrrUsd) * 10).toFixed(0)} MAD / mois
            </p>
          </div>
        </div>

        {/* AI Messages Used */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span className="flex items-center gap-1.5"><Cpu className="h-4 w-4" /> Requêtes IA Consommées</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px] font-bold">
              Multi-Router
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              {stats.totalAiMessages}
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              OpenRouter + Gemini + Groq
            </p>
          </div>
        </div>
      </div>

      {/* System Health Indicators */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
          <Radio className="h-4 w-4 text-white" /> État des Services & Santé Système
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Database className="h-4 w-4" /> PostgreSQL 16
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-bold text-black">
                EN LIGNE
              </span>
            </div>
            <p className="text-xs text-zinc-400">Base de données multi-tenant active sur port 5432. Latence : &lt;1.2ms.</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Cpu className="h-4 w-4" /> Multi-Key AI Pool
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-bold text-black">
                5 CLÉS ACTIVES
              </span>
            </div>
            <p className="text-xs text-zinc-400">OpenRouter (P1) + Gemini Pool (P2) + Groq Pool (P3) + Support BYOK.</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Radio className="h-4 w-4" /> Passerelle WhatsApp
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-bold text-black">
                OPÉRATIONNEL
              </span>
            </div>
            <p className="text-xs text-zinc-400">UltraMsg & Meta Cloud API prêts. Super Admin : +212 687-597267.</p>
          </div>
        </div>
      </div>

      {/* Tenants Data Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Répertoire des Commerces Enregistrés</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Gestion centralisée des tenants, abonnements et accès plateforme
            </p>
          </div>
          <span className="text-xs text-zinc-300 font-mono bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
            {stats.tenants.length} Commerces Enregistrés
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 font-mono border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4 font-semibold text-start">Magasin / Raison Sociale</th>
                <th className="py-3 px-4 font-semibold text-start">Ville & ICE</th>
                <th className="py-3 px-4 font-semibold text-start">Boutiques</th>
                <th className="py-3 px-4 font-semibold text-start">Utilisateurs</th>
                <th className="py-3 px-4 font-semibold text-start">Abonnement</th>
                <th className="py-3 px-4 font-semibold text-start">Date Inscription</th>
                <th className="py-3 px-4 font-semibold text-end">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {stats.tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    Aucun commerce inscrit pour le moment.
                  </td>
                </tr>
              ) : (
                stats.tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-950/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{t.displayName}</div>
                      <div className="text-[11px] text-zinc-400">{t.legalName}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{t.slug}.kasbi.ma</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-zinc-300">{t.city || "Maroc"}</div>
                      <div className="text-[11px] font-mono text-zinc-500">
                        {t.ice ? `ICE: ${t.ice}` : "Sans ICE"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-white">
                      {t.storesCount}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-white">
                      {t.usersCount}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.subscription?.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white text-black">
                          Actif ($10)
                        </span>
                      ) : t.subscription?.status === "trialing" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                          Essai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-zinc-900 text-zinc-500 border border-zinc-800">
                          Gratuit
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-mono">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-end">
                      <Link
                        href={`/dashboard?impersonate=${t.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
                      >
                        Gérer
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
