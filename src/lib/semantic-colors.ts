import { getHiringPrediction } from "@/config/product";
import { cn } from "@/lib/utils";

/** Display thresholds only — scoring logic lives elsewhere. */
export const PM_FIT_HIGH_THRESHOLD = 70;
export const HIRING_SIGNAL_MODERATE_THRESHOLD = 50;

export type ScoreBadgeKind = "pmFit" | "hiring";

export type StatCardAccent = "pmFit" | "funding" | "hiring" | "neutral";

export type SectionAccent = "pmFit" | "funding" | "hiring" | "neutral";

const BADGE_SOFT = "border";

export function resolveScoreBadgeKind(label?: string): ScoreBadgeKind {
  if (label === "Hiring signal") return "hiring";
  return "pmFit";
}

export function getScoreBadgeClasses(
  score: number,
  kind: ScoreBadgeKind = "pmFit"
): string {
  if (kind === "pmFit") {
    if (score >= PM_FIT_HIGH_THRESHOLD) {
      return cn(
        BADGE_SOFT,
        "bg-emerald-500/10 text-emerald-800 border-emerald-200/70 dark:text-emerald-300 dark:border-emerald-800/50"
      );
    }
    return cn(BADGE_SOFT, "bg-muted/50 text-muted-foreground border-border");
  }

  if (score >= HIRING_SIGNAL_MODERATE_THRESHOLD) {
    return cn(
      BADGE_SOFT,
      "bg-amber-500/10 text-amber-800 border-amber-200/70 dark:text-amber-300 dark:border-amber-800/50"
    );
  }
  return cn(BADGE_SOFT, "bg-muted/50 text-muted-foreground border-border");
}

export function getPmFitRingColors(score: number) {
  if (score >= PM_FIT_HIGH_THRESHOLD) {
    return {
      track: "stroke-emerald-200/80 dark:stroke-emerald-900/50",
      progress: "stroke-emerald-500",
      text: "text-emerald-700 dark:text-emerald-400",
      badge:
        "bg-emerald-500/10 text-emerald-800 border-emerald-200/70 dark:text-emerald-300 dark:border-emerald-800/50",
    };
  }

  return {
    track: "stroke-muted-foreground/20",
    progress: "stroke-muted-foreground/50",
    text: "text-muted-foreground",
    badge: "bg-muted/50 text-muted-foreground border-border",
  };
}

export function getPmFitBorderTint(score: number): string {
  if (score >= PM_FIT_HIGH_THRESHOLD) {
    return "border-emerald-200/40 dark:border-emerald-900/40";
  }
  return "border-border";
}

export function getHiringSignalInlineClasses(score: number): string {
  const base =
    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums";

  if (score >= HIRING_SIGNAL_MODERATE_THRESHOLD) {
    return cn(
      base,
      "bg-amber-500/10 text-amber-800 border-amber-200/70 dark:text-amber-300 dark:border-amber-800/50"
    );
  }

  return cn(base, "bg-muted/50 text-muted-foreground border-border");
}

export function getHiringPredictionTextClass(label: string): string {
  if (label === "High" || label === "Moderate") {
    return "text-amber-700 dark:text-amber-400";
  }
  return "text-muted-foreground";
}

export function getHiringUrgencyDotClass(score: number): string {
  const { label } = getHiringPrediction(score);

  if (label === "High" || label === "Moderate") {
    return "bg-amber-500";
  }

  return "bg-muted-foreground/40";
}

