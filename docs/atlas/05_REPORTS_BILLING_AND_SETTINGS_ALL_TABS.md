# أطلس الواجهات والتحكم والتيبوغرافيا — المجلد الخامس
## 05. التقارير التنفيذية، الاشتراكات وكافة تبويبات الإعدادات (Reports, Billing & Settings All Tabs)

> **المسار المصدري المشمول:** `src/app/[locale]/dashboard/reports/page.tsx` • `src/components/reports/ExecutiveReportSheet.tsx` • `src/app/[locale]/dashboard/billing/page.tsx` • `src/app/[locale]/dashboard/settings/page.tsx`

---

## 1. التقرير التنفيذي للـ 24 ساعة والختم القرمزي (`ExecutiveReportSheet.tsx`)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `exec_wa_official_svg` | SVG Logo | `ExecutiveReportSheet.tsx` [210–216] | أيقونة واتساب المتجهية الرسمية | غير نصي | `w-5 h-5 fill-current text-emerald-400` داخل حاوية `w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center` | تؤكد اختصاص الواتساب حصرياً بتقرير المالك الليلي |
| `exec_input_owner_phone` | Input (Tel) | `ExecutiveReportSheet.tsx` [255–264] | رقم واتساب المالك الشخصي • N° WhatsApp | `font-mono font-bold text-xs sm:text-sm text-white` | `w-full h-11 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.65)]` | الرقم الوحيد الذي يتلقى التقرير الليلي عند 21:00/22:00 |
| `exec_badge_masked_staff` | Badge | `ExecutiveReportSheet.tsx` [250–254] | مشفر عن الموظفين ✓ • Masqué aux employés | `font-mono text-[10px] text-zinc-500` | شارة مونوكرومية دقيقة بجوار حقل الهاتف | يؤكد للمالك أن رقمه محجوب تماماً عن الكاشيرات |
| `exec_btn_emerald_save` | Button (Submit) | `ExecutiveReportSheet.tsx` [265–273] | حفظ وتفعيل الإرسال التلقائي • Enregistrer & Activer | `font-bold text-xs text-zinc-950 font-sans` | `bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] h-11 px-6 rounded-xl active:scale-95 cursor-pointer flex items-center gap-2` | يحفظ الهاتف وتفضيل الإرسال في `/api/v1/settings` |
| `exec_crimson_stamp_box` | Seal (Button) | `ExecutiveReportSheet.tsx` [290–312] | الختم الرسمي للمملكة المغربية — كسب POS | `font-mono font-black text-[9px] uppercase tracking-widest text-red-600/70` | ختم دائري قرمزي `border-4 border-red-600/40 text-red-600/40 bg-red-500/[0.03] rotate-12 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95` | شفاف بالكامل ولا يحجب القراءة، وينقر لإخفائه مؤقتاً |
| `exec_btn_restore_stamp` | Button | `ExecutiveReportSheet.tsx` [495–503] | إظهار الختم الرسمي • Afficher le cachet | `font-mono text-[10px] text-zinc-400 hover:text-white underline cursor-pointer` | زر استعادة مضمن في تذييل التقرير | يظهر فقط بعد إخفاء الختم لإعادة إظهاره عند الطباعة |
| `exec_table_daily_sales` | Table Box | `ExecutiveReportSheet.tsx` [390–435] | جدول مبيعات اليوم الإجمالية (نقداً، بطاقة، كريدي) | `font-mono text-xs text-white` | جدول مونوكرومي عالي الدقة `w-full text-start border-t border-zinc-800` | يعرض مطابقة الصندوق المالية قبل الإغلاق الليلي |

---

