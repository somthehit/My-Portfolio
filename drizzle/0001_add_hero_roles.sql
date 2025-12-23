ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "hero_roles" text[] DEFAULT '{}'::text[] NOT NULL;
