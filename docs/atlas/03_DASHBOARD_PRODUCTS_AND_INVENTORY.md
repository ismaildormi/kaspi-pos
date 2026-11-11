# أطلس الواجهات والتحكم والتيبوغرافيا — المجلد الثالث
## 03. لوحة المؤشرات، كتالوج المنتجات والمخزون الحي (Dashboard, Products & Inventory)

> **المسار المصدري المشمول:** `src/app/[locale]/dashboard/page.tsx` • `src/app/[locale]/dashboard/products/page.tsx` • `src/app/[locale]/dashboard/inventory/page.tsx` • `src/components/dashboard/*` • `src/components/ui/FloatingCommerceCanvas.tsx`

---

## 1. لوحة المؤشرات والرسوم البيانية الرئيسية (`/dashboard/page.tsx`)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `dash_hero_store_name` | Heading | `dashboard/page.tsx` [107–109] | الاسم التجاري للمحل (ديناميكي) | `font-black text-2xl text-white tracking-tight` | نص العنوان الرئيسي للوحة التحكم | يعرض `safeDisplayName` المقروء من بيانات الـ Tenant |
| `dash_hero_sector_pill` | Badge | `dashboard/page.tsx` [110–125] | قطاع النشاط المعتمد (بقالة، مجزرة...) | `font-mono font-bold text-[10px] text-white` | شارة مستديرة `bg-white/10 text-white border border-white/20 px-2.5 py-1 rounded-full flex items-center gap-1.5` | يعكس قطاع النشاط الحالي مع نقطة زمردية نبضية |
| `dash_btn_import_excel` | Button (Link) | `dashboard/page.tsx` [138–144] | استيراد ملف إكسيل • Import Excel | `font-semibold text-xs text-zinc-300 hover:text-white` | `inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 hover:bg-zinc-800 active:scale-95 cursor-pointer` | ينقل لصفحة الاستيراد الذكي للكتالوج `/products/import` |
| `dash_btn_open_pos` | Button (Link) | `dashboard/page.tsx` [145–152] | فتح نقطة البيع • Ouvrir Caisse • Open POS | `font-bold text-xs text-zinc-950 font-sans` | `sheen-btn inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 hover:bg-zinc-200 active:scale-[0.98] shadow-md cursor-pointer` | يفتح شاشة الكاشير السريعة `/[locale]/pos` |
| `dash_kpi_card_sales` | KPI Card | `dashboard/page.tsx` [157–172] | مبيعات اليوم الإجمالية بالدرهم (MAD) | `font-black text-2xl text-titanium-gradient font-mono tracking-tight` | بطاقة مونوكرومية `rounded-3xl border border-white/10 surface-obsidian hover:border-white/20 p-5 shadow-lg relative overflow-hidden` | يعرض `totalSalesMad` المحدث لحظياً من مبيعات اليوم |
| `dash_kpi_card_transactions` | KPI Card | `dashboard/page.tsx` [174–188] | عدد المعاملات المكتملة • Transactions | `font-black text-2xl text-titanium-gradient font-mono tracking-tight` | بطاقة مونوكرومية `rounded-3xl border border-white/10 surface-obsidian hover:border-white/20 p-5 shadow-lg relative overflow-hidden` | يعرض `salesCount` لعدد التذاكر الصادرة |
| `dash_kpi_card_products` | KPI Card | `dashboard/page.tsx` [189–204] | عدد المنتجات في الكتالوج • Articles | `font-black text-2xl text-titanium-gradient font-mono tracking-tight` | بطاقة مونوكرومية `rounded-3xl border border-white/10 surface-obsidian hover:border-white/20 p-5 shadow-lg relative overflow-hidden` | يعرض `productsCount` الكلي للسلع المسجلة |
| `dash_canvas_commerce_overlay` | Kinetic Canvas | `FloatingCommerceCanvas.tsx` [1–114] | خلفية المتجهات التجارية اللوجستية | غير نصي (SVG Art) | `absolute inset-0 pointer-events-none select-none opacity-[0.04]` | يمنح اللوحة عمقاً حركياً خفيفاً دون التأثير على الأداء |

