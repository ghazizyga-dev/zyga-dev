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

interface ConversationThreadProps {
  conversationId: number;
  onBack: () => void;
}

export function ConversationThread({
  conversationId,
  onBack,
}: ConversationThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const response = await fetch(
          `/api/conversations/${conversationId}/messages`,
        );
        if (response.ok) {
          const messagesData = (await response.json()) as Message[];
          setMessages(messagesData);
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    }
    void fetchMessages();
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
  }

  async function handleGenerateReply() {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "prospect" }),
        },
      );

      if (!response.ok) throw new Error("Failed to generate reply");

      const refreshResponse = await fetch(
        `/api/conversations/${conversationId}/messages`,
      );
      if (refreshResponse.ok) {
        const messagesData = (await refreshResponse.json()) as Message[];
        setMessages(messagesData);
      }
    } catch {
      alert("Failed to generate reply. Please try again.");
    } finally {
      setIsGenerating(false);
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

      <ContactResponseInput
        onSubmit={handleContactResponse}
        onGenerateReply={handleGenerateReply}
        isGenerating={isGenerating}
      />
    </div>
  );
}
