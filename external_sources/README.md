# KASPI POS — External Open-Source Engines (`external_sources/`)

هذا المجلد يضم المصادر المفتوحة الـ 10 الكاملة التي تم ربطها ودمج محركاتها داخل **Kaspi AI Studio**:

## 1. قائمة المصادر الـ 10 والروابط المباشرة

| الترتيب | اسم المشروع | الرابط المباشر على GitHub | رابط النقل المباشر (Git Clone) | الوظيفة الأساسية في KASPI POS |
| :--- | :--- | :--- | :--- | :--- |
| **01** | **Morphic** | https://github.com/miurla/morphic | `https://github.com/miurla/morphic.git` | محرك بحث بالذكاء الاصطناعي مع إجابات مدعومة بمصادر موثقة (Web + Store RAG). |
| **02** | **Moonshine** | https://github.com/moonshine-ai/moonshine | `https://github.com/moonshine-ai/moonshine.git` | تحويل الكلام إلى نص وتوليد ملفات صوتية WAV حقيقية محلياً على بروسيسور الجهاز. |
| **03** | **Unstract** | https://github.com/Zipstack/unstract | `https://github.com/Zipstack/unstract.git` | تحويل المستندات والملفات (PDF/صور/نصوص) إلى بيانات JSON منظمة وحقنها في المخزون. |
| **04** | **pdfme** | https://github.com/pdfme/pdfme | `https://github.com/pdfme/pdfme.git` | مولّد مستندات PDF ثنائية حقيقية (`%PDF-1.4`) مع محرر قوالب مرئي وحفظ تلقائي. |
| **05** | **DocETL** | https://github.com/ucbepic/docetl | `https://github.com/ucbepic/docetl.git` | استخراج وتصنيف وتلخيص وتحليل البيانات من آلاف النصوص والسجلات وهوامش الربح. |
| **06** | **assistant-ui** | https://github.com/assistant-ui/assistant-ui | `https://github.com/assistant-ui/assistant-ui.git` | واجهة محادثة متكاملة بالذكاء الاصطناعي مبنية بـ React بستايل Google AI Studio. |
| **07** | **OpnForm** | https://github.com/OpnForm/OpnForm | `https://github.com/OpnForm/OpnForm.git` | أداة لبناء النماذج التفاعلية (Forms) مع الأسئلة الشرطية ورفع الملفات والأتمتة. |
| **08** | **LitServe** | https://github.com/Lightning-AI/LitServe | `https://github.com/Lightning-AI/LitServe.git` | تحويل نماذج الذكاء الاصطناعي المحلية والمجانية إلى واجهة برمجية (API) سريعة. |
| **09** | **next-forge** | https://github.com/vercel/next-forge | `https://github.com/vercel/next-forge.git` | قالب متكامل لبدء مشروع SaaS جاهز (حسابات، دفع، قاعدة بيانات، وتعدد المتاجر). |
| **10** | **Puck** | https://github.com/puckeditor/puck | `https://github.com/puckeditor/puck.git` | محرر مواقع ومتاجر إلكترونية مرئي بالسحب والإفلات (Drag & Drop) لتطبيقات React. |

---

## 2. سكريبت النقل المباشر (`scripts/sync-open-source-engines.sh`)

```bash
#!/bin/bash

# إنشاء مجلد رئيسي يجمع جميع المصادر داخل مشروعك
mkdir -p external_sources
cd external_sources || exit

# قائمة الروابط المباشرة للنقل
REPOS=(
  "https://github.com/miurla/morphic.git"
  "https://github.com/moonshine-ai/moonshine.git"
  "https://github.com/Zipstack/unstract.git"
  "https://github.com/pdfme/pdfme.git"
  "https://github.com/ucbepic/docetl.git"
  "https://github.com/assistant-ui/assistant-ui.git"
  "https://github.com/OpnForm/OpnForm.git"
  "https://github.com/Lightning-AI/LitServe.git"
  "https://github.com/vercel/next-forge.git"
  "https://github.com/puckeditor/puck.git"
)

# تنفيذ عملية النقل لكل مصدر
for repo in "${REPOS[@]}"; do
  echo "----------------------------------------"
  echo "نقل المصدر: $repo"
  git clone --depth 1 "$repo"
done

echo "----------------------------------------"
echo "تم نقل جميع المصادر الـ 10 بنجاح داخل مجلد external_sources!"
```
