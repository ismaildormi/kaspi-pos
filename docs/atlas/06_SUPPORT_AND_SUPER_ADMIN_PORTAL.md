# أطلس الواجهات والتحكم والتيبوغرافيا — المجلد السادس
## 06. الدعم الفني، تشخيص الذكاء الاصطناعي وبوابة الإدارة العامة (Support & Super Admin Portal)

> **المسار المصدري المشمول:** `src/app/[locale]/dashboard/support/page.tsx` • `src/app/admin/page.tsx` • `src/app/admin/messages/page.tsx` • `src/app/admin/TenantsTable.tsx` • `src/app/admin/MasterAiBanner.tsx` • `src/components/ui/KineticEmptyState.tsx`

---

## 1. شاشة الدعم الفني للكاشير والتاجر (`/dashboard/support/page.tsx`)

### جدول 1.1: نموذج إرسال التذكرة وحالة الفراغ المركزية (`support/page.tsx`)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `sup_input_subject` | Input (Text) | `support/page.tsx` [80–90] | موضوع طلب المساعدة • Sujet de la Demande | `font-sans font-bold text-xs text-white` | `w-full h-11 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.65)]` | إلزامي، يربط بـ `ticketSubject` |
| `sup_select_category` | Select | `support/page.tsx` [95–110] | نوع المشكلة (طابعة، ميزان، شبكة، كاشير، فوترة) | `font-sans text-xs text-white` | `w-full h-11 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40 cursor-pointer` | يصنف التذكرة لتوجيهها لفريق الدعم المختص |
| `sup_pill_priority_urgent` | Pill (Button) | `support/page.tsx` [115–125] | أولوية عاجلة جداً (عطل في نقطة البيع) | `font-mono font-bold text-[11px] text-red-400` | شارة مستطيلة `px-3 py-1 rounded-lg border border-red-500/20 bg-red-500/[0.05] cursor-pointer` | يرفع أولوية التذكرة لتنبيه الإدارة فورياً |
| `sup_textarea_message` | Textarea | `support/page.tsx` [130–145] | اشرح المشكلة الفنية بالتفصيل • Description | `font-sans text-xs text-white leading-relaxed` | `w-full h-32 p-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | تفاصيل العطل الفني المشاهد من الكاشير |
| `sup_btn_submit_ticket` | Button (Submit) | `support/page.tsx` [155–170] | إرسال التذكرة للدعم الفني • Envoyer Ticket | `font-bold text-xs text-zinc-950 font-sans` | `sheen-btn w-full h-11 bg-white hover:bg-zinc-200 rounded-xl active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-2` | يحفظ في `/api/v1/support` ويرسل إيميل تنبيه فوري للمالك |
| `sup_empty_shield_center` | Centered Container | `support/page.tsx` [212–224] | تذاكري السابقة — لا توجد تذاكر مفتوحة | `font-bold text-sm text-white` + `text-xs text-zinc-400` | توسيط تام `py-16 flex flex-col items-center justify-center text-center w-full mx-auto my-auto min-h-[340px]` | درع كسب الأمني المتحرك بحركات نبضية ناعمة |
| `sup_ticket_row_status` | Status Badge | `support/page.tsx` [239–255] | مبعوث • تم الاطلاع • تم الحل والرد | `font-mono font-bold text-[10px] uppercase` | شارة ملونة حسب الحالة (`bg-white text-black` للردود الجديدة) | يوضح للكاشير حالة متابعة التذكرة من قبل الإدارة |
| `sup_admin_reply_box` | Response Box | `support/page.tsx` [260–275] | الرد الرسمي للإدارة والحل المقترح | `font-sans text-xs text-zinc-200 leading-relaxed` | حاوية مونوكرومية محاطة بحدود `p-4 rounded-xl bg-zinc-950 border border-white/20 mt-2` | يعرض الحل الهندسي المعتمد من قبل الإدارة |

---

## 2. بوابة الإدارة العامة للمنصة (`/admin/page.tsx` & Components)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `admin_header_title` | Heading | `admin/page.tsx` [40–45] | منصة كسب الإدارية • Super Admin Console | `font-black text-xl text-white tracking-tight` | شريط علوي رمادي داكن `bg-zinc-900 border border-zinc-800 p-6 rounded-3xl` | لوحة القيادة العليا لمراقبة كافة المتاجر والمشتركين |
| `admin_banner_ai_monitor` | AI Banner | `MasterAiBanner.tsx` [20–60] | المساعد الذكي لمراقبة المنصة وكشف الشذوذ المالي | `font-sans text-xs text-zinc-300` | حاوية ذكية `p-5 rounded-2xl bg-zinc-950/80 border border-white/10 shadow-lg relative overflow-hidden` | يحلل سلوك المعاملات وينبه لانقطاع أجهزة الكاشير أو تأخر الفواتير |
| `admin_kpi_total_tenants` | KPI Card | `admin/page.tsx` [70–85] | إجمالي المتاجر والشركات المسجلة (Tenants) | `font-black text-2xl text-titanium-gradient font-mono tracking-tight` | بطاقة مونوكرومية `rounded-3xl border border-white/10 surface-obsidian p-5 shadow-lg` | عدد المشتركين الكلي على قاعدة البيانات |
| `admin_kpi_active_subs` | KPI Card | `admin/page.tsx` [86–100] | الاشتراكات النشطة (200 MAD / +150 MAD) | `font-black text-2xl text-titanium-gradient font-mono tracking-tight` | بطاقة مونوكرومية `rounded-3xl border border-white/10 surface-obsidian p-5 shadow-lg` | عدد التراخيص السارية شهرياً وسنوياً |
| `admin_btn_broadcast_mail` | Button | `AdminBroadcastButton.tsx` [30–50] | إرسال بريد جماعي لكافة التجار (Broadcast) | `font-bold text-xs text-white` | `px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 cursor-pointer flex items-center gap-1.5` | يفتح نافذة صياغة بريد إلكتروني رسمي وإرساله للجميع |
| `admin_input_license_gen` | Input (Text) | `admin/page.tsx` [140–155] | كود الترخيص المولد بنقرة واحدة (KASPI-365D) | `font-mono font-bold text-xs text-emerald-400 uppercase tracking-wider` | `w-full h-11 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يولد مفتاح ترخيص فوري للتجار والمحلات |
| `admin_btn_gen_license_30d` | Button | `admin/page.tsx` [160–170] | توليد ترخيص 30 يوماً (KASPI-30D) | `font-mono font-bold text-xs text-zinc-300` | `px-3 py-1.5 rounded-lg border border-white/10 bg-zinc-900 hover:bg-white/[0.08] active:scale-90 cursor-pointer` | ينشئ ترخيصاً شهرياً بقيمة 200 د.م في جدول التراخيص |
| `admin_btn_gen_license_365d`| Button | `admin/page.tsx` [171–180] | توليد ترخيص سنوي (KASPI-365D) | `font-mono font-bold text-xs text-white` | `px-3 py-1.5 rounded-lg border border-white/20 bg-zinc-800 hover:bg-zinc-700 active:scale-90 cursor-pointer` | ينشئ ترخيصاً سنوياً كاملاً للمتجر |
| `admin_table_tenants_list` | Table Container | `TenantsTable.tsx` [40–120] | قائمة التجار ومحطات البيع المسجلة | `font-mono text-xs text-zinc-300` | جدول مونوكرومي عريض مع أزرار التبديل الفوري لسياق التاجر | يمكن المشرف من الدخول لحساب أي متجر لتقديم الدعم |

