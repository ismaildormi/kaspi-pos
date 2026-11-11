# دليل الاعتماد والموارد الشامل للانطلاق الفعلي في بيئة الإنتاج
## KASPI POS — Master Credentials, Environment Secrets & Production Resources Audit (Zero-Omission Edition)

> **تاريخ التدقيق:** 2026-11-11  
> **حالة النظام:** جاهز 100% للتشغيل الحي بمجرد إدخال القيم الحقيقية (Zero Broken Code / Production Ready)  
> **الإصدار المتوافق:** Commit `c32e5e4` وما بعده

---

## 1. الفهرس العام للموارد والبيئات (Architecture & Inventory Overview)

تم تصميم بنية **KASPI POS** لتكون معمارية هجينة فائقة الكفاءة (Ultra-Low Cost & High-Resilience Cloud-Edge POS)، حيث تعمل كافة المميزات إما محلياً (Offline First / IndexedDB / Client-Side WebP Compression) أو عبر خدمات سحابية مجانية ومدفوعة تدعم السقوط التلقائي (Multi-Provider Failover).

```mermaid
graph TD
    App[KASPI POS Next.js / Tauri App] --> DB[(PostgreSQL Supabase/Neon)]
    App --> Redis[(Upstash Redis Cache)]
    App --> Mailer[Official Gmail / SMTP Engine]
    App --> AI[Multi-Provider AI & OCR Hub]
    App --> Storage[Multi-Cloud Pool R2 / Supabase / Cloudinary]
    App --> Vault[Owner Profile & Sensitive Vault]
    App --> Desktop[Tauri IPC 127.0.0.1:41732]
    App --> Hardware[Thermal Printer 9100 & Scale 20-29]
```

---

## 2. الجداول التفصيلية للمتغيرات والمفاتيح المطلوبة (Detailed Variable Tables)

### جدول 1: متغيرات البنية التحتية وقاعدة البيانات والجلسات (Core Infrastructure & Database)

