import { cn } from "@/lib/utils";
import { getSurfacePanelClasses } from "@/lib/semantic-colors";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        getSurfacePanelClasses(),
        "space-y-3 p-8 text-center sm:p-12",
        className
      )}
    >
      {icon && <div className="flex justify-center text-muted-foreground">{icon}</div>}
      <div className="space-y-1.5">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
