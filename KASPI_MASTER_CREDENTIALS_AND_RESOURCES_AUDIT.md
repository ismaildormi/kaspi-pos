# دليل الاعتماد والموارد الشامل للانطلاق الفعلي في بيئة الإنتاج
## KASPI POS — Master Credentials, Environment Secrets & Production Resources Audit

> **تاريخ التدقيق:** 2026-11-11  
> **حالة النظام:** جاهز 100% للتشغيل الحي بمجرد إدخال القيم الحقيقية (Zero Broken Code / Production Ready)  
> **الإصدار المتوافق:** Commit `c32e5e4` وما بعده

---

## 1. الفهرس العام للموارد والبيئات (Architecture & Inventory Overview)

تم تصميم بنية **KASPI POS** لتكون معمارية هجينة فائقة الكفاءة (Ultra-Low Cost & High-Resilience Cloud-Edge POS)، حيث تعمل كافة المميزات إما محلياً (Offline First / IndexedDB / Client-Side WebP Compression) أو عبر خدمات سحابية مجانية ومدفوعة تدعم السقوط التلقائي (Multi-Provider Failover).

الجدول التالي يوضح خريطة التكامل وتوزيع المفاتيح:

```mermaid
graph TD
    App[KASPI POS Next.js / Tauri App] --> DB[(PostgreSQL Supabase/Neon)]
    App --> Redis[(Upstash Redis Cache)]
    App --> Mailer[Official Gmail / SMTP Engine]
    App --> AI[Multi-Provider AI & OCR Hub]
    App --> Storage[Multi-Cloud Pool R2 / Supabase / Cloudinary]
    App --> Vault[Owner Profile & Sensitive Vault]
    App --> Desktop[Tauri IPC 127.0.0.1:41732]
```

---

## 2. الجداول التفصيلية للمتغيرات والمفاتيح المطلوبة (Detailed Variable Tables)

### جدول 1: متغيرات البنية التحتية وقاعدة البيانات الأساسية (Core Infrastructure & Database)
*يتم ضبطها في لوحة تحكم الاستضافة السحابية (Vercel / Railway / Docker / `.env.production`).*

