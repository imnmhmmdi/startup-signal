export const PRODUCT = {
  name: "Startup Signal",
  tagline: "Hiring intelligence for senior Product Managers",
  description:
    "Discover the best Senior PM opportunities in the Paris ecosystem — funding momentum, hiring signals, and ecosystem presence.",
  defaultCountry: "France",
  focusRegion: "Paris ecosystem",
} as const;

export const NAV_ITEMS = [
  { href: "/", label: "Overview", description: "Hiring intelligence at a glance" },
  { href: "/companies", label: "Companies", description: "Browse funded startups" },
  { href: "/funding", label: "Funding", description: "Recent funding events" },
  { href: "/pipeline", label: "Pipeline", description: "Application workflow" },
] as const;

export function getHiringPrediction(score: number): {
  label: string;
  detail: string;
} {
  if (score >= 75) {
    return { label: "High", detail: "Likely to hire PMs within 90 days" };
  }
  if (score >= 50) {
    return { label: "Moderate", detail: "Post-funding scaling may open PM roles" };
  }
  return { label: "Low", detail: "Limited near-term PM hiring signal" };
}
