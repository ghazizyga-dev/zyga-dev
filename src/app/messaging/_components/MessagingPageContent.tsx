"use client";

import { useEffect, useState } from "react";

import { ConversationList } from "~/app/messaging/_components/ConversationList";
import { ConversationSetup } from "~/app/messaging/_components/ConversationSetup";
import { ConversationThread } from "~/app/messaging/_components/ConversationThread";

interface ConversationContact {
  firstName: string;
  lastName: string;
  company: string | null;
}

interface EnrichedConversation {
  id: number;
  contactId: number;
  createdAt: string;
  contact: ConversationContact | null;
  stoppedAt: string | null;
}

type View = "list" | "setup" | "thread";

export function MessagingPageContent() {
  const [currentView, setCurrentView] = useState<View>("list");
  const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchConversations() {
      try {
        const response = await fetch("/api/conversations");
        if (response.ok) {
          setConversations((await response.json()) as EnrichedConversation[]);
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoadingConversations(false);
      }
    }
    void fetchConversations();
  }, []);

  function handleOpenConversation(conversationId: number) {
    setActiveConversationId(conversationId);
    setCurrentView("thread");
  }

  function handleNewConversation() {
    setCurrentView("setup");
  }

  function handleConversationCreated(conversationId: number) {
    setActiveConversationId(conversationId);
    setCurrentView("thread");
  }

  function handleBackToList() {
    setCurrentView("list");
    setIsLoadingConversations(true);
    void fetch("/api/conversations")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch conversations");
        return response.json();
      })
      .then((data) => setConversations(data as EnrichedConversation[]))
      .catch(() => undefined)
      .finally(() => setIsLoadingConversations(false));
  }

  if (currentView === "thread" && activeConversationId !== null) {
    return (
      <ConversationThread
        conversationId={activeConversationId}
        onBack={handleBackToList}
      />
    );
  }

  if (currentView === "setup") {
    return (
      <ConversationSetup
        onConversationCreated={handleConversationCreated}
        onBack={handleBackToList}
        existingConversations={conversations}
      />
    );
  }

  return (
    <ConversationList
      conversations={conversations}
      isLoading={isLoadingConversations}
      onOpenConversation={handleOpenConversation}
      onNewConversation={handleNewConversation}
    />
  );
}
