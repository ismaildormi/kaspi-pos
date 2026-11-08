import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { checkSuperAdminUser } from "@/server/admin/guard";
import { getAdminDashboardStats } from "@/server/admin/stats";
import { AdminAlertButton } from "./AdminAlertButton";
import { AdminBroadcastButton } from "./AdminBroadcastButton";
import { MasterAiBanner } from "./MasterAiBanner";
import { RevenueChart } from "./RevenueChart";
import { TenantsTable } from "./TenantsTable";
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
  Download,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await checkSuperAdminUser();
  if (!user) {
    redirect("/ar/login?from=/admin");
  }

  let stats;
  try {
    stats = await getAdminDashboardStats();
  } catch (err) {
    console.error("[Admin Page Error loading stats]:", err);
    stats = {
      totalTenants: 0,
      totalDownloads: 0,
      activeSubscriptions: 0,
      mrrUsd: "0.00",
      mrrMad: "0.00",
      totalGmvMad: "0.00",
      newTenantsThisMonth: 0,
      totalAiMessages: 0,
      revenueHistory: [],
      tenants: [],
    };
  }

  return (
    <div className="space-y-8 pb-16 select-none font-sans">
      {/* Top Banner with Super Admin Identity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-5">
          <img
            src="/logo.png"
            alt="KASPI POS"
            className="w-16 h-16 object-contain bg-transparent shrink-0"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Owner Studio • Command Center
              </h1>
            </div>
            <p className="text-xs text-zinc-400">
              Super Admin : <strong className="text-white">{user.email}</strong> • Passerelle Alerte WhatsApp :{" "}
              <strong className="text-white font-mono">+212 687-597267</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/messages"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black transition hover:bg-zinc-200 shadow"
          >
            Support Inbox
          </Link>
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Accéder au POS
          </Link>
          <AdminAlertButton />
          <AdminBroadcastButton />
        </div>
      </div>

      {/* Master AI CDO Console Banner */}
      <MasterAiBanner />

      {/* 5-Card Global Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Total Tenants */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-white" />
              Commerces (Tenants)
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px] font-bold">
              Neon DB
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

        {/* Metric 2: Total App Downloads */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Download className="h-4 w-4 text-white" />
              Téléchargements (.exe)
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px] font-bold">
              Windows
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              {stats.totalDownloads}
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              Installateurs natifs distribués
            </p>
          </div>
        </div>

        {/* Metric 3: Active Subscriptions */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-white" />
              Abonnements Actifs
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px] font-bold">
              Tiering
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              {stats.activeSubscriptions}
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              {stats.totalTenants > 0
                ? `${((stats.activeSubscriptions / stats.totalTenants) * 100).toFixed(0)}% de conversion`
                : "100% de conversion"}
            </p>
          </div>
        </div>

        {/* Metric 4: Total Revenue (MRR) */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-white" />
              Revenu Mensuel (MRR)
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px] font-bold">
              MAD / USD
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {Number(stats.mrrMad).toLocaleString()} DH
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              ≈ ${stats.mrrUsd} / mois
            </p>
          </div>
        </div>

        {/* Metric 5: Total AI Requests Consumed */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-white" />
              Requêtes IA
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px] font-bold">
              Multi-Pool
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              {stats.totalAiMessages}
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              Gemini + Groq + Mistral
            </p>
          </div>
        </div>
      </div>

      {/* 30-Day Revenue Growth Chart (Recharts) */}
      <RevenueChart data={stats.revenueHistory} />

      {/* Infrastructure & Services Health */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-5 flex items-center gap-2">
          <Radio className="h-4 w-4 text-white" /> État des Services Cloud & Passerelles Free-Tier
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Database className="h-4 w-4" /> Neon PostgreSQL
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-bold text-black">
                EN LIGNE
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Postgres 16 avec RLS Multi-Tenant &amp; Supavisor pooler. Latence &lt; 2ms.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Cpu className="h-4 w-4" /> Multi-Gateway AI Pool
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-bold text-black">
                9 NIVEAUX
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Failover automatique Gemini, Groq, Mistral, Together, OpenRouter &amp; GPU local.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <HardDrive className="h-4 w-4" /> Cloudflare R2
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-bold text-black">
                0$ EGRESS
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              10GB stockage gratuit pour tickets, factures PDF, logos et sauvegardes.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Radio className="h-4 w-4" /> WhatsApp Gateway
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-bold text-black">
                DOCKER VPS
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Evolution API auto-hébergé sur Oracle Cloud ARM gratuit.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Tenants Management Table */}
      <TenantsTable tenants={stats.tenants} />
    </div>
  );
}
