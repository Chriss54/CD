-- Add languageCode to User (preferred language)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "languageCode" VARCHAR(10) DEFAULT 'en';

-- Add languageCode and contentHash to Post
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "languageCode" VARCHAR(10);
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "contentHash" VARCHAR(64);

-- Add languageCode and contentHash to Comment
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "languageCode" VARCHAR(10);
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "contentHash" VARCHAR(64);

-- Add languageCode and contentHash to Course
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "languageCode" VARCHAR(10);
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "contentHash" VARCHAR(64);

-- Add languageCode and contentHash to Lesson
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "languageCode" VARCHAR(10);
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "contentHash" VARCHAR(64);

-- Add languageCode and contentHash to Event
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "languageCode" VARCHAR(10);
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "contentHash" VARCHAR(64);

-- Create Translation table for caching translations
CREATE TABLE IF NOT EXISTS "Translation" (
  "id" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "fieldName" TEXT NOT NULL,
  "sourceLanguage" TEXT NOT NULL,
  "sourceHash" TEXT NOT NULL,
  "targetLanguage" TEXT NOT NULL,
  "translatedContent" TEXT NOT NULL,
  "modelProvider" TEXT NOT NULL,
  "modelVersion" TEXT NOT NULL,
  "confidenceScore" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on Translation
CREATE UNIQUE INDEX IF NOT EXISTS "Translation_entityType_entityId_fieldName_targetLanguage_key" 
  ON "Translation"("entityType", "entityId", "fieldName", "targetLanguage");

-- Create index for efficient translation lookups
CREATE INDEX IF NOT EXISTS "Translation_entityType_entityId_targetLanguage_idx" 
  ON "Translation"("entityType", "entityId", "targetLanguage");
