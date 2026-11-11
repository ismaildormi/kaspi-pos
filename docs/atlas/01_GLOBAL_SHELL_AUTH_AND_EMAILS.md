# أطلس الواجهات والتحكم والتيبوغرافيا — المجلد الأول
## 01. الهيكل العام، التوثيق، المصادقة وقوالب البريد الإلكتروني (Global Shell, Auth & HTML Emails)

> **المسار المصدري المشمول:** `src/app/[locale]/dashboard/layout.tsx` • `src/components/layout/Sidebar.tsx` • `LanguageSwitcher.tsx` • `AIChatWidget.tsx` • `OwnerProfileModal.tsx` • `(auth)/login` • `(auth)/register` • `(auth)/verify-code` • `launch-desktop` • `download` • `src/lib/email/*`

---

## 1. شريط التنقل العلوي المكتبي والمحمول (Top Navbar — `src/app/[locale]/dashboard/layout.tsx`)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية اللغوية (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `topbar_mobile_toggle` | Button | `layout.tsx` [107–114] | فتح القائمة • Menu • Menu | أيقونة `Menu w-5 h-5 text-zinc-300` | `h-9 w-9 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 flex items-center justify-center md:hidden cursor-pointer` | يتحكم في حالة `mobileMenuOpen` لعرض الشريط الجانبي في الموبايل |
| `topbar_brand_logo_img` | Image | `layout.tsx` [118–124] | شعار كسب • Logo KASPI | غير نصي | `w-6 h-6 object-contain rounded-md shrink-0` | مسار الصورة الافتراضية `/logo.png` أو `storeLogoUrl` المحدث من الخزنة |
| `topbar_brand_title` | Text (Link) | `layout.tsx` [125–127] | كسب POS • KASPI POS • KASPI POS | `font-extrabold text-sm tracking-tight text-white shrink-0` | رابط مضمن `flex items-center gap-2 text-white hover:opacity-90` | ينقل للصفحة الرئيسية `/[locale]/dashboard` |
| `topbar_shop_name_pill` | Badge | `layout.tsx` [128–130] | اسم المحل التجاري (ديناميكي) | `text-[11px] font-mono text-zinc-400 truncate` | `hidden sm:inline-block px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/10 max-w-[160px]` | يعرض `shopName` المقروء من `/api/v1/settings` ويحدث فورياً عند تعديل الخزنة |
| `topbar_btn_pos_register` | Button (Link) | `layout.tsx` [136–143] | نقطة البيع • Caisse POS • POS Terminal | `font-bold text-xs text-zinc-950 font-sans` | `sheen-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 active:scale-[0.98] shadow-xs cursor-pointer` | يفتح شاشة الكاشير السريعة `/[locale]/pos` |
| `topbar_btn_download_app` | Button (Link) | `layout.tsx` [144–150] | تطبيق الويندوز • App Desktop • Desktop App | `font-medium text-xs text-zinc-300 hover:text-white` | `hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] active:scale-95` | يوجه التاجر لصفحة التثبيت والربط المكتبي `/[locale]/download` |
| `topbar_lang_selector_btn` | Button | `LanguageSwitcher.tsx` [25–40] | AR • FR • EN | `font-mono font-bold text-xs text-zinc-200` | `h-8 px-2.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.1] active:scale-95 flex items-center gap-1.5 cursor-pointer` | يبدل قائمة اللغات المدعومة ويحفظ الكوكي `NEXT_LOCALE` |
| `topbar_btn_settings_icon` | Button (Link) | `layout.tsx` [154–160] | الإعدادات • Paramètres • Settings | أيقونة `Settings w-3.5 h-3.5 text-zinc-300` | `w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center hover:rotate-90 transition-transform duration-500` | ينقل لصفحة الإعدادات العامة `/[locale]/dashboard/settings` |
| `topbar_btn_owner_profile` | Button | `layout.tsx` [162–172] | خزنة المالك • Profil Propriétaire • Owner Vault | `font-medium text-xs text-zinc-200 truncate max-w-[110px]` | `hidden md:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer` | يغير حالة `isOwnerModalOpen` إلى `true` لفتح نافذة المالك المحمية |

