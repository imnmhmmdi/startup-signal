import { getHiringPrediction } from "@/config/product";
import { getHiringUrgencyDotClass } from "@/lib/semantic-colors";
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
        getHiringUrgencyDotClass(score),
        className
      )}
      title={`Hiring prediction: ${prediction.label}`}
    />
  );
}
