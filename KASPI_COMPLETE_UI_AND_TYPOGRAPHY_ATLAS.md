# أطلس الواجهات الرسومية، التيبوغرافيا والتفاعل الشامل
## KASPI POS — Master UI, Controls, Typography & Interaction Atlas

> **تاريخ الإصدار:** 2026-11-11  
> **الإصدار البرمجي المعتمد:** Commit `c32e5e4` وما بعده  
> **فلسفة التصميم:** نظام أحادي اللون فاخر كينيتيك (Kinetic Obsidian Monochrome & Living Micro-Interactions)  
> **هندسة الاتجاهات:** هندسة فيزيائية ثابتة من اليسار لليمين (`dir="ltr"` Physical Geometry) مع محاذاة لغوية متسقة وتصفير تباعد الحروف العربية (`letter-spacing: 0 !important`).

---

## 1. رموز النظام البصري وقواعد التيبوغرافيا (Master Typography & Design Tokens)

### 1.1 الخطوط الرسمية المعتمدة (Font Families)
1. **الخط العربي (Arabic Typographic Core):** `Cairo` / `Noto Sans Arabic` — خط هندسي عصري فائق الوضوح للشاشات اللمسية، يُطبق عليه إجبارياً `letter-spacing: 0` لمنع تقطع الحروف العربية المتصلة.
2. **الخط اللاتيني (Latin UI Core):** `Inter` — خط نظيف، متوازن، ومعتمد لكافة النصوص بالفرنسية والإنجليزية.
3. **خط الأرقام والبيانات التقنية (Monospace Data & Currency):** `JetBrains Mono` / `ui-monospace` — معتمد لأسعار الدرهم المغربي (MAD)، أرقام الباركود (EAN-13)، أرقام التعريف الضريبي (ICE / IF / RC)، مفاتيح التراخيص، وسجلات التدقيق المحاسبي.

### 1.2 لوحة الألوان المونوكرومية الحية (Monochrome Living Palette)
- **الخلفية العميقة الأساسية:** `#09090B` (`bg-zinc-950` / Obsidian Black) مع شبكة كينيتيك نقطية خافتة (`.bg-dot-matrix`).
- **أسطح البطاقات والحاويات:** `bg-zinc-900/60` مع حدود زجاجية داكنة `border-white/10`.
- **أزرار الإجراءات الأساسية (Primary CTAs):** `bg-white text-zinc-950 font-bold hover:bg-zinc-200` مع تأثير البريق الحركي المتدفق (`.sheen-btn`).
- **أزرار الأمان الخضراء الاستثنائية:** `bg-emerald-500 hover:bg-emerald-400 text-zinc-950` مع توهج زمردي ناعم `shadow-[0_0_20px_rgba(16,185,129,0.3)]` (حفظ واتساب / المعاملات الناجحة).
- **الختم الرسمي المغربي:** أحمر قرمزي شبه شفاف `border-red-600/40 text-red-600/40 bg-red-500/[0.03]` قابل للإخفاء بنقرة واحدة لضمان قراءة النصوص تحته.

---

## 2. الهيكل العام وشريط التنقل العلوي والجانبي (Global Shell & Navigation)

### جدول 2.1: عناصر شريط التنقل العلوي (`src/app/[locale]/dashboard/layout.tsx` - Lines 110–198)

