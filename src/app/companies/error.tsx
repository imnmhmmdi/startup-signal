"use client";

import { RouteErrorPanel } from "@/components/route-error-panel";

export default function CompaniesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorPanel error={error} reset={reset} routeLabel="Companies" />;
}
