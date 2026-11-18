"use client";

import React, { useState } from "react";
import { CheckSquare, Plus, Trash2, Send, Share2, Sparkles, Sliders, Webhook, Check } from "lucide-react";
import { toast } from "sonner";

interface FormField {
  id: string;
  type: "text" | "number" | "select" | "file";
  label: string;
  required: boolean;
  options?: string[];
}

export const KaspiOpnFormBuilder: React.FC<{ locale?: string }> = ({ locale = "ar" }) => {
  const [formTitle, setFormTitle] = useState("استمارة طلب طلبيات الجملة والمناسبات الخاصة");
  const [webhookUrl, setWebhookUrl] = useState("https://api.kaspipos.com/webhooks/orders");
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);

  const [fields, setFields] = useState<FormField[]>([
    { id: "f1", type: "text", label: "الاسم الكامل للزبون أو الشركة", required: true },
    { id: "f2", type: "text", label: "رقم هاتف الواتساب للتواصل", required: true },
    {
      id: "f3",
      type: "select",
      label: "نوع المناسبة أو الطلبية",
      required: true,
      options: ["طلبية تموين أسبوعي", "حفل أو عقيقة", "توريد مطاعم ومقاهي", "أخرى"],
    },
    { id: "f4", type: "number", label: "الميزانية التقديرية بالدرهم (MAD)", required: false },
    { id: "f5", type: "file", label: "إرفاق صورة أو لائحة السلع المطلوبة", required: false },
  ]);

  const addField = () => {
    const newField: FormField = {
      id: `f-${Date.now()}`,
      type: "text",
      label: "سؤال أو خانة جديدة...",
      required: false,
    };
    setFields([...fields, newField]);
    toast.success("تمت إضافة خانة جديدة للنموذج");
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(`https://forms.kaspipos.com/f/${Date.now().toString(36)}`);
    toast.success("تم نسخ رابط النموذج التفاعلي (OpnForm) بنجاح!");
  };

  return (
    <div className="space-y-4 text-start">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl kaspi-glass-btn flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--kaspi-text-primary)]">
              أداة النماذج والاستبيانات التفاعلية (OpnForm Engine)
            </h4>
            <p className="text-[11px] text-[var(--kaspi-text-muted)]">
              نماذج ذكية مع أسئلة شرطية، رفع ملفات، وأتمتة الإشعارات الفورية عبر واتساب وويب هوك
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyLink}
          className="px-3.5 py-1.5 rounded-xl kaspi-glass-btn text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>مشاركة رابط النموذج</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Editor Controls (6 cols) */}
        <div className="lg:col-span-6 space-y-3.5 kaspi-glass-surface p-4 rounded-2xl border border-white/10">
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 font-mono">عنوان النموذج:</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                حقول النموذج ({fields.length}):
              </span>
              <button
                type="button"
                onClick={addField}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>إضافة خانة</span>
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto kaspi-no-scrollbar">
              {fields.map((f, i) => (
                <div
                  key={f.id}
                  className="p-2.5 rounded-xl kaspi-glass-surface border border-white/10 flex items-center justify-between gap-2 text-xs"
                >
                  <span className="text-zinc-500 font-mono text-[10px]">{i + 1}.</span>
                  <input
                    type="text"
                    value={f.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFields((prev) =>
                        prev.map((item) => (item.id === f.id ? { ...item, label: val } : item))
                      );
                    }}
                    className="flex-1 min-w-0 bg-transparent text-white focus:outline-none border-b border-transparent focus:border-emerald-500/40 text-xs"
                  />
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 uppercase">
                    {f.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeField(f.id)}
                    className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Webhook & Automation */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
              أتمتة الإشعارات (Webhooks & WhatsApp):
            </span>
            <label className="flex items-center justify-between text-xs text-zinc-300 p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span>إرسال إشعار فوري لواتساب صاحب المتجر عند كل إرسال:</span>
              <input
                type="checkbox"
                checked={notifyWhatsApp}
                onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                className="accent-emerald-500 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Live Form Preview (6 cols) */}
        <div className="lg:col-span-6 kaspi-frosted-card rounded-2xl p-5 border border-white/15 space-y-4">
          <div className="border-b border-white/10 pb-2">
            <h3 className="text-sm font-bold text-white">{formTitle}</h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              نموذج رسمي مؤمن ومربوط مع قاعدة كاسبي كلاود
            </p>
          </div>

          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.id} className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-300 block">
                  {f.label} {f.required && <span className="text-emerald-400">*</span>}
                </label>
                {f.type === "select" ? (
                  <select className="w-full px-3 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-zinc-300 focus:outline-none">
                    {f.options?.map((opt, idx) => (
                      <option key={idx} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : f.type === "file" ? (
                  <div className="border border-dashed border-white/20 rounded-xl p-3 text-center text-xs text-zinc-400 bg-white/[0.01]">
                    انقر أو اسحب لإرفاق الملف أو الصورة
                  </div>
                ) : (
                  <input
                    type={f.type === "number" ? "number" : "text"}
                    placeholder="..."
                    className="w-full px-3 py-1.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => toast.success("تم إرسال النموذج بنجاح كمحاكاة تجريبية!")}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer active:scale-95 mt-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>إرسال الطلب الآن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