| معرّف العنصر (Element ID) | الملف ونطاق الأسطر | التسميات اللغوية الثلاث (AR / FR / EN) | التيبوغرافيا (Typography) | الحاوية والأنماط البصرية (Visual Classes) | الترابط الوظيفي ومسار البيانات |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `topbar_brand_logo` | `layout.tsx` [115–131] | شعار كسب • KASPI POS | `font-extrabold text-sm text-white` | `flex items-center gap-2 text-white` مع صورة الشعار `w-6 h-6 object-contain` | ينقل إلى `/[locale]/dashboard` ويعرض اسم المحل من `settings.shopName` |
| `topbar_pos_launcher` | `layout.tsx` [136–143] | نقطة البيع (POS)<br>Caisse POS<br>POS Terminal | `font-bold text-xs text-zinc-950` | `sheen-btn h-8 px-3 rounded-lg bg-white hover:bg-zinc-200 shadow-xs cursor-pointer` | يفتح شاشة الكاشير السريعة `/[locale]/pos` |
| `topbar_desktop_pill` | `layout.tsx` [144–150] | تطبيق الويندوز<br>App Desktop<br>Desktop App | `font-medium text-xs text-zinc-300 hover:text-white` | `h-8 px-2.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08]` | يوجه لصفحة التنزيل والربط المكتبي `/[locale]/download` |
| `topbar_lang_switcher` | `LanguageSwitcher.tsx` [1–85] | العربية • FR • EN | `font-bold text-xs font-mono text-zinc-200` | `h-8 px-2.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.1]` | يبدل سياق اللغة ومسار المتصفح مع حفظ التفضيل محلياً |
| `topbar_settings_icon` | `layout.tsx` [154–160] | الإعدادات<br>Paramètres<br>Settings | أيقونة `Settings w-3.5 h-3.5` | `w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] hover:rotate-90 transition-transform` | ينقل لصفحة الإعدادات العامة `/[locale]/dashboard/settings` |
| `topbar_owner_vault_pill` | `layout.tsx` [162–172] | خزنة المالك والملف الشخصي<br>Profil Propriétaire & Coffre-Fort<br>Owner Vault & Profile | `font-medium text-xs text-zinc-200 truncate max-w-[110px]` | `h-8 px-2.5 rounded-lg border border-white/10 bg-white/[0.04] flex items-center gap-1.5 cursor-pointer` | يفتح نافذة `OwnerProfileModal` المحمية بكلمة المرور |

---

### جدول 2.2: الشريط الجانبي وقطاع النشاط (`src/components/layout/Sidebar.tsx` - Lines 1–280)

