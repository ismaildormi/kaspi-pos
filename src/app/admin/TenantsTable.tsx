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
  Key,
  Copy,
  Check,
  Zap,
  X,
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

  // License Generator State
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [licenseDuration, setLicenseDuration] = useState<30 | 365>(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [activatingTenantId, setActivatingTenantId] = useState<string | null>(null);

  const handleGenerateLicenseKey = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", durationDays: licenseDuration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setGeneratedKey(data.licenseKey);
      toast.success(`Clé ${licenseDuration} jours générée !`);
    } catch (err: any) {
      toast.error(err.message || "Erreur de génération");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyKey = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    toast.success("Clé copiée dans le presse-papier !");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleInstantActivate = async (tenantId: string, durationDays: 30 | 365) => {
    setActivatingTenantId(tenantId);
    try {
      const res = await fetch("/api/admin/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "instant_activate", tenantId, durationDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to activate");
      toast.success(`Abonnement activé pour ${durationDays} jours avec succès !`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Erreur d'activation");
    } finally {
      setActivatingTenantId(null);
    }
  };

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

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, ville, ICE..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setGeneratedKey(null);
              setIsLicenseModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-xl transition shadow cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Générer Clé de Licence</span>
          </button>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleInstantActivate(tenant.id, 30)}
                          disabled={activatingTenantId === tenant.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-mono font-bold text-[11px] rounded-xl border border-zinc-700 transition disabled:opacity-50 cursor-pointer"
                          title="Activer 30 jours (Pro)"
                        >
                          {activatingTenantId === tenant.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Zap className="w-3 h-3 text-emerald-400" />
                          )}
                          <span>+30j</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInstantActivate(tenant.id, 365)}
                          disabled={activatingTenantId === tenant.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-mono font-bold text-[11px] rounded-xl border border-zinc-700 transition disabled:opacity-50 cursor-pointer"
                          title="Activer 365 jours (1 An)"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>+1 An</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleImpersonate(tenant)}
                          disabled={isImpersonating}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black font-sans font-bold text-xs rounded-xl hover:bg-zinc-200 transition disabled:opacity-50 cursor-pointer shadow ml-1"
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
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* License Key Generator Modal */}
      {isLicenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Générateur de Clé de Licence</h4>
                  <p className="text-[11px] text-zinc-400">Générez un code d'activation pour vos clients virement bancaire</p>
                </div>
              </div>
              <button
                onClick={() => setIsLicenseModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-300">
                Durée de la Licence :
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setLicenseDuration(30);
                    setGeneratedKey(null);
                  }}
                  className={`p-3 rounded-xl border text-center font-bold transition ${
                    licenseDuration === 30
                      ? "bg-zinc-800 border-white text-white"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className="block text-sm">30 Jours</span>
                  <span className="text-[10px] text-zinc-400 font-mono">200 MAD / mois</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLicenseDuration(365);
                    setGeneratedKey(null);
                  }}
                  className={`p-3 rounded-xl border text-center font-bold transition ${
                    licenseDuration === 365
                      ? "bg-zinc-800 border-white text-white"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className="block text-sm">1 An (365j)</span>
                  <span className="text-[10px] text-amber-400 font-mono">2 000 MAD / an</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleGenerateLicenseKey}
                disabled={isGenerating}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Génération en cours...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>Générer le Code {licenseDuration} Jours</span>
                  </>
                )}
              </button>

              {generatedKey && (
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 mt-3">
                  <span className="text-[11px] text-zinc-400 block font-semibold">Code d'activation généré :</span>
                  <div className="flex items-center justify-between gap-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                    <span className="font-mono text-sm font-black text-amber-400 select-all tracking-wider">
                      {generatedKey}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? "Copié !" : "Copier"}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Fournissez ce code au commerçant après réception de son virement. Il pourra l'activer directement dans son menu Facturation.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