| المتغير البرمجي (Env Variable) | النوع والإلزامية | الشرح والوظيفة التشغيلية (Arabic Description) | القيمة الافتراضية / النموذجية |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **إلزامي** (Mandatory) | رابط الاتصال المجمع بقاعدة بيانات PostgreSQL (Prisma Connection Pool). يدعم Supabase Pooler (Port 6543) أو Neon. | `postgresql://postgres.[ref]:[pass]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | **إلزامي** للمهاجرات | رابط الاتصال المباشر غير المجمع بقاعدة البيانات لتنفيذ عمليات `prisma migrate` و DDL دون انقطاع. | `postgresql://postgres.[ref]:[pass]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres` |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | **إلزامي** (Mandatory) | مفتاح تشفير عشوائي بصيغة Base64 بطول 32 بايت لتشفير جلسات JWT والتوكنات السرية (`openssl rand -base64 32`). | `e.g. 7f8b9a2c3d4e5f6a1b2c3d4e5f6a7b8c` |
| `NEXTAUTH_URL` | **إلزامي** (Mandatory) | النطاق الأساسي للتطبيق المستخدم لإعادة التوجيه الآمن ومطابقة جلسات NextAuth. | `https://kaspi-pos.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | **إلزامي** (Mandatory) | الرابط العام للتطبيق المستخدم في روابط البريد الإلكتروني، إشعارات الدعم الفني، وربط تطبيق Tauri بسحابة الإنتاج. | `https://kaspi-pos.vercel.app` |
| `CRON_SECRET` | **إلزامي** للأتمتة الليلية | مفتاح التوثيق السري لتشغيل كرون التقارير التنفيذية التلقائية عند الساعة 21:00/22:00 ليلاً عبر Vercel Cron أو أداة جدولة خارجية. | `kaspi_nightly_cron_secret_2026_x99` |
| `SESSION_COOKIE_NAME` | نظامي (`pos_session`) | اسم كوكي الجلسة السريعة لمحطات الكاشير الميدانية والمحمي بـ HTTP-Only & SameSite=Lax. | `pos_session` |
| `UPSTASH_REDIS_REST_URL` | اختياري (Recommended) | رابط خدمة Upstash Redis السريعة لإدارة الكاش، تحديد معدل الطلبات (Rate Limiting)، والمزامنة اللحظية. | `https://eu1-fitting-xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | اختياري (Recommended) | توكن التوثيق لخدمة Upstash Redis REST API. في حال غيابه، يتراجع النظام تلقائياً للذاكرة المحلية (In-Memory Fallback). | `AXXXAAIncDE...` |
| `NODE_ENV` | نظامي (System) | بيئة التشغيل للتحسين والضغط. | `production` |

---

### جدول 2: محرك البريد الإلكتروني والمعاملات الرسمية عبر Gmail (`mailer.ts`)

| المتغير البرمجي (Env Variable) | النوع والإلزامية | الشرح والوظيفة التشغيلية (Arabic Description) | القيمة الافتراضية / النموذجية |
| :--- | :--- | :--- | :--- |
| `GMAIL_USER` | **إلزامي** للمراسلات الحية | حساب Google Workspace أو بريد Gmail الرسمي للمنصة المستخدم لإرسال الرسائل وتلقي التذاكر. | `official.kaspi.pos@gmail.com` |
| `GMAIL_APP_PASSWORD` | **إلزامي** للمراسلات الحية | كلمة مرور التطبيقات المكونة من 16 حرفاً (Google App Password) مع تفعيل التحقق بخطوتين (2FA). | `xxxx xxxx xxxx xxxx` |
| `FOUNDER_EMAIL` | اختياري (Fallback) | البريد الشخصي للمؤسس/المالك لتلقي النسخ الاحتياطية وإشعارات الطوارئ الفنية. | `founder@kaspi.ma` |
| `ADMIN_EMAIL` | اختياري | البريد الإلكتروني المعتمد لمدير النظام لتسجيل الدخول إلى `/admin`. | `admin@kaspi.ma` |
| `ADMIN_SUPPORT_EMAIL` | اختياري | وجهة إعادة توجيه تذاكر الدعم الفني الواردة من الكاشيرات والتجار. | يتطابق مع `GMAIL_USER` تلقائياً |
| `SMTP_HOST` / `SMTP_PORT` | احتياطي ثانوي (Backup) | إعدادات خادم SMTP بديل (في حال عدم استخدام Gmail المباشر مثل Sendgrid / Resend / Infomaniak). | `smtp.gmail.com` (Port 465 SSL أو 587 TLS) |

---

### جدول 3: شبكة مزودي الذكاء الاصطناعي والتعرف الضوئي على الفواتير (AI & OCR Failover Hub)

| المزود (Provider) | المتغير البرمجي (Env Variable) | الأولوية والوظيفة (Priority & Capability) | حدود الاستخدام المجاني (Free Tier Limits) |
| :--- | :--- | :--- | :--- |
| **Google Gemini** | `GEMINI_API_KEY` أو `GOOGLE_GENERATIVE_AI_API_KEY` | **الأولوية 1 (Primary):** المساعد الذكي، الاستشارات الإدارية، قراءة وتفريغ فواتير الموردين (OCR Vision). | **مجاني بالكامل** حتى 15 طلب بالدقيقة (RPM) ومليون رمز شهرياً عبر Google AI Studio. |
| **Groq LPU** | `GROQ_API_KEY` أو `GROQ_API_KEYS` | **الأولوية 2 (Ultra-Fast):** ردود شات الدعم الفني بسرعة فائقة عبر نموذج `llama-3.3-70b-versatile`. | **مجاني** حتى 30 طلب بالدقيقة وسرعة توليد تتجاوز 300 token/sec. |
| **OpenRouter** | `OPENROUTER_API_KEY` | **الأولوية 3 (Universal Gateway):** الوصول الموحد لكافة النماذج المفتوحة والتجارية عند الطوارئ. | مجاني للنماذج ذات لاحقة `:free` ورصيد حسب الشحن. |
| **DeepSeek** | `DEEPSEEK_API_KEY` أو `DEEPSEEK_API_KEYS` | **الأولوية 4 (Deep Reasoning):** التدقيق المحاسبي المعقد وتحليل هوامش الربح. | تكلفة رمزية منخفضة جداً (0.14$ لكل مليون رمز). |
| **Mistral AI** | `MISTRAL_API_KEY` أو `MISTRAL_API_KEYS` | **الأولوية 5 (European Fallback):** نماذج Mistral Small/Nemo الدقيقة في اللغة الفرنسية. | خطة تجريبية مجانية شهرية (La Plateforme). |
| **Local Edge AI** | `LOCAL_AI_BASE_URL` | **الأولوية المحلية (Offline Edge):** تشغيل الذكاء الاصطناعي محلياً عبر Ollama (Port 11434) على جهاز الكاشير دون إنترنت. | `http://127.0.0.1:11434` (مجاني 100% وبلا سقف). |