---

## 2. الشريط الجانبي المكتبي المتطور (`src/components/layout/Sidebar.tsx`)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية اللغوية (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `sidebar_sector_card` | Container (Button) | `Sidebar.tsx` [85–130] | قطاع النشاط الحالي • Secteur d'Activité | `font-bold text-xs text-white` + `font-mono text-[10px] text-zinc-400` | بطاقة 3D فاخرة `rounded-2xl p-3 bg-zinc-900/90 border border-white/10 shadow-lg surface-obsidian hover:border-white/25 transition-all cursor-pointer` | يعرض `storeType` من `usePosStore` ويفتح `IndustryWorkspaceModal` |
| `sidebar_sector_pulse_dot` | Status Dot | `Sidebar.tsx` [92–95] | مؤشر النشاط الفوري | غير نصي | `w-2 h-2 rounded-full bg-emerald-400 animate-pulse` | يشير لحالة المزامنة الحية مع السحابة |
| `sidebar_nav_dashboard` | Nav Link | `Sidebar.tsx` [140–146] | الرئيسية • Aperçu • Overview | `font-semibold text-xs` (النشط: `font-bold text-white`) | النشط: `bg-white/[0.08] text-white border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2.5` | يوجه إلى `/[locale]/dashboard` |
| `sidebar_nav_products` | Nav Link | `Sidebar.tsx` [147–153] | المنتجات • Produits • Products | `font-semibold text-xs` (النشط: `font-bold text-white`) | الخامل: `text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-xl px-3 py-2.5 flex items-center gap-2.5` | يوجه إلى `/[locale]/dashboard/products` |
| `sidebar_nav_inventory` | Nav Link | `Sidebar.tsx` [154–160] | المخزون • Stock • Inventory | `font-semibold text-xs` (النشط: `font-bold text-white`) | الخامل: `text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-xl px-3 py-2.5 flex items-center gap-2.5` | يوجه إلى `/[locale]/dashboard/inventory` |
| `sidebar_nav_customers` | Nav Link | `Sidebar.tsx` [161–167] | العملاء • Clients • Customers | `font-semibold text-xs` (النشط: `font-bold text-white`) | الخامل: `text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-xl px-3 py-2.5 flex items-center gap-2.5` | يوجه إلى `/[locale]/dashboard/customers` |
| `sidebar_nav_suppliers` | Nav Link | `Sidebar.tsx` [168–174] | الموردين • Fournisseurs • Suppliers | `font-semibold text-xs` (النشط: `font-bold text-white`) | الخامل: `text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-xl px-3 py-2.5 flex items-center gap-2.5` | يوجه إلى `/[locale]/dashboard/suppliers` |
| `sidebar_nav_reports` | Nav Link | `Sidebar.tsx` [175–181] | التقارير • Rapports Z • Reports | `font-semibold text-xs` (النشط: `font-bold text-white`) | الخامل: `text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-xl px-3 py-2.5 flex items-center gap-2.5` | يوجه إلى `/[locale]/dashboard/reports` |
| `sidebar_nav_billing` | Nav Link | `Sidebar.tsx` [182–188] | الاشتراكات • Abonnement • Billing | `font-semibold text-xs` (النشط: `font-bold text-white`) | الخامل: `text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-xl px-3 py-2.5 flex items-center gap-2.5` | يوجه إلى `/[locale]/dashboard/billing` |
| `sidebar_nav_settings` | Nav Link | `Sidebar.tsx` [189–195] | الإعدادات • Paramètres • Settings | `font-semibold text-xs` (النشط: `font-bold text-white`) | الخامل: `text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-xl px-3 py-2.5 flex items-center gap-2.5` | يوجه إلى `/[locale]/dashboard/settings` |
| `sidebar_nav_support` | Nav Link | `Sidebar.tsx` [196–205] | المساعدة • Support • Help | `font-semibold text-xs` (النشط: `font-bold text-white`) | الخامل: `text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-xl px-3 py-2.5 flex items-center gap-2.5` | يوجه إلى `/[locale]/dashboard/support` |
| `sidebar_vault_quick_trigger` | Button | `Sidebar.tsx` [215–235] | خزنة المالك • Coffre-Fort • Owner Vault | `font-bold text-[11px] text-zinc-300 group-hover:text-white` | `w-full p-2.5 rounded-xl border border-white/10 bg-zinc-950/80 hover:bg-white/[0.05] active:scale-[0.98] flex items-center justify-between cursor-pointer group` | يبث حدث `open-owner-vault` في نافذة المتصفح لفتح المودال |
| `sidebar_btn_logout` | Button | `Sidebar.tsx` [240–260] | تسجيل الخروج • Déconnexion • Sign Out | `font-semibold text-xs text-red-400 hover:text-red-300` | `w-full px-3 py-2 rounded-xl border border-red-500/10 hover:bg-red-500/10 active:scale-[0.98] flex items-center gap-2 cursor-pointer transition` | يستدعي `signOut()` من NextAuth لمسح الجلسة وتوجيه المستخدم لـ `/login` |