| معرّف العنصر (Element ID) | الملف ونطاق الأسطر | التسميات اللغوية الثلاث (AR / FR / EN) | التيبوغرافيا (Typography) | الحاوية والأنماط البصرية (Visual Classes) | الترابط الوظيفي ومسار البيانات |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sidebar_sector_indicator` | `Sidebar.tsx` [85–130] | قطاع النشاط الحالي (بقالة، جزارة، مطعم...) | `font-bold text-xs text-white` + `text-[10px] text-zinc-400 font-mono` | حاوية 3D زجاجية `rounded-2xl p-3 bg-zinc-900/90 border border-white/10 shadow-lg` مع مؤشر نبضي زمردي | يعرض القطاع الحالي ويفتح `IndustryWorkspaceModal` لتغييره لحظياً |
| `sidebar_nav_links` | `Sidebar.tsx` [135–210] | الرئيسية، المنتجات، المخزون، العملاء، الموردين، التقارير، الفواتير، الدعم | `font-semibold text-xs` (النشط: `text-white font-bold`، الخامل: `text-zinc-400`) | النشط: `bg-white/[0.08] text-white border border-white/10 rounded-xl px-3 py-2.5` | تنقل لحظي بين أقسام لوحة التحكم بدون وميض في الصفحة |
| `sidebar_vault_quick_btn` | `Sidebar.tsx` [215–240] | خزنة المالك الحساسة<br>Coffre-Fort Sécurisé<br>Owner Security Vault | `font-bold text-[11px] text-zinc-300 hover:text-white` | `w-full p-2.5 rounded-xl border border-white/10 bg-zinc-950/80 flex items-center justify-between cursor-pointer` | يطلق حدث `window.dispatchEvent("open-owner-vault")` لفتح المودال |

---

### جدول 2.3: نافذة خزنة المالك المحمية (`src/components/layout/OwnerProfileModal.tsx` - Lines 1–535)

| معرّف العنصر (Element ID) | المرحلة والسطر | التسميات اللغوية الثلاث (AR / FR / EN) | التيبوغرافيا (Typography) | الحاوية والأنماط البصرية (Visual Classes) | الترابط الوظيفي ومسار البيانات |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `vault_gate_title` | الخطوة 1 [220–235] | التحقق من هوية المالك<br>Authentification Propriétaire<br>Owner Vault Verification | `font-bold text-base text-white` | أيقونة قفل ذهبية `Lock text-amber-400` داخل دائرة `w-12 h-12 bg-amber-500/10` | تطلب كلمة مرور الحساب لحجب البيانات عن الكاشيرات |
| `vault_password_input` | الخطوة 1 [240–265] | كلمة مرور الحساب الشخصي | `font-mono text-xs text-white` | `w-full h-11 px-3.5 bg-zinc-900 border border-white/10 rounded-xl` مع زر إظهار/إخفاء الرمز | ترسل طلب فك القفل إلى `/api/v1/owner/vault` (`action: "unlock"`) |
| `vault_logo_uploader` | الخطوة 2 [310–350] | شعار المتجر والفاتورة (WebP)<br>Logo du Commerce<br>Store Logo | `font-semibold text-xs text-zinc-300` | حاوية سحب وإفلات `border-dashed border-white/20 hover:border-white/40 p-4 rounded-xl text-center cursor-pointer` | تضغط الصورة عبر `compressImage` لأقل من 40KB وترفعها كـ WebP |
| `vault_bank_rib_input` | الخطوة 2 [380–410] | الرقم البنكي المغربي الموحد (24 رقماً)<br>RIB Bancaire Marocain (24 chiffres)<br>Moroccan Bank RIB (24 digits) | `font-mono font-bold text-xs text-white tracking-widest` | `w-full h-11 px-3.5 bg-zinc-900 border border-white/10 rounded-xl` | يُحفظ في `IdempotencyRecord` ويُحجب تلقائياً عن شاشات الموظفين |
| `vault_save_btn` | الخطوة 2 [490–525] | حفظ وتأمين الخزنة بنجاح<br>Enregistrer et Verrouiller<br>Save & Secure Vault | `font-bold text-xs text-zinc-950` | `h-11 px-6 rounded-xl bg-white hover:bg-zinc-200 cursor-pointer shadow-md flex items-center gap-2` | ترسل البيانات لـ `/api/v1/owner/vault` وتبث حدث `kaspi_store_profile_updated` |

---

## 3. محطة البيع والكاشير الميدانية (`src/app/[locale]/pos/page.tsx` & Components)

### جدول 3.1: شريط البحث والأوامر وسلة التسوق المدمجة (`src/components/pos/`)

| معرّف العنصر (Element ID) | الملف ونطاق الأسطر | التسميات اللغوية الثلاث (AR / FR / EN) | التيبوغرافيا (Typography) | الحاوية والأنماط البصرية (Visual Classes) | الترابط الوظيفي ومسار البيانات |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `pos_barcode_search` | `ProductSearch.tsx` [45–95] | امسح الباركود أو اكتب اسم المنتج...<br>Scanner ou rechercher article...<br>Scan barcode or search product... | `font-mono text-sm text-white` | `w-full h-12 px-4 bg-zinc-900/90 border border-white/10 rounded-2xl focus:border-white` | مسح فوري بزمن 0ms عبر لوحة المفاتيح والـ Douchette أو الميزان |
| `pos_scale_badge` | `ProductSearch.tsx` [96–115] | ميزان الباركود الإلكتروني (DGI Weight 28/29)<br>Balance Électronique<br>Electronic Scale Active | `font-mono font-bold text-[10px] text-emerald-400` | شارة مستطيلة `bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded` | يكتشف تلقائياً الوزن المضمن في كود الميزان (وزن كغ وسعر إجمالي) |
| `pos_category_tabs` | `CategoryFilter.tsx` [20–65] | الكل، خضر وفواكه، مشروبات، مجمدات... | `font-bold text-xs text-white` | أزرار مدمجة قابلة للتمرير الأفقي `px-3.5 py-1.5 rounded-xl border border-white/10` | فلترة لحظية لشبكة المنتجات بدون استدعاء جديد للشبكة |
| `pos_cart_empty_trolley` | `CartPanel.tsx` [140–210] | عربة التسوق فارغة<br>Votre panier est vide<br>Your cart is empty | `font-black text-sm text-white` + `text-xs text-zinc-500` | مشهد عربة تسوق سوبرماركت SVG تفاعلية مع فيزياء عائمة `animate-float` ودوران العجلات عند التمرير بالماوس | حالة الفراغ الحركية للسلة، تتحول للبنود فور نقر أي منتج |
| `pos_price_mode_toggle` | `CartPanel.tsx` [75–115] | تجزئة (Retail) / جملة (Wholesale) | `font-mono font-bold text-xs` | مفتاح تبديل مونوكرومي `bg-zinc-900 p-1 rounded-xl border border-white/10` | يبدل أسعار كافة العناصر في السلة بين `unit_price` و `wholesale_price` |
| `pos_checkout_trigger` | `CartPanel.tsx` [380–420] | دفع الحساب وإنهاء البيع<br>Encaisser & Facturer<br>Complete Checkout | `font-black text-sm text-zinc-950` | زر ضخم مميز `w-full h-14 bg-white hover:bg-zinc-200 rounded-2xl sheen-btn cursor-pointer` | يفتح نافذة الدفع الموحدة `UnifiedCheckoutModal` |

---

### جدول 3.2: نافذة الدفع المتعددة والكريدي (`UnifiedCheckoutModal.tsx` - Lines 1–450)

| معرّف العنصر (Element ID) | الملف ونطاق الأسطر | التسميات اللغوية الثلاث (AR / FR / EN) | التيبوغرافيا (Typography) | الحاوية والأنماط البصرية (Visual Classes) | الترابط الوظيفي ومسار البيانات |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `checkout_method_cash` | `UnifiedCheckoutModal.tsx` [110–140] | نقداً (Espèces / Cash) | `font-bold text-xs text-white` | زر بطاقة `p-3 rounded-xl border border-white/10 bg-zinc-900 hover:bg-white/[0.08]` | يحدد الدفع نقداً مع حاسبة الصرف والباقي السريع |
| `checkout_method_tpe` | `UnifiedCheckoutModal.tsx` [141–175] | بطاقة بنكية / TPE (CMI) | `font-bold text-xs text-white` | زر بطاقة مع كاشف BIN البنكي المغربي التلقائي | يرسل أمر التمرير لجهاز TPE الشبكي (Port 9100/Bridge) |
| `checkout_method_karne` | `UnifiedCheckoutModal.tsx` [176–210] | كناش الكريدي (Carnet Crédit) | `font-bold text-xs text-amber-400` | زر بطاقة ذهبي خافت مع قائمة اختيار العميل المسجل | يسجل الرصيد في دفتر ديون العميل (`CustomerCreditRecord`) |
| `checkout_quick_cash_pills` | `UnifiedCheckoutModal.tsx` [240–280] | 20 د.م • 50 د.م • 100 د.م • 200 د.م | `font-mono font-bold text-xs text-white` | أزرار نقدية سريعة `px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700` | حساب المبلغ المدفوع ونقرة واحدة للباقي |
| `checkout_confirm_btn` | `UnifiedCheckoutModal.tsx` [380–425] | تأكيد وطباعة التذكرة DGI<br>Valider & Imprimer<br>Confirm & Print DGI Receipt | `font-black text-sm text-zinc-950` | `w-full h-12 rounded-xl bg-white hover:bg-zinc-200 cursor-pointer shadow-lg` | ينشئ البيع في `/api/v1/sales` ويرسل أمر الطباعة الحرارية فوراً |

---

## 4. لوحة الإحصائيات وإدارة المخزون والكتالوج (`/dashboard` Screens)

### جدول 4.1: الصفحة الرئيسية وخلفية التجارة الحية (`/dashboard/page.tsx`)

| معرّف العنصر (Element ID) | الملف ونطاق الأسطر | التسميات اللغوية الثلاث (AR / FR / EN) | التيبوغرافيا (Typography) | الحاوية والأنماط البصرية (Visual Classes) | الترابط الوظيفي ومسار البيانات |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `dash_commerce_canvas` | `FloatingCommerceCanvas.tsx` [1–114] | خلفية التجارة واللوجستيات الحية | غير مرئي نصياً (SVG Kinetic Art) | `absolute inset-0 pointer-events-none select-none opacity-15` مع فيزياء الانجراف الثلاثية | يعطي عمقاً بصرياً للشاشة دون حجب النقرات أو التأثير على الأداء |
| `dash_kpi_revenue` | `dashboard/page.tsx` [80–120] | إجمالي المبيعات اليومية<br>Chiffre d'Affaires du Jour<br>Today's Total Revenue | `font-black text-2xl font-mono text-white` | بطاقة مونوكرومية `rounded-3xl p-6 bg-zinc-900/60 border border-white/10` | تجمع إجمالي مبيعات اليوم بالدرهم من `/api/v1/reports/sales-summary` |
| `dash_kpi_orders` | `dashboard/page.tsx` [121–150] | عدد المعاملات المنجزة<br>Tickets Validés<br>Completed Transactions | `font-black text-2xl font-mono text-white` | بطاقة مونوكرومية `rounded-3xl p-6 bg-zinc-900/60 border border-white/10` | تعرض عدد الإيصالات الصادرة خلال جلسات الكاشير اليومية |
| `dash_quick_pos_action` | `dashboard/page.tsx` [220–250] | فتح نقطة البيع<br>Ouvrir la Caisse<br>Open Register | `font-bold text-xs text-zinc-950` | `sheen-btn px-5 py-3 rounded-2xl bg-white hover:bg-zinc-200 cursor-pointer` | انتقال فوري لشاشة البيع `/pos` |

---

### جدول 4.2: كتالوج المنتجات والمخزون (`/dashboard/products` & `/dashboard/inventory`)

| معرّف العنصر (Element ID) | الملف ونطاق الأسطر | التسميات اللغوية الثلاث (AR / FR / EN) | التيبوغرافيا (Typography) | الحاوية والأنماط البصرية (Visual Classes) | الترابط الوظيفي ومسار البيانات |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `prod_table_header` | `products/page.tsx` [320–360] | المنتج، الباركود، الفئة، سعر التجزئة، سعر الجملة، المخزون، الإجراءات | `font-mono text-xs uppercase text-zinc-400` | شريط جدول رمادي داكن `border-b border-white/10 bg-zinc-950/40 p-3` | يعرض أعمدة المنتجات مع فرز تصاعدي وتنازلي |
| `prod_create_modal` | `products/page.tsx` [500–680] | إضافة منتج جديد للكتالوج<br>Nouveau Produit<br>New Product Modal | `font-bold text-base text-white` | نافذة منبثقة `rounded-3xl p-6 bg-zinc-950 border border-white/10 max-w-2xl` | يحفظ الاسم، الباركود، التكلفة، البيع، الجملة، والوحدة عبر `/api/v1/products` |
| `inv_reorder_badge` | `inventory/page.tsx` [250–275] | كمية الطلب المقترحة: +{qty} وحدة<br>Réapprovisionnement suggéré: +{qty} u.<br>Suggested Reorder: +{qty} units | `font-mono font-bold text-[11px] text-zinc-300` | شارة مونوكرومية أنيقة `px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10` | توصية الذكاء الاصطناعي لإعادة التموين بدلاً من أزرار الواتساب العشوائية |

---

## 5. العملاء، كناش الكريدي، والموردين (`/customers` & `/suppliers`)

### جدول 5.1: شاشة العملاء وبطاقة الأوبسيديان الثلاثية الأبعاد (`/dashboard/customers/page.tsx`)

| معرّف العنصر (Element ID) | الملف ونطاق الأسطر | التسميات اللغوية الثلاث (AR / FR / EN) | التيبوغرافيا (Typography) | الحاوية والأنماط البصرية (Visual Classes) | الترابط الوظيفي ومسار البيانات |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `cust_white_canvas_empty` | `KineticEmptyState.tsx` [450–510] & `customers/page.tsx` [315–322] | لا يوجد أي عميل مسجل حالياً<br>Aucun client enregistré<br>No registered customers yet | `font-black text-lg text-zinc-950` + `text-xs text-zinc-600` | حاوية بيضاء ناصعة `bg-white text-zinc-950 border border-zinc-200 shadow-2xl rounded-3xl p-8` تكسر السواد بتباين فائق | حالة الفراغ المميزة لشاشة العملاء |
| `cust_3d_obsidian_vip_card` | `KineticEmptyState.tsx` [460–495] | بطاقة VIP أوبسيديان معدنية تفاعلية ثلاثية الأبعاد | أرقام نقش مونوكرومية `font-mono text-zinc-300 text-xs tracking-widest` | كرت معدني عائم `w-64 h-36 rounded-2xl bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-800 border border-zinc-700/80 shadow-2xl animate-float` | يعبر عن برامج الولاء وبطاقات الائتمان الخاصة بالمتجر |
| `cust_add_btn` | `customers/page.tsx` [180–210] | + إضافة عميل جديد<br>+ Nouveau Client<br>+ New Customer | `font-bold text-xs text-zinc-950` | `sheen-btn px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 cursor-pointer` | يفتح نافذة تسجيل اسم العميل، الهاتف، ورقم الـ ICE |

---

### جدول 5.2: الموردين، تفريغ الفواتير OCR، ومواعيد الكمبيالات (`/dashboard/suppliers/page.tsx`)

| معرّف العنصر (Element ID) | الملف ونطاق الأسطر | التسميات اللغوية الثلاث (AR / FR / EN) | التيبوغرافيا (Typography) | الحاوية والأنماط البصرية (Visual Classes) | الترابط الوظيفي ومسار البيانات |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supp_maturity_banner` | `suppliers/page.tsx` [140–190] | تنبيه استحقاق الكمبيالات والشيكات البنكية (7 أيام قادمة) | `font-mono font-bold text-xs text-amber-300` | لافتة تحذيرية `p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20` | تنبيه التاجر بمواعيد سداد الموردين لتفادي رفض الشيكات البنكية |
| `supp_ocr_scan_btn` | `suppliers/page.tsx` [210–235] | مسح الفاتورة بالذكاء الاصطناعي (OCR Vision)<br>Scanner Facture IA<br>AI Invoice OCR | `font-bold text-xs text-white` | `px-4 py-2 rounded-xl bg-zinc-900 border border-white/20 hover:bg-white/[0.1] cursor-pointer flex items-center gap-2` | رفع صورة الفاتورة وقراءتها آلياً عبر Gemini OCR Vision |
| `supp_empty_state` | `KineticEmptyState.tsx` [380–440] | لا توجد ديون أو فواتير موردين مسجلة | `font-bold text-sm text-white` | `KineticSupplierInvoiceScanEmpty` بدرع مونوكرومي عائم ومؤشر مسح ليزري | الحفاظ التام على شاشة الفراغ المعتمدة للموردين |

