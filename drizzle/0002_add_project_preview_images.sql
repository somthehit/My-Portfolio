ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "preview_images" text[] DEFAULT '{}'::text[] NOT NULL;
