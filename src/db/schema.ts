import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  real,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

export const savedStatusEnum = pgEnum("saved_status", [
  "new",
  "contacted",
  "applied",
  "interview",
  "rejected",
  "offer",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    website: text("website"),
    websiteDomain: text("website_domain"),
    linkedinUrl: text("linkedin_url"),
    logoUrl: text("logo_url"),
    hqCity: text("hq_city"),
    hqCountry: text("hq_country"),
    fundingAmountUsd: integer("funding_amount_usd"),
    fundingRound: text("funding_round"),
    fundingDate: timestamp("funding_date", { withTimezone: true }),
    investors: jsonb("investors").$type<string[]>().default([]),
    industry: text("industry"),
    subcategory: text("subcategory"),
    aiCategory: text("ai_category"),
    businessModel: text("business_model"),
    isOpenSource: boolean("is_open_source").default(false),
    githubStars: integer("github_stars"),
    hiringPageUrl: text("hiring_page_url"),
    openRolesTotal: integer("open_roles_total").default(0),
    pmRoles: integer("pm_roles").default(0),
    aiRoles: integer("ai_roles").default(0),
    engRoles: integer("eng_roles").default(0),
    workMode: text("work_mode"),
    visaSponsorship: boolean("visa_sponsorship"),
    languagesRequired: jsonb("languages_required").$type<string[]>().default([]),
    normalizedName: text("normalized_name"),
    discoverySources: jsonb("discovery_sources").$type<string[]>().default([]),
    discoveryConfidence: integer("discovery_confidence").default(0),
    parisPresenceScore: integer("paris_presence_score").default(0),
    parisPresenceBreakdown: jsonb("paris_presence_breakdown").$type<
      Record<string, number>
    >(),
    sources: jsonb("sources")
      .$type<Record<string, { value: unknown; source: string; fetchedAt: string }>>()
      .default({}),
    aiHiringScore: integer("ai_hiring_score").default(0),
    pmFitScore: integer("pm_fit_score").default(0),
    aiHiringScoreBreakdown: jsonb("ai_hiring_score_breakdown").$type<
      Record<string, number>
    >(),
    pmFitScoreBreakdown: jsonb("pm_fit_score_breakdown").$type<
      Record<string, number>
    >(),
    strategicRelevanceScore: integer("strategic_relevance_score"),
    description: text("description"),
    dataHash: text("data_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("companies_slug_idx").on(table.slug),
    uniqueIndex("companies_website_domain_idx").on(table.websiteDomain),
    index("companies_hq_country_idx").on(table.hqCountry),
    index("companies_funding_round_idx").on(table.fundingRound),
    index("companies_funding_date_idx").on(table.fundingDate),
    index("companies_ai_category_idx").on(table.aiCategory),
    index("companies_ai_hiring_score_idx").on(table.aiHiringScore),
    index("companies_pm_fit_score_idx").on(table.pmFitScore),
    index("companies_name_idx").on(table.name),
    index("companies_normalized_name_idx").on(table.normalizedName),
    index("companies_paris_presence_score_idx").on(table.parisPresenceScore),
    index("companies_discovery_confidence_idx").on(table.discoveryConfidence),
    index("companies_strategic_relevance_score_idx").on(table.strategicRelevanceScore),
  ]
);

export const companyBriefs = pgTable(
  "company_briefs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    brief: jsonb("brief").$type<CompanyBriefContent>().notNull(),
    dataHash: text("data_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("company_briefs_company_idx").on(table.companyId)]
);

export const savedCompanies = pgTable(
  "saved_companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    notes: text("notes").default(""),
    status: savedStatusEnum("status").default("new").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("saved_companies_user_company_idx").on(table.userId, table.companyId),
    index("saved_companies_user_idx").on(table.userId),
  ]
);

export const ingestionRuns = pgTable(
  "ingestion_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobName: text("job_name").notNull(),
    sourceName: text("source_name"),
    status: jobStatusEnum("status").default("pending").notNull(),
    itemsProcessed: integer("items_processed").default(0),
    itemsCreated: integer("items_created").default(0),
    itemsUpdated: integer("items_updated").default(0),
    itemsSkipped: integer("items_skipped").default(0),
    rejectionReasons: jsonb("rejection_reasons").$type<Record<string, number>>().default({}),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("ingestion_runs_job_name_idx").on(table.jobName),
    index("ingestion_runs_started_at_idx").on(table.startedAt),
  ]
);

export const rawFundingItems = pgTable(
  "raw_funding_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceName: text("source_name").notNull(),
    externalId: text("external_id").notNull(),
    rawData: jsonb("raw_data").notNull(),
    processed: boolean("processed").default(false),
    companyId: uuid("company_id").references(() => companies.id),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("raw_funding_items_source_external_idx").on(
      table.sourceName,
      table.externalId
    ),
  ]
);

export type CompanyBriefContent = {
  whyNow: string;
  whyThisCompany: string;
  whyTheyMayHirePMs: string;
  suggestedOutreachStrategy: string;
  linkedinMessage: string;
  resumeFocus: string;
  interviewPrepTopics: string[];
  risks: string[];
};

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type SavedCompany = typeof savedCompanies.$inferSelect;
export type SavedStatus = (typeof savedStatusEnum.enumValues)[number];
