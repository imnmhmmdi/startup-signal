import type { SavedStatus } from "@/db/schema";

export const PIPELINE_STAGES: {
  value: SavedStatus;
  label: string;
  description: string;
  nextAction: string;
}[] = [
  {
    value: "new",
    label: "New",
    description: "Saved, not yet contacted",
    nextAction: "Review company brief",
  },
  {
    value: "contacted",
    label: "Contacted",
    description: "Outreach sent",
    nextAction: "Follow up in 5–7 days",
  },
  {
    value: "applied",
    label: "Applied",
    description: "Application submitted",
    nextAction: "Prepare for recruiter screen",
  },
  {
    value: "interview",
    label: "Interview",
    description: "In interview process",
    nextAction: "Prep interview topics",
  },
  {
    value: "offer",
    label: "Offer",
    description: "Offer received",
    nextAction: "Evaluate offer terms",
  },
  {
    value: "rejected",
    label: "Rejected",
    description: "Closed — not proceeding",
    nextAction: "Archive or revisit later",
  },
];

export function getNextAction(status: SavedStatus): string {
  return PIPELINE_STAGES.find((s) => s.value === status)?.nextAction ?? "Review company";
}

export const PIPELINE_STATUS_OPTIONS = PIPELINE_STAGES.map(({ value, label }) => ({
  value,
  label,
}));
