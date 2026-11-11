# أطلس الواجهات والتحكم والتيبوغرافيا — المجلد الثاني
## 02. محطة البيع، سلة التسوق والنوافذ المنبثقة التخصصية (POS Terminal, Cart & Modals)

> **المسار المصدري المشمول:** `src/app/[locale]/pos/page.tsx` • `src/components/pos/ProductSearch.tsx` • `CategoryFilter.tsx` • `ProductGrid.tsx` • `CartPanel.tsx` • `IndustryWorkspaceModal.tsx` • `StockTransferModal.tsx` • `UnifiedCheckoutModal.tsx` • `CashShiftModal.tsx` • `CustomerModal.tsx` • `HeldCartsModal.tsx`

---

## 1. شريط البحث السريع والباركود والميزان الإلكتروني (`ProductSearch.tsx`)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `pos_input_search_barcode` | Input (Search) | `ProductSearch.tsx` [45–75] | امسح الباركود أو اكتب اسم المنتج...<br>Scanner ou rechercher article... | `font-mono text-sm text-white placeholder-zinc-500` | `w-full h-12 px-4 bg-[#0B0B0E] border border-white/[0.12] rounded-2xl focus:border-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.65)]` | بحث فوري بزمن 0ms في الكاش المحلي وقراءة ماسح الباركود والـ Douchette |
| `pos_btn_clear_search` | Button | `ProductSearch.tsx` [76–85] | تفريغ البحث • Effacer • Clear | أيقونة `X w-4 h-4 text-zinc-400` | `absolute end-3 top-3.5 text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer` | يفرغ حقل البحث ويعيد إظهار كافة المنتجات |
| `pos_badge_scale_detected` | Badge | `ProductSearch.tsx` [96–115] | ميزان إلكتروني EAN 20-29 • Balance Active | `font-mono font-bold text-[10px] text-emerald-400` | شارة منبثقة `bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1` | يتعرف آلياً على كود الميزان ويستخرج الوزن بالجرام والسعر الصافي |
| `pos_pill_f1_cash` | Button (Pill) | `ProductSearch.tsx` [130–140] | F1 نقداً • F1 Espèces • F1 Cash | `font-mono font-bold text-[11px] text-zinc-300` | `px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 hover:bg-white/[0.08] active:scale-95 cursor-pointer` | اختصار لوحة المفاتيح لفتح الدفع النقدي المباشر |
| `pos_pill_f2_split` | Button (Pill) | `ProductSearch.tsx` [141–150] | F2 دفع مجزأ • F2 Mixte • F2 Split | `font-mono font-bold text-[11px] text-zinc-300` | `px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 hover:bg-white/[0.08] active:scale-95 cursor-pointer` | اختصار لتقسيم المبلغ بين كاش وبطاقة بنكية |
| `pos_pill_f3_discount` | Button (Pill) | `ProductSearch.tsx` [151–160] | F3 خصم • F3 Remise • F3 Discount | `font-mono font-bold text-[11px] text-zinc-300` | `px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 hover:bg-white/[0.08] active:scale-95 cursor-pointer` | يفتح نافذة تطبيق خصم نسبي أو مبلغ ثابت |
| `pos_pill_f4_customer` | Button (Pill) | `ProductSearch.tsx` [161–170] | F4 عميل • F4 Client • F4 Customer | `font-mono font-bold text-[11px] text-zinc-300` | `px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 hover:bg-white/[0.08] active:scale-95 cursor-pointer` | يفتح قائمة ربط الفاتورة بعميل مسجل للكريدي أو الولاء |

---