---

### جدول 4: مجمّع التخزين السحابي والتواقيع الأمنية للبوابات (Storage & Webhook Verification)

| الخدمة / المزود | المتغيرات المطلوبة (Environment Keys) | الشرح والوظيفة (Usage & Strategy) | السعة / التحقق الأمني |
| :--- | :--- | :--- | :--- |
| **Cloudflare R2** | `R2_ACCOUNT_ID`<br>`R2_ACCESS_KEY_ID`<br>`R2_SECRET_ACCESS_KEY`<br>`R2_BUCKET_NAME`<br>`R2_ENDPOINT`<br>`R2_PUBLIC_URL` | تخزين صور المنتجات، إيصالات الفواتير، وشعارات المتاجر مع **انعدام رسوم نقل البيانات (0$ Egress Fees)**. | **10 جيجابايت مجاناً شهرياً** (0.015$/GB إضافي). |
| **Supabase Storage** | `NEXT_PUBLIC_SUPABASE_URL`<br>`NEXT_PUBLIC_SUPABASE_ANON_KEY`<br>`SUPABASE_SERVICE_ROLE_KEY`<br>`SUPABASE_STORAGE_BUCKET` | تخزين مستندات العملاء وفواتير DGI متزامناً مع نفس مشروع قاعدة البيانات. | **1 جيجابايت مجاناً**. |
| **YouCan Pay Webhook** | `YOUCANPAY_WEBHOOK_SECRET` | التحقق من صحة إشعارات الدفع التلقائي لاشتراكات التجار لتفادي التزوير. | توقيع SHA-256 HMAC. |
| **Stripe Webhook** | `STRIPE_WEBHOOK_SECRET` | توثيق دفع البطاقات الدولية والتحويلات الخارجية. | توقيع Stripe Webhook Signature. |
| **Paddle Webhook** | `PADDLE_WEBHOOK_SECRET` | توثيق اشتراكات SaaS للمشتركين خارج المغرب. | Paddle Signature Header. |

---

### جدول 5: إعدادات العتاد، الطابعات الحرارية، وموازين الباركود الإلكترونية (Hardware & Scale Rules)

| الإعداد العتادي (Hardware Param) | القيمة القياسية (Default Value) | المسار البرمجي المرجعي | الشرح الفني والتوافق |
| :--- | :--- | :--- | :--- |
| **منفذ الطابعة الحرارية الافتراضي** | `9100` (RAW ESC/POS TCP Socket) | `src/client/printing/index.ts` & `src-tauri/src/printer.rs` | المنفذ القياسي العالمي لكافة طابعات الشبكة (Epson, Xprinter, Rongta, Bixolon). |
| **عرض ورق الإيصالات** | `80mm` (576 dots) أو `58mm` (384 dots) | `src/client/printing/index.ts` | يتم ضبطه في إعدادات الطابعة وتكييف نص التذكرة والرسوم تلقائياً. |
| **أكواد موازين الباركود المدمجة** | بادئات EAN-13: `20` إلى `29` (5 خانات صنف + 5 خانات وزن) | `src/components/pos/ProductSearch.tsx` [54–75] | يتعرف الكاشير فوراً بزمن 0ms على وزن السلعة بالجرام ويحسب السعر الإجمالي تلقائياً. |
| **أمر فتح درج النقدية الإلكتروني** | نبضة ESC/POS: `ESC p 0 25 250` (Pin 2/Pin 5) | `src-tauri/src/printer.rs` | يُرسل آلياً مع طباعة إيصال الدفع النقدي لفتح الدرج فورياً. |

---

## 3. قائمة التحقق النهائية قبل الإطلاق الحي (Live Readiness Verification Checklist)

