"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScoreBadge, formatFundingAmount, formatDate } from "@/components/score-badge";
import { getHiringPrediction } from "@/config/product";
import type { Company, CompanyBriefContent, SavedStatus } from "@/db/schema";

const STATUS_OPTIONS: { value: SavedStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "rejected", label: "Rejected" },
  { value: "offer", label: "Offer" },
];

type CompanyProfileProps = {
  company: Company & {
    saved: { id: string; notes: string | null; status: SavedStatus } | null;
  };
  brief: CompanyBriefContent | null;
  isAuthenticated: boolean;
};

export function CompanyProfile({ company, brief, isAuthenticated }: CompanyProfileProps) {
  const [isSaved, setIsSaved] = useState(!!company.saved);
  const [notes, setNotes] = useState(company.saved?.notes ?? "");
  const [status, setStatus] = useState<SavedStatus>(company.saved?.status ?? "new");
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [currentBrief, setCurrentBrief] = useState(brief);
  const prediction = getHiringPrediction(company.aiHiringScore ?? 0);

  const toggleSave = async () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    const method = isSaved ? "DELETE" : "POST";
    await fetch("/api/saved", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: company.id }),
    });
    setIsSaved(!isSaved);
  };

  const saveNotes = async () => {
    if (!isAuthenticated) return;
    await fetch("/api/saved", {
      method: isSaved ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: company.id, notes, status }),
    });
    if (!isSaved) setIsSaved(true);
  };

  const regenerateBrief = async () => {
    setRegenerating(true);
    const res = await fetch(`/api/companies/${company.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "regenerate_brief" }),
    });
    const data = await res.json();
    setCurrentBrief(data.brief);
    setRegenerating(false);
  };

  const copyMessage = () => {
    if (currentBrief?.linkedinMessage) {
      navigator.clipboard.writeText(currentBrief.linkedinMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/companies"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to companies
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {company.hqCountry && <Badge variant="outline">{company.hqCountry}</Badge>}
            {company.aiCategory && <Badge variant="secondary">{company.aiCategory}</Badge>}
            {company.businessModel && <Badge variant="outline">{company.businessModel}</Badge>}
            {company.fundingRound && <Badge>{company.fundingRound}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Website
            </a>
          )}
          <Button variant={isSaved ? "default" : "outline"} size="sm" onClick={toggleSave}>
            <Bookmark className={cn("h-4 w-4 mr-1.5", isSaved && "fill-current")} />
            {isSaved ? "In pipeline" : "Add to pipeline"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 flex flex-col items-center">
                <ScoreBadge score={company.aiHiringScore ?? 0} label="Hiring signal" size="md" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex flex-col items-center">
                <ScoreBadge score={company.pmFitScore ?? 0} label="PM fit" size="md" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-sm font-semibold">{prediction.label}</p>
                <p className="text-xs text-muted-foreground mt-1">Hiring prediction</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold tabular-nums">{company.openRolesTotal ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Open roles</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Funding Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Round</p>
                <p className="font-medium">{company.fundingRound ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-medium">{formatFundingAmount(company.fundingAmountUsd)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(company.fundingDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Investors</p>
                <p className="font-medium">{(company.investors ?? []).join(", ") || "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hiring Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">PM Roles</p>
                <p className="text-xl font-bold tabular-nums">{company.pmRoles ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">AI Roles</p>
                <p className="text-xl font-bold tabular-nums">{company.aiRoles ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Eng Roles</p>
                <p className="text-xl font-bold tabular-nums">{company.engRoles ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Work Mode</p>
                <p className="font-medium">{company.workMode ?? "Hybrid"}</p>
              </div>
            </CardContent>
          </Card>

          {currentBrief && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Company brief</CardTitle>
                <Button variant="ghost" size="sm" onClick={regenerateBrief} disabled={regenerating}>
                  <RefreshCw className={cn("h-4 w-4 mr-1.5", regenerating && "animate-spin")} />
                  Regenerate
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <BriefSection title="Why now?" content={currentBrief.whyNow} />
                <BriefSection title="Why this company?" content={currentBrief.whyThisCompany} />
                <BriefSection title="Why they may hire PMs" content={currentBrief.whyTheyMayHirePMs} />
                <BriefSection title="Outreach strategy" content={currentBrief.suggestedOutreachStrategy} />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-muted-foreground">LinkedIn message</p>
                    <Button variant="ghost" size="sm" onClick={copyMessage}>
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <p className="bg-muted rounded-md p-3 italic">{currentBrief.linkedinMessage}</p>
                </div>
                <BriefSection title="Resume focus" content={currentBrief.resumeFocus} />
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Interview prep</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {currentBrief.interviewPrepTopics.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Risks</p>
                  <ul className="list-disc list-inside space-y-0.5 text-red-600/80">
                    {currentBrief.risks.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <ScoreBreakdown title="Hiring signal" breakdown={company.aiHiringScoreBreakdown} />
              <Separator />
              <ScoreBreakdown title="PM fit score" breakdown={company.pmFitScoreBreakdown} />
            </CardContent>
          </Card>

          {isAuthenticated && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Application workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={status} onValueChange={(v) => setStatus(v as SavedStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Add notes about this company..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
                <Button size="sm" className="w-full" onClick={saveNotes}>
                  Save notes
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function BriefSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <p className="font-medium text-muted-foreground mb-1">{title}</p>
      <p>{content}</p>
    </div>
  );
}

function ScoreBreakdown({
  title,
  breakdown,
}: {
  title: string;
  breakdown: Record<string, number> | null;
}) {
  if (!breakdown || Object.keys(breakdown).length === 0) {
    return (
      <div>
        <p className="font-medium mb-2">{title}</p>
        <p className="text-muted-foreground">No breakdown available</p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-medium mb-2">{title}</p>
      <div className="space-y-1">
        {Object.entries(breakdown).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-muted-foreground capitalize">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </span>
            <span className={cn("tabular-nums font-medium", value < 0 && "text-red-600")}>
              {value > 0 ? "+" : ""}{value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
