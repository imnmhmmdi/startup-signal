"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { getSurfacePanelClasses } from "@/lib/semantic-colors";
import { cn } from "@/lib/utils";

type RouteErrorPanelProps = {
  error: Error & { digest?: string };
  reset: () => void;
  routeLabel?: string;
};

export function RouteErrorPanel({ error, reset, routeLabel }: RouteErrorPanelProps) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        level: "error",
        event: "client_error_boundary",
        route: routeLabel,
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      })
    );
  }, [error, routeLabel]);

  const isQueryTimeout = error.message.includes("timed out after");
  const isDatabaseConfigError =
    error.message.includes("DATABASE_URL") && !isQueryTimeout;
  const isDatabaseConnectionError =
    isDatabaseConfigError ||
    error.message.includes("ENOTFOUND") ||
    error.message.includes("ECONNREFUSED") ||
    error.message.includes("password authentication failed");

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 py-8">
      <div className={cn(getSurfacePanelClasses(), "max-w-md space-y-4 p-8 text-center sm:p-10")}>
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
        <div className="space-y-2">
          <h2 className="text-section-title">Something went wrong</h2>
          {routeLabel && (
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{routeLabel}</p>
          )}
          {isQueryTimeout ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              The database query took too long. If this keeps happening, confirm your Supabase
              project is active and DATABASE_URL uses the Transaction pooler (port 6543).
            </p>
          ) : isDatabaseConnectionError ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Unable to connect to the database. Check that your Supabase project is active and
              DATABASE_URL uses the Shared Pooler connection string.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {error.message || "An unexpected error occurred while loading this page."}
            </p>
          )}
          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground">Error ID: {error.digest}</p>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={reset}>
            Try again
          </Button>
          <Link
            href="/api/diagnostics/render"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Run diagnostics
          </Link>
          <Link href="/api/health" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Check health
          </Link>
        </div>
      </div>
    </div>
  );
}
