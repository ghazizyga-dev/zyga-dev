"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import posthog from "posthog-js";

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  company: string | null;
}

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
}

interface OnboardingStatus {
  completed: boolean;
  hasCompanyKnowledge: boolean;
}

interface ConversationSetupProps {
  onConversationCreated: (conversationId: number) => void;
  onBack: () => void;
  existingConversations: EnrichedConversation[];
}

export function ConversationSetup({
  onConversationCreated,
  onBack,
  existingConversations,
}: ConversationSetupProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<number | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(true);

  useEffect(() => {
    async function fetchContacts() {
      try {
        const response = await fetch("/api/contacts");
        if (response.ok) setContacts((await response.json()) as Contact[]);
      } catch {
        // Silently fail
      } finally {
        setIsLoadingContacts(false);
      }
    }
    void fetchContacts();
  }, []);

  useEffect(() => {
    async function fetchOnboardingStatus() {
      try {
        const response = await fetch("/api/onboarding");
        if (response.ok) {
          setOnboardingStatus((await response.json()) as OnboardingStatus);
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoadingOnboarding(false);
      }
    }
    void fetchOnboardingStatus();
  }, []);

  const matchingConversation =
    selectedContactId !== ""
      ? existingConversations.find((conversation) => conversation.contactId === selectedContactId)
      : null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedContactId) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: selectedContactId }),
      });
      if (!response.ok) throw new Error("Failed to create conversation");
      const conversationResponse = (await response.json()) as { conversation: { id: number } };

      posthog.capture("conversation_started", {
        contact_id: selectedContactId,
      });

      onConversationCreated(conversationResponse.conversation.id);
    } catch (error) {
      posthog.captureException(error);
      alert("Failed to create conversation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const isInitialLoading = isLoadingContacts || isLoadingOnboarding;
  const needsCompanyKnowledge = onboardingStatus && !onboardingStatus.hasCompanyKnowledge;

  if (isInitialLoading)
    return <p className="text-white/50">Loading...</p>;
  if (contacts.length === 0)
    return (
      <p className="text-white/50">No contacts yet. Add contacts first.</p>
    );

  if (needsCompanyKnowledge) {
    return (
      <div className="flex w-full max-w-md flex-col gap-4">
        <button
          onClick={onBack}
          className="self-start text-sm text-white/50 transition hover:text-white"
        >
          &larr; Back to conversations
        </button>

        <div className="rounded-lg bg-purple-500/10 px-6 py-5 text-center">
          <p className="mb-4 text-white/80">
            Before starting a conversation, you need to set up your company information.
          </p>
          <Link
            href="/settings"
            className="inline-block rounded-lg bg-purple-600 px-4 py-2 font-medium transition hover:bg-purple-500"
          >
            Set up in Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-white/50 transition hover:text-white"
        >
          &larr; Back to conversations
        </button>
        <Link
          href="/settings"
          className="text-sm text-white/50 transition hover:text-white"
        >
          Customize AI in Settings
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="contact-select" className="text-sm font-medium">
            Contact
          </label>
          <select
            id="contact-select"
            value={selectedContactId}
            onChange={(event) =>
              setSelectedContactId(Number(event.target.value) || "")
            }
            className="rounded-lg bg-white/10 px-4 py-2 text-white"
            required
          >
            <option value="">Select a contact...</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.firstName} {contact.lastName}
                {contact.company ? ` (${contact.company})` : ""}
              </option>
            ))}
          </select>
        </div>

        {matchingConversation && (
          <div className="rounded-lg bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            <p>A conversation already exists with this contact.</p>
            <button
              type="button"
              onClick={() => onConversationCreated(matchingConversation.id)}
              className="mt-2 font-medium text-yellow-100 underline transition hover:text-white"
            >
              Open existing conversation
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !selectedContactId}
          className="rounded-lg bg-purple-600 px-4 py-2 font-medium transition hover:bg-purple-500 disabled:opacity-50"
        >
          {isLoading ? "Generating First Message..." : "Generate First Message"}
        </button>
      </form>
    </div>
  );
}