## 2. لوحة الاشتراكات والفواتير وتوسعة الفروع (`/dashboard/billing`)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `billing_hero_plan_badge` | Badge | `billing/page.tsx` [54–58] | خطة كسب المتدرجة — 200 درهم شهرياً | `font-mono font-bold text-xs text-white` | شارة مونوكرومية عريضة `bg-white/10 border border-white/20 px-3 py-1 rounded-full` | عنوان باقة الاشتراك المعتمدة |
| `billing_card_base_plan` | Card Container | `billing/page.tsx` [400–430] | بطاقة الخطة الأساسية (200 MAD / شهر) | `font-black text-2xl text-titanium-gradient font-mono tracking-tight` | بطاقة ChatGPT مونوكرومية عريضة `p-6 rounded-3xl bg-zinc-900 border border-white/10 surface-obsidian` | تشمل خادماً سحابياً ومتجراً رئيسياً ونقطة كاشير واحدة |
| `billing_pill_addon_branch` | Addon Pill | `billing/page.tsx` [470–500] | +150 درهم / شهر لكل نقطة بيع أو فرع إضافي | `font-mono font-bold text-xs text-white` | شارة منبثقة مميزة مع زر الإضافة السريعة | يرفع رصيد الأجهزة المسموح بها للمتجر فورياً |
| `billing_btn_add_register` | Button | `billing/page.tsx` [510–525] | إضافة نقطة بيع جديدة (+150 درهم) | `font-bold text-xs text-zinc-950 font-sans` | `sheen-btn px-5 py-3 rounded-xl bg-white hover:bg-zinc-200 active:scale-95 cursor-pointer shadow-md flex items-center gap-2` | يفتح مسار الاشتراك الإضافي وترقية الحساب |
| `billing_box_bank_notice` | Info Card | `billing/page.tsx` [440–470] | التحويل البنكي وتأكيد الوصولات عبر Gmail | `font-sans text-xs text-zinc-300` | بطاقة معلوماتية سوداء بدون أي إشارة لواتساب مع إبراز بريد الجيميل الرسمي | تنبيه التاجر بإرسال وصل التحويل لجيميل لتفعيل الترخيص فورياً |
| `billing_input_license_key` | Input (Text) | `billing/page.tsx` [560–575] | رمز الترخيص السنوي أو الشهري (KASPI-XXX) | `font-mono font-bold text-xs text-white uppercase` | `w-full h-11 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بكود التفعيل المرسل للتاجر |
| `billing_btn_activate_key` | Button (Submit) | `billing/page.tsx` [580–595] | تفعيل الترخيص فورياً • Activer Licence | `font-bold text-xs text-zinc-950 font-sans` | `sheen-btn px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 active:scale-95 cursor-pointer shadow-md` | يرسل الكود لـ `/api/v1/billing/activate-license` ويرسل إيميل 3D |
| `billing_table_history` | Table Container | `billing/page.tsx` [620–675] | سجل المدفوعات والاشتراكات الحية | `font-mono text-xs text-zinc-300` | جدول مونوكرومي يعرض كافة المعاملات والمبالغ | يعرض كل الدفعات (200 MAD و 150 MAD) دون إخفاء أي عملية |

---

## 3. تبويبات الإعدادات العامة الخمسة ومودال الفرع الجديد (`/dashboard/settings`)

### جدول 3.1: تبويب الهوية القانونية والفروع ومودال +150 د.م (Tabs 1 & 2)

| معرّف العنصر (Element ID) | نوع العنصر | التبويب والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `set_tab_btn_general` | Tab Button | `settings/page.tsx` [820–830] | الهوية القانونية ومواصفات DGI • Identité | `font-bold text-xs` (النشط: `text-white`) | زر تبويب مونوكرومي `px-4 py-2 rounded-xl border border-white/10` | يعرض حقول الـ ICE، IF، السجل التجاري، والعنوان |
| `set_input_ice_15` | Input (Text) | `settings/page.tsx` [870–880] | الرقم الموحد للمقاولة ICE (15 رقماً إجبارياً) | `font-mono font-bold text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يطابق المعايير الضريبية المغربية DGI |
| `set_tab_btn_branches` | Tab Button | `settings/page.tsx` [831–840] | الفروع ونقاط البيع • Succursales | `font-bold text-xs` (النشط: `text-white`) | زر تبويب مونوكرومي | يعرض بطاقات المتاجر المفتوحة وزر الفرع الجديد |
| `set_btn_new_branch_trigger` | Button | `settings/page.tsx` [985–993] | + إضافة فرع جديد • + Nouvelle Succursale | `font-semibold text-xs text-white` | `h-8 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 active:scale-95 flex items-center gap-1.5 cursor-pointer` | يفتح نافذة اشتراك وإضافة الفرع الجديد المنبثقة |
| `modal_branch_badge_addon` | Addon Badge | `settings/page.tsx` [1015–1025] | +150 MAD / شهر (اشتراك الفرع الإضافي ومحطة الكاشير) | `font-mono font-bold text-xs text-emerald-400` | شارة زمردية `p-3.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 flex items-center justify-between` | تؤكد بوضوح تسعيرة التوسعة دون أي غموض مالي |
| `modal_branch_input_name` | Input (Text) | `settings/page.tsx` [1035–1045] | اسم الفرع (مثال: فرع المعاريف كازا) | `font-sans text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بـ `newStoreName` في طلب الإنشاء |
| `modal_branch_input_code` | Input (Text) | `settings/page.tsx` [1050–1060] | رمز الفرع المختصر (مثال: MAARIF-01) | `font-mono font-bold text-xs text-white uppercase` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بـ `newStoreCode` لمنع التكرار |
| `modal_branch_input_address` | Input (Text) | `settings/page.tsx` [1065–1075] | عنوان الفرع والمدينة • Adresse | `font-sans text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بـ `newStoreAddress` |
| `modal_branch_btn_confirm` | Button (Submit) | `settings/page.tsx` [1080–1095] | تأكيد إضافة الفرع والاشتراك (+150 د.م/شهر) | `font-bold text-xs text-zinc-950 font-sans` | `sheen-btn px-5 py-2.5 bg-white hover:bg-zinc-200 rounded-xl active:scale-95 cursor-pointer shadow-lg flex items-center gap-2` | ينشئ المتجر في `/api/v1/stores` ويسجل فوراً دفعة 150 درهم |