---

## 3. الخزنة الحساسة للمالك والملف الشخصي (`OwnerProfileModal.tsx`)

### جدول 3.1: شاشة القفل والتحقق من كلمة المرور (Step 1 — Password Gate)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `vault_gate_modal_card` | Modal Box | `OwnerProfileModal.tsx` [210–220] | حاوية التحقق من الهوية | غير نصي | `w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl surface-obsidian animate-in zoom-in-95` | نافذة منبثقة معتمة لحجب البيانات عن الكاشيرات |
| `vault_gate_icon_container` | Badge | `OwnerProfileModal.tsx` [221–225] | أيقونة القفل الذهبي | غير نصي | `w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3` | مؤشر أمان مرئي |
| `vault_gate_title_text` | Heading | `OwnerProfileModal.tsx` [226–230] | تأكيد هوية مالك المتجر • Authentification Propriétaire | `font-bold text-base text-white text-center` | نص عنوان متمركز | يوضح للمستخدم ضرورة إدخال كلمة سر الحساب |
| `vault_gate_subtitle_text` | Paragraph | `OwnerProfileModal.tsx` [231–235] | أدخل كلمة المرور لحماية البيانات البنكية والواتساب | `text-xs text-zinc-400 text-center mt-1` | نص توضيحي | يحذر من ترك البيانات مفتوحة أمام الموظفين |
| `vault_gate_input_password` | Input (Password) | `OwnerProfileModal.tsx` [245–255] | كلمة المرور • Mot de passe • Account Password | `font-mono text-xs text-white` | `w-full h-11 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40 focus:bg-[#111116]` | يربط بمتغير الحالة `password` |
| `vault_gate_btn_toggle_eye` | Button | `OwnerProfileModal.tsx` [256–263] | إظهار/إخفاء الرمز | أيقونة `Eye / EyeOff w-4 h-4 text-zinc-400` | `absolute end-3 top-3.5 text-zinc-400 hover:text-white cursor-pointer` | يبدل نوع الحقل بين `password` و `text` |
| `vault_gate_btn_cancel` | Button | `OwnerProfileModal.tsx` [270–276] | إلغاء • Annuler • Cancel | `font-semibold text-xs text-zinc-400 hover:text-white` | `px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/[0.05] active:scale-95 cursor-pointer` | يغلق المودال ويعيد تصفير الحالة |
| `vault_gate_btn_submit` | Button (Submit) | `OwnerProfileModal.tsx` [277–288] | فتح الخزنة • Déverrouiller • Unlock Vault | `font-bold text-xs text-zinc-950 font-sans` | `sheen-btn px-5 py-2.5 bg-white hover:bg-zinc-200 rounded-xl active:scale-95 cursor-pointer flex items-center gap-2` | يرسل `{ action: "unlock", password }` إلى `/api/v1/owner/vault` |
| `vault_gate_alert_error` | Alert Box | `OwnerProfileModal.tsx` [290–298] | رسالة الخطأ (كلمة المرور غير صحيحة) | `font-mono text-xs text-red-400 font-semibold` | `p-3 rounded-xl bg-red-500/10 border border-red-500/20 mt-3 text-center` | يظهر عند فشل فك القفل مع اهتزاز تحذيري |