---

## 6. التقارير التنفيذية والإغلاق اليومي Z (`/reports` & `ExecutiveReportSheet.tsx`)

### جدول 6.1: التقرير التنفيذي للـ 24 ساعة والختم القرمزي (`ExecutiveReportSheet.tsx` - Lines 1–510)

| معرّف العنصر (Element ID) | الملف ونطاق الأسطر | التسميات اللغوية الثلاث (AR / FR / EN) | التيبوغرافيا (Typography) | الحاوية والأنماط البصرية (Visual Classes) | الترابط الوظيفي ومسار البيانات |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `exec_wa_svg_badge` | `ExecutiveReportSheet.tsx` [210–225] | شعار واتساب الرسمي المتجهي (Official Vector SVG) | `font-mono text-[10px] text-emerald-400 uppercase` | حاوية زمردية `w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center` | تأكيد اعتماد الواتساب الحصري للتقرير التنفيذي الليلي للمالك |
| `exec_emerald_save_btn` | `ExecutiveReportSheet.tsx` [265–273] | حفظ وتفعيل الإرسال التلقائي (21:00 / 22:00)<br>Enregistrer & Activer Envoi<br>Save & Enable Dispatch | `font-bold text-xs text-zinc-950` | زر زمردي فائق التباين `bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] h-11 px-6 rounded-xl cursor-pointer` | يحفظ رقم المالك الخاص وموعد الإرسال اليومي في `/api/v1/settings` |
| `exec_crimson_stamp` | `ExecutiveReportSheet.tsx` [290–312] | الختم الرسمي للمملكة المغربية — كسب POS<br>Cachet Officiel • Conforme DGI | خط مونو قرمزي `font-mono font-black text-[9px] uppercase tracking-widest text-red-600/70` | ختم دائري قرمزي شفاف `border-4 border-red-600/40 text-red-600/40 bg-red-500/[0.03] rotate-12 cursor-pointer` | قابل للإخفاء التام بنقرة واحدة لتسهيل قراءة النص مع زر استعادة بالأسفل |
| `exec_daily_sales_table` | `ExecutiveReportSheet.tsx` [390–435] | مبيعات اليوم الإجمالية (نقداً، بطاقة، كريدي) | `font-mono text-xs text-white` | جدول مونوكرومي عالي الدقة `w-full text-start border-t border-zinc-800` | عرض مفصل لكافة المعاملات المالية ومطابقتها قبل الإغلاق الليلي |

