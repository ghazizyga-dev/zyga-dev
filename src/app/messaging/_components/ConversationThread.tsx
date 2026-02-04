"use client";

import { useEffect, useState } from "react";

import { MessageBubble } from "~/app/messaging/_components/MessageBubble";
import { ContactResponseInput } from "~/app/messaging/_components/ContactResponseInput";

interface Message {
  id: number;
  conversationId: number;
  role: "prospect" | "contact";
  content: string;
  createdAt: string;
}

type ConversationStopReason = "positive_outcome" | "unresponsive" | "negative_outcome";

interface ConversationData {
  id: number;
  stoppedAt: string | null;
  stoppedReason: ConversationStopReason | null;
}

function getStopReasonMessage(reason: ConversationStopReason | null): string {
  if (!reason) return "AI has stopped working on this conversation";
  const messages: Record<ConversationStopReason, string> = {
    positive_outcome: "Prospect showed interest - ready for manual follow-up",
    unresponsive: "Prospect hasn't responded after multiple attempts",
    negative_outcome: "Prospect declined - not interested",
  };
  return messages[reason];
}

interface ConversationThreadProps {
  conversationId: number;
  onBack: () => void;
}

export function ConversationThread({
  conversationId,
  onBack,
}: ConversationThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const isStopped = conversation?.stoppedAt !== null && conversation?.stoppedAt !== undefined;

  useEffect(() => {
    async function fetchData() {
      try {
        const [messagesResponse, conversationResponse] = await Promise.all([
          fetch(`/api/conversations/${conversationId}/messages`),
          fetch(`/api/conversations/${conversationId}`),
        ]);
        if (messagesResponse.ok) {
          const messagesData = (await messagesResponse.json()) as Message[];
          setMessages(messagesData);
        }
        if (conversationResponse.ok) {
          const conversationData = (await conversationResponse.json()) as ConversationData;
          setConversation(conversationData);
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    }
    void fetchData();
  }, [conversationId]);

  async function handleContactResponse(content: string) {
    const response = await fetch(
      `/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "contact", content }),
      },
    );

    if (!response.ok) throw new Error("Failed to send response");

    const savedMessage = (await response.json()) as Message;
    setMessages((previousMessages) => [...previousMessages, savedMessage]);

    // Automatically generate AI reply (errors handled separately)
    setIsGenerating(true);
    try {
      await handleGenerateReply();
    } catch {
      alert("Failed to generate AI reply. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateReply() {
    const response = await fetch(
      `/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "prospect" }),
      },
    );

    if (!response.ok) throw new Error("Failed to generate reply");

    const result = (await response.json()) as {
      stopped?: boolean;
      stoppedReason?: ConversationStopReason | null;
    };

    // If AI stopped, update conversation state (handle missing reason gracefully)
    if (result.stopped) {
      setConversation((prev) => ({
        id: prev?.id ?? conversationId,
        stoppedAt: new Date().toISOString(),
        stoppedReason: result.stoppedReason ?? null,
      }));
    }

    // Refresh messages
    const refreshResponse = await fetch(
      `/api/conversations/${conversationId}/messages`,
    );
    if (refreshResponse.ok) {
      const messagesData = (await refreshResponse.json()) as Message[];
      setMessages(messagesData);
    }
  }

  if (isLoading) {
    return <p className="text-white/50">Loading conversation...</p>;
  }

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <button
        onClick={onBack}
        className="self-start text-sm text-white/50 transition hover:text-white"
      >
        &larr; Back to conversations
      </button>

      <div className="flex flex-col gap-3">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      {isStopped ? (
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          <span className="font-medium">Conversation ended:</span>{" "}
          {getStopReasonMessage(conversation?.stoppedReason ?? null)}
        </div>
      ) : (
        <ContactResponseInput
          onSubmit={handleContactResponse}
          isProcessing={isGenerating}
        />
      )}
    </div>
  );
}
