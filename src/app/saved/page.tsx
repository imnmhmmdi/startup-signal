"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScoreBadge, formatFundingAmount, formatDate } from "@/components/score-badge";
import type { Company, SavedStatus } from "@/db/schema";

const STATUS_OPTIONS: { value: SavedStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: "bg-blue-500/15 text-blue-700" },
  { value: "contacted", label: "Contacted", color: "bg-purple-500/15 text-purple-700" },
  { value: "applied", label: "Applied", color: "bg-amber-500/15 text-amber-700" },
  { value: "interview", label: "Interview", color: "bg-emerald-500/15 text-emerald-700" },
  { value: "rejected", label: "Rejected", color: "bg-red-500/15 text-red-700" },
  { value: "offer", label: "Offer", color: "bg-green-500/15 text-green-700" },
];

type SavedCompany = Company & {
  saved: { id: string; notes: string | null; status: SavedStatus } | null;
};

export default function SavedPage() {
  const [companies, setCompanies] = useState<SavedCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/saved")
      .then((r) => r.json())
      .then((data) => {
        setCompanies(data.companies ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  if (loading) {
    return <p className="text-muted-foreground">Loading saved companies...</p>;
  }

  if (companies.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center space-y-3">
        <Bookmark className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">No saved companies yet.</p>
        <Link href="/" className="text-sm text-primary hover:underline">
          Browse the dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saved Companies</h1>
        <p className="text-muted-foreground mt-1">{companies.length} companies tracked</p>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Company</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Round</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">PM Fit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Saved</TableHead>
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
                </TableCell>
                <TableCell className="text-sm">{company.hqCountry ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{company.fundingRound ?? "—"}</Badge>
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {formatFundingAmount(company.fundingAmountUsd)}
                </TableCell>
                <TableCell className="text-center">
                  <ScoreBadge score={company.pmFitScore ?? 0} />
                </TableCell>
                <TableCell>
                  <Select
                    value={company.saved?.status ?? "new"}
                    onValueChange={(v) => updateStatus(company.id, v as SavedStatus)}
                  >
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
