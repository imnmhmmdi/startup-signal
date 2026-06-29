import { Target } from "lucide-react";
import { getScoreTier } from "@/components/score-badge";
import { getPmFitRingColors } from "@/lib/semantic-colors";
import { cn } from "@/lib/utils";

type PmFitRingProps = {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
};

const SIZE_CONFIG = {
  sm: { dimension: 56, stroke: 4, fontSize: "text-sm", labelSize: "text-[10px]" },
  md: { dimension: 72, stroke: 5, fontSize: "text-lg", labelSize: "text-xs" },
  lg: { dimension: 88, stroke: 6, fontSize: "text-xl", labelSize: "text-xs" },
} as const;

export function PmFitRing({
  score,
  size = "md",
  showLabel = true,
  className,
}: PmFitRingProps) {
  const config = SIZE_CONFIG[size];
  const colors = getPmFitRingColors(score);
  const tier = getScoreTier(score);
  const radius = (config.dimension - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = config.dimension / 2;

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className="relative" style={{ width: config.dimension, height: config.dimension }}>
        <svg
          width={config.dimension}
          height={config.dimension}
          viewBox={`0 0 ${config.dimension} ${config.dimension}`}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={config.stroke}
            className={colors.track}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(colors.progress, "transition-all duration-500")}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold tabular-nums leading-none", config.fontSize, colors.text)}>
            {score}
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            <Target className="h-3 w-3" />
            PM fit
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 font-medium",
              config.labelSize,
              colors.badge
            )}
          >
            {tier.shortLabel}
          </span>
        </div>
      )}
    </div>
  );
}
