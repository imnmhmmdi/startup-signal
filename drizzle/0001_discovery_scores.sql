ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "normalized_name" text;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "discovery_sources" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "discovery_confidence" integer DEFAULT 0;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "paris_presence_score" integer DEFAULT 0;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "paris_presence_breakdown" jsonb;

CREATE INDEX IF NOT EXISTS "companies_normalized_name_idx" ON "companies" ("normalized_name");
CREATE INDEX IF NOT EXISTS "companies_paris_presence_score_idx" ON "companies" ("paris_presence_score");
CREATE INDEX IF NOT EXISTS "companies_discovery_confidence_idx" ON "companies" ("discovery_confidence");
