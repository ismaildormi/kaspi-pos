#!/bin/bash

# ==============================================================================
# KASPI POS — Open-Source AI Studio, Arena AI & Retail Engines Synchronizer
# نقل ومزامنة جميع المصادر المفتوحة (10 مصادر أساسية + منصات Arena AI الرسمية)
# ==============================================================================

mkdir -p external_sources
cd external_sources || exit

# قائمة الروابط المباشرة للنقل (شاملة Arena AI + Puck + المصادر الـ 10)
REPOS=(
  "https://github.com/lm-sys/FastChat.git"
  "https://github.com/lm-sys/arena-hard-auto.git"
  "https://github.com/puckeditor/puck.git"
  "https://github.com/miurla/morphic.git"
  "https://github.com/moonshine-ai/moonshine.git"
  "https://github.com/Zipstack/unstract.git"
  "https://github.com/pdfme/pdfme.git"
  "https://github.com/ucbepic/docetl.git"
  "https://github.com/assistant-ui/assistant-ui.git"
  "https://github.com/OpnForm/OpnForm.git"
  "https://github.com/Lightning-AI/LitServe.git"
  "https://github.com/vercel/next-forge.git"
)

# تنفيذ عملية النقل لكل مصدر مع تحسين الحجم (--depth 1 --filter=blob:none)
for repo in "${REPOS[@]}"; do
  name=$(basename "$repo" .git)
  echo "----------------------------------------"
  echo "نقل المصدر: $name ($repo)"
  if [ -d "$name/.git" ]; then
    echo "المصدر $name موجود مسبقاً، جاري التحديث..."
    (cd "$name" && git pull --depth 1)
  else
    git clone --depth 1 --filter=blob:none "$repo" "$name"
  fi
done

echo "----------------------------------------"
echo "تم نقل جميع المصادر ومنصة Arena AI بنجاح داخل مجلد external_sources!"
