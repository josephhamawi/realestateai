import { Timestamp } from "firebase-admin/firestore";

export interface Message {
  messageId: string;
  tenantId: string;
  leadId: string;
  type: "inbound" | "outbound" | "system";
  channel: "whatsapp" | "telegram" | "dashboard" | "system";
  senderType: "lead" | "ai" | "agent" | "system";

  content: {
    text?: string;
    audioUrl?: string;
    mediaUrl?: string;
    mediaType?: "image" | "document" | "video" | "audio";
    templateName?: string;
    location?: { latitude: number; longitude: number };
  };

  metadata: {
    aiGenerated: boolean;
    aiModel?: string;
    tokensUsed?: number;
    languageDetected?: string;
    languageConfidence?: number;
    complianceCheck?: "passed" | "flagged" | "blocked";
    complianceNotes?: string;
    entities?: {
      budget?: string;
      timeline?: string;
      propertyType?: string;
      areas?: string[];
      requirements?: string[];
    };
    whatsappMessageId?: string;
    deliveryStatus?: "sent" | "delivered" | "read" | "failed";
  };

  timestamp: Timestamp;
  createdAt: Timestamp;
}