---

## 3. صندوق رسائل التجار وتشخيص الذكاء الاصطناعي (`/admin/messages/page.tsx`)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `msg_tab_filter_all` | Tab Button | `admin/messages/page.tsx` [170–176] | كافة الرسائل الواردة • Tous les Tickets | `font-bold text-xs text-white` | النشط: `bg-white text-black px-4 py-2 rounded-xl font-bold` | يعرض جميع التذاكر من كافة المتاجر |
| `msg_tab_filter_unread` | Tab Button | `admin/messages/page.tsx` [177–183] | التذاكر غير المقروءة • Non Lus | `font-bold text-xs text-zinc-300` | الخامل: `border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white px-4 py-2 rounded-xl cursor-pointer` | يصفي التذاكر الجديدة التي تحتاج رداً |
| `msg_card_ticket_item` | Ticket Card | `admin/messages/page.tsx` [215–265] | بطاقة التذكرة في القائمة اليسرى | `font-semibold text-xs text-zinc-200` + `text-[11px] text-zinc-400` | بطاقة تفاعلية `p-4 border-b border-zinc-800/70 hover:bg-zinc-950/50 cursor-pointer transition` | ينقر لعرض تفاصيل المشكلة في اللوحة اليمنى |
| `msg_btn_whatsapp_direct` | Button (Link) | `admin/messages/page.tsx` [250–262] | تواصل مباشر عبر واتساب ↗ • Contact WhatsApp | `font-bold text-[10px] text-white` | `inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1 hover:bg-white hover:text-black transition` | يفتح شات واتساب مباشر مع التاجر لمعالجة العطل الميداني |
| `msg_btn_mark_read` | Button | `admin/messages/page.tsx` [305–314] | تمييز كمقروء • Marquer Lu | `font-semibold text-xs text-zinc-300` | `inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 hover:bg-zinc-800 active:scale-95 cursor-pointer` | يغير حالة التذكرة إلى `read` |
| `msg_btn_mark_resolved` | Button | `admin/messages/page.tsx` [315–323] | تمييز كمحلول • Marquer Résolu | `font-bold text-xs text-black` | `inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 hover:bg-zinc-200 active:scale-95 cursor-pointer shadow-xs` | يغير حالة التذكرة إلى `resolved` |
| `msg_body_quote_container` | Text Container | `admin/messages/page.tsx` [325–329] | نص شكوى التاجر الأصلية | `font-sans text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap` | حاوية معتمة `rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-inner` | يعرض نص المشكلة المسجل من شاشة الكاشير |
| `msg_btn_ai_diagnose` | Button | `admin/messages/page.tsx` [430–450] | تشخيص المشكلة واقتراح الحل بالذكاء الاصطناعي (AI Diagnose) | `font-bold text-xs text-white flex items-center gap-1.5` | `px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 active:scale-95 cursor-pointer transition shadow-xs` | يستدعي الذكاء الاصطناعي لتحليل المشكلة وصياغة الرد الفني المناسب |
| `msg_textarea_admin_reply` | Textarea | `admin/messages/page.tsx` [455–465] | صياغة الرد الرسمي الذي يظهر في شاشة التاجر | `font-sans text-xs text-white leading-relaxed` | `w-full rounded-2xl border border-zinc-800 bg-[#0B0B0E] p-3.5 focus:border-white focus:outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.65)]` | يتم ملؤه بنقرة واحدة من تشخيص الـ AI أو التعديل اليدوي |
| `msg_btn_send_reply_resolve`| Button (Submit) | `admin/messages/page.tsx` [470–485] | إرسال الرد وحل التذكرة • Envoyer Réponse & Résoudre | `font-bold text-xs text-black font-sans` | `sheen-btn inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 hover:bg-zinc-200 active:scale-95 cursor-pointer shadow-md` | يحفظ الرد في قاعدة البيانات ويغلق التذكرة بنجاح |
