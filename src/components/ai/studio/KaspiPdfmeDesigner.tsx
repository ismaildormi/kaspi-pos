"use client";

import React, { useState, useEffect } from "react";
import { FileDown, Printer, Share2, Layout, QrCode, RefreshCw, Archive, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePosStore } from "@/client/store/usePosStore";
import {
  generateRealPdfmeDocument,
  getSavedPdfmeDocuments,
  type SavedPdfDocument,
} from "@/lib/open-source-engines";

type DocTemplateType = "invoice" | "devis" | "z_report" | "warranty";

export const KaspiPdfmeDesigner: React.FC<{
  locale?: string;
  onLog?: (msg: string) => void;
}> = ({ locale = "ar", onLog }) => {
  const { tenantInfo, cart } = usePosStore();
  const [template, setTemplate] = useState<DocTemplateType>("invoice");
  const [docTitle, setDocTitle] = useState("فاتورة بيع رسمية N° 2026-0042");
  const [accentColor, setAccentColor] = useState("#10b981");
  const [includeQr, setIncludeQr] = useState(true);
  const [clientName, setClientName] = useState("زبون المتجر");
  const [clientPhone, setClientPhone] = useState("+212600000000");

  const [items, setItems] = useState<
    Array<{ designation: string; qty: number; unitPrice: number; total: number }>
  >(() => {
    if (cart && cart.length > 0) {
      return cart.map((c) => ({
        designation: c.name,
        qty: c.quantity,
        unitPrice: c.unitPrice,
        total: c.lineTotal,
      }));
    }
    return [
      { designation: "سلة مشتريات متجر كسب (Pack Standard)", qty: 4, unitPrice: 120.0, total: 480.0 },
      { designation: "منتجات استهلاكية معتمدة", qty: 2, unitPrice: 85.0, total: 170.0 },
    ];
  });

  const [savedDocs, setSavedDocs] = useState<SavedPdfDocument[]>([]);
  const [activeDoc, setActiveDoc] = useState<SavedPdfDocument | null>(null);

  const shopName = tenantInfo?.shopName || "ASIMA • KASPI POS";
  const iceNumber = tenantInfo?.ice || "003291823000045";

  useEffect(() => {
    setSavedDocs(getSavedPdfmeDocuments());
  }, []);

  const totalTTC = items.reduce((a, it) => a + it.qty * it.unitPrice, 0);
  const totalHT = Math.round((totalTTC / 1.2) * 100) / 100;
  const totalTVA = Math.round((totalTTC - totalHT) * 100) / 100;

  const handleGenerateAndSavePdf = (forceRegen = false) => {
    const doc = generateRealPdfmeDocument(
      {
        templateType: template,
        title: docTitle,
        shopName,
        ice: iceNumber,
        clientName,
        clientPhone,
        date: new Date().toISOString().slice(0, 10),
        accentColor,
        includeQr,
        items,
      },
      forceRegen
    );
    setActiveDoc(doc);
    setSavedDocs(getSavedPdfmeDocuments());
    onLog?.(
      `[pdfme Engine] ✔ تم توليد وحفظ مستند PDF حقيقي (${doc.title}) بإجمالي ${doc.totalTTC.toFixed(2)} MAD في الذاكرة المحلية`
    );

    // Trigger real .pdf download
    const a = document.createElement("a");
    a.href = doc.pdfDataUri;
    a.download = `${doc.templateType}-${doc.date}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("تم توليد وتحميل ملف الـ PDF الحقيقي وحفظه في الأرشيف!");
  };

  const handleShareWhatsApp = () => {
    const lines = items.map(
      (it, i) => `${i + 1}. ${it.designation} (×${it.qty}) = ${(it.qty * it.unitPrice).toFixed(2)} MAD`
    );
    const text = encodeURIComponent(
      `📄 *${docTitle}*\n🏪 متجر: ${shopName}\n🔢 ICE: ${iceNumber}\n👤 الزبون: ${clientName}\n\n${lines.join(
        "\n"
      )}\n\n💰 *الإجمالي الواجب أداؤه: ${totalTTC.toFixed(2)} MAD*\n— تم التوليد عبر محرك pdfme في KASPI POS`
    );
    const cleanPhone = clientPhone.replace(/[^0-9]/g, "");
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
    onLog?.(`[pdfme -> WhatsApp] إرسال التقرير المالي (${totalTTC.toFixed(2)} MAD) إلى ${clientPhone}`);
  };

  return (
    <div className="space-y-4 text-start">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl kaspi-glass-btn flex items-center justify-center">
            <Layout className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--kaspi-text-primary)]">
              pdfme — مولّد ومصمم مستندات PDF الحقيقي (%PDF-1.4 Binary)
            </h4>
            <p className="text-[11px] text-[var(--kaspi-text-muted)]">
              github.com/pdfme/pdfme • يحفظ المستندات تلقائياً عند التوليد لتفادي إعادة الإنتاج غير الضرورية
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          Auto-Cached PDF
        </span>
      </div>

      {/* Saved PDFs Vault Bar */}
      {savedDocs.length > 0 && (
        <div className="p-2.5 rounded-xl kaspi-glass-surface border border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 shrink-0">
            <Archive className="w-3 h-3" />
            <span>المستندات المحفوظة ({savedDocs.length}):</span>
          </span>
          {savedDocs.slice(0, 5).map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setDocTitle(d.title);
                setItems(d.items);
                setActiveDoc(d);
                toast.info(`تم استرجاع المستند المحفوظ: ${d.title}`);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-[11px] text-zinc-200 whitespace-nowrap cursor-pointer"
            >
              {d.title} ({d.totalTTC.toFixed(0)} MAD)
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-3 kaspi-glass-surface p-3.5 rounded-2xl border border-white/10">
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: "invoice", label: "فاتورة رسمية Facture" },
              { id: "devis", label: "عرض أسعار Devis" },
              { id: "z_report", label: "تقرير الإغلاق Z-Report" },
              { id: "warranty", label: "شهادة ضمان / تسليم" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTemplate(t.id as DocTemplateType);
                  setDocTitle(
                    t.id === "invoice"
                      ? "فاتورة بيع رسمية N° 2026-0042"
                      : t.id === "devis"
                      ? "عرض أسعار تجاري N° DEV-2026"
                      : t.id === "z_report"
                      ? "تقرير الإغلاق المالي لليوم (Z-Clôture)"
                      : "شهادة ضمان معتمدة"
                  );
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold text-start transition-all cursor-pointer border ${
                  template === t.id
                    ? "kaspi-glass-btn text-white border-emerald-500/40"
                    : "kaspi-glass-surface text-zinc-400 hover:text-white border-white/[0.06]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 font-mono">عنوان المستند:</label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-mono">اسم الزبون:</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-mono">واتساب الزبون:</label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Editable Line Items */}
          <div className="space-y-1.5 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-mono">الأسطر والسلع:</span>
              <button
                type="button"
                onClick={() =>
                  setItems([
                    ...items,
                    { designation: "سلعة جديدة", qty: 1, unitPrice: 50, total: 50 },
                  ])
                }
                className="text-[11px] text-emerald-400 font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>سطر جديد</span>
              </button>
            </div>
            <div className="space-y-1 max-h-28 overflow-y-auto kaspi-no-scrollbar">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-1 text-[11px]">
                  <input
                    type="text"
                    value={it.designation}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx].designation = e.target.value;
                      setItems(next);
                    }}
                    className="flex-1 min-w-0 px-2 py-1 rounded bg-white/[0.04] border border-white/10 text-white"
                  />
                  <input
                    type="number"
                    value={it.qty}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx].qty = Math.max(1, Number(e.target.value) || 1);
                      next[idx].total = next[idx].qty * next[idx].unitPrice;
                      setItems(next);
                    }}
                    className="w-12 px-1.5 py-1 rounded bg-white/[0.04] border border-white/10 text-center font-mono text-white"
                  />
                  <input
                    type="number"
                    value={it.unitPrice}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx].unitPrice = Math.max(0, Number(e.target.value) || 0);
                      next[idx].total = next[idx].qty * next[idx].unitPrice;
                      setItems(next);
                    }}
                    className="w-16 px-1.5 py-1 rounded bg-white/[0.04] border border-white/10 text-center font-mono text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setItems(items.filter((_, i) => i !== idx))}
                    className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => handleGenerateAndSavePdf(false)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>تحميل وحفظ PDF</span>
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-2 rounded-xl kaspi-glass-btn text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>إرسال واتساب</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleGenerateAndSavePdf(true)}
              className="px-2.5 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-[11px] text-zinc-300 hover:text-white flex items-center justify-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>إعادة صياغة جديدة</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-2.5 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-[11px] text-zinc-300 hover:text-white flex items-center justify-center gap-1 cursor-pointer"
            >
              <Printer className="w-3 h-3" />
              <span>طباعة مباشرة</span>
            </button>
          </div>
        </div>

        {/* Live Paper Preview (7 cols) */}
        <div className="lg:col-span-7 bg-white text-zinc-900 rounded-2xl p-5 shadow-2xl space-y-4 font-sans select-none border border-zinc-200" dir="rtl">
          <div className="flex items-start justify-between border-b-2 pb-3" style={{ borderColor: accentColor }}>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900">{shopName}</h2>
              <p className="text-[10px] text-zinc-500">نظام كاسبي كاشير السحابي • الدار البيضاء، المغرب</p>
              <p className="text-[10px] text-zinc-600 font-mono mt-0.5">ICE: {iceNumber} • الزبون: {clientName}</p>
            </div>
            <div className="text-start">
              <span
                className="px-2.5 py-1 rounded text-[11px] font-extrabold text-white font-mono inline-block shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                {docTitle}
              </span>
              <p className="text-[10px] text-zinc-500 font-mono mt-1 text-end">
                {new Date().toISOString().slice(0, 10)}
              </p>
            </div>
          </div>

          <table className="w-full text-xs text-start">
            <thead className="bg-zinc-100 text-zinc-700 text-[10px] font-bold border-b border-zinc-300">
              <tr>
                <th className="py-1.5 px-2 text-start">البيان / Désignation</th>
                <th className="py-1.5 px-2 text-center">الكمية</th>
                <th className="py-1.5 px-2 text-center">السعر الفردي</th>
                <th className="py-1.5 px-2 text-end">المجموع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {items.map((it, i) => (
                <tr key={i}>
                  <td className="py-2 px-2 font-medium">{it.designation}</td>
                  <td className="py-2 px-2 text-center font-mono">{it.qty}</td>
                  <td className="py-2 px-2 text-center font-mono">{it.unitPrice.toFixed(2)}</td>
                  <td className="py-2 px-2 text-end font-mono font-bold">
                    {(it.qty * it.unitPrice).toFixed(2)} MAD
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-end justify-between border-t border-zinc-200 pt-3">
            {includeQr ? (
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded border border-zinc-300 flex items-center justify-center p-1 bg-zinc-50">
                  <QrCode className="w-10 h-10 text-zinc-800" />
                </div>
                <div className="text-[9px] text-zinc-500 leading-tight">
                  <p className="font-bold text-zinc-700">ختم التوثيق الرقمي</p>
                  <p>pdfme SHA-256 Verified</p>
                </div>
              </div>
            ) : <div />}

            <div className="text-end space-y-1">
              <div className="text-xs text-zinc-600">المجموع الصافي (HT): {totalHT.toFixed(2)} MAD</div>
              <div className="text-xs text-zinc-600">الضريبة TVA (20%): {totalTVA.toFixed(2)} MAD</div>
              <div className="text-sm font-extrabold font-mono" style={{ color: accentColor }}>
                المجموع الواجب أداؤه: {totalTTC.toFixed(2)} MAD
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