| الخدمة / المتغير | الملف البرمجي ونطاق السطر | الحالة الحالية قبل إدخال القيمة (Graceful Fallback) | السلوك اللحظي فور إدخال القيمة في الإنتاج (Live Production) |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `src/server/db/prisma.ts` [L1–25] | استخدام قاعدة البيانات المحلية أو السحابة التجريبية للتطوير | اتصال فوري مجمع وعالي السرعة بقاعدة الإنتاج الحية |
| `GMAIL_APP_PASSWORD` | `src/lib/email/mailer.ts` [L50–85] | تسجيل الإيميل في الطرفية (`console.log`) دون انهيار | إرسال فوري لإيميلات التحقق ووصولات الاشتراك 3D وتنبيهات الدعم |
| `GEMINI_API_KEY` | `src/app/api/ai/chat/route.ts` [L1–15] | تفعيل الردود الذاتية الهندسية `generateDiagnosticFallback` | تفعيل المساعد الذكي الكامل وقراءة الفواتير بالرؤية الحاسوبية OCR |
| `CRON_SECRET` | `src/app/api/reports/daily-whatsapp/route.ts` [L18–35] | يتطلب جلسة كاشير مسجلة لإصدار التقرير يدوياً | تشغيل آلي كل ليلة عند 21:00/22:00 لإرسال التقرير لواتساب المالك |
| `R2_SECRET_ACCESS_KEY` | `src/lib/storage/cloud-pool.ts` [L30–75] | ضغط الصور WebP وحفظها كـ Base64 أو في IndexedDB محلياً | رفع فوري لصور المنتجات إلى Cloudflare R2 بدون أي تكلفة نقل |
| `YOUCANPAY_PRIVATE_KEY` | `src/app/api/billing/checkout/route.ts` [L40–80] | إتاحة التحويل البنكي اليدوي والدفع النقدي فقط | تفعيل الدفع الفوري بالبطاقات البنكية المغربية CMI |

---

## 4. قالب ملف البيئة الشامل للإنتاج (Master `.env.production`)

```bash
# ==============================================================================
# KASPI POS — COMPLETE MASTER PRODUCTION CONFIGURATION
# ==============================================================================

# 1. CORE DATABASE & AUTHENTICATION
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
NEXTAUTH_SECRET="your_generated_32_bytes_super_secure_nextauth_secret_here"
AUTH_SECRET="your_generated_32_bytes_super_secure_nextauth_secret_here"
NEXTAUTH_URL="https://kaspi-pos.vercel.app"
NEXT_PUBLIC_APP_URL="https://kaspi-pos.vercel.app"
CRON_SECRET="kaspi_nightly_cron_secret_2026_x99"
NODE_ENV="production"

# Upstash Redis Cache (Optional)
UPSTASH_REDIS_REST_URL="https://your-upstash-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_redis_token_here"

# 2. OFFICIAL GMAIL & TRANSACTIONAL NOTIFICATIONS
GMAIL_USER="official.kaspi.pos@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
FOUNDER_EMAIL="founder@kaspi.ma"
ADMIN_EMAIL="admin@kaspi.ma"
ADMIN_SEED_SECRET="kaspi_super_secret_seed_token_2026"

# 3. MULTI-PROVIDER AI & OCR FAILOVER HUB
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
GOOGLE_GENERATIVE_AI_API_KEY="AIzaSyYourGeminiApiKeyHere"
GROQ_API_KEY="gsk_YourGroqApiKeyHere"
OPENROUTER_API_KEY="sk-or-v1-YourOpenRouterKeyHere"
DEEPSEEK_API_KEY="sk-YourDeepSeekKeyHere"
LOCAL_AI_BASE_URL="http://127.0.0.1:11434"

# 4. ZERO-COST CLOUD STORAGE POOL (CLOUDFLARE R2 / SUPABASE)
R2_ACCOUNT_ID="your_cloudflare_account_id_here"
R2_ACCESS_KEY_ID="your_r2_access_key_id_here"
R2_SECRET_ACCESS_KEY="your_r2_secret_access_key_here"
R2_BUCKET_NAME="kaspi-pos-storage"
R2_ENDPOINT="https://your_cloudflare_account_id.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://pub-your-bucket-id.r2.dev"
NEXT_PUBLIC_R2_PUBLIC_URL="https://pub-your-bucket-id.r2.dev"

# Supabase Storage Fallback
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_public_key_here"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_secret_key_here"
SUPABASE_STORAGE_BUCKET="receipts"

# 5. PAYMENT GATEWAY API & WEBHOOK SECRETS
YOUCANPAY_PUBLIC_KEY="pub_your_youcanpay_key"
YOUCANPAY_PRIVATE_KEY="priv_your_youcanpay_key"
YOUCANPAY_WEBHOOK_SECRET="whsec_your_youcanpay_webhook_secret"
YOUCANPAY_SANDBOX="false"
STRIPE_SECRET_KEY="sk_live_your_stripe_key"
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret"
```
