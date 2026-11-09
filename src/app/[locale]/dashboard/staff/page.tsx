"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  ShieldAlert,
  UserCheck,
  UserPlus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  X,
  Loader2,
  Mail,
  User,
} from "lucide-react";

interface MemberItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function StaffPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Invite Form
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("cashier");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/staff");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.data?.members || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), fullName: fullName.trim(), role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Impossible d'ajouter le membre");
      }

      setIsModalOpen(false);
      setEmail("");
      setFullName("");
      setRole("cashier");
      fetchStaff();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Voulez-vous vraiment révoquer l'accès de cet utilisateur ?")) return;

    try {
      const res = await fetch(`/api/v1/staff?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchStaff();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div dir="ltr" className="min-h-screen bg-zinc-950 text-white pb-20 select-none">
      {/* Top Bar */}
      <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/pos`}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isRtl ? "العودة لنقطة البيع (POS)" : "Retour au POS"}</span>
            </Link>
            <div className="h-5 w-px bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold shadow-xs">
                <UserCheck className="w-4 h-4" />
              </div>
              <h1 className="text-sm font-bold text-white">
                {isRtl ? "فريق العمل والصلاحيات" : "Équipe & Rôles"}
              </h1>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Ajouter un membre</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 font-mono">
                <tr>
                  <th className="p-3.5 text-start">Utilisateur</th>
                  <th className="p-3.5 text-start">Email</th>
                  <th className="p-3.5 text-start">Rôle</th>
                  <th className="p-3.5 text-start">Statut</th>
                  <th className="p-3.5 text-end">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500">
                      Chargement de l&apos;équipe...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500">
                      Aucun membre enregistré.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-950/40 transition">
                      <td className="p-3.5 text-white font-bold">{m.name}</td>
                      <td className="p-3.5 text-zinc-400 font-mono">{m.email}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {m.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            m.status === "active"
                              ? "bg-zinc-800 text-white border border-zinc-600"
                              : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-end">
                        {m.role !== "owner" && m.status === "active" && (
                          <button
                            onClick={() => handleRevoke(m.id)}
                            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                            title="Révoquer l'accès"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Invite Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="font-bold text-white text-base">Ajouter un collaborateur</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Yassine Chraibi"
                  className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Adresse Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yassine@commerce.ma"
                  className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Rôle & Permissions
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-11 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-medium cursor-pointer"
                >
                  <option value="cashier">Caissier (Point de vente seul)</option>
                  <option value="manager">Gérant / Responsable de magasin</option>
                  <option value="accountant">Comptable (Factures & Rapports)</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition disabled:opacity-40 cursor-pointer"
                >
                  {isSubmitting ? "Enregistrement..." : "Créer l'accès"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
