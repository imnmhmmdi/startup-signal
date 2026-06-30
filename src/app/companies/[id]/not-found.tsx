import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getSurfacePanelClasses } from "@/lib/semantic-colors";
import { cn } from "@/lib/utils";

export default function CompanyNotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 py-8">
      <div className={cn(getSurfacePanelClasses(), "max-w-md space-y-4 p-8 text-center sm:p-10")}>
        <h2 className="text-section-title">Company not found</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This company may have been removed or the link is incorrect.
        </p>
        <Link
          href="/companies"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Browse companies
        </Link>
      </div>
    </div>
  );
}
