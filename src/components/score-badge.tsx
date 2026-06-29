import { MapPin, ShieldCheck, Target, TrendingUp, LucideIcon } from "lucide-react";
import {
  getScoreBadgeClasses,
  resolveScoreBadgeKind,
} from "@/lib/semantic-colors";
import { cn } from "@/lib/utils";

type ScoreBadgeProps = {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  showTier?: boolean;
  align?: "center" | "start";
};

const LABEL_ICONS: Record<string, LucideIcon> = {
  "PM fit": Target,
  "Hiring signal": TrendingUp,
  "Paris presence": MapPin,
  Confidence: ShieldCheck,
};

export function getScoreTier(score: number): { label: string; shortLabel: string } {
  if (score >= 75) return { label: "Strong match", shortLabel: "Strong" };
  if (score >= 60) return { label: "Good fit", shortLabel: "Good" };
  if (score >= 50) return { label: "Moderate", shortLabel: "Moderate" };
  return { label: "Low fit", shortLabel: "Low" };
}

export function ScoreBadge({
  score,
  label,
  size = "sm",
  showTier = false,
  align = "center",
}: ScoreBadgeProps) {
  const tier = getScoreTier(score);
  const Icon = label ? LABEL_ICONS[label] : undefined;
  const kind = resolveScoreBadgeKind(label);

  return (
    <div className={cn("flex flex-col gap-0.5", align === "center" ? "items-center" : "items-start")}>
      {label && (
        <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {Icon && <Icon className="h-3 w-3" />}
          {label}
        </span>
      )}
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-md border font-semibold tabular-nums",
          getScoreBadgeClasses(score, kind),
          size === "sm" && "px-2 py-0.5 text-xs min-w-[2.5rem]",
          size === "md" && "px-3 py-1 text-sm min-w-[3rem]",
          size === "lg" && "px-4 py-1.5 text-lg min-w-[3.5rem]"
        )}
      >
        {score}
      </span>
      {showTier && (
        <span className="text-xs font-medium text-foreground">{tier.label}</span>
      )}
    </div>
  );
}

export function formatFundingAmount(amount: number | null | undefined): string {
  if (!amount) return "—";
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
