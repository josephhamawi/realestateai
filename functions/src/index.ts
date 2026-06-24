// Cloud Function exports for AgentFlow AI
// All functions are deployed from this file

export { provisionTenant } from "./functions/provisionTenant";
export { whatsappWebhook } from "./functions/whatsappWebhook";
export { telegramWebhook, registerTelegramWebhook } from "./functions/telegramWebhook";
export { aiConversation as aiConversationOrchestrator } from "./functions/aiConversation";
export { leadIngestion } from "./functions/leadIngestion";
export { calendarManager } from "./functions/calendarManager";
export { googleCalendarConnect } from "./functions/googleCalendarConnect";
export { googleCalendarCallback } from "./functions/googleCalendarCallback";
export { outlookCalendarConnect } from "./functions/outlookCalendarConnect";
export { outlookCalendarCallback } from "./functions/outlookCalendarCallback";
export {
  paymentProcessor as initializePayment,
  stripeWebhook,
} from "./functions/paymentProcessor";
export { complianceLogger } from "./functions/complianceLogger";

// Scheduled batch jobs: REMOVED (cost optimization 2026-05-03)
// Source preserved in functions/dailyBatchJobs.ts but no longer deployed.
// Do NOT re-add functions.pubsub.schedule(...). That was the cost we removed.