| المتغير البرمجي (Env Variable) | النوع والإلزامية | الشرح والوظيفة التشغيلية (Arabic Description) | القيمة الافتراضية / النموذجية |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **إلزامي** (Mandatory) | رابط الاتصال المجمع بقاعدة بيانات PostgreSQL (Prisma Connection Pool). يدعم Supabase Pooler (Port 6543) أو Neon أو AWS RDS. | `postgresql://postgres.[ref]:[pass]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | **إلزامي** للمهاجرات (Prisma Migrations) | رابط الاتصال المباشر غير المجمع بقاعدة البيانات لتنفيذ عمليات `prisma migrate` و DDL دون انقطاع. | `postgresql://postgres.[ref]:[pass]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres` |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | **إلزامي** (Mandatory) | مفتاح تشفير عشوائي بصيغة Base64 بطول 32 بايت لتشفير جلسات JWT والتوكنات السرية. يمكن توليده عبر `openssl rand -base64 32`. | `e.g. 7f8b9a2c3d4e5f6a1b2c3d4e5f6a7b8c` |
| `NEXTAUTH_URL` | **إلزامي** (Mandatory) | النطاق الأساسي للتطبيق المستخدم لإعادة التوجيه الآمن ومطابقة جلسات NextAuth. | `https://kaspi.ma` أو `https://kaspi-pos.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | **إلزامي** (Mandatory) | الرابط العام للتطبيق المستخدم في روابط البريد الإلكتروني، إشعارات الدعم الفني، وربط تطبيق Tauri بسحابة الإنتاج. | `https://kaspi-pos.vercel.app` |
| `NEXT_PUBLIC_API_URL` | اختياري (Recommended) | رابط الـ API العام المباشر في حال فصل واجهة المستخدم عن خادم المعالجة. | فارغ افتراضياً (يعتمد على مسارات Next.js النسبية) |
| `UPSTASH_REDIS_REST_URL` | اختياري (Recommended) | رابط خدمة Upstash Redis السريعة لإدارة الكاش، تحديد معدل الطلبات (Rate Limiting)، والمزامنة اللحظية. | `https://eu1-fitting-xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | اختياري (Recommended) | توكن التوثيق لخدمة Upstash Redis REST API. في حال غيابه، يتراجع النظام تلقائياً للذاكرة المحلية (In-Memory Fallback). | `AXXXAAIncDE...` |
| `NODE_ENV` | نظامي (System) | بيئة التشغيل للتحسين والضغط. | `production` |

---

### جدول 2: محرك البريد الإلكتروني والمعاملات الرسمية عبر Gmail (`mailer.ts`)
*يُستخدم لإرسال رسائل التحقق من الحساب، إيصالات الاشتراك 3D، وتنبيهات الدعم الفني للمالك فورياً.*

| المتغير البرمجي (Env Variable) | النوع والإلزامية | الشرح والوظيفة التشغيلية (Arabic Description) | القيمة الافتراضية / النموذجية |
| :--- | :--- | :--- | :--- |
| `GMAIL_USER` | **إلزامي** للمراسلات الحية | حساب Google Workspace أو بريد Gmail الرسمي للمنصة المستخدم لإرسال الرسائل وتلقي التذاكر. | `official.kaspi.pos@gmail.com` |
| `GMAIL_APP_PASSWORD` | **إلزامي** للمراسلات الحية | كلمة مرور التطبيقات المكونة من 16 حرفاً (Google App Password) مع تفعيل التحقق بخطوتين (2FA). | `xxxx xxxx xxxx xxxx` |
| `FOUNDER_EMAIL` | اختياري (Fallback) | البريد الشخصي للمؤسس/المالك لتلقي النسخ الاحتياطية وإشعارات الطوارئ الفنية. | `founder@kaspi.ma` |
| `ADMIN_EMAIL` | اختياري | البريد الإلكتروني المعتمد لمدير النظام لتسجيل الدخول إلى `/admin`. | `admin@kaspi.ma` |
| `ADMIN_SUPPORT_EMAIL` | اختياري | وجهة إعادة توجيه تذاكر الدعم الفني الواردة من الكاشيرات والتجار. | يتطابق مع `GMAIL_USER` تلقائياً |
| `SMTP_HOST` / `SMTP_PORT` | احتياطي ثانوي (Backup) | إعدادات خادم SMTP بديل (في حال عدم استخدام Gmail المباشر مثل Sendgrid / Resend / Infomaniak). | `smtp.gmail.com` (Port 465 SSL أو 587 TLS) |

#### خطوات استخراج كلمة مرور التطبيقات لـ Gmail (How to Get Gmail App Password):
1. سجل الدخول إلى حساب Google المخصص للمشروع (`myaccount.google.com`).
2. انتقل إلى **الأمان (Security)** وتأكد من تفعيل **التحقق بخطوتين (2-Step Verification)**.
3. ابحث في شريط البحث بالأعلى عن **كلمات مرور التطبيقات (App Passwords)**.
4. أنشئ اسماً جديداً مثل `KASPI POS Production Mailer` ثم انسخ الكود المكون من 16 حرفاً وضعه في `GMAIL_APP_PASSWORD`.

---

### جدول 3: شبكة مزودي الذكاء الاصطناعي والتعرف الضوئي على الفواتير (AI & OCR Failover Hub)
*يدعم النظام التحويل التلقائي المتدرج (Automatic Fallback Chain). إذا نفد رصيد أو تجاوز معدل مزود ما، ينتقل فوراً للمزود التالي دون انقطاع الخدمة.*

| المزود (Provider) | المتغير البرمجي (Env Variable) | الأولوية والوظيفة (Priority & Capability) | حدود الاستخدام المجاني (Free Tier Limits) |
| :--- | :--- | :--- | :--- |
| **Google Gemini** | `GEMINI_API_KEY` أو `GOOGLE_GENERATIVE_AI_API_KEY` | **الأولوية 1 (Primary):** المساعد الذكي، الاستشارات الإدارية، قراءة وتفريغ فواتير الموردين (OCR Vision). | **مجاني بالكامل** حتى 15 طلب بالدقيقة (RPM) ومليون رمز شهرياً عبر Google AI Studio. |
| **Groq LPU** | `GROQ_API_KEY` أو `GROQ_API_KEYS` | **الأولوية 2 (Ultra-Fast):** ردود شات الدعم الفني بسرعة فائقة عبر نموذج `llama-3.3-70b-versatile`. | **مجاني** حتى 30 طلب بالدقيقة وسرعة توليد تتجاوز 300 token/sec. |
| **OpenRouter** | `OPENROUTER_API_KEY` | **الأولوية 3 (Universal Gateway):** الوصول الموحد لكافة النماذج المفتوحة والتجارية عند الطوارئ. | مجاني للنماذج ذات لاحقة `:free` ورصيد حسب الشحن. |
| **DeepSeek** | `DEEPSEEK_API_KEY` أو `DEEPSEEK_API_KEYS` | **الأولوية 4 (Deep Reasoning):** التدقيق المحاسبي المعقد وتحليل هوامش الربح. | تكلفة رمزية منخفضة جداً (0.14$ لكل مليون رمز). |
| **Mistral AI** | `MISTRAL_API_KEY` أو `MISTRAL_API_KEYS` | **الأولوية 5 (European Fallback):** نماذج Mistral Small/Nemo الدقيقة في اللغة الفرنسية. | خطة تجريبية مجانية شهرية (La Plateforme). |
| **Together AI** | `TOGETHER_API_KEY` | **الأولوية 6 (Cloud Cluster):** خادم بديل إضافي. | رصيد ترحيبي 5$ مجاناً. |
| **HuggingFace** | `HUGGINGFACE_API_KEY` | **الأولوية 7 (Serverless Inference):** استدعاء نماذج الرؤية الحاسوبية المفتوحة. | مجاني للطلبات القياسية. |
| **Local Edge AI** | `LOCAL_AI_BASE_URL` | **الأولوية المحلية (Offline Edge):** تشغيل الذكاء الاصطناعي محلياً عبر Ollama (Port 11434) على جهاز الكاشير دون إنترنت. | `http://127.0.0.1:11434` (مجاني 100% وبلا سقف). |

