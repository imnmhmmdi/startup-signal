import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getSectionEyebrowClass, type SectionAccent } from "@/lib/semantic-colors";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  accent?: SectionAccent;
  eyebrow?: string;
};

export function SectionHeader({
  title,
  href,
  linkLabel = "View all",
  className,
  accent = "neutral",
  eyebrow,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <div>
        {eyebrow && (
          <p
            className={cn(
              "mb-1.5 text-xs font-semibold uppercase tracking-widest",
              getSectionEyebrowClass(accent)
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2 className="text-section-title">{title}</h2>
      </div>
      {href && (
        <Link href={href} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          {linkLabel} <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      )}
    </div>
  );
}