---

### جدول 3.2: عناصر نموذج الخزنة المفتوحة (Step 2 — Inside Sensitive Vault)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `vault_logo_dropzone` | Dropzone Box | `OwnerProfileModal.tsx` [315–335] | اسحب شعار المتجر هنا أو انقر للاختيار (WebP < 40KB) | `font-semibold text-xs text-zinc-300` | `w-full p-4 rounded-xl border border-dashed border-white/20 hover:border-white/40 bg-zinc-900/50 flex flex-col items-center justify-center cursor-pointer` | يفتح منتقي الملفات ويضغط الشعار محلياً لأقل من 40KB |
| `vault_logo_file_input` | Input (File) | `OwnerProfileModal.tsx` [336–340] | منتقي الصورة المخفي | غير مرئي (`hidden`) | `ref={fileInputRef} accept="image/*"` | يستدعي `compressImage()` بصيغة WebP |
| `vault_input_shop_name` | Input (Text) | `OwnerProfileModal.tsx` [350–360] | الاسم التجاري للمتجر • Nom Commercial | `font-sans text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بـ `vaultData.shopName` |
| `vault_input_owner_name` | Input (Text) | `OwnerProfileModal.tsx` [361–370] | الاسم الكامل للمالك • Nom du Propriétaire | `font-sans text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بـ `vaultData.fullName` |
| `vault_input_owner_phone` | Input (Tel) | `OwnerProfileModal.tsx` [371–380] | رقم واتساب المالك الشخصي (للتقارير 21:00) | `font-mono text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بـ `vaultData.ownerPhone` |
| `vault_input_bank_name` | Input (Text) | `OwnerProfileModal.tsx` [385–395] | اسم البنك المغربي • Nom de la Banque | `font-sans text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بـ `vaultData.bankName` (مثل التجاري وفا بنك) |
| `vault_input_bank_rib` | Input (Text) | `OwnerProfileModal.tsx` [396–410] | الرقم البنكي المغربي الموحد RIB (24 خانة) | `font-mono font-bold text-xs text-white tracking-widest` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بـ `vaultData.bankRib` ويحجب بـ 24 خانة |
| `vault_input_tpe_id` | Input (Text) | `OwnerProfileModal.tsx` [415–425] | معرّف محطة الدفع الإلكتروني TPE Terminal ID | `font-mono text-xs text-white uppercase` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بـ `vaultData.tpeTerminalId` لمطابقة عمليات CMI |
| `vault_select_gateway` | Select | `OwnerProfileModal.tsx` [430–445] | بوابة الدفع المفعلة للمتجر • Passerelle Active | `font-mono text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | خيارات: `cash_only` / `cmi_tpe` / `youcanpay` / `stripe` |
| `vault_btn_save_submit` | Button (Submit) | `OwnerProfileModal.tsx` [480–495] | حفظ وتأمين الخزنة بنجاح • Sauvegarder | `font-bold text-xs text-zinc-950 font-sans` | `sheen-btn px-6 py-2.5 bg-white hover:bg-zinc-200 rounded-xl active:scale-95 cursor-pointer shadow-lg flex items-center gap-2` | يرسل `{ action: "save", data }` إلى `/api/v1/owner/vault` ويبث حدث المزامنة |

---

## 4. شاشات المصادقة والدخول والتسجيل (`(auth)` Screens)

### جدول 4.1: شاشة الدخول وتسجيل حساب جديد (`/login` & `/register`)

| معرّف العنصر (Element ID) | نوع العنصر | الصفحة والملف | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `auth_login_input_email` | Input (Email) | `login/page.tsx` [80–90] | البريد الإلكتروني • Adresse Email • Email Address | `font-mono text-xs text-white` | `w-full h-11 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بـ `email` ويرسل إلى `/api/v1/auth/login` |
| `auth_login_input_password` | Input (Password) | `login/page.tsx` [95–105] | كلمة المرور • Mot de Passe • Password | `font-mono text-xs text-white` | `w-full h-11 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بـ `password` |
| `auth_login_btn_submit` | Button (Submit) | `login/page.tsx` [115–125] | تسجيل الدخول للوحة التحكم • Se Connecter | `font-bold text-xs text-zinc-950` | `sheen-btn w-full h-11 bg-white hover:bg-zinc-200 rounded-xl active:scale-[0.98] cursor-pointer shadow-md` | يستدعي `signIn("credentials")` وينشئ جلسة `pos_session` |
| `auth_login_btn_demo` | Button | `login/page.tsx` [130–140] | تجربة سريعة ببيانات تجريبية (Demo Mode) | `font-semibold text-xs text-zinc-300 hover:text-white` | `w-full h-10 border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl active:scale-[0.98] cursor-pointer` | يسجل الدخول بحساب تجريبي مهيأ مسبقاً `/api/v1/auth/demo` |
| `auth_reg_input_fullname` | Input (Text) | `register/page.tsx` [70–80] | الاسم الكامل • Nom et Prénom • Full Name | `font-sans text-xs text-white` | `w-full h-11 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بـ `fullName` في طلب التسجيل |
| `auth_reg_input_storename` | Input (Text) | `register/page.tsx` [85–95] | اسم المتجر أو العلامة التجارية • Nom du Magasin | `font-sans text-xs text-white` | `w-full h-11 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | ينشئ سجل `Tenant` جديد باسم المحل |
| `auth_reg_select_industry` | Select | `register/page.tsx` [100–115] | قطاع النشاط التجاري • Secteur d'Activité | `font-sans text-xs text-white` | `w-full h-11 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يحدد القطاع: بقالة، مجزرة، مطعم، مخبزة، أزياء، إلكترونيات، جملة |
| `auth_reg_btn_submit` | Button (Submit) | `register/page.tsx` [140–150] | إنشاء حساب وبدء الاستخدام • Créer un Compte | `font-bold text-xs text-zinc-950` | `sheen-btn w-full h-11 bg-white hover:bg-zinc-200 rounded-xl active:scale-[0.98] cursor-pointer shadow-md` | يرسل البيانات إلى `/api/v1/auth/register` ويولد كود التحقق OTP |

