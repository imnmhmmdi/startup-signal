import { Radar, Sparkles } from "lucide-react";
import { ProfileChip } from "@/components/profile-chip";
import { IMAN_PROFILE } from "@/config/pm-profile";
import { PRODUCT } from "@/config/product";

type OverviewHeroProps = {
  briefingLine: string;
};

export function OverviewHero({ briefingLine }: OverviewHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/[0.03] via-background to-emerald-500/[0.04] px-5 py-6 sm:px-8 sm:py-8">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Personalized for {IMAN_PROFILE.name}
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 hidden rounded-xl border bg-background/80 p-2.5 shadow-sm sm:block">
              <Radar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-page-title-lg sm:text-4xl">Your PM opportunity radar</h1>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground sm:text-lg">
                AI-ranked {PRODUCT.focusRegion} startups and senior PM opportunities — scored for{" "}
                {IMAN_PROFILE.targetRoles[0].toLowerCase()} roles in{" "}
                {IMAN_PROFILE.preferredCategories.slice(0, -1).join(", ")}, and{" "}
                {IMAN_PROFILE.preferredCategories.at(-1)}.
              </p>
            </div>
          </div>

          <p className="rounded-lg border border-dashed border-primary/20 bg-background/60 px-3 py-2 text-sm text-foreground/90">
            {briefingLine}
          </p>
        </div>

        <div className="shrink-0 lg:pt-1">
          <ProfileChip />
        </div>
      </div>
    </section>
  );
}
