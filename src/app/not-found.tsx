import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getSurfacePanelClasses } from "@/lib/semantic-colors";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 py-8">
      <div className={cn(getSurfacePanelClasses(), "max-w-md space-y-4 p-8 text-center sm:p-10")}>
        <h2 className="text-section-title">Page not found</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The page you requested does not exist or may have moved.
        </p>
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Back to overview
        </Link>
      </div>
    </div>
  );
}
