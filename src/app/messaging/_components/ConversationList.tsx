"use client";

interface ConversationContact {
  firstName: string;
  lastName: string;
  company: string | null;
}

interface ConversationListItem {
  id: number;
  contactId: number;
  contact: ConversationContact | null;
  stoppedAt: string | null;
}

interface ConversationListProps {
  conversations: ConversationListItem[];
  isLoading: boolean;
  onOpenConversation: (conversationId: number) => void;
  onNewConversation: () => void;
}

export function ConversationList({
  conversations,
  isLoading,
  onOpenConversation,
  onNewConversation,
}: ConversationListProps) {
  if (isLoading) {
    return <p className="text-white/50">Loading conversations...</p>;
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <button
        onClick={onNewConversation}
        className="rounded-lg bg-purple-600 px-4 py-2 font-medium transition hover:bg-purple-500"
      >
        New Conversation
      </button>

      {conversations.length === 0 ? (
        <p className="text-center text-white/50">No conversations yet. Start a new one!</p>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((conversation) => {
            const isStopped = conversation.stoppedAt !== null;
            return (
              <button
                key={conversation.id}
                onClick={() => onOpenConversation(conversation.id)}
                className="rounded-lg bg-white/10 px-4 py-3 text-left transition hover:bg-white/20"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {conversation.contact
                      ? `${conversation.contact.firstName} ${conversation.contact.lastName}`
                      : `Contact #${conversation.contactId}`}
                    {conversation.contact?.company && (
                      <span className="text-white/50"> ({conversation.contact.company})</span>
                    )}
                  </span>
                  {isStopped && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50">
                      Ended
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
