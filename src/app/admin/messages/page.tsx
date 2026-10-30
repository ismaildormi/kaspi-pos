"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Inbox,
  CheckCircle2,
  MailOpen,
  MessageCircle,
  Send,
  RefreshCw,
  ArrowLeft,
  Building2,
  Clock,
} from "lucide-react";

interface AdminSupportMessage {
  id: string;
  tenantId: string;
  senderName: string;
  senderPhone: string | null;
  subject: string | null;
  message: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
  tenant?: {
    displayName: string;
    legalName: string;
    city: string | null;
    settings?: {
      phone: string | null;
      whatsappReportNumber: string | null;
    } | null;
  };
}

function formatWhatsAppPhone(raw?: string | null): string {
  if (!raw) return "";
  let cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("06") || cleaned.startsWith("07") || cleaned.startsWith("05")) {
    cleaned = `212${cleaned.slice(1)}`;
  } else if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

export default function AdminMessagesInboxPage() {
  const [messages, setMessages] = useState<AdminSupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "resolved">("all");
  const [replyText, setReplyText] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/messages");
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        if (!selectedId && data.messages?.length > 0) {
          setSelectedId(data.messages[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching admin inbox:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const selectedMessage = messages.find((m) => m.id === selectedId) || null;

  useEffect(() => {
    if (selectedMessage) {
      setReplyText(selectedMessage.adminReply || "");
    }
  }, [selectedId]);

  const updateMessageStatus = async (id: string, status: string, adminReply?: string) => {
    try {
      setUpdating(true);
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, adminReply }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  status,
                  ...(adminReply !== undefined ? { adminReply } : {}),
                }
              : m
          )
        );
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleSelectMessage = (msg: AdminSupportMessage) => {
    setSelectedId(msg.id);
    if (msg.status === "unread") {
      updateMessageStatus(msg.id, "read");
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (filter === "all") return true;
    if (filter === "resolved") return m.status === "resolved" || m.status === "replied";
    return m.status === filter;
  });

  const unreadCount = messages.filter((m) => m.status === "unread").length;

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Inbox className="h-5 w-5 text-white" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Support Inbox • Messagerie Commerçants
            </h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-black text-black">
                {unreadCount} non lus
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            Réception en temps réel des demandes d&apos;assistance de tous les tenants KASPI POS
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMessages}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualiser
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Vue Globale Admin
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { key: "all", label: `Tous (${messages.length})` },
            { key: "unread", label: `Non lus (${unreadCount})` },
            { key: "read", label: "Lus" },
            { key: "resolved", label: "Résolus / Répondus" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              filter === tab.key
                ? "bg-white text-black"
                : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Split Inbox View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 rounded-3xl border border-zinc-800 bg-zinc-900/60 overflow-hidden flex flex-col max-h-[640px]">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 text-xs font-mono text-zinc-400 flex justify-between">
            <span>Tickets Entrants</span>
            <span>{filteredMessages.length} résultats</span>
          </div>

          <div className="divide-y divide-zinc-800/70 overflow-y-auto flex-1">
            {loading ? (
              <div className="p-12 text-center text-xs text-zinc-500">Chargement de la boîte de réception...</div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-12 text-center text-xs text-zinc-500">Aucun message dans cette catégorie.</div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = msg.id === selectedId;
                const isUnread = msg.status === "unread";
                const phoneRaw =
                  msg.senderPhone ||
                  msg.tenant?.settings?.whatsappReportNumber ||
                  msg.tenant?.settings?.phone;
                const waPhone = formatWhatsAppPhone(phoneRaw);

                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-4 transition cursor-pointer ${
                      isSelected ? "bg-zinc-800/90" : "hover:bg-zinc-950/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isUnread && <span className="h-2 w-2 rounded-full bg-white shrink-0" />}
                        <span className={`text-xs ${isUnread ? "font-black text-white" : "font-semibold text-zinc-200"}`}>
                          {msg.senderName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-zinc-300 mt-1 truncate">
                      {msg.subject || "Assistance KASPI POS"}
                    </div>

                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                      {msg.message}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                        {msg.tenant?.displayName || "Commerçant"}
                      </span>

                      {waPhone && (
                        <a
                          href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                            `Bonjour ${msg.senderName}, suite à votre message support sur KASPI POS :`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-white hover:text-black transition"
                        >
                          <MessageCircle className="h-3 w-3" />
                          Contact via WhatsApp ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail & Action Pane */}
        <div className="lg:col-span-7 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 flex flex-col justify-between min-h-[420px]">
          {!selectedMessage ? (
            <div className="my-auto text-center space-y-2 text-zinc-500">
              <Inbox className="h-10 w-10 mx-auto text-zinc-700" />
              <p className="text-sm font-medium">Sélectionnez un message pour afficher les détails</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Message Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-white">
                      {selectedMessage.subject || "Assistance Technique"}
                    </h2>
                    <span className="rounded-full bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase text-white">
                      {selectedMessage.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      <strong className="text-white">{selectedMessage.senderName}</strong> (
                      {selectedMessage.tenant?.displayName || "Tenant"})
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="h-3 w-3" />
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Quick Status Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => updateMessageStatus(selectedMessage.id, "read")}
                    disabled={updating}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                  >
                    <MailOpen className="h-3.5 w-3.5" />
                    Marquer Lu
                  </button>
                  <button
                    onClick={() => updateMessageStatus(selectedMessage.id, "resolved")}
                    disabled={updating}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-black hover:bg-zinc-200 transition cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Marquer Résolu
                  </button>
                </div>
              </div>

              {/* Message Body */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </div>

              {/* WhatsApp Direct Shortcut Banner */}
              {(() => {
                const phoneRaw =
                  selectedMessage.senderPhone ||
                  selectedMessage.tenant?.settings?.whatsappReportNumber ||
                  selectedMessage.tenant?.settings?.phone;
                const waPhone = formatWhatsAppPhone(phoneRaw);

                return (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="text-xs">
                      <span className="text-zinc-400">Numéro WhatsApp du commerçant : </span>
                      <strong className="text-white font-mono">
                        {phoneRaw || "Non renseigné (utiliser réponse interne)"}
                      </strong>
                    </div>
                    {waPhone && (
                      <a
                        href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                          `Bonjour ${selectedMessage.senderName}, ici le Support Super Admin KASPI POS concernant votre demande "${selectedMessage.subject || ""}": `
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Contact via WhatsApp ↗
                      </a>
                    )}
                  </div>
                );
              })()}

              {/* Internal Admin Reply Box */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Réponse Interne (affichée dans le Dashboard du Commerçant)
                </label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Écrivez votre réponse officielle au commerçant..."
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 text-xs text-white focus:border-white focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={updating || !replyText.trim()}
                    onClick={() => updateMessageStatus(selectedMessage.id, "replied", replyText)}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black hover:bg-zinc-200 transition cursor-pointer disabled:opacity-40"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Envoyer la Réponse & Résoudre
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
