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

const PIPELINE_STAGES: {
  value: SavedStatus;
  label: string;
  description: string;
}[] = [
  { value: "new", label: "New", description: "Saved, not yet contacted" },
  { value: "contacted", label: "Contacted", description: "Outreach sent" },
  { value: "applied", label: "Applied", description: "Application submitted" },
  { value: "interview", label: "Interview", description: "In interview process" },
  { value: "offer", label: "Offer", description: "Offer received" },
  { value: "rejected", label: "Rejected", description: "Closed — not proceeding" },
];

type PipelineCompany = Company & {
  saved: { id: string; notes: string | null; status: SavedStatus } | null;
};

export default function PipelinePage() {
  const [companies, setCompanies] = useState<PipelineCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState(false);

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
  }));

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
        <div className="rounded-lg border bg-card p-12 text-center space-y-3">
          <Kanban className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Sign in to manage your application pipeline.</p>
          <Link href="/login" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pipeline" />
        <div className="rounded-lg border bg-card p-12 text-center space-y-3">
          <p className="text-muted-foreground">Unable to load pipeline. Please try again.</p>
        </div>
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
        <div className="rounded-lg border bg-card p-12 text-center space-y-3">
          <Kanban className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">No companies in your pipeline yet.</p>
          <Link href="/companies" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
            Browse companies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        subtitle={`${companies.length} companies in your application workflow`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {byStage.map((stage) => (
          <Card key={stage.value}>
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-sm font-medium">{stage.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{stage.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Company</TableHead>
              <TableHead>Funding</TableHead>
              <TableHead className="text-center">PM fit</TableHead>
              <TableHead className="text-center">Hiring signal</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Funded</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
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
                    value={company.saved?.status ?? "new"}
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
                  {formatDate(company.fundingDate)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