export function getCategoryBadgeClasses(category: string | null | undefined): string {
  const base = cn(BADGE_SOFT, "text-xs font-semibold tracking-wide");

  if (!category) {
    return cn(base, "bg-muted/50 text-muted-foreground border-border");
  }

  const normalized = category.toLowerCase();

  if (normalized === "ai infrastructure") {
    return cn(
      base,
      "bg-violet-500/10 text-violet-800 border-violet-200/70 dark:text-violet-300 dark:border-violet-800/50"
    );
  }

  if (normalized === "healthcare ai") {
    return cn(
      base,
      "bg-rose-500/10 text-rose-800 border-rose-200/70 dark:text-rose-300 dark:border-rose-800/50"
    );
  }

  if (normalized === "llm platform") {
    return cn(
      base,
      "bg-indigo-500/10 text-indigo-800 border-indigo-200/70 dark:text-indigo-300 dark:border-indigo-800/50"
    );
  }

  return cn(base, "bg-muted/50 text-muted-foreground border-border");
}

export function getFundingBadgeClasses(): string {
  return cn(
    BADGE_SOFT,
    "text-xs font-semibold tracking-wide bg-blue-500/12 text-blue-900 border-blue-300/80 dark:text-blue-200 dark:border-blue-700/60"
  );
}

export function getFundingAmountClasses(size: "sm" | "md" | "lg" = "md"): string {
  const base = "tabular-nums text-blue-900 dark:text-blue-200";
  const sizes = {
    sm: cn(base, "text-sm font-semibold"),
    md: cn(base, "font-semibold"),
    lg: cn(base, "text-lg font-bold tracking-tight dark:text-blue-100"),
  };
  return sizes[size];
}

export function getFundingRowHoverClasses(): string {
  return cn(
    "group block rounded-lg border border-transparent transition-all duration-200",
    "hover:border-blue-200/60 hover:bg-blue-500/[0.04] hover:shadow-sm",
    "dark:hover:border-blue-800/50 dark:hover:bg-blue-500/[0.06]"
  );
}

export function getFundingCardHoverClasses(): string {
  return cn(
    "group block rounded-xl border bg-card shadow-sm ring-1 ring-foreground/[0.04]",
    "transition-all duration-200 ease-out",
    "hover:-translate-y-0.5 hover:border-blue-300/50 hover:shadow-md hover:shadow-blue-500/[0.08]",
    "dark:hover:border-blue-700/50"
  );
}

export function getPmFitReasonTextClass(): string {
  return "text-emerald-700 dark:text-emerald-400";
}

export function getPmFitHighlightTextClass(): string {
  return "text-emerald-700 dark:text-emerald-400";
}

export function getPmFitCellBackgroundClass(score: number): string {
  if (score >= PM_FIT_HIGH_THRESHOLD) {
    return "bg-emerald-500/5";
  }
  return "";
}

export function getStatCardAccentClasses(accent: StatCardAccent = "neutral"): string {
  switch (accent) {
    case "pmFit":
      return "border-emerald-200/30 bg-emerald-500/[0.03] dark:border-emerald-900/30";
    case "funding":
      return "border-blue-200/30 bg-blue-500/[0.03] dark:border-blue-900/30";
    case "hiring":
      return "border-amber-200/30 bg-amber-500/[0.03] dark:border-amber-900/30";
    default:
      return "";
  }
}

export function getSectionEyebrowClass(accent: SectionAccent = "neutral"): string {
  switch (accent) {
    case "pmFit":
      return "text-emerald-700 dark:text-emerald-400";
    case "funding":
      return "text-blue-700 dark:text-blue-400";
    case "hiring":
      return "text-amber-700 dark:text-amber-400";
    default:
      return "text-muted-foreground";
  }
}

/** Shared panel chrome for filters, empty states, and table shells. */
export function getSurfacePanelClasses(): string {
  return "rounded-xl border bg-card ring-1 ring-foreground/10";
}

export function getInteractiveTableRowClasses(): string {
  return "transition-colors hover:bg-muted/40";
}

export function getNavItemActiveClasses(): string {
  return "bg-primary/10 text-primary ring-1 ring-primary/15";
}

export function getNavItemInactiveClasses(): string {
  return "text-muted-foreground hover:bg-muted hover:text-foreground";
}

export function getClickableCardHoverClasses(): string {
  return "transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5";
}
