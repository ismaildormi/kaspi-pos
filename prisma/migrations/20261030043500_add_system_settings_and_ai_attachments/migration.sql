-- AlterTable
ALTER TABLE "ai_chat_messages" ADD COLUMN IF NOT EXISTS "image_url" TEXT,
ADD COLUMN IF NOT EXISTS "document_url" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "system_settings" (
    "id" UUID NOT NULL,
    "provider_name" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "base_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "system_settings_provider_name_key" ON "system_settings"("provider_name");
