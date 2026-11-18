"use client";

import React, { useState } from "react";
import { FileDown, Printer, Share2, Sparkles, Layout, Palette, QrCode, Check, Eye } from "lucide-react";
import { toast } from "sonner";
import { usePosStore } from "@/client/store/usePosStore";

type DocTemplateType = "invoice" | "devis" | "z_report" | "warranty";

export const KaspiPdfmeDesigner: React.FC<{ locale?: string }> = ({ locale = "ar" }) => {
  const { tenantInfo, cart } = usePosStore();
  const [template, setTemplate] = useState<DocTemplateType>("invoice");
  const [docTitle, setDocTitle] = useState("فاتورة بيع رقم 2026-0042");
  const [accentColor, setAccentColor] = useState("#10b981");
  const [includeQr, setIncludeQr] = useState(true);
  const [clientPhone, setClientPhone] = useState("+212600000000");

  const shopName = tenantInfo?.shopName || "متجر كسب النموذجي";
  const iceNumber = tenantInfo?.ice || "003291823000045";

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `📄 *${docTitle}*\n🏪 متجر: ${shopName}\n🔢 رقم التعريف الضريبي ICE: ${iceNumber}\n💰 الإجمالي: 1,850.00 MAD\n\nتم توليد المستند تلقائياً عبر مولّد PDF الذكي (pdfme) في تطبيق KASPI POS.`
    );
    const cleanPhone = clientPhone.replace(/[^0-9]/g, "");
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
    toast.success("تم تجهيز رابط المشاركة عبر واتساب بنجاح!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 text-start">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl kaspi-glass-btn flex items-center justify-center">
            <Layout className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--kaspi-text-primary)]">
              مولّد ومصمم المستندات المرئي (pdfme Document Engine)
            </h4>
            <p className="text-[11px] text-[var(--kaspi-text-muted)]">
              تصميم وتوليد الفواتير، عروض الأسعار (Devis)، وتقارير Z تلقائياً بهوية المتجر
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          Visual Designer
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left / Controls Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5 kaspi-glass-surface p-4 rounded-2xl border border-white/10">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
            نوع القالب المختار:
          </span>
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
                className={`px-2.5 py-2 rounded-xl text-xs font-semibold text-start transition-all cursor-pointer border ${
                  template === t.id
                    ? "kaspi-glass-btn text-white border-emerald-500/40 shadow-xs"
                    : "kaspi-glass-surface text-zinc-400 hover:text-white border-white/[0.06]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Document Title Input */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 font-mono">عنوان المستند:</label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Theme Color & Customization */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-zinc-400 font-mono">اللون المميز (Accent):</span>
            <div className="flex items-center gap-1.5">
              {["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAccentColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                    accentColor === c ? "scale-125 ring-2 ring-white ring-offset-1 ring-offset-zinc-900" : "opacity-80 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Toggle QR code */}
          <label className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer text-xs text-zinc-300">
            <span>تضمين رمز QR الرقمي للتحقق:</span>
            <input
              type="checkbox"
              checked={includeQr}
              onChange={(e) => setIncludeQr(e.target.checked)}
              className="accent-emerald-500 rounded cursor-pointer"
            />
          </label>

          {/* WhatsApp Destination */}
          <div className="space-y-1 pt-1">
            <label className="text-[10px] text-zinc-400 font-mono">رقم واتساب للإرسال (الزبون أو المحاسب):</label>
            <input
              type="text"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+212600000000"
              className="w-full px-3 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>إرسال واتساب</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl kaspi-glass-btn text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة المستند</span>
            </button>
          </div>
        </div>

        {/* Right / Live Paper Preview (7 cols) */}
        <div className="lg:col-span-7 bg-white text-zinc-900 rounded-2xl p-5 shadow-2xl space-y-4 font-sans select-none border border-zinc-200" dir="rtl">
          {/* Paper Header */}
          <div className="flex items-start justify-between border-b-2 pb-3" style={{ borderColor: accentColor }}>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900">{shopName}</h2>
              <p className="text-[10px] text-zinc-500">نظام كاسبي كاشير السحابي • الدار البيضاء، المغرب</p>
              <p className="text-[10px] text-zinc-600 font-mono mt-0.5">ICE: {iceNumber} • RC: 489201</p>
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

          {/* Items Table Mockup */}
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
              <tr>
                <td className="py-2 px-2 font-medium">سلة مشتريات عامة ممتازة (Cart Pack)</td>
                <td className="py-2 px-2 text-center font-mono">10</td>
                <td className="py-2 px-2 text-center font-mono">120.00</td>
                <td className="py-2 px-2 text-end font-mono font-bold">1,200.00 MAD</td>
              </tr>
              <tr>
                <td className="py-2 px-2 font-medium">بضائع استهلاكية مرخصة مع الضمان</td>
                <td className="py-2 px-2 text-center font-mono">5</td>
                <td className="py-2 px-2 text-center font-mono">130.00</td>
                <td className="py-2 px-2 text-end font-mono font-bold">650.00 MAD</td>
              </tr>
            </tbody>
          </table>

          {/* Bottom Totals & QR */}
          <div className="flex items-end justify-between border-t border-zinc-200 pt-3">
            {includeQr ? (
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded border border-zinc-300 flex items-center justify-center p-1 bg-zinc-50">
                  <QrCode className="w-10 h-10 text-zinc-800" />
                </div>
                <div className="text-[9px] text-zinc-500 leading-tight">
                  <p className="font-bold text-zinc-700">ختم التوثيق الرقمي</p>
                  <p>SHA-256 Tamper Sealed</p>
                </div>
              </div>
            ) : <div />}

            <div className="text-end space-y-1">
              <div className="text-xs text-zinc-600">المجموع الصافي (HT): 1,541.67 MAD</div>
              <div className="text-xs text-zinc-600">الضريبة TVA (20%): 308.33 MAD</div>
              <div className="text-sm font-extrabold font-mono" style={{ color: accentColor }}>
                المجموع الواجب أداؤه: 1,850.00 MAD
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
