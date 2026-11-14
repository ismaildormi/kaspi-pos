# التقرير الرسمي الشامل للأمن السيبراني، الأدلة الجنائية الرقمية (Rule 3-2-1)، وأتمتة الإيرادات — KASPI POS

**تاريخ الإصدار:** 2026-11-14  
**التصنيف:** وثيقة تدقيق تنفيذية (Executive Security, Forensics & Compliance Dossier)  
**الجمهور المستهدف:** وكالات التسويق الرقمي، سلاسل المتاجر الكبرى (Supermarket Chains)، المستثمرون، المحاسبون المعتمدون (Experts-Comptables)، والمدققون القانونيون.

---

## 1. الملخص التنفيذي والدرع القانوني (Executive Summary & Legal Compliance Shield)

تم تصميم وهندسة منصة **KASPI POS** وفق مبدأ **الأمن أولاً واليقين الجنائي الرقمي (Zero-Trust & Cryptographic Forensics)** لحماية أموال التجار، ومنع التلاعب أو الاحتيال الداخلي على مستوى نقاط البيع (Cashier Fraud)، وتوفير حصانة قانونية ومالية كاملة لمؤسس المنصة والتجار على حد سواء:

- **سلسلة الأدلة الجنائية غير القابلة للمحو (`SHA-256 / HMAC Hash Chaining` + `Rule 3-2-1`):**  
  كل عملية حساسة (تسجيل دخول، تعديل سعر، إلغاء فاتورة، فتح درج النقود بدون بيع، تغيير الحساب البنكي `RIB`) تُربط تشفيرياً بالسجل السابق عبر بصمة `HMAC-SHA256`، وتُنسخ لا تزامنياً في اللحظة نفسها إلى مخزن خارجي معزول بصلاحيات **الكتابة فقط (`Write-Only Air-Gapped Vault`)**، مما يجعل تعديل أو حذف الأدلة مستحيلاً رياضياً حتى في حال اختراق الخادم الرئيسي.
- **الامتثال للقانون المغربي 09-08 (`CNDP` — حماية المعطيات الشخصية):**  
  عزل رياضي تام لبيانات كل متجر عبر سياسات `PostgreSQL Row-Level Security (RLS)`، مع تشفير محلي `AES-256-GCM` وربط ببصمة الجهاز.
- **الامتثال الضريبي للمديرية العامة للضرائب (`DGI — Article 145 du CGI`):**  
  ربط جميع الفواتير وإيصالات البيع في سلسلة `SHA-256` متصلة (`previousInvoiceHash -> currentInvoiceHash`) مع ختم تحقق مالي من 8 خانات (`KSP-XXXX-XXXX`) يظهر على وصل الطباعة الحرارية (`80mm / 58mm`) وتقرير الإقفال اليومي (`Z-Report`)، مع كشف فوري لأي حذف أو تغيير بأثر رجعي.
- **معيار أمان بيانات بطاقات الدفع (`PCI-DSS Zero-Card-Storage`):**  
  لا تقوم المنصة بتخزين أو تسجيل أي أرقام بطاقات بنكية (`PAN`) أو رموز أمان (`CVV/CVC`) أو تواريخ انتهاء الصلاحية في أي قاعدة بيانات أو سجل جنائي.

---

## 2. مصفوفة الهندسة الأمنية للطبقات الثماني المنفذة (Implemented Architecture Matrix)