---

## 7. الاشتراكات، الفواتير والفروع الجديدة (`/billing` & `settings/page.tsx`)

### جدول 7.1: خطط الأسعار وإضافة الفروع (`/dashboard/billing` & `/dashboard/settings`)

| معرّف العنصر (Element ID) | الملف ونطاق الأسطر | التسميات اللغوية الثلاث (AR / FR / EN) | التيبوغرافيا (Typography) | الحاوية والأنماط البصرية (Visual Classes) | الترابط الوظيفي ومسار البيانات |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `billing_base_plan_card` | `billing/page.tsx` [400–460] | الخطة الأساسية — 200 درهم شهرياً<br>Formule Base — 200 MAD/mois<br>Base Plan — 200 MAD/month | `font-black text-2xl font-mono text-white` | بطاقة ChatGPT مونوكرومية عريضة `p-6 rounded-3xl bg-zinc-900 border border-white/10` | تشمل متجراً رئيسياً مع نقطة بيع وكاشير سحابي متكامل |
| `billing_addon_pill` | `billing/page.tsx` [470–510] | +150 درهم / شهر لكل نقطة بيع أو فرع إضافي<br>+150 MAD / poste supplémentaire<br>+150 MAD / extra register | `font-mono font-bold text-xs text-white` | شارة مونوكرومية منبثقة مع زر الترقية الفورية | يرفع عدد الأجهزة المسموح بها في قاعدة البيانات |
| `billing_new_branch_modal` | `settings/page.tsx` [995–1090] | إضافة فرع جديد ونقطة بيع متصلة (+150 د.م/شهر)<br>Ajouter Succursale (+150 MAD/m)<br>New Branch (+150 MAD/mo) | `font-bold text-base text-white` + `font-mono text-emerald-400` | نافذة اشتراك منبثقة `max-w-lg bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl` | تنشئ الفرع في `/api/v1/stores` وتسجل فوراً دفعة 150 درهم في سجل الفواتير |
| `billing_license_activator` | `billing/page.tsx` [560–620] | تفعيل ترخيص المنصة (رمز التفعيل السنوي أو الشهري) | `font-mono font-bold text-xs text-white uppercase` | حقل إدخال كود الترخيص مع زر تفعيل مونوكرومي | يتحقق من صحة الكود ويرسل بريد التفعيل 3D للمشترك فوراً |

