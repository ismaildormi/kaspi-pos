"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Building2,
  ExternalLink,
  Shield,
  Monitor,
  Store,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface TenantItem {
  id: string;
  legalName: string;
  displayName: string;
  slug: string;
  ice: string | null;
  city: string | null;
  status: string;
  maxDevices: number;
  createdAt: string;
  storesCount: number;
  usersCount: number;
  subscription: {
    status: string;
    planCode: string;
    currentPeriodEnd: string | null;
  } | null;
}

interface TenantsTableProps {
  tenants: TenantItem[];
}

export function TenantsTable({ tenants }: TenantsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.displayName.toLowerCase().includes(q) ||
      t.legalName.toLowerCase().includes(q) ||
      (t.city && t.city.toLowerCase().includes(q)) ||
      (t.ice && t.ice.toLowerCase().includes(q))
    );
  });

  const handleImpersonate = async (tenant: TenantItem) => {
    setImpersonatingId(tenant.id);
    try {
      const res = await fetch(`/api/v1/tenants/${tenant.id}/switch`, {
        method: "POST",
      });
      const data = await res.json().catch(() => null);

      if (res.ok) {
        toast.success(`Mode gérant activé : ${tenant.displayName}`);
        router.push("/pos");
        router.refresh();
      } else {
        toast.error(
          data?.error?.message || "Impossible d'impersoner ce commerce"
        );
      }
    } catch {
      toast.error("Erreur réseau lors du basculement");
    } finally {
      setImpersonatingId(null);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
      {/* Table Header & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-white" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              Commerces Enregistrés (Tenants)
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Gérez et prenez le contrôle direct de n'importe quel magasin de la plateforme.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, ville, ICE..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-950/70 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Commerce</th>
              <th className="py-3.5 px-4 font-semibold">Statut</th>
              <th className="py-3.5 px-4 font-semibold">Appareils</th>
              <th className="py-3.5 px-4 font-semibold">Magasins / Staff</th>
              <th className="py-3.5 px-4 font-semibold">Date d'inscription</th>
              <th className="py-3.5 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-500">
                  Aucun commerce ne correspond à la recherche.
                </td>
              </tr>
            ) : (
              filtered.map((tenant) => {
                const isImpersonating = impersonatingId === tenant.id;
                return (
                  <tr
                    key={tenant.id}
                    className="hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-sans font-bold text-white text-sm">
                        {tenant.displayName}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        {tenant.legalName} • {tenant.city || "Maroc"} • ICE:{" "}
                        {tenant.ice || "N/A"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          tenant.status === "active" ||
                          tenant.status === "trialing"
                            ? "bg-zinc-800 text-white border border-zinc-700"
                            : "bg-red-950 text-red-400 border border-red-800"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tenant.status === "active" ||
                            tenant.status === "trialing"
                              ? "bg-white"
                              : "bg-red-500"
                          }`}
                        />
                        {tenant.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs">
                        <Monitor className="w-3.5 h-3.5 text-zinc-400" />
                        {tenant.maxDevices} {tenant.maxDevices > 1 ? "postes" : "poste"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Store className="w-3.5 h-3.5 text-zinc-500" />
                          {tenant.storesCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-zinc-500" />
                          {tenant.usersCount}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">
                      {new Date(tenant.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleImpersonate(tenant)}
                        disabled={isImpersonating}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black font-sans font-bold text-xs rounded-xl hover:bg-zinc-200 transition disabled:opacity-50 cursor-pointer shadow"
                      >
                        {isImpersonating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Connexion...</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-3.5 h-3.5" />
                            <span>Impersonate</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
