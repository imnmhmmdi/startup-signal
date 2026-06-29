CREATE TYPE "public"."saved_status" AS ENUM('new', 'contacted', 'applied', 'interview', 'rejected', 'offer');
CREATE TYPE "public"."job_status" AS ENUM('pending', 'running', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS "companies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "website" text,
  "website_domain" text,
  "linkedin_url" text,
  "logo_url" text,
  "hq_city" text,
  "hq_country" text,
  "funding_amount_usd" integer,
  "funding_round" text,
  "funding_date" timestamp with time zone,
  "investors" jsonb DEFAULT '[]'::jsonb,
  "industry" text,
  "subcategory" text,
  "ai_category" text,
  "business_model" text,
  "is_open_source" boolean DEFAULT false,
  "github_stars" integer,
  "hiring_page_url" text,
  "open_roles_total" integer DEFAULT 0,
  "pm_roles" integer DEFAULT 0,
  "ai_roles" integer DEFAULT 0,
  "eng_roles" integer DEFAULT 0,
  "work_mode" text,
  "visa_sponsorship" boolean,
  "languages_required" jsonb DEFAULT '[]'::jsonb,
  "sources" jsonb DEFAULT '{}'::jsonb,
  "ai_hiring_score" integer DEFAULT 0,
  "pm_fit_score" integer DEFAULT 0,
  "ai_hiring_score_breakdown" jsonb,
  "pm_fit_score_breakdown" jsonb,
  "description" text,
  "data_hash" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "companies_slug_idx" ON "companies" ("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "companies_website_domain_idx" ON "companies" ("website_domain");
CREATE INDEX IF NOT EXISTS "companies_hq_country_idx" ON "companies" ("hq_country");
CREATE INDEX IF NOT EXISTS "companies_funding_round_idx" ON "companies" ("funding_round");
CREATE INDEX IF NOT EXISTS "companies_funding_date_idx" ON "companies" ("funding_date");
CREATE INDEX IF NOT EXISTS "companies_ai_category_idx" ON "companies" ("ai_category");
CREATE INDEX IF NOT EXISTS "companies_ai_hiring_score_idx" ON "companies" ("ai_hiring_score");
CREATE INDEX IF NOT EXISTS "companies_pm_fit_score_idx" ON "companies" ("pm_fit_score");
CREATE INDEX IF NOT EXISTS "companies_name_idx" ON "companies" ("name");

CREATE TABLE IF NOT EXISTS "company_briefs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "brief" jsonb NOT NULL,
  "data_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "company_briefs_company_idx" ON "company_briefs" ("company_id");

CREATE TABLE IF NOT EXISTS "saved_companies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "notes" text DEFAULT '',
  "status" "saved_status" DEFAULT 'new' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "saved_companies_user_company_idx" ON "saved_companies" ("user_id", "company_id");
CREATE INDEX IF NOT EXISTS "saved_companies_user_idx" ON "saved_companies" ("user_id");

CREATE TABLE IF NOT EXISTS "ingestion_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "job_name" text NOT NULL,
  "source_name" text,
  "status" "job_status" DEFAULT 'pending' NOT NULL,
  "items_processed" integer DEFAULT 0,
  "items_created" integer DEFAULT 0,
  "items_updated" integer DEFAULT 0,
  "error_message" text,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "ingestion_runs_job_name_idx" ON "ingestion_runs" ("job_name");
CREATE INDEX IF NOT EXISTS "ingestion_runs_started_at_idx" ON "ingestion_runs" ("started_at");

CREATE TABLE IF NOT EXISTS "raw_funding_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source_name" text NOT NULL,
  "external_id" text NOT NULL,
  "raw_data" jsonb NOT NULL,
  "processed" boolean DEFAULT false,
  "company_id" uuid REFERENCES "companies"("id"),
  "fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "raw_funding_items_source_external_idx" ON "raw_funding_items" ("source_name", "external_id");

-- Row Level Security
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company_briefs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saved_companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ingestion_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "raw_funding_items" ENABLE ROW LEVEL SECURITY;

-- Public read access for companies and briefs
CREATE POLICY "companies_public_read" ON "companies" FOR SELECT USING (true);
CREATE POLICY "company_briefs_public_read" ON "company_briefs" FOR SELECT USING (true);

-- Saved companies: users can only access their own
CREATE POLICY "saved_companies_select_own" ON "saved_companies" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_companies_insert_own" ON "saved_companies" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_companies_update_own" ON "saved_companies" FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "saved_companies_delete_own" ON "saved_companies" FOR DELETE USING (auth.uid() = user_id);

-- Service role handles ingestion (no public policies on ingestion tables)
CREATE POLICY "ingestion_runs_service" ON "ingestion_runs" FOR ALL USING (false);
CREATE POLICY "raw_funding_items_service" ON "raw_funding_items" FOR ALL USING (false);
