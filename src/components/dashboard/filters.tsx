"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
import { PRODUCT } from "@/config/product";

type FilterOptions = {
  countries: string[];
  fundingRounds: string[];
  aiCategories: string[];
};

type DashboardFiltersProps = {
  filterOptions: FilterOptions;
  defaultCountry?: string;
};

export function DashboardFilters({
  filterOptions,
  defaultCountry = PRODUCT.defaultCountry,
}: DashboardFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const basePath = pathname.startsWith("/companies") ? "/companies" : pathname;

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`${basePath}?${params.toString()}`);
      });
    },
    [router, searchParams, basePath]
  );

  const clearFilters = () => {
    startTransition(() => {
      router.push(`${basePath}?country=${defaultCountry}`);
    });
  };

  const hasFilters = Array.from(searchParams.entries()).some(
    ([k, v]) => !(k === "country" && v === defaultCountry)
  );
  const minPmFit = parseInt(searchParams.get("minPmFitScore") ?? "0");
  const minHiring = parseInt(searchParams.get("minAiHiringScore") ?? "0");

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filter companies</h2>
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
          placeholder="Search by company name..."
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
            value={searchParams.get("country") ?? defaultCountry}
            onValueChange={(v) => updateFilter("country", v === "all" ? null : v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder={defaultCountry} />
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
          <Label className="text-xs">Funding round</Label>
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
          <Label className="text-xs">Sector</Label>
          <Select
            value={searchParams.get("aiCategory") ?? "all"}
            onValueChange={(v) => updateFilter("aiCategory", v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All sectors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sectors</SelectItem>
              {filterOptions.aiCategories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Sort by</Label>
          <Select
            value={searchParams.get("sortBy") ?? "pmFitScore"}
            onValueChange={(v) => updateFilter("sortBy", v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pmFitScore">PM fit score</SelectItem>
              <SelectItem value="aiHiringScore">Hiring signal</SelectItem>
              <SelectItem value="fundingDate">Funding date</SelectItem>
              <SelectItem value="fundingAmountUsd">Funding amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-xs">Min PM fit score</Label>
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
            <Label className="text-xs">Min hiring signal</Label>
            <span className="text-xs text-muted-foreground tabular-nums">{minHiring}</span>
          </div>
          <Slider
            value={[minHiring]}
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