---

### جدول 4: مجمّع التخزين السحابي متعدد المزودين بصفر تكلفة (`cloud-pool.ts`)
*يدعم ضغط الصور محلياً WebP إلى أقل من 45 كيلوبايت، ثم رفعها إلى المزود المتاح مع دعم التخزين المحلي Offline كخيار نهائي.*

| المزود (Storage Provider) | المتغيرات المطلوبة (Environment Keys) | الشرح والوظيفة (Usage & Strategy) | السعة المجانية المتاحة (Free Tier) |
| :--- | :--- | :--- | :--- |
| **Cloudflare R2** | `R2_ACCOUNT_ID`<br>`R2_ACCESS_KEY_ID`<br>`R2_SECRET_ACCESS_KEY`<br>`R2_BUCKET_NAME`<br>`R2_ENDPOINT`<br>`R2_PUBLIC_URL` | **الخيار الأول (Zero Egress):** تخزين صور المنتجات، إيصالات الفواتير، وشعارات المتاجر مع **انعدام رسوم نقل البيانات (0$ Egress Fees)**. | **10 جيجابايت مجاناً شهرياً**، وتكلفة شبه معدومة بعد ذلك (0.015$/GB). |
| **Supabase Storage** | `NEXT_PUBLIC_SUPABASE_URL`<br>`NEXT_PUBLIC_SUPABASE_ANON_KEY`<br>`SUPABASE_SERVICE_ROLE_KEY`<br>`SUPABASE_STORAGE_BUCKET` | **الخيار المتزامن:** يستخدم نفس قاعدة بيانات Supabase لحفظ مستندات العملاء وفواتير DGI. | **1 جيجابايت مجاناً** في الخطة المجانية. |
| **Cloudinary** | `CLOUDINARY_CLOUD_NAME`<br>`CLOUDINARY_API_KEY`<br>`CLOUDINARY_UPLOAD_PRESET` | **الخيار الاحتياطي للصور المصغرة:** معالجة وضغط تلقائي في السحابة. | **25 نقطة رصيد مجانية شهرياً** (~25GB تخزين وعرض). |
| **Local IndexedDB** | *لا يتطلب أي مفتاح (No Env Required)* | **الاحتياطي الميداني الإجباري:** عند انقطاع الإنترنت أو غياب المفاتيح، يتم تخزين الصور محلياً كـ Base64 مضغوط ومزامنتها لاحقاً. | **غير محدود** (يعتمد على مساحة المتصفح / القرص الصلب). |

