import {
  extractDomain,
  normalizeCompanyName,
  normalizeLinkedInSlug,
} from "./utils";

export type CompanyNameValidationContext = {
  website?: string;
  linkedinUrl?: string;
};

export type CompanyNameRejection = {
  candidate: string;
  reason: string;
};

export type CompanyNameEvaluation = {
  name?: string;
  rejected: CompanyNameRejection[];
};

const HEADLINE_PREFIX_PATTERN =
  /^(exclusive|breaking|updated|analysis|opinion|interview|podcast|newsletter|watch|live|investigation|explainer|comment)\s*:\s*/i;

const EXACT_BOILERPLATE_NAMES = new Set([
  "exclusive",
  "breaking",
  "the seed",
  "european deeptech",
  "index to lead",
  "raises",
  "funding",
  "startup",
  "startups",
  "deeptech",
  "european",
  "seed",
  "series",
  "round",
  "investors",
  "venture",
  "weekly recap",
  "tech weekly",
  "ia",
]);

const NEWS_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "its",
  "of",
  "on",
  "or",
  "our",
  "that",
  "the",
  "their",
  "this",
  "to",
  "was",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
  "your",
]);

const SECTOR_BOILERPLATE_WORDS = new Set([
  "ai",
  "artificial",
  "intelligence",
  "deeptech",
  "deep",
  "tech",
  "technology",
  "european",
  "europe",
  "global",
  "startup",
  "startups",
  "founder",
  "founders",
  "funding",
  "fundraise",
  "fundraising",
  "investment",
  "investments",
  "investor",
  "investors",
  "venture",
  "capital",
  "vc",
  "vcs",
  "seed",
  "series",
  "round",
  "rounds",
  "growth",
  "exclusive",
  "breaking",
  "report",
  "recap",
  "weekly",
  "landscape",
  "ecosystem",
  "market",
  "markets",
  "sector",
  "trends",
  "trend",
  "future",
  "next",
  "new",
  "top",
  "inside",
  "index",
  "lead",
  "leads",
  "leading",
  "targeting",
  "raises",
  "raised",
  "lands",
  "secures",
  "closes",
  "semiconductors",
  "companies",
  "company",
  "hand",
  "robot",
  "cyber",
  "cybersecurity",
  "commentary",
  "storytelling",
  "unicorn",
  "deals",
  "deal",
  "records",
  "broken",
  "eight",
  "ten",
  "comment",
  "adoption",
  "exit",
  "prestige",
  "massive",
  "piloter",
  "entreprises",
  "fondateurs",
  "reve",
  "americain",
  "wall",
  "street",
  "versailles",
]);

const BRAND_SUFFIX_WORDS = new Set(["ai", "ml", "labs", "lab", "hq", "io", "tech", "robotics"]);

const EDITORIAL_TITLE_PATTERN =
  /(?:\?$|\d+\s+(companies|startups|firms|deals)\b|weekly recap|companies that|learn from|storytelling|commentary|how .+ can|why .+ (?:is|are|should|will)|what .+ (?:is|are|means)|from .+ to .+:)/i;

const FRENCH_EDITORIAL_TITLE_PATTERN =
  /^(de |la |les |adoption |exit de |comment |pourquoi |est-ce que |décryptage|analyse |ia\s*:|les startups )/i;

const FRAGMENT_PREFIX_PATTERN =
  /^(investment into|investment in|by |the best|france seeks|index to|european deeptech|what |how |why |commentary|analysis|report|weekly|inside|comment|podcast|opinion|records broken|records|health unicorn|eight |several |many |amid |from |can |semiconductors|robot hand|de wall street|adoption massive|exit de|la tech|european tech weekly recap|european tech weekly|amid rising)\b/i;

const FRAGMENT_CONTENT_PATTERN =
  /\b(into|aren't|isn't|don't|won't|for the next|seeking to|role in|record funding|broken as|european startups|startups raise|companies raise|companies that|unicorn status|learn from|storytelling|settles|settle|talent growth|charging evs|powering data|fondateurs du|fondateurs de|le reve|à versailles|, le |, la )\b/i;

const LISTICLE_NAME_PATTERN =
  /(?:^\d+\s+|companies that|weekly recap|companies\b|startups\b|deals and|semiconductors\b|ten companies|eight european)/i;