---

## 5. قوالب البريد الإلكتروني الثلاثية الأبعاد (`src/lib/email/`)

| معرّف العنصر (Element ID) | القالب والملف | التسمية والوظيفة (Subject & Content) | أنماط التيبوغرافيا (Typography) | الحاوية والأنماط البصرية (HTML Email Markup) | الترابط الوظيفي ومسار البيانات (Mailer Call) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `email_otp_badge` | `mailer.ts` [L180–220] | رمز التحقق السري: `[XXXXXX]` | `font-family: monospace; font-size: 28px; font-weight: 900; letter-spacing: 6px; color: #ffffff;` | بطاقة سوداء `background: #09090b; border: 1px solid #27272a; padding: 24px; border-radius: 16px; text-align: center;` | يُرسل عبر `sendVerificationEmail()` لتأكيد البريد الإلكتروني |
| `email_welcome_pass` | `welcome-email.ts` [L40–80] | بطاقة التاجر الرقمية ورمز الدخول الأول | `font-family: sans-serif; font-size: 14px; color: #e4e4e7;` | حاوية مونوكرومية عريضة `background: #09090b; border: 1px solid #ffffff15; border-radius: 20px; padding: 32px;` | يُرسل عبر `sendWelcomeEmail()` مع بيانات الربط بسحابة كسب |
| `email_sub_receipt_3d` | `subscription-email.ts` [L30–120] | إيصال تفعيل الترخيص والاشتراك الشهري 3D | `font-family: monospace; font-size: 13px; color: #34d399; font-weight: bold;` | تصميم بطاقة ثلاثية الأبعاد بظلال فحمية `box-shadow: 0 20px 40px rgba(0,0,0,0.8); border: 1px solid #34d39940;` | يُرسل عبر `sendSubscriptionConfirmationEmail()` عند تفعيل الكود |


