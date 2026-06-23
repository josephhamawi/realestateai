export interface QualificationReadiness {
  budgetConfirmed: boolean;
  timelineConfirmed: boolean;
  propertyTypeConfirmed: boolean;
  areaConfirmed: boolean;
  agentReady: boolean;
}

export interface ScoringInput {
  readiness: QualificationReadiness;
  messageCount: number;
  hasAppointment: boolean;
  hasConsent: boolean;
}

export function calculateLeadScore(input: ScoringInput): {
  score: number;
  urgency: "hot" | "warm" | "cold";
  status: "unqualified" | "qualifying" | "qualified" | "disqualified";
} {
  let score = 0;

  // Readiness criteria (up to 60 points)
  if (input.readiness.budgetConfirmed) score += 15;
  if (input.readiness.timelineConfirmed) score += 15;
  if (input.readiness.propertyTypeConfirmed) score += 10;
  if (input.readiness.areaConfirmed) score += 10;
  if (input.readiness.agentReady) score += 10;

  // Engagement bonus (up to 20 points)
  if (input.messageCount >= 3) score += 5;
  if (input.messageCount >= 6) score += 5;
  if (input.messageCount >= 10) score += 5;
  if (input.messageCount >= 15) score += 5;

  // Appointment bonus (10 points)
  if (input.hasAppointment) score += 10;

  // Consent bonus (10 points)
  if (input.hasConsent) score += 10;

  // Cap at 100
  score = Math.min(score, 100);

  // Determine urgency
  let urgency: "hot" | "warm" | "cold";
  if (score >= 70) urgency = "hot";
  else if (score >= 40) urgency = "warm";
  else urgency = "cold";

  // Determine qualification status
  let status: "unqualified" | "qualifying" | "qualified" | "disqualified";
  if (score >= 60) status = "qualified";
  else if (score >= 20) status = "qualifying";
  else status = "unqualified";

  return { score, urgency, status };
}
