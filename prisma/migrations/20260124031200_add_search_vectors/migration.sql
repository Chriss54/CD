-- Add plainText column to Post (for storing extracted Tiptap text)
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "plainText" TEXT;

-- Drop existing searchVector columns if they exist (from db push)
-- to recreate them as GENERATED columns
ALTER TABLE "Post" DROP COLUMN IF EXISTS "searchVector";
ALTER TABLE "User" DROP COLUMN IF EXISTS "searchVector";
ALTER TABLE "Course" DROP COLUMN IF EXISTS "searchVector";

-- Add search_vector column with GENERATED ALWAYS AS for Post
-- Weight B for content (posts don't have titles)
ALTER TABLE "Post" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("plainText", '')), 'B')
  ) STORED;

-- Add search_vector column with GENERATED ALWAYS AS for User
-- Weight A for name (more important), weight B for bio
ALTER TABLE "User" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(bio, '')), 'B')
  ) STORED;

-- Add search_vector column with GENERATED ALWAYS AS for Course
-- Weight A for title, weight B for description
ALTER TABLE "Course" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

-- Create GIN indexes for fast full-text search queries
CREATE INDEX IF NOT EXISTS "Post_searchVector_idx" ON "Post" USING GIN ("searchVector");
CREATE INDEX IF NOT EXISTS "User_searchVector_idx" ON "User" USING GIN ("searchVector");
CREATE INDEX IF NOT EXISTS "Course_searchVector_idx" ON "Course" USING GIN ("searchVector");
