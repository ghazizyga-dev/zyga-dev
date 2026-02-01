"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  company: string | null;
}

interface Conversation {
  id: number;
  contactId: number;
  sellingContext: string;
  createdAt: string;
}

interface ExistingConversation {
  id: number;
  contactId: number;
}

interface ConversationSetupProps {
  onConversationCreated: (conversation: Conversation) => void;
  onBack: () => void;
  existingConversations: ExistingConversation[];
}

export function ConversationSetup({
  onConversationCreated,
  onBack,
  existingConversations,
}: ConversationSetupProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<number | "">("");
  const [sellingContext, setSellingContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);

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

  const matchingConversation =
    selectedContactId !== ""
      ? existingConversations.find((conversation) => conversation.contactId === selectedContactId)
      : null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedContactId || !sellingContext.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: selectedContactId, sellingContext }),
      });
      if (!response.ok) throw new Error("Failed to create conversation");
      const data = (await response.json()) as { conversation: Conversation };

      posthog.capture("conversation_started", {
        contact_id: selectedContactId,
        selling_context_length: sellingContext.trim().length,
      });

      onConversationCreated(data.conversation);
    } catch (error) {
      posthog.captureException(error);
      alert("Failed to create conversation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingContacts)
    return <p className="text-white/50">Loading contacts...</p>;
  if (contacts.length === 0)
    return (
      <p className="text-white/50">No contacts yet. Add contacts first.</p>
    );

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <button
        onClick={onBack}
        className="self-start text-sm text-white/50 transition hover:text-white"
      >
        &larr; Back to conversations
      </button>

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
              onClick={() => onConversationCreated(matchingConversation as Conversation)}
              className="mt-2 font-medium text-yellow-100 underline transition hover:text-white"
            >
              Open existing conversation
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="selling-context" className="text-sm font-medium">
            Selling Context
          </label>
          <textarea
            id="selling-context"
            value={sellingContext}
            onChange={(event) => setSellingContext(event.target.value)}
            placeholder="Describe what you're selling and why this contact would be interested..."
            className="rounded-lg bg-white/10 px-4 py-2 text-white placeholder:text-white/30"
            rows={4}
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !selectedContactId || !sellingContext.trim()}
          className="rounded-lg bg-purple-600 px-4 py-2 font-medium transition hover:bg-purple-500 disabled:opacity-50"
        >
          {isLoading ? "Generating First Message..." : "Generate First Message"}
        </button>
      </form>
    </div>
  );
}