---

### جدول 5: إعدادات المالك التجارية والخزنة الحساسة (`OwnerProfileModal` & UI Vault)
*يتم إدخال هذه البيانات وحمايتها عبر كلمة مرور المالك من داخل لوحة التحكم والواجهة الرسومية لحجبها عن الكاشيرات والموظفين.*

| الحقل التجاري (Field Name) | المسار في النظام (System Path) | التشفير والحماية (Protection & Purpose) | مثال للقيمة الحقيقية (Production Example) |
| :--- | :--- | :--- | :--- |
| **الرقم البنكي الموحد (Bank RIB)** | خزنة المالك `OwnerProfileModal` / `IdempotencyRecord` | **مشفر ومحجوب بـ 24 رقماً** (`•••• 7014`). يظهر في فواتير التحويل ولا يمكن للموظف تعديله إلا بكلمة مرور المالك. | `007 780 0001234567890123 45` (Attijariwafa / BCP / BMCE) |
| **اسم المؤسسة البنكية (Bank Name)** | خزنة المالك `OwnerProfileModal` | اسم البنك المغربي المستلم للتحويلات والفواتير. | `Attijariwafa Bank - Agence Maarif Casablanca` |
| **معرّف محطة TPE البنكية (Terminal ID)** | خزنة المالك / إعدادات الأجهزة | معرّف جهاز الدفع الإلكتروني (TPE CMI LAN/IP) للتواصل عبر المنفذ المحلي ومطابقة إيصالات البطاقات البنكية. | `TPE-LAN-CASABLANCA-01` |
| **بوابة الدفع المفعلة (Active Gateway)** | خزنة المالك / إعدادات الدفع | تحديد البوابة النشطة للمتجر: `cash_only`، `cmi_tpe`، `youcanpay`، أو `stripe`. | `cmi_tpe` أو `cash_only` |
| **رقم واتساب المالك الخاص (Private WhatsApp)** | خزنة المالك / `ExecutiveReportSheet` | **الرقم الوحيد المعتمد** لاستلام التقرير التنفيذي الذكي وملخص الإغلاق اليومي عند الساعة **21:00 أو 22:00** ليلاً. محجوب عن الموظفين. | `+212661000000` |
| **شعار المتجر (Store Logo)** | خزنة المالك / رأس الفاتورة | يتم ضغطه محلياً عبر WebP إلى أقل من 40KB لضمان سرعة الطباعة الحرارية والمزامنة الفورية. | ملف صورة (PNG/JPEG يتم تحويله تلقائياً لـ WebP). |
| **كلمة سر بذر المشرف (Admin Seed Secret)** | `ADMIN_SEED_SECRET` | رمز سري لتنفيذ سكربت التهيئة الأولية للمنصة وإنشاء حساب السوبر أدمن عبر المسارات المحمية. | `kaspi_super_secret_seed_2026` |

---

### جدول 6: إعدادات تطبيق سطح المكتب ومنافذ الاتصال المحلي (`src-tauri/tauri.conf.json`)
*مسؤولة عن تشغيل تطبيق الويندوز/الماك المستقل، الطباعة المباشرة ESC/POS، والاتصال العكسي.*

