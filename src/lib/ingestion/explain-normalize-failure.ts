import type { RawFundingItem } from "./types";
import { evaluateCompanyNameFromTitle } from "./company-name";
import { isAiRelated } from "./utils";

function isStructuredApiItem(item: RawFundingItem): boolean {
  const raw = item.raw ?? {};
  return typeof raw.slug === "string" && typeof raw.id === "number";
}

export function explainNormalizeFailure(item: RawFundingItem): string {
  if (isStructuredApiItem(item)) {
    const raw = item.raw as { website?: string; name?: string };
    if (!raw.name?.trim()) return "missing company name";
    if (!raw.website?.trim()) return "missing website";
    return "normalization failed";
  }

  const combined = `${item.title} ${item.description}`;
  if (!isAiRelated(combined) && !/fund|raise|invest|series|seed/i.test(combined)) {
    return "not AI or funding related";
  }

  const evaluation = evaluateCompanyNameFromTitle(item.title);
  if (evaluation.rejected.length > 0) {
    return evaluation.rejected[0].reason;
  }

  return "normalization failed";
}
