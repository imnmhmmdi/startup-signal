ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "strategic_relevance_score" integer;
CREATE INDEX IF NOT EXISTS "companies_strategic_relevance_score_idx" ON "companies" ("strategic_relevance_score");
