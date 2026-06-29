import { cn } from "@/lib/utils";

type ScoreBadgeProps = {
  score: number;
  label?: string;
  size?: "sm" | "md";
};

function getScoreColor(score: number): string {
  if (score >= 75) return "bg-emerald-500/15 text-emerald-700 border-emerald-200";
  if (score >= 50) return "bg-amber-500/15 text-amber-700 border-amber-200";
  return "bg-red-500/15 text-red-700 border-red-200";
}

export function ScoreBadge({ score, label, size = "sm" }: ScoreBadgeProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {label && (
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </span>
      )}
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-md border font-semibold tabular-nums",
          getScoreColor(score),
          size === "sm" ? "px-2 py-0.5 text-xs min-w-[2.5rem]" : "px-3 py-1 text-sm min-w-[3rem]"
        )}
      >
        {score}
      </span>
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
  });
}