| الإعداد (Parameter) | القيمة الرسمية المضبوطة (Configured Value) | الملف المصدري (Source File) | الوظيفة الفنية (Technical Function) |
| :--- | :--- | :--- | :--- |
| **معرّف البروتوكول المخصص (Deep-Link Scheme)** | `kaspipos://` | `src-tauri/src/desktop_handoff.rs` & Windows Registry | يسمح للمتصفح بفتح تطبيق الكاشير المكتبي بنقرة واحدة عبر صفحة `/launch-desktop` مع تمرير توكن الجلسة. |
| **منفذ خادم الربط المحلي (Local IPC Port)** | `41732` (`127.0.0.1:41732`) | `src-tauri/src/desktop_handoff.rs` | خادم ويب داخلي مدمج في الرست (Rust TCP Listener) يستقبل الأوامر بين النوافذ وتفادي تكرار تشغيل نسختين من التطبيق. |
| **عنوان النطاق الإنتاجي المرتبط** | `https://kaspi-pos.vercel.app` | `src-tauri/tauri.conf.json` (`build.frontendDist` & `windows.url`) | الموقع السحابي الذي تحمّله نافذة Tauri المظلمة عند الإقلاع. |
| **نمط النافذة والسمة (Window Theme)** | `theme: "Dark"`, `backgroundColor: "#09090b"` | `src-tauri/tauri.conf.json` & `main.rs` | فرض سمة السواد الفاخرة الموحدة على شريط العنوان وشاشة البدء لمنع ظهور أي لون أحمر أو فاقع للنظام. |
| **الأبعاد القياسية للنافذة (Window Dimensions)** | العرض: `1280px`، الارتفاع: `800px` (الحد الأدنى: `1024x700`) | `src-tauri/tauri.conf.json` | ملاءمة شاشات أجهزة الكاشير اللمسية (POS Touch Terminals) القياسية في المغرب. |
| **منفذ الطابعة الشبكية الافتراضي** | `9100` (RAW ESC/POS TCP Socket) | `src-tauri/src/printer.rs` | المنفذ العالمي المعتمد لطابعات الإيصالات الحرارية (Epson, Xprinter, Bixolon, Rongta). |

---

## 3. قالب ملف البيئة الجاهز للإنتاج (Master `.env.production` Template)

انسخ الكتلة التالية وضعها في ملف `.env.production` على خادمك أو في قسم **Environment Variables** على منصة الاستضافة (Vercel):

```bash
# ==============================================================================
# KASPI POS — OFFICIAL MASTER PRODUCTION ENVIRONMENT VARIABLES
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. CORE DATABASE & AUTHENTICATION (MANDATORY)
# ------------------------------------------------------------------------------
# Supabase Pooler (Port 6543) for high concurrency
DATABASE_URL="postgresql://postgres.[YOUR_PROJECT_REF]:[YOUR_DB_PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (Port 5432) for Prisma Schema Migrations
DIRECT_URL="postgresql://postgres.[YOUR_PROJECT_REF]:[YOUR_DB_PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# NextAuth Encryption Secret (Generate via: openssl rand -base64 32)
NEXTAUTH_SECRET="your_generated_32_bytes_super_secure_nextauth_secret_here"
AUTH_SECRET="your_generated_32_bytes_super_secure_nextauth_secret_here"

# Domain Configuration
NEXTAUTH_URL="https://kaspi-pos.vercel.app"
NEXT_PUBLIC_APP_URL="https://kaspi-pos.vercel.app"
NODE_ENV="production"

# High-Performance In-Memory Cache (Upstash Redis - Optional but recommended)
UPSTASH_REDIS_REST_URL="https://your-upstash-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_redis_token_here"

# ------------------------------------------------------------------------------
# 2. OFFICIAL GMAIL & TRANSACTIONAL NOTIFICATION ENGINE (MANDATORY FOR MAILS)
# ------------------------------------------------------------------------------
# Official Gmail / Google Workspace account
GMAIL_USER="official.kaspi.pos@gmail.com"

# 16-character Google App Password (Generated in myaccount.google.com -> Security)
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"

# Platform Founder & Super-Admin Contacts
FOUNDER_EMAIL="founder@kaspi.ma"
ADMIN_EMAIL="admin@kaspi.ma"
ADMIN_SEED_SECRET="kaspi_super_secret_seed_token_2026"

# ------------------------------------------------------------------------------
# 3. MULTI-PROVIDER AI & OCR FAILOVER HUB (FREE TIERS AVAILABLE)
# ------------------------------------------------------------------------------
# Google Gemini API Key (Priority 1 for Business Insights & Vision Invoice OCR)
# Get free key at: https://aistudio.google.com
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
GOOGLE_GENERATIVE_AI_API_KEY="AIzaSyYourGeminiApiKeyHere"

# Groq High-Speed LPU API Key (Priority 2 for Instant Support Diagnostics)
# Get free key at: https://console.groq.com
GROQ_API_KEY="gsk_YourGroqApiKeyHere"

# OpenRouter Unified AI Gateway (Priority 3 Universal Fallback)
# Get key at: https://openrouter.ai
OPENROUTER_API_KEY="sk-or-v1-YourOpenRouterKeyHere"

# DeepSeek API Key (Optional Priority 4 Reasoning Engine)
DEEPSEEK_API_KEY="sk-YourDeepSeekKeyHere"

# Mistral AI API Key (Optional Priority 5 French OCR Engine)
MISTRAL_API_KEY="YourMistralApiKeyHere"

# Local Edge AI URL (When running Ollama locally on POS register)
LOCAL_AI_BASE_URL="http://127.0.0.1:11434"

# ------------------------------------------------------------------------------
# 4. ZERO-COST CLOUD STORAGE POOL (CLOUDFLARE R2 / SUPABASE / CLOUDINARY)
# ------------------------------------------------------------------------------
# Cloudflare R2 (Recommended: 10GB Free, 0$ Egress Fees)
R2_ACCOUNT_ID="your_cloudflare_account_id_here"
R2_ACCESS_KEY_ID="your_r2_access_key_id_here"
R2_SECRET_ACCESS_KEY="your_r2_secret_access_key_here"
R2_BUCKET_NAME="kaspi-pos-storage"
R2_ENDPOINT="https://your_cloudflare_account_id.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://pub-your-bucket-id.r2.dev"
NEXT_PUBLIC_R2_PUBLIC_URL="https://pub-your-bucket-id.r2.dev"

# Supabase Storage Fallback (1GB Free)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_public_key_here"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_secret_key_here"
SUPABASE_STORAGE_BUCKET="receipts"

# Cloudinary Image Preset Fallback
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_UPLOAD_PRESET="kaspi_preset"

# ------------------------------------------------------------------------------
# 5. PAYMENT GATEWAY API KEYS (OPTIONAL - ENABLED PER MERCHANT)
# ------------------------------------------------------------------------------
# YouCan Pay Morocco (For Online Checkout / Subscriptions)
YOUCANPAY_PUBLIC_KEY="pub_your_youcanpay_key"
YOUCANPAY_PRIVATE_KEY="priv_your_youcanpay_key"
YOUCANPAY_SANDBOX="false"

# CMI Moroccan Bank Gateway (For E-Commerce Invoicing)
CMI_CLIENT_ID="your_cmi_client_id"
CMI_STORE_KEY="your_cmi_store_key"

# Stripe International (Optional)
STRIPE_SECRET_KEY="sk_live_your_stripe_key"
```

