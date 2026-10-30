import React from "react";
import { redirect } from "next/navigation";
import { getSuperAdminUser } from "@/server/admin/guard";
import { getAdminDashboardStats } from "@/server/admin/stats";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let user;
  try {
    user = await getSuperAdminUser();
  } catch (err) {
    // If unauthenticated or unauthorized, redirect to login
    redirect("/ar/login?from=/admin");
  }

  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/40 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Platform Overview • نظرة عامة على المنصة
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Logged in as <strong className="text-slate-200">{user.email}</strong> • Full Tenant Oversight Mode
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-900/90 border border-slate-700/60 px-3.5 py-1.5 rounded-lg text-xs font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>PostgreSQL Live Sync (Port 5432)</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Tenants */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-sm font-medium">
            <span>Total Shops (المحلات)</span>
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold">
              Tenants
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats.totalTenants}
            </div>
            <p className="text-xs text-emerald-400 font-medium mt-1">
              +{stats.newTenantsThisMonth} new this month
            </p>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-sm font-medium">
            <span>Active Subscriptions</span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold">
              $10/mo
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats.activeSubscriptions}
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {stats.totalTenants > 0
                ? `${((stats.activeSubscriptions / stats.totalTenants) * 100).toFixed(0)}% conversion rate`
                : "No shops yet"}
            </p>
          </div>
        </div>

        {/* MRR in USD */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-sm font-medium">
            <span>Monthly Recurring (MRR)</span>
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-bold">
              USD ($)
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              ${stats.mrrUsd}
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Paddle MoR Tax Compliant
            </p>
          </div>
        </div>

        {/* Platform GMV (MAD) */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-sm font-medium">
            <span>Processed GMV (المعاملات)</span>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold">
              MAD (د.م.)
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats.totalGmvMad}
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Total transaction volume
            </p>
          </div>
        </div>
      </div>

      {/* Tenants Data Table */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Registered Shops Directory (قائمة المحلات)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live database list of all tenants across Morocco with subscription states
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
            {stats.tenants.length} Tenants Listed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700/60">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Shop / Legal Name</th>
                <th className="py-3.5 px-4 font-semibold">City & ICE</th>
                <th className="py-3.5 px-4 font-semibold">Stores</th>
                <th className="py-3.5 px-4 font-semibold">Users</th>
                <th className="py-3.5 px-4 font-semibold">Subscription Status</th>
                <th className="py-3.5 px-4 font-semibold">Onboarded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {stats.tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No shops registered yet.
                  </td>
                </tr>
              ) : (
                stats.tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{t.displayName}</div>
                      <div className="text-xs text-slate-400">{t.legalName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{t.slug}.kasbi.ma</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-300">{t.city || "N/A"}</div>
                      <div className="text-xs font-mono text-slate-400">
                        {t.ice ? `ICE: ${t.ice}` : "ICE: Non renseigné"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                      {t.storesCount}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                      {t.usersCount}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.subscription?.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Active ($10/mo)
                        </span>
                      ) : t.subscription?.status === "trialing" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          Trialing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/40 text-slate-400 border border-slate-700">
                          Free / Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                      {new Date(t.createdAt).toLocaleDateString("fr-MA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
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
