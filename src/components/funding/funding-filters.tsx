"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { X } from "lucide-react";
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
import { getSurfacePanelClasses } from "@/lib/semantic-colors";
import { cn } from "@/lib/utils";

type FundingFiltersProps = {
  fundingRounds: string[];
};

export function FundingFilters({ fundingRounds }: FundingFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, searchParams, pathname]
  );

  const clearFilters = () => {
    startTransition(() => router.push(pathname));
  };

  const hasFilters = searchParams.toString().length > 0;
  const minPmFit = parseInt(searchParams.get("minPmFitScore") ?? "0");

  return (
    <div className={cn(getSurfacePanelClasses(), "space-y-4 p-4")}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filter events</h2>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} disabled={isPending}>
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Funded from</Label>
          <Input
            type="date"
            className="h-9"
            defaultValue={searchParams.get("fundingDateFrom") ?? ""}
            onChange={(e) => updateFilter("fundingDateFrom", e.target.value || null)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Funded to</Label>
          <Input
            type="date"
            className="h-9"
            defaultValue={searchParams.get("fundingDateTo") ?? ""}
            onChange={(e) => updateFilter("fundingDateTo", e.target.value || null)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Funding round</Label>
          <Select
            value={searchParams.get("fundingRound") ?? "all"}
            onValueChange={(v) => updateFilter("fundingRound", v === "all" ? null : v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All rounds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rounds</SelectItem>
              {fundingRounds.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
    </div>
  );
}
