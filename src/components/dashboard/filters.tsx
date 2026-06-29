"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

type FilterOptions = {
  countries: string[];
  fundingRounds: string[];
  aiCategories: string[];
};

type DashboardFiltersProps = {
  filterOptions: FilterOptions;
};

export function DashboardFilters({ filterOptions }: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`/?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    startTransition(() => {
      router.push("/");
    });
  };

  const hasFilters = Array.from(searchParams.entries()).length > 0;
  const minPmFit = parseInt(searchParams.get("minPmFitScore") ?? "0");
  const minAiHiring = parseInt(searchParams.get("minAiHiringScore") ?? "0");

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters</h2>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} disabled={isPending}>
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          className="pl-9"
          defaultValue={searchParams.get("search") ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateFilter("search", (e.target as HTMLInputElement).value || null);
            }
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Country</Label>
          <Select
            value={searchParams.get("country") ?? "all"}
            onValueChange={(v) => updateFilter("country", v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {filterOptions.countries.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Funding Round</Label>
          <Select
            value={searchParams.get("fundingRound") ?? "all"}
            onValueChange={(v) => updateFilter("fundingRound", v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All rounds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rounds</SelectItem>
              {filterOptions.fundingRounds.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">AI Category</Label>
          <Select
            value={searchParams.get("aiCategory") ?? "all"}
            onValueChange={(v) => updateFilter("aiCategory", v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {filterOptions.aiCategories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Sort By</Label>
          <Select
            value={searchParams.get("sortBy") ?? "pmFitScore"}
            onValueChange={(v) => updateFilter("sortBy", v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pmFitScore">PM Fit Score</SelectItem>
              <SelectItem value="aiHiringScore">AI Hiring Score</SelectItem>
              <SelectItem value="fundingDate">Funding Date</SelectItem>
              <SelectItem value="fundingAmountUsd">Funding Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-xs">Min PM Fit Score</Label>
            <span className="text-xs text-muted-foreground tabular-nums">{minPmFit}</span>
          </div>
          <Slider
            value={[minPmFit]}
            min={0}
            max={100}
            step={5}
            onValueCommitted={(value) => {
              const v = Array.isArray(value) ? value[0] : value;
              updateFilter("minPmFitScore", v > 0 ? String(v) : null);
            }}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-xs">Min AI Hiring Score</Label>
            <span className="text-xs text-muted-foreground tabular-nums">{minAiHiring}</span>
          </div>
          <Slider
            value={[minAiHiring]}
            min={0}
            max={100}
            step={5}
            onValueCommitted={(value) => {
              const v = Array.isArray(value) ? value[0] : value;
              updateFilter("minAiHiringScore", v > 0 ? String(v) : null);
            }}
          />
        </div>
      </div>
    </div>
  );
}
