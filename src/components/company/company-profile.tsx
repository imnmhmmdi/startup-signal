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
  Sparkles,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScoreBadge, formatFundingAmount, formatDate } from "@/components/score-badge";
import { ProfileSummaryCard } from "@/components/profile-summary-card";
import { getHiringPrediction } from "@/config/product";
import { getBreakdownLabel, getTopPmFitReason } from "@/config/scoring";
import type { Company, CompanyBriefContent, SavedStatus } from "@/db/schema";

const STATUS_OPTIONS: { value: SavedStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

type CompanyProfileProps = {
  company: Company & {
    saved: { id: string; notes: string | null; status: SavedStatus } | null;
  };
  brief: CompanyBriefContent;
  briefUpdatedAt?: Date | null;
  isAiGenerated?: boolean;
  isAuthenticated: boolean;
};

export function CompanyProfile({
  company,
  brief,
  briefUpdatedAt,
  isAiGenerated = false,
  isAuthenticated,
}: CompanyProfileProps) {
  const [isSaved, setIsSaved] = useState(!!company.saved);
  const [notes, setNotes] = useState(company.saved?.notes ?? "");
  const [status, setStatus] = useState<SavedStatus>(company.saved?.status ?? "new");
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [currentBrief, setCurrentBrief] = useState(brief);
  const prediction = getHiringPrediction(company.aiHiringScore ?? 0);
  const fitReason = getTopPmFitReason(company.pmFitScoreBreakdown);

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
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate_brief" }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.brief) setCurrentBrief(data.brief);
    } finally {
      setRegenerating(false);
    }
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
          <Card className="border-emerald-200/60 bg-emerald-500/5">
            <CardContent className="py-5">
              <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                <ScoreBadge
                  score={company.pmFitScore ?? 0}
                  label="PM fit"
                  size="lg"
                  showTier
                  align="start"
                />
                {fitReason && (
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Strong match because</p>
                    <p className="text-sm font-medium mt-0.5">{fitReason}</p>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-4 lg:ml-auto">
                  <ScoreBadge score={company.aiHiringScore ?? 0} label="Hiring signal" size="md" />
                  <div className="text-center">
                    <p className="text-sm font-semibold">{prediction.label}</p>
                    <p className="text-xs text-muted-foreground">Hiring prediction</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums">{company.openRolesTotal ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Open roles</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Company brief</CardTitle>
                  {isAiGenerated ? (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI-generated
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Template</Badge>
                  )}
                </div>
                {briefUpdatedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated {formatDate(briefUpdatedAt)}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={regenerateBrief} disabled={regenerating}>
                <RefreshCw className={cn("h-4 w-4 mr-1.5", regenerating && "animate-spin")} />
                Regenerate
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="why">
                <TabsList className="mb-4">
                  <TabsTrigger value="why">Why now</TabsTrigger>
                  <TabsTrigger value="outreach">Outreach</TabsTrigger>
                  <TabsTrigger value="prep">Interview prep</TabsTrigger>
                  <TabsTrigger value="risks">Risks</TabsTrigger>
                </TabsList>
                <TabsContent value="why" className="space-y-4 text-sm">
                  <BriefSection title="Why now?" content={currentBrief.whyNow} />
                  <BriefSection title="Why this company?" content={currentBrief.whyThisCompany} />
                  <BriefSection title="Why they may hire PMs" content={currentBrief.whyTheyMayHirePMs} />
                </TabsContent>
                <TabsContent value="outreach" className="space-y-4 text-sm">
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
                </TabsContent>
                <TabsContent value="prep" className="text-sm">
                  <ul className="list-disc list-inside space-y-1">
                    {currentBrief.interviewPrepTopics.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </TabsContent>
                <TabsContent value="risks" className="text-sm">
                  <ul className="list-disc list-inside space-y-1 text-red-600/80">
                    {currentBrief.risks.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <ProfileSummaryCard />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <ScoreBreakdown title="PM fit" breakdown={company.pmFitScoreBreakdown} />
              <Separator />
              <ScoreBreakdown title="Hiring signal" breakdown={company.aiHiringScoreBreakdown} />
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

  const maxAbs = Math.max(...Object.values(breakdown).map(Math.abs), 1);

  return (
    <div>
      <p className="font-medium mb-3">{title}</p>
      <div className="space-y-3">
        {Object.entries(breakdown).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between gap-4 text-xs mb-1">
              <span className="text-muted-foreground">{getBreakdownLabel(key)}</span>
              <span className={cn("tabular-nums font-medium", value < 0 && "text-red-600")}>
                {value > 0 ? "+" : ""}{value}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  value >= 0 ? "bg-emerald-500" : "bg-red-500"
                )}
                style={{ width: `${(Math.abs(value) / maxAbs) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
