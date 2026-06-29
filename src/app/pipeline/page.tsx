"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Kanban, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScoreBadge, formatFundingAmount, formatDate } from "@/components/score-badge";
import { buttonVariants } from "@/components/ui/button";
import type { Company, SavedStatus } from "@/db/schema";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { PipelineLoadingSkeleton } from "@/components/pipeline/pipeline-loading";
import { EmptyState } from "@/components/empty-state";
import { PIPELINE_STAGES, getNextAction } from "@/config/pipeline-stages";

type PipelineCompany = Company & {
  saved: { id: string; notes: string | null; status: SavedStatus } | null;
};

export default function PipelinePage() {
  const [companies, setCompanies] = useState<PipelineCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState(false);
  const [stageFilter, setStageFilter] = useState<SavedStatus | null>(null);

  useEffect(() => {
    fetch("/api/saved")
      .then((r) => {
        if (r.status === 401) {
          setUnauthorized(true);
          return null;
        }
        if (!r.ok) {
          setError(true);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setCompanies(data.companies ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const updateStatus = async (companyId: string, status: SavedStatus) => {
    await fetch("/api/saved", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, status }),
    });
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId
          ? { ...c, saved: c.saved ? { ...c.saved, status } : null }
          : c
      )
    );
  };

  const byStage = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    count: companies.filter((c) => (c.saved?.status ?? "new") === stage.value).length,
    companies: companies.filter((c) => (c.saved?.status ?? "new") === stage.value),
  }));

  const filteredCompanies = stageFilter
    ? companies.filter((c) => (c.saved?.status ?? "new") === stageFilter)
    : companies;

  const activeStageLabel = stageFilter
    ? PIPELINE_STAGES.find((s) => s.value === stageFilter)?.label
    : null;

  if (loading) {
    return <PipelineLoadingSkeleton />;
  }

  if (unauthorized) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Pipeline"
          subtitle="Track companies from discovery through application"
        />
        <EmptyState
          icon={<Kanban className="h-8 w-8" />}
          title="Sign in to manage your pipeline"
          description="Track companies from discovery through application."
          action={
            <Link href="/login" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
              Sign in
            </Link>
          }
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pipeline" />
        <EmptyState title="Unable to load pipeline" description="Please try again in a moment." />
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Pipeline"
          subtitle="Track companies from discovery through application"
        />
        <EmptyState
          icon={<Kanban className="h-8 w-8" />}
          title="No companies in your pipeline yet"
          description="Save companies from the browse view to track your application workflow."
          action={
            <Link href="/companies" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
              Browse companies
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        subtitle={
          activeStageLabel
            ? `${filteredCompanies.length} companies in ${activeStageLabel} — ${companies.length} total`
            : `${companies.length} companies in your application workflow`
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {byStage.map((stage) => (
          <button
            key={stage.value}
            type="button"
            onClick={() =>
              setStageFilter(stageFilter === stage.value ? null : stage.value)
            }
            className="text-left"
          >
            <Card
              className={cn(
                "transition-all duration-200 hover:border-primary/30 hover:shadow-sm cursor-pointer",
                stageFilter === stage.value && "ring-2 ring-primary border-primary/30"
              )}
            >
              <CardHeader className="pb-1 pt-4">
                <CardTitle className="text-sm font-medium">{stage.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">{stage.count}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {byStage.map((stage) => {
            const columnCompanies = stageFilter
              ? stage.value === stageFilter
                ? stage.companies
                : []
              : stage.companies;

            if (stageFilter && stage.value !== stageFilter) return null;

            return (
              <div
                key={stage.value}
                className={cn(
                  "w-64 shrink-0 rounded-lg border bg-muted/20 p-3",
                  stageFilter === stage.value && "ring-2 ring-primary/30"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">{stage.label}</h3>
                  <span className="text-xs text-muted-foreground tabular-nums">{stage.count}</span>
                </div>
                <div className="space-y-2 max-h-[420px] overflow-y-auto">
                  {columnCompanies.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No companies</p>
                  ) : (
                    columnCompanies.map((company) => (
                      <Link key={company.id} href={`/companies/${company.id}`}>
                        <Card className="hover:border-primary/30 hover:shadow-sm transition-all">
                          <CardContent className="p-3 space-y-2">
                            <p className="font-medium text-sm leading-tight">{company.name}</p>
                            <ScoreBadge score={company.pmFitScore ?? 0} label="PM fit" />
                            <p className="text-[11px] text-muted-foreground">{stage.nextAction}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {filteredCompanies.length === 0 ? (
        <EmptyState
          title="No companies in this stage"
          description="Select a different stage or clear the filter."
        />
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Company</TableHead>
                <TableHead>Funding</TableHead>
                <TableHead className="text-center">PM fit</TableHead>
                <TableHead className="text-center">Hiring signal</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Next action</TableHead>
                <TableHead>Funded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => {
                const status = company.saved?.status ?? "new";
                return (
                  <TableRow key={company.id}>
                    <TableCell>
                      <Link
                        href={`/companies/${company.id}`}
                        className="font-medium hover:text-primary flex items-center gap-1.5"
                      >
                        {company.name}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </Link>
                      {company.aiCategory && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {company.aiCategory}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <Badge variant="outline" className="text-xs mr-1">
                        {company.fundingRound ?? "—"}
                      </Badge>
                      <span className="tabular-nums">
                        {formatFundingAmount(company.fundingAmountUsd)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <ScoreBadge score={company.pmFitScore ?? 0} label="PM fit" showTier />
                    </TableCell>
                    <TableCell className="text-center">
                      <ScoreBadge score={company.aiHiringScore ?? 0} label="Hiring signal" />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={status}
                        onValueChange={(v) => updateStatus(company.id, v as SavedStatus)}
                      >
                        <SelectTrigger className="h-8 w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PIPELINE_STAGES.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getNextAction(status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(company.fundingDate)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
