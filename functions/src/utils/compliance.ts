import type { MarketConfig } from "../types/market";

export interface ComplianceResult {
  status: "passed" | "flagged" | "blocked";
  violations: string[];
  notes: string;
}

export function runComplianceCheck(
  text: string,
  marketConfig: MarketConfig
): ComplianceResult {
  const violations: string[] = [];
  const lowerText = text.toLowerCase();

  // Check blocked phrases from market config (if configured)
  const blockedPhrases = (marketConfig.compliance as Record<string, unknown>)?.blockedPhrases;
  if (Array.isArray(blockedPhrases)) {
    for (const phrase of blockedPhrases) {
      if (typeof phrase === "string" && lowerText.includes(phrase.toLowerCase())) {
        violations.push(`Blocked phrase detected: "${phrase}"`);
      }
    }
  }

  // RERA compliance checks
  if (
    lowerText.includes("guaranteed return") ||
    lowerText.includes("guaranteed roi") ||
    lowerText.includes("assured yield") ||
    lowerText.includes("guaranteed profit")
  ) {
    violations.push("RERA violation: guaranteed returns language detected");
  }

  // Nationality steering
  const nationalityPatterns = [
    /as an? (?:indian|british|russian|chinese|pakistani) (?:buyer|investor)/i,
    /only for (?:indian|british|russian|chinese|pakistani)/i,
  ];
  for (const pattern of nationalityPatterns) {
    if (pattern.test(text)) {
      violations.push("RERA violation: nationality-based steering detected");
    }
  }

  if (violations.length === 0) {
    return { status: "passed", violations: [], notes: "All checks passed" };
  }

  // Determine severity
  const hasBlockingViolation = violations.some(
    (v) => v.includes("RERA violation")
  );

  return {
    status: hasBlockingViolation ? "blocked" : "flagged",
    violations,
    notes: violations.join("; "),
  };
}

export function checkEscalationTriggers(
  text: string,
  escalationTriggers: string[]
): { triggered: boolean; reason: string; reasonCode: string } {
  const lowerText = text.toLowerCase();

  for (const trigger of escalationTriggers) {
    if (lowerText.includes(trigger.toLowerCase())) {
      return {
        triggered: true,
        reason: `Escalation trigger detected: "${trigger}"`,
        reasonCode: trigger.replace(/\s+/g, "_").toLowerCase(),
      };
    }
  }

  return { triggered: false, reason: "", reasonCode: "" };
}