| الطبقة | الدور الأمني والتشغيلي | المسارات الفعلية في المستودع (`Repository Paths`) | آلية تحييد الهجمات تلقائياً |
| :--- | :--- | :--- | :--- |
| **Layer 1: السجل الجنائي غير القابل للمحو** | توثيق 19 حدثاً أمنياً ومالياً حساساً مع ربط تشفيري ونسخ `Write-Only` وفق قاعدة `3-2-1` | `src/lib/security/forensic-audit.ts`<br>`src/app/api/security/audit/route.ts` | تنقيح تلقائي لكلمات المرور والرموز، حساب بصمة الجهاز و`IP/Geo`، وشحن فوري إلى مخزن خارجي بصلاحيات كتابة فقط. |
| **Layer 2: أمن قاعدة البيانات السحابية** | عزل تام للمستأجرين (`RLS`)، منع `UPDATE/DELETE` على الأدلة، ونسخ احتياطي مشفر | `prisma/security_rls_and_immutability.sql`<br>`src/lib/security/db-rls-guard.ts`<br>`scripts/security/offsite-backup-321.mjs` | فرض `app.current_tenant_id` في كل معاملة، وتفعيل Trigger `forbid_forensic_mutation()` لمنع أي محو، وتصدير لقطات `AES-256-GCM`. |
| **Layer 3: تطبيق سطح المكتب وسلسلة الفواتير** | حماية جهاز التاجر وتشفير التخزين المحلي + سلسلة فواتير `SHA-256` | `src/lib/security/invoice-hash-chain.ts`<br>`src/app/api/security/verify-chain/route.ts`<br>`src/lib/security/local-cipher.ts`<br>`electron/main.js` | تعطيل `DevTools` في الإنتاج، تشفير `IndexedDB/localStorage` بـ `AES-256-GCM`، وإصدار ختم `KSP-XXXX-XXXX` وكشف التلاعب. |
| **Layer 4: بوابات الدفع وخزنة المالك** | التحقق التوقيتي الثابت لـ `Webhooks` وحماية `RIB` المالك | `src/lib/security/webhook-verifier.ts`<br>`src/app/api/webhooks/{youcanpay,paddle,hyperswitch}/route.ts`<br>`src/app/api/v1/owner/vault/route.ts`<br>`src/components/layout/OwnerProfileModal.tsx` | فحص `crypto.timingSafeEqual`، رفض إعادة الإرسال (`> 5 دقائق`)، تسجيل محاولات التزوير، وتنبيه `P0` فوري عند تغيير الـ `RIB`. |
| **Layer 5: حصن المشرف العام (`Zero-Trust`)** | حماية مسار الإدارة العليا بتحقق متعدد الطبقات ومسار خفي | `src/lib/security/zero-trust-admin.ts`<br>`src/middleware.ts` | فرض `Cf-Access-Jwt-Assertion`، قائمة `IP` المسموحة، تحقق `MFA/Passkey`، ومسار خفي `SUPER_ADMIN_STEALTH_PATH`. |
| **Layer 6: جدار الحماية `WAF/IPS` ووكلاء الدفاع** | صد هجمات `SQLi/XSS/Path Traversal` والحظر التلقائي للماسحات والكشط | `src/lib/security/waf-ips-shield.ts`<br>`src/middleware.ts`<br>`infra/security/*` | حظر `403 Forbidden` فوري، عزل `IP` لمدة 15 دقيقة تلقائياً، وحقن ترويسات الأمان (`HSTS`, `X-Frame-Options`, إلخ). |
| **Layer 7: أمن مستودع الكود وسلسلة التوريد** | فحص الاعتماديات و`Keyless OIDC` وفحص تسرب المفاتيح | `.github/dependabot.yml`<br>`.github/workflows/kaspi-security-oid-ci.yml`<br>`scripts/security/secret-scan.mjs` | منع الاعتماد على مفاتيح سحابية طويلة الأمد عبر `OIDC`، ومنع دمج أي مفتاح سري أو `NEXT_PUBLIC_` خاطئ. |
| **Layer 8: أتمتة الإيرادات وتنبيهات الطوارئ `P0`** | فوترة دورية بـ `Poste` (`200 / +150 MAD`) وتنبيهات الطوارئ فقط + دعم `AI` | `src/lib/automation/subscription-lifecycle.ts`<br>`src/app/api/automation/billing-cron/route.ts`<br>`src/lib/automation/smart-critical-alerter.ts`<br>`src/app/api/ai/chat/route.ts` | فترة سماح 3 أيام، وضع القراءة الآمنة عند الانتهاء دون فقدان بيانات، تنبيه `P0` للحوادث الحرجة الـ 5 فقط، ودعم عتاد `POS` 24/7. |

---

## 3. جدول الدفاع المتعمق ذو الطبقات السبع (7-Layer Defense-in-Depth Table)

| رقم الطبقة | اسم الطبقة (`Defense Layer`) | التقنية المطبقة (`Implementation`) | الهدف الأمني (`Security Objective`) |
| :---: | :--- | :--- | :--- |
| **1** | **سجلات التدقيق الجنائية (`Audit Logs`)** | `HMAC-SHA256 Hash Chain` + مخزن خارجي `Write-Only` | منع طمس الأدلة الجنائية وضمان التتبع الكامل لجميع العمليات الحرجة |
| **2** | **قاعدة البيانات (`Neon PostgreSQL`)** | `Row-Level Security (RLS)` + `pgAudit` + `PITR` + `AES-256-GCM` | عزل بيانات المتاجر ومنع الحذف أو التعديل في الجداول الجنائية |
| **3** | **تطبيق سطح المكتب والسلسلة الضريبية** | `Electron Sandbox` + `AES-256-GCM` + `SHA-256 Invoice Chain` | حماية نقاط البيع غير المتصلة بالإنترنت وإثبات سلامة كل فاتورة |
| **4** | **بوابات الدفع وخزنة المالك** | `crypto.timingSafeEqual` + `5-min Replay Window` + `PCI-DSS` | إحباط الإشعارات المزورة (`Forged Webhooks`) وحماية بيانات `RIB` |
| **5** | **حصن المشرف العام (`Super Admin`)** | `Cloudflare Zero Trust JWT` + `IP Allowlist` + `MFA` + `Stealth` | منع أي وصول غير مصرح به للوحة التحكم المركزية للمنصة |
| **6** | **حماية `API/AI` وجدار التطبيقات `WAF`** | `Backend-Only AI Keys` + `OWASP CRS Signatures` + `Auto-Ban IPS` | حماية مفاتيح الذكاء الاصطناعي وصد الحقن والكشط الآلي تلقائياً |
| **7** | **سلسلة التوريد و`GitHub OIDC`** | `Dependabot` + `Keyless OIDC CI` + `secret-scan.mjs` | منع تسرب المفاتيح في الكود وتأمين دورة النشر التلقائي (`CI/CD`) |

