ALTER TABLE "ingestion_runs" ADD COLUMN IF NOT EXISTS "items_skipped" integer DEFAULT 0;
ALTER TABLE "ingestion_runs" ADD COLUMN IF NOT EXISTS "rejection_reasons" jsonb DEFAULT '{}'::jsonb;
