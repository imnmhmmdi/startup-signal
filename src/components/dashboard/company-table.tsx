"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBadge, formatFundingAmount, formatDate } from "@/components/score-badge";
import { getHiringPrediction } from "@/config/product";
import { EmptyState } from "@/components/empty-state";
import type { Company, SavedStatus } from "@/db/schema";
import { cn } from "@/lib/utils";

type CompanyWithSaved = Company & {
  saved: { id: string; notes: string | null; status: SavedStatus } | null;
};

type CompanyTableProps = {
  companies: CompanyWithSaved[];
  isAuthenticated: boolean;
};

export function CompanyTable({ companies, isAuthenticated }: CompanyTableProps) {
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>(
    Object.fromEntries(companies.map((c) => [c.id, !!c.saved]))
  );

  const toggleSave = async (companyId: string) => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    const isSaved = savedMap[companyId];
    const method = isSaved ? "DELETE" : "POST";

    await fetch("/api/saved", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId }),
    });

    setSavedMap((prev) => ({ ...prev, [companyId]: !isSaved }));
  };

  if (companies.length === 0) {
    return (
      <EmptyState
        title="No companies match your filters"
        description="Try adjusting your filters or clearing them to see more results."
      />
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-8" />
              <TableHead>Company</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Round</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Hiring prediction</TableHead>
              <TableHead className="text-center">Hiring signal</TableHead>
              <TableHead className="text-center">PM fit</TableHead>
              <TableHead className="text-center">Open roles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => {
              const prediction = getHiringPrediction(company.aiHiringScore ?? 0);
              return (
              <TableRow key={company.id} className="group">
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleSave(company.id)}
                  >
                    <Bookmark
                      className={cn(
                        "h-4 w-4",
                        savedMap[company.id]
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                  </Button>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/companies/${company.id}`}
                    className="font-medium hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    {company.name}
                    {company.website && (
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    )}
                  </Link>
                  {company.businessModel && (
                    <span className="text-xs text-muted-foreground">{company.businessModel}</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">{company.hqCountry ?? "—"}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs font-normal">
                    {company.fundingRound ?? "—"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {formatFundingAmount(company.fundingAmountUsd)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(company.fundingDate)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {company.aiCategory ?? "—"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      prediction.label === "High" && "text-emerald-700",
                      prediction.label === "Moderate" && "text-amber-700",
                      prediction.label === "Low" && "text-muted-foreground"
                    )}
                  >
                    {prediction.label}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <ScoreBadge score={company.aiHiringScore ?? 0} label="Hiring signal" />
                </TableCell>
                <TableCell
                  className={cn(
                    "text-center",
                    (company.pmFitScore ?? 0) >= 70 && "bg-emerald-500/5"
                  )}
                >
                  <ScoreBadge score={company.pmFitScore ?? 0} label="PM fit" showTier />
                </TableCell>
                <TableCell className="text-center tabular-nums text-sm">
                  {company.openRolesTotal ?? 0}
                  {(company.pmRoles ?? 0) > 0 && (
                    <span className="block text-xs text-muted-foreground">
                      {company.pmRoles} PM
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
