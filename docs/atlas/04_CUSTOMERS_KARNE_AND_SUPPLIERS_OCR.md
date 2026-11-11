# أطلس الواجهات والتحكم والتيبوغرافيا — المجلد الرابع
## 04. العملاء، كناش الكريدي، والموردين بمسح الفواتير الذكي (Customers, Karné & Suppliers OCR)

> **المسار المصدري المشمول:** `src/app/[locale]/dashboard/customers/page.tsx` • `src/app/[locale]/dashboard/suppliers/page.tsx` • `src/components/ui/KineticEmptyState.tsx`

---

## 1. شاشة العملاء وبطاقة الأوبسيديان VIP وكناش الكريدي (`/dashboard/customers`)

### جدول 1.1: الفلاتر، جدول العملاء وحالة الفراغ البيضاء الناصعة (`customers/page.tsx`)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `cust_btn_add_new` | Button | `customers/page.tsx` [110–125] | + إضافة عميل جديد • + Nouveau Client | `font-bold text-xs text-zinc-950 font-sans` | `sheen-btn px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 active:scale-95 cursor-pointer shadow-md flex items-center gap-2` | يفتح نافذة تسجيل عميل جديد في قاعدة البيانات |
| `cust_input_search_filter` | Input (Search) | `customers/page.tsx` [130–145] | ابحث بالاسم، الهاتف أو رقم الـ ICE... | `font-mono text-xs text-white placeholder-zinc-500` | `w-full sm:w-80 h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.65)]` | فلترة لحظية لجدول العملاء من الذاكرة المحلية |
| `cust_kpi_total_debt_mad` | KPI Card | `customers/page.tsx` [150–165] | إجمالي ديون كناش الكريدي (MAD) | `font-black text-2xl text-titanium-gradient font-mono tracking-tight` | بطاقة مونوكرومية `rounded-3xl border border-white/10 surface-obsidian p-5 shadow-lg` | يحسب مجموع أرصدة الكريدي غير المستردة لكافة الزبائن |
| `cust_col_name` | Table Header | `customers/page.tsx` [240–245] | اسم العميل • Client • Customer Name | `font-mono text-xs uppercase text-zinc-400` | عمود اسم الزبون | يفرز العملاء أبجدياً |
| `cust_col_phone` | Table Header | `customers/page.tsx` [246–250] | رقم الهاتف • Téléphone • Phone | `font-mono text-xs uppercase text-zinc-400` | عمود الاتصال | يعرض رقم الهاتف مع زر الاتصال والواتساب السريع |
| `cust_col_ice` | Table Header | `customers/page.tsx` [251–255] | الرقم الموحد ICE (15 رقماً) | `font-mono text-xs uppercase text-zinc-400` | عمود الشركات والمهنيين | يعرض رقم التعريف الموحد لفواتير الشركات DGI |
| `cust_col_balance_mad` | Table Header | `customers/page.tsx` [256–260] | رصيد الكريدي المستحق (MAD) | `font-mono font-bold text-xs uppercase text-zinc-400 text-end` | عمود الحساب المالي | يعرض الرصيد باللون الأحمر عند تجاوز سقف الائتمان |
| `cust_empty_white_canvas` | Empty Container | `KineticEmptyState.tsx` [450–475] | لا يوجد أي عميل مسجل حالياً • Aucun Client | `font-black text-lg text-zinc-950 font-sans` + `text-xs text-zinc-600` | حاوية بيضاء ناصعة `bg-white text-zinc-950 border border-zinc-200 shadow-2xl rounded-3xl p-8 flex flex-col items-center justify-center text-center` | تكسر السواد بتباين فائق لعرض بطاقة الـ VIP |
| `cust_empty_3d_vip_card` | 3D Kinetic Art | `KineticEmptyState.tsx` [480–510] | بطاقة VIP أوبسيديان معدنية تفاعلية 3D | أرقام نقش مونوكرومية `font-mono text-xs tracking-widest text-zinc-300` | بطاقة معدنية عائمة `w-64 h-36 rounded-2xl bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-800 border border-zinc-700/80 shadow-2xl animate-float mb-4` | تصميم ثلاثي الأبعاد يعكس هوية بطاقات الولاء المعتمدة |