---

## 2. كتالوج المنتجات ومودال الإضافة والتعديل الكامل (`/dashboard/products`)

### جدول 2.1: شريط الفلاتر وجدول المنتجات العام (`products/page.tsx`)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `prod_btn_create_new` | Button | `products/page.tsx` [120–135] | + إضافة منتج جديد • + Nouveau Produit | `font-bold text-xs text-zinc-950 font-sans` | `sheen-btn px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 active:scale-95 cursor-pointer shadow-md flex items-center gap-2` | يفتح نافذة إضافة منتج جديد في الكتالوج |
| `prod_input_search_query` | Input (Search) | `products/page.tsx` [150–165] | ابحث بالاسم، الباركود أو المرجع... | `font-mono text-xs text-white placeholder-zinc-500` | `w-full sm:w-80 h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.65)]` | فلترة لحظية لجدول المنتجات من الذاكرة المؤقتة |
| `prod_select_category_filter` | Select | `products/page.tsx` [170–185] | تصفية حسب الفئة • Catégorie | `font-sans text-xs text-white` | `h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40 cursor-pointer` | يصفي المنتجات حسب الصنف المختار |
| `prod_col_thumbnail` | Table Header | `products/page.tsx` [325–328] | الصورة • Image • Photo | `font-mono text-xs uppercase text-zinc-400` | عمود الجدول بعرض ثابت `w-14` | يعرض صورة المنتج المصغرة بصيغة WebP |
| `prod_col_name` | Table Header | `products/page.tsx` [329–332] | اسم المنتج • Désignation • Name | `font-mono text-xs uppercase text-zinc-400` | عمود الجدول الرئيسي | يفرز المنتجات أبجدياً |
| `prod_col_barcode` | Table Header | `products/page.tsx` [333–336] | الباركود (EAN-13 / SKU) | `font-mono text-xs uppercase text-zinc-400` | عمود الجدول البرمجي | يعرض شفرة الباركود مع ميزة النسخ السريع |
| `prod_col_retail_price` | Table Header | `products/page.tsx` [337–340] | سعر التجزئة (MAD) • Prix Détail | `font-mono text-xs uppercase text-zinc-400 text-end` | عمود التسعير الأساسي | يعرض سعر البيع للجمهور بالدرهم |
| `prod_col_wholesale_price` | Table Header | `products/page.tsx` [341–344] | سعر الجملة (MAD) • Prix Gros | `font-mono text-xs uppercase text-zinc-400 text-end` | عمود تسعير الجملة | يعرض سعر البيع للمحلات والكميات الكبيرة |
| `prod_col_stock_qty` | Table Header | `products/page.tsx` [345–348] | المخزون المتوفر • Stock Dispo | `font-mono text-xs uppercase text-zinc-400 text-center` | عمود مراقبة الكميات | يعرض الرصيد الحالي مع تنبيه لوني عند انخفاضه |
| `prod_btn_row_edit` | Button | `products/page.tsx` [410–420] | تعديل • Modifier • Edit | أيقونة `Edit3 w-3.5 h-3.5 text-zinc-300` | `p-1.5 rounded-lg border border-white/10 hover:bg-white/[0.08] active:scale-90 text-zinc-300 hover:text-white cursor-pointer` | يفتح نافذة تعديل بيانات المنتج المختار |
| `prod_btn_row_delete` | Button | `products/page.tsx` [425–435] | حذف • Supprimer • Delete | أيقونة `Trash2 w-3.5 h-3.5 text-red-400` | `p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 active:scale-90 text-red-400 cursor-pointer` | يحذف المنتج بعد تأكيد الحذف من `/api/v1/products/[id]` |

---

