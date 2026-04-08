import React from "react";
import { Bot, User, Shield } from "lucide-react";
import { Timestamp } from "firebase/firestore";

interface MessageBubbleProps {
  message: {
    messageId: string;
    type: "inbound" | "outbound" | "system";
    senderType: "lead" | "ai" | "agent" | "system";
    content: { text?: string };
    metadata: { aiGenerated: boolean; complianceCheck?: string };
    timestamp: unknown;
  };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isInbound = message.type === "inbound";
  const isSystem = message.type === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
          {message.content.text}
        </span>
      </div>
    );
  }

  const timestamp = message.timestamp
    ? (message.timestamp as Timestamp).toDate?.()
      ? (message.timestamp as Timestamp).toDate()
      : new Date()
    : new Date();

  const timeStr = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);

  return (
    <div className={`flex gap-2 ${isInbound ? "justify-start" : "justify-end"}`}>
      {isInbound && (
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      )}

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isInbound
            ? "rounded-tl-md bg-gray-100 text-gray-900"
            : message.senderType === "ai"
            ? "rounded-tr-md bg-brand-600 text-white"
            : "rounded-tr-md bg-green-600 text-white"
        }`}
      >
        {!isInbound && (
          <div className="mb-1 flex items-center gap-1">
            {message.senderType === "ai" ? (
              <Bot className="h-3 w-3 opacity-70" />
            ) : null}
            <span className="text-xs opacity-70">
              {message.senderType === "ai" ? "AI" : "Agent"}
            </span>
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content.text || "[Media]"}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className={`text-xs ${isInbound ? "text-gray-400" : "opacity-60"}`}>
            {timeStr}
          </span>
          {message.metadata.complianceCheck === "flagged" && (
            <Shield className="h-3 w-3 text-yellow-400" />
          )}
        </div>
      </div>

      {!isInbound && message.senderType === "ai" && (
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-100">
          <Bot className="h-4 w-4 text-brand-600" />
        </div>
      )}
    </div>
  );
}