---

### جدول 1.2: نوافذ إضافة العميل وسداد ديون الكريدي (Customer Add & Debt Settle Modals)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `modal_cust_input_name` | Input (Text) | `customers/page.tsx` [380–390] | اسم العميل الكامل • Nom du Client | `font-sans font-bold text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.65)]` | إلزامي، يربط بـ `customerForm.name` |
| `modal_cust_input_phone` | Input (Tel) | `customers/page.tsx` [395–405] | رقم الهاتف المحمول (واتساب) • Téléphone | `font-mono text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بـ `customerForm.phone` |
| `modal_cust_input_ice` | Input (Text) | `customers/page.tsx` [410–420] | الرقم الموحد للمقاولة ICE (15 رقماً) | `font-mono text-xs text-white uppercase` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بـ `customerForm.ice` للفواتير المهنية |
| `modal_cust_input_credit_limit`| Input (Number) | `customers/page.tsx` [425–435] | سقف الكريدي المسموح به (MAD) • Plafond | `font-mono font-bold text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | الحد الأقصى للدين المسموح به لهذا العميل |
| `modal_cust_btn_submit` | Button (Submit) | `customers/page.tsx` [450–465] | حفظ وتأكيد بيانات العميل • Enregistrer | `font-bold text-xs text-zinc-950 font-sans` | `sheen-btn px-6 py-2.5 bg-white hover:bg-zinc-200 rounded-xl active:scale-95 cursor-pointer shadow-lg flex items-center gap-2` | يرسل البيانات لـ `/api/v1/customers` ويحدث الجدول فوراً |
| `modal_settle_input_amount` | Input (Money) | `customers/page.tsx` [510–525] | المبلغ المسدد من الدين (MAD) • Montant Réglé | `font-mono font-black text-sm text-white` | `w-full h-11 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يسجل دفعة سداد نقدية أو بنكية لإنقاص رصيد الدين |
| `modal_settle_btn_confirm` | Button (Submit) | `customers/page.tsx` [550–565] | تأكيد استلام الدفعة وإصدار الوصل • Valider | `font-bold text-xs text-zinc-950 font-sans` | `sheen-btn w-full h-11 bg-white hover:bg-zinc-200 rounded-xl active:scale-95 cursor-pointer shadow-md` | يخصم المبلغ من دفتر الكريدي وينشئ إيصال قبض رسمي |

---

## 2. الموردين ومواعيد الكمبيالات ومسح الفواتير الذكي OCR (`/dashboard/suppliers`)

### جدول 2.1: لافتة استحقاق الكمبيالات وجدول الموردين (`suppliers/page.tsx`)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `supp_btn_add_supplier` | Button | `suppliers/page.tsx` [115–125] | + إضافة مورد جديد • + Nouveau Fournisseur | `font-bold text-xs text-zinc-950 font-sans` | `sheen-btn px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 active:scale-95 cursor-pointer shadow-md flex items-center gap-2` | يفتح نافذة إدخال بيانات شركة التوريد |
| `supp_btn_ocr_scanner` | Button | `suppliers/page.tsx` [126–140] | مسح الفاتورة الذكي (OCR Vision) | `font-bold text-xs text-white` | `px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/20 hover:bg-white/[0.1] active:scale-95 cursor-pointer flex items-center gap-2 shadow-sm` | يفتح ماسح الفواتير بالذكاء الاصطناعي لتفريغ البيانات آلياً |
| `supp_banner_check_maturity` | Alert Banner | `suppliers/page.tsx` [145–185] | تنبيه استحقاق الكمبيالات والشيكات (7 أيام قادمة) | `font-mono font-bold text-xs text-amber-300` | لافتة تحذيرية عريضة `p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-md flex items-center justify-between` | تحسب الشيكات والكمبيالات المستحقة وتمنع رجوع الشيكات بدون رصيد |
| `supp_col_company_name` | Table Header | `suppliers/page.tsx` [250–255] | اسم المورد / الشركة • Fournisseur | `font-mono text-xs uppercase text-zinc-400` | عمود اسم المورد الرئيسي | يفرز شركات التوريد أبجدياً |
| `supp_col_contact_person` | Table Header | `suppliers/page.tsx` [256–260] | الممثل التجاري • Contact | `font-mono text-xs uppercase text-zinc-400` | عمود اسم المندوب | يعرض اسم المندوب وهاتفه للاتصال الفوري |
| `supp_col_total_debt_mad` | Table Header | `suppliers/page.tsx` [261–265] | إجمالي المستحقات والديون (MAD) | `font-mono font-bold text-xs uppercase text-zinc-400 text-end` | عمود الديون المستحقة | يعرض مجموع الفواتير غير المسددة لهذا المورد |
| `supp_col_next_due_date` | Table Header | `suppliers/page.tsx` [266–270] | أقرب تاريخ استحقاق • Échéance | `font-mono text-xs uppercase text-zinc-400 text-center` | عمود موعد الدفع | يعرض تاريخ استحقاق الكمبيالة أو الشيك القادم |
| `supp_empty_laser_scan` | Empty Container | `KineticEmptyState.tsx` [380–440] | لا توجد ديون أو فواتير موردين مسجلة | `font-bold text-sm text-white font-sans` + `text-xs text-zinc-400` | درع كسب مونوكرومي عائم مع شعاع ليزري متحرك `animate-laser` ومؤشر مسح ضوئي | حالة الفراغ المعتمدة لصفحة الموردين |

---

### جدول 2.2: نافذة تفريغ الفواتير بالذكاء الاصطناعي (AI Invoice OCR Scanner Modal)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ocr_dropzone_invoice_img` | Dropzone Box | `suppliers/page.tsx` [450–475] | اسحب صورة فاتورة المورد أو انقر لرفعها (JPEG / PNG / PDF) | `font-semibold text-xs text-zinc-300` | `w-full h-36 rounded-2xl border border-dashed border-white/20 hover:border-white/40 bg-zinc-900/60 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden` | يرفع المستند ويرسله لمحرك الرؤية الحاسوبية `/api/v1/suppliers/ocr` |
| `ocr_progress_scan_laser` | Scanning Bar | `suppliers/page.tsx` [476–485] | جاري قراءة الأرقام الضريبية والمبالغ بالذكاء الاصطناعي... | `font-mono text-[11px] text-emerald-400` | خط ليزر متحرك `w-full h-0.5 bg-emerald-400 shadow-[0_0_15px_#34d399] animate-laser` | يوضح للمستخدم جاري التعرف البصري على الفاتورة |
| `ocr_input_extracted_ref` | Input (Text) | `suppliers/page.tsx` [495–505] | رقم الفاتورة المستخرج • N° Facture | `font-mono font-bold text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | مستخرج آلياً من الفاتورة وقابل للتعديل اليدوي |
| `ocr_input_extracted_supplier`| Input (Text) | `suppliers/page.tsx` [510–520] | اسم المورد المطابق • Fournisseur Détecté | `font-sans font-bold text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يطابق اسم الشركة المكتشف مع قائمة الموردين المسجلين |
| `ocr_input_extracted_total_ht`| Input (Money) | `suppliers/page.tsx` [525–535] | المجموع بدون ضريبة (Montant HT) | `font-mono text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | المجموع الصافي المعفي من الضريبة |
| `ocr_input_extracted_tva` | Input (Money) | `suppliers/page.tsx` [540–550] | مبلغ الضريبة على القيمة المضافة (TVA) | `font-mono text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | قيمة الضريبة المسترجعة قانونياً |
| `ocr_input_extracted_total_ttc`| Input (Money) | `suppliers/page.tsx` [555–565] | المجموع الإجمالي شامل الضريبة (TTC MAD) | `font-mono font-black text-xs text-titanium-gradient` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | المبلغ النهائي الواجب سداده للمورد |
| `ocr_btn_confirm_import` | Button (Submit) | `suppliers/page.tsx` [580–595] | تأكيد وإدراج الفاتورة في سجل الموردين | `font-bold text-xs text-zinc-950 font-sans` | `sheen-btn px-6 py-2.5 bg-white hover:bg-zinc-200 rounded-xl active:scale-95 cursor-pointer shadow-lg flex items-center gap-2` | يسجل الفاتورة في `PurchaseOrder` ويحدث رصيد ديون المورد |