---

## 6. التحقق من البريد الإلكتروني والرمز السري (`(auth)/verify-code`)

| معرّف العنصر (Element ID) | نوع العنصر | الصفحة والملف | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `verify_code_card` | Modal/Card | `verify-code/page.tsx` | صندوق تأكيد الرمز المكون من 6 أرقام | غير نصي | `w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 surface-obsidian-3d shadow-2xl` | حاوية نموذج إدخال رمز التحقق OTP |
| `verify_code_digit_inputs` | Input (OTP) | `verify-code/page.tsx` | خانات الأرقام الستة (OTP Digits 1-6) | `font-mono text-2xl font-black text-center text-white tabular-nums` | `w-12 h-14 bg-zinc-900 border border-zinc-700 rounded-xl focus:border-white focus:bg-zinc-850 keycap-3d text-center` | يربط بحالة الرمز السري `otp` المكون من 6 أرقام |
| `verify_code_btn_submit` | Button (Submit) | `verify-code/page.tsx` | تأكيد الرمز وتفعيل الحساب • Vérifier le Code | `font-bold text-xs text-zinc-950 font-sans` | `sheen-btn w-full h-11 bg-white hover:bg-zinc-200 rounded-xl active:scale-[0.98] keycap-3d cursor-pointer shadow-md` | يرسل الرمز إلى `/api/v1/auth/verify-code` ويفعل حساب التاجر |
| `verify_code_btn_resend` | Button | `verify-code/page.tsx` | إعادة إرسال الرمز • Renvoyer le Code | `font-medium text-xs text-zinc-400 hover:text-white` | `text-center underline hover:opacity-90 cursor-pointer pt-2` | يعيد توليد وإرسال رمز التحقق عبر البريد |

---

## 7. معالج التهيئة الأولية للمتجر (`/onboarding`)

| معرّف العنصر (Element ID) | نوع العنصر | الصفحة والملف | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `onboarding_wizard_card` | Container | `onboarding/page.tsx` | حاوية معالج البدء السريع ثلاثية الأبعاد | غير نصي | `w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl p-8 surface-obsidian-3d shadow-2xl` | تدير خطوات إعداد المتجر الأولى |
| `onboarding_sector_grid` | Grid (Radio) | `onboarding/page.tsx` | شبكة اختيار قطاع النشاط (7 قطاعات) | `font-bold text-xs text-white` | `grid grid-cols-2 sm:grid-cols-3 gap-3` | يحدد القطاع: بقالة، مجزرة، مطعم، مخبزة، أزياء، إلكترونيات، جملة |
| `onboarding_input_currency` | Select | `onboarding/page.tsx` | العملة الرئيسية (MAD / USD / EUR) | `font-mono text-xs text-white` | `w-full h-11 px-3.5 bg-zinc-900 border border-zinc-700 rounded-xl` | يربط بـ `currency` في إعدادات المتجر |
| `onboarding_starter_catalog_toggle` | Toggle | `onboarding/page.tsx` | توليد المنتجات الأولية المناسبة لقطاعك | `font-semibold text-xs text-zinc-300` | `flex items-center gap-2 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800` | يستدعي بذور الكتالوج التلقائية لكل قطاع |
| `onboarding_btn_launch` | Button (Submit) | `onboarding/page.tsx` | إطلاق نقطة البيع الآن • Lancer le POS | `font-black text-sm text-zinc-950 font-sans` | `sheen-btn w-full h-12 bg-white hover:bg-zinc-200 rounded-2xl active:scale-[0.98] keycap-3d cursor-pointer shadow-lg` | يحفظ إعدادات المتجر الأولية ويوجه إلى `/[locale]/pos` |

