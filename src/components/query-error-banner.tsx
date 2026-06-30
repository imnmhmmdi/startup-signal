import { AlertTriangle } from "lucide-react";
import { getSurfacePanelClasses } from "@/lib/semantic-colors";
import { cn } from "@/lib/utils";

type QueryErrorBannerProps = {
  errors: string[];
  className?: string;
};

export function QueryErrorBanner({ errors, className }: QueryErrorBannerProps) {
  if (errors.length === 0) return null;

  const uniqueErrors = [...new Set(errors)];

  return (
    <div
      role="alert"
      className={cn(
        getSurfacePanelClasses(),
        "flex gap-3 border-amber-200/60 bg-amber-500/5 p-4 dark:border-amber-900/40",
        className
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="space-y-1 text-sm">
        <p className="font-medium text-foreground">
          Some data could not be loaded. Showing partial results.
        </p>
        <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
          {uniqueErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Check server logs for structured details, or visit{" "}
          <a href="/api/diagnostics/render" className="underline hover:text-foreground">
            /api/diagnostics/render
          </a>
          .
        </p>
      </div>
    </div>
  );
}
