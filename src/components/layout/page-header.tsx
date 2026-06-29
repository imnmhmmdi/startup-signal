import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  size?: "default" | "lg";
};

export function PageHeader({ title, subtitle, actions, size = "default" }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className={cn(size === "lg" ? "text-page-title-lg" : "text-page-title")}>{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
