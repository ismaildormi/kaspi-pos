#!/bin/bash

# ==============================================================================
# KASPI POS — Open-Source AI Studio & Retail Engines Synchronizer
# نقل ومزامنة جميع المصادر المفتوحة الـ 10 داخل مجلد external_sources
# ==============================================================================

mkdir -p external_sources
cd external_sources || exit

# قائمة الروابط المباشرة للنقل (10 مصادر مفتوحة كاملة)
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

# تنفيذ عملية النقل لكل مصدر مع تحسين الحجم (--depth 1 --filter=blob:none)
for repo in "${REPOS[@]}"; do
  name=$(basename "$repo" .git)
  echo "----------------------------------------"
  echo "نقل المصدر: $name ($repo)"
  if [ -d "$name/.git" ]; then
    echo "المصدر موجود مسبقاً، جاري التحديث..."
    (cd "$name" && git pull --depth 1)
  else
    git clone --depth 1 --filter=blob:none "$repo" "$name"
  fi
done

echo "----------------------------------------"
echo "تم نقل جميع المصادر الـ 10 بنجاح داخل مجلد external_sources!"