---

### جدول 3.2: تبويبات العتاد والخزنة المحجوبة والصلاحيات (Tabs 3, 4 & 5)

| معرّف العنصر (Element ID) | نوع العنصر | التبويب والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `set_tab_btn_hardware` | Tab Button | `settings/page.tsx` [841–850] | الطابعات الحرارية والعتاد • Matériel | `font-bold text-xs` (النشط: `text-white`) | زر تبويب مونوكرومي | يفتح إعدادات الشبكة ومنافذ ESC/POS |
| `set_input_printer_ip` | Input (Text) | `settings/page.tsx` [1110–1125] | عنوان IP للطابعة الحرارية (مثال: 192.168.1.50) | `font-mono text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | العنوان الشبكي المباشر على الشبكة المحلية |
| `set_select_paper_width` | Select | `settings/page.tsx` [1130–1145] | عرض ورق الإيصالات (80mm القياسي أو 58mm) | `font-mono text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40 cursor-pointer` | يضبط أبعاد الطباعة ونقاط الرسوم |
| `set_btn_test_print` | Button | `settings/page.tsx` [1150–1165] | طباعة تذكرة تجريبية (Test Print ESC/POS) | `font-bold text-xs text-white` | `px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 cursor-pointer flex items-center gap-1.5` | يرسل أمراً مباشراً عبر Socket Port 9100 أو Tauri Bridge |
| `set_tab_btn_vault_mask` | Tab Button | `settings/page.tsx` [851–860] | بوابات الدفع والخزنة • Passerelles & Vault | `font-bold text-xs` (النشط: `text-white`) | زر تبويب مونوكرومي مع أيقونة قفل | يعرض الحقول المحجوبة وزر فتح الخزنة |
| `set_vault_masked_rib_box` | Display Mask | `settings/page.tsx` [1185–1205] | الرقم البنكي المحجوب: `•••• •••• •••• 7014` | `font-mono font-bold text-xs text-zinc-400 tracking-widest` | حاوية محجوبة `p-3.5 rounded-xl bg-zinc-950 border border-white/5 flex items-center justify-between` | يمنع الموظفين من سرقة أو تعديل الحساب البنكي |
| `set_btn_unlock_vault_trigger`| Button | `settings/page.tsx` [1215–1225] | فتح خزنة المالك المحمية بكلمة المرور | `font-bold text-xs text-white` | `px-3.5 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 active:scale-95 cursor-pointer flex items-center gap-1.5` | يطلق حدث `open-owner-vault` لطلب كلمة مرور المالك |
| `set_tab_btn_rbac` | Tab Button | `settings/page.tsx` [861–870] | المستخدمون والصلاحيات • Utilisateurs & RBAC | `font-bold text-xs` (النشط: `text-white`) | زر تبويب مونوكرومي | يعرض قائمة الكاشيرات والمديرين |
| `set_toggle_audio_feedback` | Toggle Switch | `settings/page.tsx` [1570–1585] | المؤثرات الصوتية للكاشير (Beep المسح والدفع) | `font-semibold text-xs text-zinc-300` | مفتاح تبديل مونوكرومي ناعم | يتحكم في تشغيل أصوات الـ Web Audio API أثناء العمل |
| `set_btn_reset_demo_data` | Button | `settings/page.tsx` [1330–1350] | تصفير البيانات التجريبية وبدء متجر فارغ | `font-bold text-xs text-red-400` | `px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/[0.05] hover:bg-red-500/10 active:scale-95 cursor-pointer` | يمسح مبيعات الديمو عبر `/api/v1/settings/reset-demo` |
