"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LayoutGrid, TableProperties } from "lucide-react";
import { CompanyTable } from "@/components/dashboard/company-table";
import { CompanyCard } from "@/components/companies/company-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { getSurfacePanelClasses } from "@/lib/semantic-colors";
import { cn } from "@/lib/utils";
import type { Company, SavedStatus } from "@/db/schema";

type CompanyWithSaved = Company & {
  saved: { id: string; notes: string | null; status: SavedStatus } | null;
};

export function CompaniesViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") === "table" ? "table" : "cards";

  const setView = (next: "cards" | "table") => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "cards") {
      params.delete("view");
    } else {
      params.set("view", next);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className={cn(getSurfacePanelClasses(), "flex items-center gap-1 bg-muted/30 p-1")}>
      <Button
        type="button"
        variant={view === "cards" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 gap-1.5"
        onClick={() => setView("cards")}
      >
        <LayoutGrid className="h-4 w-4" />
        Cards
      </Button>
      <Button
        type="button"
        variant={view === "table" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 gap-1.5"
        onClick={() => setView("table")}
      >
        <TableProperties className="h-4 w-4" />
        Table
      </Button>
    </div>
  );
}

type CompaniesResultsProps = {
  companies: CompanyWithSaved[];
  isAuthenticated: boolean;
  view: "cards" | "table";
};

export function CompaniesResults({
  companies,
  isAuthenticated,
  view,
}: CompaniesResultsProps) {
  if (view === "table") {
    return <CompanyTable companies={companies} isAuthenticated={isAuthenticated} />;
  }

  if (companies.length === 0) {
    return (
      <EmptyState
        title="No companies match your filters"
        description="Try adjusting your filters or clearing them to see more results."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  );
}