---

## 4. تقرير التدقيق الثاني واستراتيجية التراجع الآمن (Second Verification Pass & Graceful Degradation)

تم فحص الكود البرمجي في المسارات التالية للتحقق من عدم حدوث أي انهيار (Runtime Crash) في حال عدم توفير أي مفتاح اختياري:

1. **غياب مفاتيح الذكاء الاصطناعي (`GEMINI_API_KEY` / `GROQ_API_KEY`):**
   - في `/api/ai/chat` و `/admin/messages`: إذا لم تتوفر المفاتيح الخارجية، يقوم النظام بتفعيل دالة `generateDiagnosticFallback` المحلية الفورية لتقديم حلول تقنية نموذجية (طابعات، قارئ باركود، شبكة، كروت بنكية) بلغة التاجر دون أي خطأ 500.
2. **غياب مفاتيح التخزين السحابي (`R2` / `Cloudinary`):**
   - في `cloud-pool.ts` و `compression-engine.ts`: يقوم النظام فوراً بضغط الصورة بصيغة WebP خفيفة الوزن وحفظها إما داخل حقل قاعدة البيانات أو محلياً في المتصفح عبر `IndexedDB`، مع بقاء الواجهة نشطة بنسبة 100%.
3. **غياب مفاتيح Redis (`UPSTASH_REDIS`):**
   - في `src/lib/cache/client-cache.ts` و `rate-limit.ts`: يتراجع النظام تلقائياً إلى الذاكرة المؤقتة للعملية (`Map` In-Memory Cache) مع الحفاظ على زمن استجابة 0ms.
4. **غياب البريد الإلكتروني الرسمي مؤقتاً:**
   - تسجل العمليات في سجلات الأحداث (`console.log`) دون إيقاف تسجيل المستخدم أو تفعيل الترخيص.

**النتيجة النهائية للتدقيق:** النظام مهيأ بنسبة **100%** للانتقال للإنتاج الفعلي بمجرد لصق المفاتيح الحقيقية في لوحة تحكم الاستضافة.
