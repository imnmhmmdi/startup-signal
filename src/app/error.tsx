"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDatabaseError =
    error.message.includes("DATABASE_URL") ||
    error.message.includes("database") ||
    error.message.includes("ENOTFOUND") ||
    error.message.includes("ECONNREFUSED") ||
    error.message.includes("connection");

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <div className="space-y-2 max-w-md">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        {isDatabaseError ? (
          <p className="text-sm text-muted-foreground">
            Unable to connect to the database. Check that your Supabase project is active
            and DATABASE_URL uses the Shared Pooler connection string.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred while loading this page."}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
        <Link href="/api/health" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Check health
        </Link>
      </div>
    </div>
  );
}
