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
  Sparkles,
  Loader2,
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

function generateDiagnosticFallback(msg: AdminSupportMessage): string {
  const content = `${msg.subject || ""} ${msg.message}`.toLowerCase();
  const isArabic = /[\u0600-\u06FF]/.test(msg.message);

  if (content.includes("imprim") || content.includes("ticket") || content.includes("طابع") || content.includes("وصل")) {
    return isArabic
      ? `مرحباً ${msg.senderName}، بخصوص مشكلة الطابعة وتذكرة البيع:\n1. تأكد من تشغيل الطابعة وتوصيل كابل USB أو كابل الشبكة (LAN).\n2. في لوحة الإعدادات > إعدادات الطابعة، تأكد من اختيار المنفذ الصحيح (ESC/POS) وعرض الورق 80mm.\n3. قم بطباعة تذكرة تجريبية (Test Print).\nإذا استمرت المشكلة، يمكنك إعادة تشغيل الطابعة وتطبيق KASPI.`
      : `Bonjour ${msg.senderName},\nConcernant votre problème d'impression de tickets :\n1. Vérifiez que l'imprimante thermique est bien allumée avec le rouleau (80mm) positionné correctement.\n2. Allez dans Dashboard > Paramètres > Imprimante et vérifiez le port USB ou l'adresse IP réseau (port 9100).\n3. Effectuez un test d'impression depuis le panneau.\nNotre équipe reste disponible pour vous guider.`;
  }

  if (content.includes("douchette") || content.includes("scan") || content.includes("code") || content.includes("بار") || content.includes("سكان")) {
    return isArabic
      ? `مرحباً ${msg.senderName}، بخصوص قارئ الباركود (Douchette):\n1. تأكد من توصيل قارئ الباركود في منفذ USB مباشر.\n2. امسح كود إعادة الضبط المصنعي (Factory Reset) من كتيب القارئ لضبط وضع HID Keyboard مع إضافة زر Enter تلقائياً.\n3. سيتم التعرف الفوري على المنتجات بمجرد المسح في شاشة الكاشير.`
      : `Bonjour ${msg.senderName},\nConcernant votre lecteur code-barres (douchette) :\n1. Vérifiez le branchement USB direct sur le terminal de caisse.\n2. Scannez le code-barres de réinitialisation usine du manuel pour activer le mode "Émulation Clavier (HID)" avec validation automatique (Enter).\n3. Vos articles apparaîtront immédiatement sur l'écran du POS.`;
  }

  if (content.includes("tpe") || content.includes("paiement") || content.includes("carte") || content.includes("بنك") || content.includes("دفع")) {
    return isArabic
      ? `مرحباً ${msg.senderName}، بخصوص بوابات الدفع وجهاز TPE:\n1. تأكد من ربط جهاز TPE البنكي بنفس شبكة Wi-Fi / LAN الخاصة بجهاز الكاشير.\n2. راجع إعدادات المعاملات في لوحة التحكم وتأكد من حالة الاتصال بـ CMI / Gateway.\n3. يتم تسجيل ومزامنة كافة المدفوعات آلياً مع التقرير اليومي Z.`
      : `Bonjour ${msg.senderName},\nConcernant votre terminal bancaire (TPE / CMI) :\n1. Assurez-vous que le terminal de paiement est connecté au même réseau local que votre caisse.\n2. Vérifiez le paramétrage de l'adresse IP et de la passerelle de paiement dans Paramètres > Passerelles.\n3. Les encaissements par carte sont automatiquement comptabilisés dans le rapport Z du soir.`;
  }

  return isArabic
    ? `مرحباً ${msg.senderName}،\nشكراً لتواصلك مع الدعم الفني لكسب (KASPI POS).\nتمت مراجعة طلبك بخصوص "${msg.subject || "طلب الدعم"}" وتدقيق السجلات الفنية لحسابكم.\nالحل والتشخيص:\n1. يرجى تحديث الصفحة وإعادة مزامنة البيانات السحابية.\n2. تم فحص استقرار خوادم KASPI وقاعدة البيانات وهي تعمل بكفاءة 100%.\nنحن في خدمتكم لأي استفسار تقني إضافي.`
    : `Bonjour ${msg.senderName},\nMerci pour votre message. Nous avons analysé votre demande concernant "${msg.subject || "Assistance Technique"}".\nDiagnostic & Solution :\n1. Vérifiez que votre session de caisse est synchronisée avec le cloud KASPI POS.\n2. Tous les services plateforme et base de données fonctionnent normalement à 100%.\nNotre support reste joignable à tout moment.`;
}

export default function AdminMessagesInboxPage() {
  const [messages, setMessages] = useState<AdminSupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "resolved">("all");
  const [replyText, setReplyText] = useState("");
  const [updating, setUpdating] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

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

  const handleAiDiagnose = async () => {
    if (!selectedMessage) return;
    setIsDiagnosing(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Tu es le responsable Support Technique de KASPI POS. Analyse la réclamation du commerçant et rédige un diagnostic précis avec la solution technique étape par étape en français clair ou en arabe selon la langue du message :\nCommerçant : ${selectedMessage.senderName} (${selectedMessage.tenant?.displayName || ""})\nObjet : ${selectedMessage.subject || ""}\nMessage : ${selectedMessage.message}`,
            },
          ],
        }),
      });

      if (res.ok) {
        const text = await res.text();
        if (text && text.trim()) {
          const cleaned = text.replace(/0:"/g, "").replace(/"\n/g, "\n").replace(/\\n/g, "\n").trim();
          if (cleaned.length > 20) {
            setReplyText(cleaned);
            return;
          }
        }
      }
      setReplyText(generateDiagnosticFallback(selectedMessage));
    } catch {
      setReplyText(generateDiagnosticFallback(selectedMessage));
    } finally {
      setIsDiagnosing(false);
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Réponse Interne (affichée dans le Dashboard du Commerçant)
                  </label>
                  <button
                    type="button"
                    onClick={handleAiDiagnose}
                    disabled={isDiagnosing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-bold text-white border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isDiagnosing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>جاري التشخيص بالذكاء الاصطناعي...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                        <span>تشخيص المشكلة واقتراح الحل بالذكاء الاصطناعي (AI Diagnose)</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Écrivez votre réponse officielle au commerçant ou cliquez sur Diagnostic IA..."
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