---

## 4. جدول الدرع الدفاعي الآلي المجاني (Automated Free Defense Shield Table)

| الأداة / النظام | الطبقة | الدور الدفاعي التلقائي | التكامل في المستودع |
| :--- | :--- | :--- | :--- |
| **Cloudflare WAF & Zero Trust** | حافة الشبكة (`Edge`) | فلترة `DDoS`، حماية `Zero Trust` لـ `/super-admin`، وحقن ترويسات الهوية الجغرافية | `src/lib/security/zero-trust-admin.ts` |
| **ModSecurity OWASP CRS** | طبقة التطبيق (`WAF`) | صد هجمات `SQLi` و`XSS` و`Path Traversal` وماسحات الثغرات | `src/lib/security/waf-ips-shield.ts` |
| **CrowdSec IPS** | منع التطفل التعاوني | تحليل السجلات وحظر عناوين `IP` المهاجمة جماعياً عبر `Bouncer` | `infra/security/crowdsec-kaspi-acquis.yaml` |
| **Fail2Ban** | مستوى النظام والشبكة | حظر تلقائي لمدة ساعة إلى 24 ساعة بعد تكرار محاولات الدخول الفاشلة | `infra/security/fail2ban-kaspi.conf` |
| **Wazuh XDR** | مراقبة الكشف والاستجابة | قواعد كشف فورية لتزوير الـ `Webhook` أو كسر سلسلة الفواتير | `infra/security/wazuh-agent-rules.xml` |
| **Suricata IDS** | كشف التسلل الشبكي | مراقبة الحزم المشبوهة على مستوى خادم الإنتاج وربطها بـ `Wazuh` | تكامل تليمتري مع معايير `Wazuh/SOAR` |
| **Shuffle SOAR** | الأتمتة الأمنية والاستجابة | أتمتة تذاكر الحوادث وإشعارات الطوارئ عبر خطاف موحد | `infra/security/shuffle-dfir-iris-webhook-schema.json` |
| **DFIR-IRIS** | إدارة الأدلة والتحقيق الجنائي | توثيق حوادث `P0` وتجميع سلاسل التجزئة للتحقيق القانوني | `infra/security/shuffle-dfir-iris-webhook-schema.json` |

---

## 5. قائمة التحقق السريعة للمؤسس — 5 دقائق (Founder's 5-Minute External Account Checklist)

لإكمال الإغلاق الأمني على مستوى الحسابات السحابية الخارجية دون المساس بالكود:

1. **تأمين حساب `GitHub`:**
   - تفعيل **Passkeys / FIDO2 Hardware Key** كمصادقة ثنائية إلزامية.
   - تفعيل **Secret Scanning & Push Protection** من إعدادات الأمان في المستودع (`Settings -> Code security and analysis`).
   - حفظ **Recovery Codes** في خزنة كلمات مرور غير متصلة بالإنترنت (`Bitwarden / 1Password` أو نسخة ورقية مغلفة).
2. **تفعيل `Cloudflare Zero Trust`:**
   - إنشاء سياسة `Access Policy` لمسار `/super-admin` (أو المسار الخفي `SUPER_ADMIN_STEALTH_PATH`) تقتصر على البريد الرسمي للمؤسس.
   - ضبط المتغير `CLOUDFLARE_ZERO_TRUST_ENFORCED=true` و`CF_ACCESS_TEAM_DOMAIN` في بيئة الإنتاج.
3. **إعداد البريد الثانوي المعزول (`Air-Gapped Secondary Email / S3 Object Lock`):**
   - تخصيص بريد إلكتروني مستقل تماماً عن بريد الإدارة لاستلام تقارير النسخ الاحتياطي المشفر (`offsite-backup-321.mjs`).
   - تفعيل صلاحيات **Write-Only** على نقطة الاستقبال `FORENSIC_WRITE_ONLY_INGEST_URL` لضمان بقاء الأدلة الجنائية محصنة وفق قاعدة **3-2-1**.