## 2. شريط التصنيفات وشبكة بطاقات المنتجات (`CategoryFilter.tsx` & `ProductGrid.tsx`)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `pos_cat_tab_all` | Tab Button | `CategoryFilter.tsx` [30–38] | كافة المنتجات • Tous les articles • All Items | `font-bold text-xs text-white` | النشط: `bg-white text-zinc-950 font-bold px-3.5 py-1.5 rounded-xl shadow-xs` | يعرض جميع عناصر الكتالوج المخزنة في `usePosStore` |
| `pos_cat_tab_dynamic` | Tab Button | `CategoryFilter.tsx` [39–55] | اسم الفئة (خضر، مشروبات، بقالة...) | `font-medium text-xs text-zinc-400` | الخامل: `bg-zinc-900/80 border border-white/10 text-zinc-300 hover:text-white px-3.5 py-1.5 rounded-xl cursor-pointer` | يصفي مصفوفة المنتجات حسب معرّف `categoryId` |
| `pos_prod_card_container` | Card (Button) | `ProductGrid.tsx` [60–90] | بطاقة المنتج الميدانية | غير نصي | `group relative rounded-2xl border border-white/10 bg-zinc-900/60 surface-obsidian hover:border-white/30 p-3 flex flex-col justify-between active:scale-[0.97] transition-all cursor-pointer` | ينقر لإضافة المنتج فورياً لسلة التسوق مع صوت خافت |
| `pos_prod_card_image` | Image Box | `ProductGrid.tsx` [91–105] | صورة المنتج المصغرة (WebP) | غير نصي | `w-full h-24 rounded-xl bg-zinc-950 object-cover border border-white/5 overflow-hidden mb-2` | يعرض رابط الصورة المضغوطة أو أيقونة تصنيف افتراضية |
| `pos_prod_card_title` | Heading | `ProductGrid.tsx` [106–112] | اسم المنتج التجاري | `font-bold text-xs text-white truncate` | نص عنوان المنتج | يعرض `product.name` |
| `pos_prod_card_price` | Price Badge | `ProductGrid.tsx` [113–120] | السعر بالدرهم: `XX.XX MAD` | `font-mono font-black text-xs text-white` | شارة سعرية `px-2 py-0.5 rounded bg-zinc-950 border border-white/10 text-titanium-gradient` | يعرض `unit_price` في وضع التجزئة و `wholesale_price` في الجملة |
| `pos_prod_card_stock_pill` | Stock Pill | `ProductGrid.tsx` [121–130] | الكمية المتوفرة: `{qty} وحدة` | `font-mono text-[10px] text-zinc-400` | مؤشر رصيد المخزون اللحظي | يقرأ من `stockLevels` وينبه باللون الأحمر عند نفاد الكمية |

---

## 3. لوحة سلة المشتريات والحسابات (`CartPanel.tsx`)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `cart_mode_toggle_retail` | Toggle Button | `CartPanel.tsx` [80–95] | تجزئة • Détail • Retail | `font-bold text-xs text-white` | النشط: `bg-white text-zinc-950 rounded-lg px-3 py-1 font-bold` | يضبط وضع التسعير على التجزئة العادية |
| `cart_mode_toggle_wholesale` | Toggle Button | `CartPanel.tsx` [96–110] | جملة • Gros • Wholesale | `font-bold text-xs text-zinc-400` | الخامل: `text-zinc-400 hover:text-white px-3 py-1` | يبدل أسعار كافة العناصر فورياً لأسعار الجملة المخفضة |
| `cart_empty_scene_trolley` | Kinetic SVG | `CartPanel.tsx` [145–195] | عربة تسوق سوبرماركت تفاعلية عائمة | `font-black text-sm text-white` + `text-xs text-zinc-500` | مشهد عربة SVG مع دوران العجلات عند مرور الفأرة وفيزياء عائمة `animate-float` داخل شارة مونوكرومية | حالة الفراغ الحركية المعتمدة للسلة |
| `cart_item_btn_minus` | Button | `CartPanel.tsx` [240–250] | إنقاص الكمية (-) • Diminuer | أيقونة `Minus w-3.5 h-3.5 text-zinc-300` | `w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-90 flex items-center justify-center cursor-pointer` | ينقص كمية المنتج بمقدار 1 أو يحذفه إذا بلغت صفر |
| `cart_item_input_qty` | Input (Number) | `CartPanel.tsx` [251–260] | كمية العنصر المباع | `font-mono font-bold text-xs text-white text-center` | `w-12 h-7 bg-zinc-950 border border-white/10 rounded-lg text-center focus:border-white/40` | يربط بكمية السلعة في السلة مع دعم الكسور للأوزان |
| `cart_item_btn_plus` | Button | `CartPanel.tsx` [261–270] | زيادة الكمية (+) • Augmenter | أيقونة `Plus w-3.5 h-3.5 text-zinc-300` | `w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-90 flex items-center justify-center cursor-pointer` | يزيد كمية المنتج بمقدار 1 |
| `cart_item_btn_remove` | Button | `CartPanel.tsx` [280–290] | حذف العنصر • Supprimer • Remove | أيقونة `Trash2 w-3.5 h-3.5 text-red-400` | `p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 cursor-pointer transition` | يحذف السطر من سلة المشتريات بالكامل |
| `cart_summary_total_mad` | Display | `CartPanel.tsx` [340–355] | الإجمالي النهائي: `XX.XX MAD` | `font-black text-2xl font-mono text-titanium-gradient` | حاوية سفلية عريضة `p-4 rounded-2xl bg-zinc-950 border border-white/10` | يحسب المجموع الصافي شاملاً الضريبة والخصم |
| `cart_btn_checkout_cta` | Button (Primary) | `CartPanel.tsx` [380–420] | إنهاء البيع والدفع • Encaisser & Facturer | `font-black text-sm text-zinc-950 font-sans` | `sheen-btn w-full h-14 bg-white hover:bg-zinc-200 rounded-2xl active:scale-[0.98] cursor-pointer shadow-lg flex items-center justify-center gap-2` | يفتح نافذة الدفع المتعددة `UnifiedCheckoutModal` |