---

## 8. الدعم الفني ولوحة إدارة المنصة (`/support`, `/admin` & `/admin/messages`)

### جدول 8.1: شاشة الدعم الفني وتشخيص الذكاء الاصطناعي للمسؤول

| معرّف العنصر (Element ID) | الملف ونطاق الأسطر | التسميات اللغوية الثلاث (AR / FR / EN) | التيبوغرافيا (Typography) | الحاوية والأنماط البصرية (Visual Classes) | الترابط الوظيفي ومسار البيانات |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `support_empty_shield` | `support/page.tsx` [212–224] | تذاكري السابقة — لا توجد تذاكر دعم فني مفتوحة | `font-bold text-sm text-white` + `text-xs text-zinc-400` | توسيط تام أفقياً وعمودياً `py-16 flex flex-col items-center justify-center text-center w-full mx-auto my-auto min-h-[340px]` | درع كسب الأمني المتحرك بحركات نبضية ناعمة |
| `support_ticket_form` | `support/page.tsx` [90–180] | إرسال تذكرة مساعدة تقنية للمالك والإدارة | `font-bold text-xs text-zinc-950` | نموذج إرسال سريع يرسل تنبيهاً فورياً عبر بريد الجيميل الرسمي للمالك | يرتبط بـ `/api/v1/support` و `mailer.ts` |
| `admin_ai_diagnose_btn` | `admin/messages/page.tsx` [430–450] | تشخيص المشكلة واقتراح الحل بالذكاء الاصطناعي (AI Diagnose) | `font-bold text-xs text-white` | `px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 flex items-center gap-1.5 cursor-pointer` | يحلل شكوى التاجر فورياً ويملأ الرد بالحل الهندسي المناسب (طابعة، شبكة، كروت) |

---

## 9. التدقيق النهائي للتوافق المونوكرومي والتيبوغرافي (Final System Verification)

تمت مراجعة كافة الشاشات والقوالب للتأكد من المعايير القياسية التالية:
1. **صفر أخطاء محاذاة:** هندسة ثابتة من اليسار لليمين (`dir="ltr"`) لمنع تشوه الجداول والقوائم عند التبديل بين اللغات.
2. **اتصال الحروف العربية:** تطبيق `letter-spacing: 0 !important` على كافة بطاقات الأسعار والأزرار العربية.
3. **انعدام الألوان الفاقعة:** التزام كامل بنظام السواد والأبيض مع الاستثناءات المحددة فقط (أخضر زمردي لواتساب وحفظ المعاملات، أحمر قرمزي شبه شفاف لختم الدولة، وأصفر خافت لتنبيهات الكمبيالات).
4. **جهوزية الإنتاج:** كافة الروابط، الأحداث، النوافذ المنبثقة، ونماذج التخزين متصلة وتعمل بكفاءة 100%.
