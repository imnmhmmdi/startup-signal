"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getCompanyInitials, getCompanyLogoCandidates } from "@/lib/company-logo";

type CompanyLogoProps = {
  name: string;
  logoUrl?: string | null;
  website?: string | null;
  websiteDomain?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASSES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function CompanyLogo({
  name,
  logoUrl,
  website,
  websiteDomain,
  size = "sm",
  className,
}: CompanyLogoProps) {
  const candidates = useMemo(
    () => getCompanyLogoCandidates({ logoUrl, website, websiteDomain }),
    [logoUrl, website, websiteDomain]
  );
  const candidatesKey = candidates.join("|");

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [trackedCandidatesKey, setTrackedCandidatesKey] = useState(candidatesKey);

  if (trackedCandidatesKey !== candidatesKey) {
    setTrackedCandidatesKey(candidatesKey);
    setCandidateIndex(0);
    setLoaded(false);
  }

  const src = candidates[candidateIndex] ?? null;
  const initials = getCompanyInitials(name);
  const sizeClass = SIZE_CLASSES[size];
  const showInitialsOnly = !src;

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setLoaded(false);
    setCandidateIndex((current) => current + 1);
  }, []);

  if (showInitialsOnly || candidateIndex >= candidates.length) {
    return (
      <div
        className={cn(
          "rounded-md bg-muted flex items-center justify-center font-semibold text-muted-foreground shrink-0",
          sizeClass,
          className
        )}
        aria-label={`${name} logo`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={cn("relative shrink-0", sizeClass, className)}
      aria-label={`${name} logo`}
    >
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center rounded-md bg-muted font-semibold text-muted-foreground transition-opacity duration-150",
          sizeClass,
          loaded ? "opacity-0" : "opacity-100"
        )}
        aria-hidden
      >
        {initials}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt=""
        width={48}
        height={48}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "relative h-full w-full rounded-md border bg-white object-contain p-0.5 transition-opacity duration-150",
          loaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