---

## 4. نافذة الدفع الموحدة المتعددة والكريدي (`UnifiedCheckoutModal.tsx`)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `checkout_card_method_cash` | Card (Button) | `UnifiedCheckoutModal.tsx` [110–135] | نقداً • Espèces • Cash | `font-bold text-xs text-white` | بطاقة تفاعلية `p-3.5 rounded-xl border border-white/10 bg-zinc-900 hover:bg-white/[0.08] active:scale-95 cursor-pointer` | يحدد طريقة الدفع نقداً مع تفعيل حاسبة الصرف |
| `checkout_card_method_tpe` | Card (Button) | `UnifiedCheckoutModal.tsx` [136–165] | بطاقة بنكية TPE • Carte Bancaire | `font-bold text-xs text-white` | بطاقة تفاعلية مع كاشف BIN البنكي المغربي | يربط بجهاز الدفع الإلكتروني الشبكي |
| `checkout_card_method_karne` | Card (Button) | `UnifiedCheckoutModal.tsx` [166–195] | كناش الكريدي • Carnet Crédit | `font-bold text-xs text-amber-400` | بطاقة ذهبية محاطة بحدود `border-amber-500/30 bg-amber-500/[0.05]` | يسجل المبلغ كدين على حساب العميل المختار |
| `checkout_card_method_split` | Card (Button) | `UnifiedCheckoutModal.tsx` [196–220] | دفع مجزأ • Paiement Mixte | `font-bold text-xs text-white` | بطاقة مونوكرومية مزدوجة | يقسم المبلغ الإجمالي بين عدة وسائل دفع |
| `checkout_pill_cash_20` | Pill (Button) | `UnifiedCheckoutModal.tsx` [245–252] | 20 د.م • 20 MAD | `font-mono font-bold text-xs text-white` | `px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-90 cursor-pointer` | يملأ حقل المبلغ المدفوع بـ 20 درهم |
| `checkout_pill_cash_50` | Pill (Button) | `UnifiedCheckoutModal.tsx` [253–260] | 50 د.م • 50 MAD | `font-mono font-bold text-xs text-white` | `px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-90 cursor-pointer` | يملأ حقل المبلغ المدفوع بـ 50 درهم |
| `checkout_pill_cash_100` | Pill (Button) | `UnifiedCheckoutModal.tsx` [261–268] | 100 د.م • 100 MAD | `font-mono font-bold text-xs text-white` | `px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-90 cursor-pointer` | يملأ حقل المبلغ المدفوع بـ 100 درهم |
| `checkout_pill_cash_200` | Pill (Button) | `UnifiedCheckoutModal.tsx` [269–276] | 200 د.م • 200 MAD | `font-mono font-bold text-xs text-white` | `px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-90 cursor-pointer` | يملأ حقل المبلغ المدفوع بـ 200 درهم |
| `checkout_input_cash_received` | Input (Money) | `UnifiedCheckoutModal.tsx` [285–298] | المبلغ المستلم من الزبون • Montant Reçu | `font-mono font-black text-sm text-white` | `w-full h-11 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يحسب الباقي الفوري الواجب إرجاعه للمشتري |
| `checkout_display_change_due` | Display Box | `UnifiedCheckoutModal.tsx` [305–320] | الباقي للزبون: `XX.XX MAD` • Rendu Monnaie | `font-mono font-black text-lg text-emerald-400` | حاوية زمردية خافتة `p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center` | يوضح الصرف المتبقي بالدرهم بدقة |
| `checkout_btn_confirm_submit` | Button (Submit) | `UnifiedCheckoutModal.tsx` [385–420] | تأكيد وطباعة التذكرة DGI • Valider & Imprimer | `font-black text-sm text-zinc-950 font-sans` | `sheen-btn w-full h-12 bg-white hover:bg-zinc-200 rounded-xl active:scale-[0.98] cursor-pointer shadow-lg flex items-center justify-center gap-2` | ينشئ سجل البيع في `/api/v1/sales` ويرسل أمر الطباعة لـ ESC/POS |

---

## 5. نوافذ القطاعات ونقل المخزون (`IndustryWorkspaceModal` & `StockTransferModal`)

| معرّف العنصر (Element ID) | نوع العنصر | الملف والأسطر | التسمية والرمز (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والحاوية (Surfaces & Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `sector_modal_tab_grocery` | Sector Card | `IndustryWorkspaceModal.tsx` [80–95] | بقالة وسوبرماركت • Épicerie | `font-bold text-xs text-white` | بطاقة مونوكرومية مع أيقونة سلة تسوق `ShoppingBag` | يضبط وضع المتجر على `grocery` |
| `sector_modal_tab_butchery` | Sector Card | `IndustryWorkspaceModal.tsx` [96–110] | مجزرة ولحوم • Boucherie | `font-bold text-xs text-white` | بطاقة مونوكرومية مع أدوات الميزان الآلي | يضبط وضع المتجر على `butchery` ويحدث الواجهة |
| `sector_modal_tab_restaurant` | Sector Card | `IndustryWorkspaceModal.tsx` [111–125] | مطعم ومقهى • Restaurant & KDS | `font-bold text-xs text-white` | بطاقة مونوكرومية مع خريطة الطاولات وشاشة المطبخ | يضبط وضع المتجر على `restaurant` |
| `sector_modal_tab_bakery` | Sector Card | `IndustryWorkspaceModal.tsx` [126–140] | مخبزة وحلويات • Boulangerie | `font-bold text-xs text-white` | بطاقة مونوكرومية مع مواعيد الخبز الساخن | يضبط وضع المتجر على `bakery` |
| `sector_modal_tab_fashion` | Sector Card | `IndustryWorkspaceModal.tsx` [141–155] | أزياء وملابس • Mode & Prêt-à-Porter | `font-bold text-xs text-white` | بطاقة مونوكرومية مع مصفوفة المقاسات والألوان | يضبط وضع المتجر على `fashion` |
| `sector_modal_tab_tech` | Sector Card | `IndustryWorkspaceModal.tsx` [156–170] | إلكترونيات • Tech & IMEI | `font-bold text-xs text-white` | بطاقة مونوكرومية مع حقول تتبع أرقام الـ IMEI | يضبط وضع المتجر على `tech` |
| `sector_modal_tab_wholesale` | Sector Card | `IndustryWorkspaceModal.tsx` [171–185] | جملة وتوزيع • Grossiste B2B | `font-bold text-xs text-white` | بطاقة مونوكرومية مع مصفوفة الكراتين والحزم | يضبط وضع المتجر على `wholesale` |
| `transfer_select_source_store` | Select | `StockTransferModal.tsx` [60–75] | متجر الإرسال (المصدر) • Magasin Source | `font-mono text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يحدد الفرع المنقول منه البضاعة |
| `transfer_select_target_store` | Select | `StockTransferModal.tsx` [80–95] | متجر الاستلام (الوجهة) • Magasin Destinataire | `font-mono text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يحدد الفرع المستقبل للبضاعة |
| `transfer_input_quantity` | Input (Number) | `StockTransferModal.tsx` [100–115] | الكمية المحولة • Quantité Transférée | `font-mono font-bold text-xs text-white` | `w-full h-10 px-3.5 bg-[#0B0B0E] border border-white/[0.12] rounded-xl focus:border-white/40` | يربط بكمية التحويل المنفذة عبر `/api/v1/inventory/transfers` |
| `transfer_btn_confirm_submit` | Button (Submit) | `StockTransferModal.tsx` [130–145] | تأكيد نقل البضاعة بين الفروع • Transférer | `font-bold text-xs text-zinc-950 font-sans` | `sheen-btn px-6 py-2.5 bg-white hover:bg-zinc-200 rounded-xl active:scale-95 cursor-pointer shadow-md` | يخصم الكمية من المصدر ويضيفها للوجهة لحظياً |


---

## 6. مساحات العمل الحية للقطاعات السبعة (`IndustryWorkspaceModal.tsx` & Chameleon POS)

### جدول 6.1: قطاع المطاعم والمقاهي (Restaurant Workspace & KDS)

| معرّف العنصر (Element ID) | نوع العنصر | التسمية والوظيفة (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والفيزياء (Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `rest_mode_dine_in` | Mode Pill | محلي (بالصالة) • Sur Place • Dine In | `font-bold text-xs` | `keycap-3d py-1.5 px-3 rounded-xl border` | يضبط نمط الطلب على التناول داخل المطعم |
| `rest_mode_takeaway` | Mode Pill | سفري • À Emporter • Takeaway | `font-bold text-xs` | `keycap-3d py-1.5 px-3 rounded-xl border` | يضبط نمط الطلب على الاستلام والمغادرة |
| `rest_mode_delivery` | Mode Pill | توصيل • Livraison • Delivery | `font-bold text-xs` | `keycap-3d py-1.5 px-3 rounded-xl border` | يضبط نمط الطلب على التوصيل الخارجي |
| `rest_guest_stepper` | Stepper | عدد الزبائن (1-10) • Couverts | `font-mono font-bold text-xs` | `keycap-3d w-7 h-7 rounded-lg border` | يحدد عدد الضيوف في تذكرة الطاولة والمطبخ |
| `rest_table_grid_btn` | Table Card | طاولات T-01 إلى T-12 وتراس 1-4 | `font-mono font-black text-xs` | `keycap-3d p-3 rounded-2xl border h-24 flex flex-col justify-between` | يربط الفاتورة بـ `selectedTableId` ويعرض وقت الجلوس والمبلغ |
| `rest_btn_kds_dispatch` | Button (Action) | إرسال للمطبخ (KDS) • Envoyer Cuisine | `font-black text-xs text-zinc-950 font-sans` | `keycap-3d px-4 py-2 bg-white text-zinc-950 rounded-xl shadow-xs` | يرسل تذكرة الطلبات إلى `/api/v1/kds` |
| `rest_btn_split_bill` | Button | تقسيم الحساب (Split Bill) | `font-bold text-xs text-white` | `keycap-3d px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700` | يفتح حاسبة تجزيء المبلغ على 2 إلى 6 أشخاص |

### جدول 6.2: قطاع المجازر واللحوم (Butchery & Digital LCD Scale)

| معرّف العنصر (Element ID) | نوع العنصر | التسمية والوظيفة (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والفيزياء (Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `butchery_lcd_display` | LCD Screen | شاشة الميزان الرقمية (الوزن × السعر = الإجمالي) | `font-mono font-black text-4xl text-white tabular-nums` | `p-5 rounded-2xl bg-zinc-950 border border-zinc-800` | يحسب المجموع الفوري بدقة 3 أرقام عشرية |
| `butchery_tare_pills` | Pill Group | معايرة الوزن الفارغ (-15g sac, -30g barquette, -50g) | `font-mono text-xs font-bold` | `keycap-3d px-3 py-1.5 rounded-xl border` | يخصم وزن الكيس أو الصحن من الوزن الإجمالي |
| `butchery_weight_presets` | Pill Grid | أوزان سريعة (250g, 500g, 750g, 1kg, 1.5kg, 2kg) | `font-mono font-bold text-xs` | `keycap-3d py-2 rounded-xl border` | يملأ الوزن المحدد فورياً |
| `butchery_cut_tags` | Tag Grid | طريقة التقطيع (كفتة، ستيك، طاجين، متبل، كوطليط) | `font-bold text-xs` | `keycap-3d py-2 rounded-xl border` | يرفق نوع التقطيع في ملاحظات السطر بالفاتورة |

### جدول 6.3: قطاع المخابز والحلويات (Bakery & Custom Cake Reservation)

| معرّف العنصر (Element ID) | نوع العنصر | التسمية والوظيفة (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والفيزياء (Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `bakery_oven_batch_badge` | Badge | دفعة الخبز الساخنة (في غضون 14 دقيقة) | `font-mono font-bold text-xs text-white` | `p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800` | يعرض توقيت خروج الخبز الطازج القادم للزبائن |
| `bakery_box_builder_cards` | Card Group | علب حلويات مشكلة (250g, 500g, 1kg, Plateau) | `font-black text-xs` | `keycap-3d p-3 rounded-2xl border text-center` | يضيف بلاطو مشكل بسعره المحدد مباشرة إلى السلة |
| `bakery_cake_res_form` | Form Box | استمارة حجز طورطة المناسبات والعبارة والعربون | `font-sans text-xs` | `p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800` | يسجل اسم الزبون، العبارة، ويضيف العربون للسلة |

### جدول 6.4: قطاع الملابس والأحذية (Fashion & Size Matrix)

| معرّف العنصر (Element ID) | نوع العنصر | التسمية والوظيفة (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والفيزياء (Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `fashion_size_matrix_btn` | Button Group | مقاسات الملابس (XS-XXL) والأحذية (36-45) | `font-mono font-black text-xs` | `keycap-3d w-12 h-11 rounded-xl border` | يربط المقاس بالعنصر المختار بالسلة |
| `fashion_color_swatches` | Color Swatches | عينات الألوان (أسود، أبيض، رمادي، بيج، أزرق، أحمر) | `font-bold text-xs` | `keycap-3d p-2.5 rounded-xl border flex items-center gap-2` | يربط اللون المختار بملاحظة الصنف |
| `fashion_gift_voucher_btn` | Toggle | تذكرة تبديل بدون سعر (صالحة 15 يوماً) | `font-bold text-xs` | `keycap-3d px-3 py-1.5 rounded-xl border` | يطبع إيصال هدية خالي من الأسعار للاستبدال |

### جدول 6.5: قطاع التكنولوجيا والصيانة (Tech, IMEI & Repair Intake)

| معرّف العنصر (Element ID) | نوع العنصر | التسمية والوظيفة (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والفيزياء (Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `tech_input_imei_sn` | Input (Text) | الرقم التسلسلي IMEI (15 خانة) | `font-mono text-sm text-white` | `w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800` | يدقق ويربط الـ IMEI بالمنتج لتتبع الكفالة |
| `tech_warranty_pills` | Pill Group | مدة الضمان (بدون، 3 شهور، 6 شهور، سنة، سنتين) | `font-mono font-black text-xs` | `keycap-3d py-2.5 rounded-xl border` | يثبت مدة الكفالة القانونية على إيصال الشراء |
| `tech_repair_intake_form` | Form Box | بون صيانة واستلام جهاز (SAV) وعربون الإصلاح | `font-sans text-xs` | `p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800` | يسجل العطل وتكلفة الإصلاح التقديرية ويضيف العربون |

### جدول 6.6: قطاع تجارة الجملة (Wholesale Multipliers & BL)

| معرّف العنصر (Element ID) | نوع العنصر | التسمية والوظيفة (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والفيزياء (Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `wholesale_multiplier_btns` | Button Grid | معاملات التعبئة (x1, x6 Demi-Pack, x12 Carton, x24 Colis, x50) | `font-mono font-black text-base` | `keycap-3d p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-center` | يضاعف الكمية ويحول التسعير لـ Wholesale فورياً |
| `wholesale_bl_mode_toggle` | Toggle | وصل تسليم (Bon de Livraison) vs تذكرة | `font-bold text-xs` | `keycap-3d px-3 py-1 rounded-lg border` | يبدل صيغة الإيصال إلى BL تجاري رسمي |
| `wholesale_input_buyer_ice` | Input (Text) | رقم التعريف الموحد للمشتري ICE (15 خانة) | `font-mono text-xs text-white` | `w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800` | يطبع ترويسة الشركة المشترية ورقم ICE في الفاتورة |

### جدول 6.7: قطاع البقالة والسوبرماركت (Grocery Express & Consigne)

| معرّف العنصر (Element ID) | نوع العنصر | التسمية والوظيفة (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والفيزياء (Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `grocery_express_shelf_btns` | Button Grid | سلع يومية سريعة (خبز 1.20، حليب 3.50، ماء 6.00، بيض 1.50، كيس 0.10) | `font-bold text-xs` + `font-mono text-zinc-300` | `keycap-3d p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-center` | إضافة بنقرة واحدة للسلة دون الحاجة للباركود |
| `grocery_consigne_gaz_btns` | Button Pair | رهن قنينة الغاز (+100 MAD) وإرجاع الرهن (-100 MAD) | `font-bold text-xs` | `keycap-3d py-2 rounded-lg bg-zinc-900 border border-zinc-700` | يضيف أو يخصم قيمة رهن البوطا من المجموع |
| `grocery_consigne_caisse_btns` | Button Pair | رهن صندوق المشروبات (+15 MAD) وإرجاعه (-15 MAD) | `font-bold text-xs` | `keycap-3d py-2 rounded-lg bg-zinc-900 border border-zinc-700` | يضيف أو يخصم قيمة رهن الصندوق والصناديق |
| `grocery_label_studio_print` | Button (Action) | طباعة ملصق الباركود الحراري 40x30mm | `font-black text-xs text-zinc-950` | `keycap-3d py-2.5 rounded-xl bg-white text-zinc-950 shadow-xs` | يفتح نافذة الطباعة المباشرة لملصقات الرفوف والميزان |

---

## 7. إدارة ورديات الصندوق والتقارير (`CashShiftModal.tsx`)

| معرّف العنصر (Element ID) | نوع العنصر | التسمية والوظيفة (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والفيزياء (Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `cash_shift_input_float` | Input (Money) | رصيد بداية الصندوق (Fond de Caisse) | `font-mono font-black text-lg text-white` | `w-full h-11 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl` | يسجل المبلغ النقدي الافتتاحي في الوردية |
| `cash_shift_btn_open` | Button | فتح الوردية • Ouvrir le Shift | `font-bold text-xs text-zinc-950` | `sheen-btn px-5 py-2.5 bg-white hover:bg-zinc-200 rounded-xl keycap-3d` | ينشئ وردية جديدة عبر `/api/v1/shifts/open` |
| `cash_shift_btn_x_report` | Button | تقرير مؤقت X-Report (طباعة وعرض المبيعات) | `font-bold text-xs text-white` | `keycap-3d px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700` | يولد تقرير منتصف الوردية دون إغلاق الصندوق |
| `cash_shift_btn_z_report` | Button | إغلاق الصندوق النهائي Z-Report | `font-bold text-xs text-white` | `keycap-3d px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700` | يغلق الوردية ويحسب الفارق بين المسجل والمعدود |

---

## 8. السلات المعلقة وقائمة الانتظار (`HeldCartsModal.tsx`)

| معrّف العنصر (Element ID) | نوع العنصر | التسمية والوظيفة (AR / FR / EN) | أنماط التيبوغرافيا (Typography) | أنماط السطح والفيزياء (Micro-Physics) | الترابط الوظيفي ومسار البيانات (State & API) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `held_cart_item_card` | Card Box | بطاقة السلة المعلقة (توقيت التعليق، عدد المواد، الإجمالي) | `font-mono text-xs font-bold text-white` | `p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between items-center` | يعرض بيانات السلة المحفوظة مؤقتاً في الذاكرة |
| `held_cart_btn_restore` | Button | استرجاع السلة لمواصلة البيع • Restaurer | `font-bold text-xs text-zinc-950` | `keycap-3d px-3 py-1.5 bg-white text-zinc-950 rounded-lg shadow-xs` | يعيد تحميل العناصر إلى السلة النشطة |
| `held_cart_btn_discard` | Button | إلغاء السلة المعلقة • Supprimer | `text-xs text-red-400 hover:text-red-300` | `p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer` | يحذف السلة المعلقة نهائياً |