### جدول 2.2: كل حقل وعنصر تحكم داخل نافذة إضافة/تعديل المنتج (Product Create/Edit Modal Controls)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `modal_prod_image_dropzone` | Dropzone | `products/page.tsx` [520–540] | سحب أو اختيار صورة المنتج (WebP مضغوطة تلقائياً) | `font-semibold text-xs text-zinc-300` | `w-full h-28 rounded-xl border border-dashed border-white/20 hover:border-white/40 bg-zinc-900/60 flex flex-col items-center justify-center cursor-pointer` | يضغط الصورة محلياً لأقل من 40KB عبر `compressImage()` |
| `modal_prod_input_name` | Input (Text) | `products/page.tsx` [550–560] | اسم المنتج التجاري • Nom du Produit | `font-sans font-bold text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.65)]` | إلزامي، يربط بـ `formData.name` |
| `modal_prod_input_barcode` | Input (Text) | `products/page.tsx` [565–575] | كود الباركود EAN-13 أو الرمز التعريفي SKU | `font-mono text-xs text-white uppercase` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بـ `formData.sku` و `formData.barcode` |
| `modal_prod_btn_gen_barcode` | Button | `products/page.tsx` [576–585] | توليد باركود تلقائي • Générer Code | `font-mono font-bold text-[10px] text-zinc-300` | `px-2.5 py-1 rounded-lg border border-white/10 bg-zinc-800 hover:bg-zinc-700 active:scale-95 cursor-pointer` | يولد باركود قياسي عشوائي 13 خانة متوافق مع الموازين |
| `modal_prod_select_category` | Select | `products/page.tsx` [590–605] | الفئة أو التصنيف • Catégorie de l'article | `font-sans text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40 cursor-pointer` | يربط بـ `formData.categoryId` |
| `modal_prod_input_retail_price`| Input (Number) | `products/page.tsx` [610–620] | سعر البيع بالتجزئة (MAD) • Prix de Vente | `font-mono font-black text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بـ `formData.retailPrice` |
| `modal_prod_input_wholesale_price`| Input (Number) | `products/page.tsx` [625–635] | سعر البيع بالجملة (MAD) • Prix de Gros | `font-mono font-bold text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بـ `formData.wholesalePrice` المعتمد في السلة |
| `modal_prod_input_cost_price` | Input (Number) | `products/page.tsx` [640–650] | سعر التكلفة والشراء (MAD) • Prix d'Achat | `font-mono text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بـ `formData.costPrice` لحساب هامش الربح |
| `modal_prod_select_unit` | Select | `products/page.tsx` [655–670] | وحدة القياس • Unité (قطعة، كغ، لتر، متر، علبة) | `font-sans text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40 cursor-pointer` | يربط بـ `ProductUnit` (`piece`, `kg`, `liter`, `meter`, `pack`) |
| `modal_prod_input_stock_initial`| Input (Number) | `products/page.tsx` [675–685] | الكمية الأولية في المخزون • Quantité Initiale | `font-mono font-bold text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | ينشئ سجل رصيد المخزون الأولي في `StockLevel` |
| `modal_prod_input_min_stock` | Input (Number) | `products/page.tsx` [690–700] | حد إعادة الطلب والتنبيه • Seuil d'Alerte | `font-mono text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | ينبه التاجر عند انخفاض الرصيد عن هذا الحد |
| `modal_prod_select_tva` | Select | `products/page.tsx` [705–720] | نسبة الضريبة DGI TVA (0%, 7%, 10%, 14%, 20%) | `font-mono text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40 cursor-pointer` | معدل الضريبة على القيمة المضافة المغربية المعتمد |
| `modal_prod_btn_cancel` | Button | `products/page.tsx` [730–736] | إلغاء • Annuler • Cancel | `font-semibold text-xs text-zinc-400 hover:text-white` | `px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/[0.05] active:scale-95 cursor-pointer` | يغلق النافذة دون حفظ التغييرات |
| `modal_prod_btn_submit` | Button (Submit) | `products/page.tsx` [737–750] | حفظ المنتج في الكتالوج • Enregistrer Produit | `font-bold text-xs text-zinc-950 font-sans` | `sheen-btn px-6 py-2.5 bg-white hover:bg-zinc-200 rounded-xl active:scale-95 cursor-pointer shadow-lg flex items-center gap-2` | يرسل البيانات لـ `/api/v1/products` ويحدث جدول المنتجات |

