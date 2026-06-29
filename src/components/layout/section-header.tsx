import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
};

export function SectionHeader({
  title,
  href,
  linkLabel = "View all",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <h2 className="text-section-title">{title}</h2>
      {href && (
        <Link href={href} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          {linkLabel} <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      )}
    </div>
  );
}
