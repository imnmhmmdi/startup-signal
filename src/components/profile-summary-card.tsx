import { IMAN_PROFILE } from "@/config/pm-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfileSummaryCard() {
  const sectors = IMAN_PROFILE.preferredCategories.slice(0, 4).join(", ");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="font-medium">{IMAN_PROFILE.targetRoles[0]}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {IMAN_PROFILE.background.split("\n")[0]}
        </p>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Preferred sectors</p>
          <p className="text-xs">{sectors}</p>
        </div>
      </CardContent>
    </Card>
  );
}
