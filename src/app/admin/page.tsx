import React from "react";
import { redirect } from "next/navigation";
import { getSuperAdminUser } from "@/server/admin/guard";
import { getAdminDashboardStats } from "@/server/admin/stats";
import { AdminAlertButton } from "./AdminAlertButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let user;
  try {
    user = await getSuperAdminUser();
  } catch (err) {
    redirect("/ar/login?from=/admin");
  }

  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Super Admin Console • لوحة تحكم المنصة
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Connecté en tant que <strong className="text-white">{user.email}</strong> • Téléphone Admin :{" "}
            <strong className="text-white font-mono">+212 687-597267</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AdminAlertButton />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tenants */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Total Commerces (Tenants)</span>
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
            <span>Abonnements Actifs</span>
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
                ? `${((stats.activeSubscriptions / stats.totalTenants) * 100).toFixed(0)}% taux de conversion`
                : "Aucun commerce"}
            </p>
          </div>
        </div>

        {/* MRR in USD */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Revenu Mensuel (MRR)</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px] font-bold">
              USD ($)
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              ${stats.mrrUsd}
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Paddle MoR & YouCan Pay Net
            </p>
          </div>
        </div>

        {/* Platform GMV (MAD) */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Volume Global Ventes (GMV)</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px] font-bold">
              MAD
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              {stats.totalGmvMad}
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Volume total transigé
            </p>
          </div>
        </div>
      </div>

      {/* Tenants Data Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Répertoire des Commerces Enregistrés</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Liste en temps réel des tenants actifs et de leur statut d&apos;abonnement
            </p>
          </div>
          <span className="text-xs text-zinc-400 font-mono bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
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
                <th className="py-3 px-4 font-semibold text-end">Date d&apos;inscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {stats.tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
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
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-zinc-800 text-white border border-zinc-600">
                          Active ($10)
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
                    <td className="py-3.5 px-4 text-end text-zinc-400 font-mono">
                      {new Date(t.createdAt).toLocaleDateString()}
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