const LOCATION_POSSESSIVE_PATTERN =
  /^(?:spain|germany|france|uk|u\.k\.|czech|poland|italy|sweden|norway|finland|denmark|netherlands|belgium|austria|portugal|ireland|switzerland|berlin|london|paris|syracuse|amsterdam|stockholm|oslo|copenhagen|dublin|madrid|barcelona|munich|vienna|lisbon|warsaw|prague)['’]s\s+/i;

const INVESTOR_SUFFIX_PATTERN = /\b(VC|Ventures|Capital Partners|Partners)\s*$/i;

const MAX_COMPANY_NAME_WORDS = 4;

function stripHeadlineBoilerplate(title: string): string {
  return title.replace(HEADLINE_PREFIX_PATTERN, "").trim();
}

function cleanExtractedName(name: string): string {
  return name
    .trim()
    .replace(/^['"“”‘’]+|['"“”‘’]+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/[,:;–—-]+$/g, "")
    .trim();
}

function isEditorialTitle(title: string): boolean {
  const cleaned = stripHeadlineBoilerplate(title);
  if (EDITORIAL_TITLE_PATTERN.test(cleaned)) return true;
  if (FRENCH_EDITORIAL_TITLE_PATTERN.test(cleaned)) return true;
  if (/^.+\s*:\s*\d+\s+/i.test(cleaned)) return true;
  return false;
}

function countMeaningfulWords(name: string): number {
  const rawWords = name
    .split(/\s+/)
    .map((word) => word.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);

  const meaningful = rawWords.filter(
    (word) => !NEWS_STOPWORDS.has(word) && !SECTOR_BOILERPLATE_WORDS.has(word)
  );
  const brandSuffixes = rawWords.filter((word) => BRAND_SUFFIX_WORDS.has(word));

  if (meaningful.length >= 1 && brandSuffixes.length > 0) {
    return meaningful.length + brandSuffixes.length;
  }

  return meaningful.length;
}

function hasProperNounSignal(name: string): boolean {
  const words = name.split(/\s+/).filter(Boolean);
  return words.some((word) => {
    const stripped = word.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");
    if (!stripped) return false;
    if (/^[A-Z0-9]{2,}$/.test(stripped)) return true;
    if (/^[A-Z][a-z]+/.test(stripped)) return true;
    if (/^[a-z]+[A-Z]/.test(stripped)) return true;
    if (/['’]/.test(stripped)) return true;
    return false;
  });
}

function isFragmentName(name: string): boolean {
  const lower = name.toLowerCase();
  if (FRAGMENT_PREFIX_PATTERN.test(lower)) return true;
  if (FRAGMENT_CONTENT_PATTERN.test(lower)) return true;
  if (LISTICLE_NAME_PATTERN.test(lower)) return true;
  if (/-based\b/i.test(name)) return true;
  if (/\bstartup\s+/i.test(name)) return true;
  if (LOCATION_POSSESSIVE_PATTERN.test(name)) return true;
  if (INVESTOR_SUFFIX_PATTERN.test(name)) return true;
  if (/^(investment|report|analysis|commentary|exclusive|seed|series|round)\b/.test(lower)) {
    return true;
  }
  if (name.includes(":")) return true;
  if (name.split(/\s+/).length > MAX_COMPANY_NAME_WORDS) return true;
  return false;
}

function isBoilerplateName(name: string): boolean {
  const normalized = normalizeCompanyName(name);
  if (!normalized) return true;
  if (EXACT_BOILERPLATE_NAMES.has(normalized)) return true;

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  if (words.every((word) => SECTOR_BOILERPLATE_WORDS.has(word) || NEWS_STOPWORDS.has(word))) {
    return true;
  }

  const boilerplateHits = words.filter(
    (word) => SECTOR_BOILERPLATE_WORDS.has(word) || EXACT_BOILERPLATE_NAMES.has(word)
  ).length;
  if (words.length <= 2 && boilerplateHits === words.length) return true;

  return false;
}

function explainInvalidCompanyName(
  name: string,
  context: CompanyNameValidationContext = {}
): string | null {
  const cleaned = cleanExtractedName(name);
  if (!cleaned || cleaned.length < 2) return "too short";
  if (cleaned.length > 80) return "too long";
  if (isFragmentName(cleaned)) return "editorial or descriptor fragment";
  if (isBoilerplateName(cleaned)) return "boilerplate headline text";
  if (!hasProperNounSignal(cleaned)) return "no proper-noun signal";

  const meaningfulWords = countMeaningfulWords(cleaned);

  if (meaningfulWords >= 2 && hasProperNounSignal(cleaned)) return null;
  if (meaningfulWords === 1 && hasProperNounSignal(cleaned)) return null;

  return "insufficient meaningful words";
}

export function isValidCompanyName(
  name: string,
  context: CompanyNameValidationContext = {}
): boolean {
  return explainInvalidCompanyName(name, context) === null;
}

function refineNameCandidates(name: string): string[] {
  const cleaned = cleanExtractedName(name);
  const refined = new Set<string>([cleaned]);

  const basedMatch = cleaned.match(/^[\w\s'’-]+-based\s+(.+)$/i);
  if (basedMatch?.[1]) refined.add(cleanExtractedName(basedMatch[1]));

  if (LOCATION_POSSESSIVE_PATTERN.test(cleaned)) {
    const stripped = cleaned.replace(LOCATION_POSSESSIVE_PATTERN, "");
    if (stripped) refined.add(cleanExtractedName(stripped));
  }

  const startupDescriptorMatch = cleaned.match(
    /^(?:[\w-]+\s+){1,4}startup\s+(.+)$/i
  );
  if (startupDescriptorMatch?.[1]) {
    refined.add(cleanExtractedName(startupDescriptorMatch[1]));
  }

  const unicornDescriptorMatch = cleaned.match(
    /^(?:health|french|ai|european|berlin|london|paris|cybersecurity|fintech)\s+(?:[\w-]+\s+){0,2}(?:startup|unicorn)\s+(.+)$/i
  );
  if (unicornDescriptorMatch?.[1]) {
    refined.add(cleanExtractedName(unicornDescriptorMatch[1]));
  }

  return [...refined].filter(Boolean);
}

function extractNameCandidates(title: string): string[] {
  const cleanedTitle = stripHeadlineBoilerplate(title);
  const candidates: string[] = [];

  const verbPattern =
    "(?:raises|raised|raise|secures|secured|secure|bags|bagged|lands|landed|closes|closed|gets|got|snags|snagged|pulls in|pulls|receives|received|nabs|nabbed|valued at|completes|completed)";

  const patterns: RegExp[] = [
    new RegExp(`^(.+?)\\s+targeting\\s+(?:[\\$€£]|\\d)`, "i"),
    new RegExp(`^(.+?)\\s+${verbPattern}(?:\\s+|[\\$€£]|$)`, "i"),
    new RegExp(`^(.+?)\\s+(?:in|into)\\s+(?:[\\$€£]|\\d)`, "i"),
    /(?:funding for|investment in|backed)\s+([A-Z0-9][^,.?]+?)(?:\s*[,.]|$)/i,
    new RegExp(`(?:^|:)\\s*(.+?)\\s+${verbPattern}(?:\\s+|[\\$€£]|$)`, "i"),
    /^[\w\s'’-]+-based\s+([A-Z0-9][\w'’&.-]*(?:\s+[A-Z0-9][\w'’&.-]*)*)\s+(?:raises|raised|raise|secures|secured|closes|closed|targeting)\b/i,
    /^(?:[\w'’-]+\s+){0,4}startup\s+([A-Z0-9][\w'’&.-]*(?:\s+[A-Z0-9][\w'’&.-]*)*)\s+(?:raises|raised|raise|secures|secured|closes|closed|targeting)\b/i,
    /^(?:health|french|ai|european|berlin|london|paris|cybersecurity|fintech)\s+(?:[\w-]+\s+){0,2}(?:startup|unicorn)\s+([A-Z0-9][\w'’&.-]*(?:\s+[A-Z0-9][\w'’&.-]*)*)\s+(?:raises|raised|raise|secures|secured|closes|closed|targeting)\b/i,
    /^([A-Z][A-Za-z0-9-]+)\s+(?:remporte|lève|levé|levée|annonce|rafle|clôture|cloture|obtient)\b/i,
  ];

  for (const pattern of patterns) {
    const match = cleanedTitle.match(pattern);
    if (match?.[1]) {
      candidates.push(...refineNameCandidates(match[1]));
    }
  }

  const possessiveMatch = cleanedTitle.match(
    /(?:^|[,:]\s*|[\w'’]+\s+)([A-Z0-9][\w'’&.-]*(?:\s+[A-Z0-9][\w'’&.-]*)+)\s+targeting\b/i
  );
  if (possessiveMatch?.[1]) {
    candidates.push(...refineNameCandidates(possessiveMatch[1]));
  }

  const afterColon = cleanedTitle.match(/:\s*(.+)$/);
  if (afterColon?.[1] && !/^\d+\s+(companies|startups)/i.test(afterColon[1])) {
    for (const pattern of patterns) {
      const match = afterColon[1].match(pattern);
      if (match?.[1]) {
        candidates.push(...refineNameCandidates(match[1]));
      }
    }
  }

  return [...new Set(candidates.filter(Boolean))];
}

export function evaluateCompanyNameFromTitle(
  title: string,
  context: CompanyNameValidationContext = {}
): CompanyNameEvaluation {
  const rejected: CompanyNameRejection[] = [];

  if (isEditorialTitle(title)) {
    return {
      rejected: [{ candidate: title, reason: "editorial or listicle headline" }],
    };
  }

  const candidates = extractNameCandidates(title).sort(
    (a, b) => a.split(/\s+/).length - b.split(/\s+/).length
  );
  if (candidates.length === 0) {
    return {
      rejected: [{ candidate: title, reason: "no company name pattern matched" }],
    };
  }

  for (const candidate of candidates) {
    const reason = explainInvalidCompanyName(candidate, context);
    if (reason) {
      rejected.push({ candidate, reason });
      continue;
    }
    return { name: candidate, rejected };
  }

  return { rejected };
}

export function extractCompanyName(
  title: string,
  context: CompanyNameValidationContext = {}
): string | undefined {
  return evaluateCompanyNameFromTitle(title, context).name;
}
