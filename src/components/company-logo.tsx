"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { getCompanyInitials, getCompanyLogoSources } from "@/lib/company-logo";

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
  const sources = getCompanyLogoSources({ logoUrl, website, websiteDomain });
  const [src, setSrc] = useState(sources.primary);
  const [showInitials, setShowInitials] = useState(!sources.primary);

  const handleError = () => {
    if (src === sources.primary && sources.fallback && sources.fallback !== sources.primary) {
      setSrc(sources.fallback);
      return;
    }
    setShowInitials(true);
  };

  if (showInitials || !src) {
    return (
      <div
        className={cn(
          "rounded-md bg-muted flex items-center justify-center font-semibold text-muted-foreground shrink-0",
          SIZE_CLASSES[size],
          className
        )}
        aria-label={`${name} logo`}
      >
        {getCompanyInitials(name)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      onError={handleError}
      className={cn(
        "rounded-md object-contain bg-white border shrink-0 p-0.5",
        SIZE_CLASSES[size],
        className
      )}
    />
  );
}