---

## 3. إدارة المخزون الحي وتوصيات التموين الذكية (`/dashboard/inventory`)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `inv_kpi_total_cost_val` | KPI Card | `inventory/page.tsx` [110–125] | القيمة الإجمالية للمخزون بالتكلفة (MAD) | `font-black text-2xl text-titanium-gradient font-mono tracking-tight` | بطاقة مونوكرومية `rounded-3xl border border-white/10 surface-obsidian p-5 shadow-lg` | تحسب حاصل ضرب الكميات في سعر التكلفة |
| `inv_kpi_total_retail_val` | KPI Card | `inventory/page.tsx` [126–140] | القيمة السوقية للمخزون بسعر البيع (MAD) | `font-black text-2xl text-titanium-gradient font-mono tracking-tight` | بطاقة مونوكرومية `rounded-3xl border border-white/10 surface-obsidian p-5 shadow-lg` | تحسب القيمة الإجمالية عند البيع التام |
| `inv_kpi_low_stock_count` | KPI Card | `inventory/page.tsx` [141–155] | عدد الأصناف الموشكة على النفاد | `font-black text-2xl font-mono text-amber-400` | بطاقة تنبيهية `rounded-3xl border border-amber-500/20 bg-amber-500/[0.04] p-5 shadow-lg` | تعرض عدد المنتجات التي تقل عن حد الأمان |
| `inv_tab_filter_all` | Tab Button | `inventory/page.tsx` [180–188] | كافة مستويات المخزون • Tous les Stocks | `font-bold text-xs text-white` | النشط: `bg-white text-zinc-950 px-3.5 py-1.5 rounded-xl font-bold` | يعرض كافة السلع المسجلة في المخازن |
| `inv_tab_filter_low` | Tab Button | `inventory/page.tsx` [189–198] | تنبيهات النقص وإعادة الطلب • Alertes Rupture | `font-bold text-xs text-amber-400` | الخامل: `text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-xl cursor-pointer` | يصفي الجدول على المواد التي تحتاج تزويداً عاجلاً |
| `inv_badge_reorder_qty` | Reorder Badge | `inventory/page.tsx` [250–265] | كمية الطلب المقترحة: +{qty} وحدة | `font-mono font-bold text-[11px] text-zinc-300` | شارة مونوكرومية أنيقة `px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 flex items-center gap-1.5` | توصية الذكاء الاصطناعي لكمية التموين المثالية |
| `inv_btn_fast_plus` | Button | `inventory/page.tsx` [290–298] | تعديل سريع زيادة (+) • Stock In | أيقونة `Plus w-3.5 h-3.5 text-zinc-200` | `w-7 h-7 rounded-lg border border-white/10 bg-zinc-800 hover:bg-zinc-700 active:scale-90 flex items-center justify-center cursor-pointer` | يزيد رصيد المخزون بوحدة واحدة مباشرة في السجل |
| `inv_btn_fast_minus` | Button | `inventory/page.tsx` [299–308] | تعديل سريع خصم (-) • Stock Out | أيقونة `Minus w-3.5 h-3.5 text-zinc-200` | `w-7 h-7 rounded-lg border border-white/10 bg-zinc-800 hover:bg-zinc-700 active:scale-90 flex items-center justify-center cursor-pointer` | يخصم وحدة من رصيد المخزون مع توثيق الحركة |
| `inv_empty_state_radar` | Empty State Box | `inventory/page.tsx` [295–315] | لا توجد منتجات في المخزون حالياً • Aucun produit en stock | `font-bold text-sm text-white` + `font-bold text-xs text-zinc-950` | حاوية مونوكرومية عريضة `py-14` مع رادار حركي 3D وزر `+ إضافة منتج جديد` مونوكرومي أبيض | يوجه التاجر مباشرة إلى `/dashboard/products` لإضافة المنتجات عند فراغ المخزون |