---

## 8. صفحة الإطلاق والربط المكتبي (`/launch-desktop` & `/download`)

| معرّف العنصر (Element ID) | نوع العنصر | الصفحة والملف | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `launch_desktop_hero_card` | Container | `launch-desktop/page.tsx` | بطاقة الربط المباشر ببروتوكول `kaspi://` | `font-extrabold text-2xl text-white` | `p-8 rounded-3xl bg-zinc-950 border border-zinc-800 surface-obsidian-3d shadow-2xl text-center space-y-4` | حاوية الربط بين الويب وتطبيق ويندوز المكتبي |
| `launch_desktop_btn_open_app` | Button (Link) | `launch-desktop/page.tsx` | فتح تطبيق كسب المكتبي • Ouvrir l'App Desktop | `font-black text-sm text-zinc-950 font-sans` | `sheen-btn inline-flex items-center gap-2 px-8 py-3.5 bg-white hover:bg-zinc-200 text-zinc-950 rounded-2xl active:scale-[0.98] keycap-3d shadow-lg` | ينشط بروتوكول `kaspi://auth?token=...` لفتح التطبيق المكتبي فورياً |
| `download_page_win_installer_btn` | Button (Link) | `download/page.tsx` | تحميل مثبت ويندوز (.exe) — Windows 10/11 | `font-black text-sm text-zinc-950` + `font-mono text-[10px] text-zinc-600` | `sheen-btn inline-flex items-center gap-3 px-6 py-4 bg-white hover:bg-zinc-200 rounded-2xl keycap-3d cursor-pointer shadow-xl` | يبدأ تحميل حزمة التثبيت المستقلة لتطبيق كسب المكتبي |
| `download_page_hardware_pill` | Badge | `download/page.tsx` | دعم الطابعات الحرارية والباركود والميزان | `font-mono text-xs text-zinc-400` | `px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800` | يوضح توافق الأجهزة المحلية USB / Serial / ESC-POS |

---

## 9. مساعد الذكاء الاصطناعي الذكي (`AIChatWidget.tsx`)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ai_chat_floating_fab` | Button (FAB) | `AIChatWidget.tsx` [45–65] | زر المستشار الذكي العائم (AI Smart Advisor) | أيقونة `Sparkles w-5 h-5 text-zinc-950` | `fixed bottom-5 end-5 w-13 h-13 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95 keycap-3d shadow-2xl flex items-center justify-center z-40 cursor-pointer` | يبدل حالة ظهور نافذة الدردشة الذكية `isOpen` |
| `ai_chat_modal_panel` | Container | `AIChatWidget.tsx` [70–110] | نافذة الدردشة وتحليل بيانات المتجر | `font-sans text-xs` | `fixed bottom-20 end-5 w-96 max-w-[calc(100vw-2.5rem)] h-[520px] rounded-3xl bg-zinc-950/95 border border-zinc-800 surface-obsidian-3d shadow-2xl backdrop-blur-xl flex flex-col z-50 overflow-hidden` | إطار الشات الذكي مع نموذج تحليل المبيعات والقرارات |
| `ai_chat_input_message` | Input (Text) | `AIChatWidget.tsx` [180–195] | اسأل المستشار الذكي عن مبيعاتك وأرباحك... | `font-sans text-xs text-white` | `w-full h-10 px-3.5 bg-zinc-900 border border-zinc-700 rounded-xl focus:border-white focus:outline-none` | يربط بـ `messageInput` |
| `ai_chat_btn_send` | Button | `AIChatWidget.tsx` [196–205] | إرسال • Envoyer • Send | أيقونة `Send w-4 h-4 text-zinc-950` | `h-10 px-3 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95 keycap-3d flex items-center justify-center cursor-pointer` | يرسل الاستفسار إلى `/api/v1/ai/advisor` ويولد إجابة مدعومة بالبيانات الحية |
