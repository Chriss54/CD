-- Add coverImage column to Course table
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "coverImage" TEXT;
