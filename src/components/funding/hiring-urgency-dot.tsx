import { getHiringPrediction } from "@/config/product";
import { cn } from "@/lib/utils";

type HiringUrgencyDotProps = {
  score: number;
  className?: string;
};

export function HiringUrgencyDot({ score, className }: HiringUrgencyDotProps) {
  const prediction = getHiringPrediction(score);

  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full shrink-0",
        prediction.label === "High" && "bg-emerald-500",
        prediction.label === "Moderate" && "bg-amber-500",
        prediction.label === "Low" && "bg-muted-foreground/40",
        className
      )}
      title={`Hiring prediction: ${prediction.label}`}
    />
  );
}
