import React, { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";

interface MessageData {
  messageId: string;
  type: "inbound" | "outbound" | "system";
  senderType: "lead" | "ai" | "agent" | "system";
  content: { text?: string; mediaUrl?: string; mediaType?: string };
  metadata: { aiGenerated: boolean; complianceCheck?: string };
  timestamp: unknown;
}

interface ConversationThreadProps {
  tenantId: string;
  leadId: string;
  leadName: string;
  aiActive: boolean;
}

export function ConversationThread({
  tenantId,
  leadId,
  leadName,
  aiActive,
}: ConversationThreadProps) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tenantId || !leadId) return;

    const q = query(
      collection(db, `tenants/${tenantId}/leads/${leadId}/messages`),
      orderBy("timestamp", "asc"),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((d) => ({
        ...d.data(),
        messageId: d.id,
      })) as MessageData[];
      setMessages(msgs);
      setLoading(false);
    });

    return unsubscribe;
  }, [tenantId, leadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{leadName}</h3>
            <p className="text-xs text-gray-500">
              {messages.length} messages {aiActive ? "- AI Active" : "- Agent Mode"}
            </p>
          </div>
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              aiActive ? "bg-green-500" : "bg-yellow-500"
            }`}
            title={aiActive ? "AI is handling conversation" : "Agent has taken over"}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No messages yet
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.messageId} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <MessageInput tenantId={tenantId} leadId={leadId} />
    </div>
  );
}
