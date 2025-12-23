ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "likes_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "rating_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "rating_sum" integer DEFAULT 0 NOT NULL;
