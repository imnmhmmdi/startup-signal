import { IMAN_PROFILE } from "@/config/pm-profile";
import { PRODUCT } from "@/config/product";

export function ProfileChip() {
  const role = IMAN_PROFILE.targetRoles[0];
  const sectors = IMAN_PROFILE.preferredCategories.slice(0, 3).join(" · ");

  return (
    <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
      <span>Scoring for</span>
      <span className="font-medium text-foreground">{role}</span>
      <span aria-hidden="true">·</span>
      <span>{sectors}</span>
      <span aria-hidden="true">·</span>
      <span>{PRODUCT.defaultCountry}</span>
    </div>
  );
}
