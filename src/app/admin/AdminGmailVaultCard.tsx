"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Download, Mail, RefreshCw, Search } from "lucide-react";

interface VaultEntry {
  email: string;
  fullName?: string | null;
  source: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export function AdminGmailVaultCard() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [gmailOnly, setGmailOnly] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/gmail-directory", { cache: "no-store" });
      const data = await res.json();
      if (data?.ok) {
        setEntries(Array.isArray(data.entries) ? data.entries : []);
        setTotal(Number(data.totalEmails || 0));
        setGmailOnly(Number(data.gmailOnlyCount || 0));
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = entries.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.email.includes(q) ||
      (item.fullName || "").toLowerCase().includes(q) ||
      item.source.toLowerCase().includes(q)
    );
  });

  const handleExportCsv = () => {
    const rows = [
      "email,full_name,source,first_seen,last_seen",
      ...filtered.map(
        (r) =>
          `"${r.email}","${(r.fullName || "").replace(/"/g, "'")}","${r.source}","${r.firstSeenAt}","${r.lastSeenAt}"`
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kaspi-heyuka-gmails-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Mail className="w-4 h-4 text-rose-500" />
            <span>Répertoire Central Gmail &amp; Contacts HEYUKA / KASPI</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-mono text-[11px]">
              {total} Emails ({gmailOnly} @gmail.com)
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Synchronisé automatiquement depuis Inscription POS, OTP Gmail, HEYUKA Chat/Share, Clés API et Formulaires Support.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer email / source..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            title="Actualiser"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950/70">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="py-2.5 px-4 text-start">Email / Gmail</th>
              <th className="py-2.5 px-4 text-start">Nom</th>
              <th className="py-2.5 px-4 text-start">Source</th>
              <th className="py-2.5 px-4 text-end">Dernière activité</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-zinc-500">
                  {loading ? "Chargement du répertoire..." : "Aucun email trouvé."}
                </td>
              </tr>
            ) : (
              filtered.slice(0, 120).map((entry) => (
                <tr key={entry.email} className="hover:bg-white/[0.03]">
                  <td className="py-2.5 px-4 font-mono text-rose-300">{entry.email}</td>
                  <td className="py-2.5 px-4 text-zinc-200">{entry.fullName || "—"}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-white/[0.06] text-zinc-300 font-mono text-[10px]">
                      {entry.source}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-end text-zinc-500 font-mono text-[11px]">
                    {new Date(entry.lastSeenAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
