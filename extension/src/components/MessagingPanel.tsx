import { useState, useEffect, useCallback } from "react";
import { get, post, ApiError } from "../lib/api-client";
import { MessageBubble } from "./MessageBubble";

interface Conversation {
  id: number;
  contactId: number;
}

interface Message {
  id: number;
  role: "prospect" | "contact";
  content: string;
}

interface CreateConversationResponse {
  conversation: Conversation;
  firstMessage: { content: string; stopped: boolean; stoppedReason: string | null };
}

interface DraftResponse {
  content: string;
  stopped: boolean;
  stoppedReason: string | null;
}

interface MessagingPanelProps {
  contactId: number;
  contactName: string;
}

type PanelState = "loading" | "no-conversation" | "conversation" | "error";

export function MessagingPanel({ contactId, contactName }: MessagingPanelProps) {
  const [panelState, setPanelState] = useState<PanelState>("loading");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contactReplyInput, setContactReplyInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stoppedReason, setStoppedReason] = useState<string | null>(null);

  const findExistingConversation = useCallback(async () => {
    setPanelState("loading");
    try {
      const conversations = await get<Conversation[]>("/api/conversations");
      const existingConversation = conversations.find(
        (conversation) => conversation.contactId === contactId,
      );

      if (existingConversation) {
        setConversationId(existingConversation.id);
        const conversationMessages = await get<Message[]>(
          `/api/conversations/${existingConversation.id}/messages`,
        );
        setMessages(conversationMessages);
        setPanelState("conversation");
      } else {
        setPanelState("no-conversation");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load";
      setErrorMessage(message);
      setPanelState("error");
    }
  }, [contactId]);

  useEffect(() => {
    void findExistingConversation();
  }, [findExistingConversation]);

  async function handleStartConversation() {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await post<CreateConversationResponse>("/api/conversations", {
        contactId,
      });
      setConversationId(result.conversation.id);
      setMessages([
        {
          id: Date.now(),
          role: "prospect",
          content: result.firstMessage.content,
        },
      ]);
      if (result.firstMessage.stopped) {
        setStoppedReason(result.firstMessage.stoppedReason);
      }
      setPanelState("conversation");
    } catch (error) {
      if (error instanceof ApiError && error.status === 402) {
        setErrorMessage("Insufficient credits");
      } else {
        const message = error instanceof Error ? error.message : "Failed to start";
        setErrorMessage(message);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSendContactReply() {
    if (!conversationId || !contactReplyInput.trim()) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const savedMessage = await post<Message>(
        `/api/conversations/${conversationId}/messages`,
        { role: "contact", content: contactReplyInput.trim() },
      );
      setMessages((previous) => [...previous, savedMessage]);
      setContactReplyInput("");

      // Auto-generate AI reply
      const aiReply = await post<DraftResponse>(
        `/api/conversations/${conversationId}/messages`,
        { role: "prospect" },
      );
      setMessages((previous) => [
        ...previous,
        { id: Date.now(), role: "prospect", content: aiReply.content },
      ]);
      if (aiReply.stopped) {
        setStoppedReason(aiReply.stoppedReason);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 402) {
        setErrorMessage("Insufficient credits");
      } else {
        const message = error instanceof Error ? error.message : "Failed to send";
        setErrorMessage(message);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  const containerStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  };

  const messagesContainerStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxHeight: "250px",
    overflowY: "auto",
    padding: "4px 0",
  };

  const inputRowStyles: React.CSSProperties = {
    display: "flex",
    gap: "6px",
    marginTop: "4px",
  };

  const inputStyles: React.CSSProperties = {
    flex: 1,
    padding: "8px 10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "13px",
    outline: "none",
  };

  const sendButtonStyles: React.CSSProperties = {
    background: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    opacity: isProcessing ? 0.5 : 1,
  };

  const startButtonStyles: React.CSSProperties = {
    width: "100%",
    background: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    opacity: isProcessing ? 0.5 : 1,
  };

  if (panelState === "loading") {
    return <p style={{ color: "#6b7280", fontSize: "13px" }}>Loading messages...</p>;
  }

  if (panelState === "error") {
    return <p style={{ color: "#dc2626", fontSize: "13px" }}>{errorMessage}</p>;
  }

  if (panelState === "no-conversation") {
    return (
      <div style={containerStyles}>
        <p style={{ fontSize: "13px", color: "#6b7280" }}>
          No conversation with {contactName} yet.
        </p>
        {errorMessage && (
          <p style={{ color: "#dc2626", fontSize: "12px" }}>{errorMessage}</p>
        )}
        <button
          onClick={handleStartConversation}
          disabled={isProcessing}
          style={startButtonStyles}
        >
          {isProcessing ? "Starting..." : "Start AI Conversation"}
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <div style={messagesContainerStyles}>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role}
            content={message.content}
          />
        ))}
      </div>

      {stoppedReason && (
        <p style={{ fontSize: "12px", color: "#92400e", background: "#fffbeb", padding: "6px 8px", borderRadius: "4px" }}>
          Conversation ended: {stoppedReason}
        </p>
      )}

      {errorMessage && (
        <p style={{ color: "#dc2626", fontSize: "12px" }}>{errorMessage}</p>
      )}

      {!stoppedReason && (
        <div style={inputRowStyles}>
          <input
            type="text"
            placeholder="Simulate contact reply..."
            value={contactReplyInput}
            onChange={(event) => setContactReplyInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !isProcessing) {
                void handleSendContactReply();
              }
            }}
            style={inputStyles}
            disabled={isProcessing}
          />
          <button
            onClick={handleSendContactReply}
            disabled={isProcessing || !contactReplyInput.trim()}
            style={sendButtonStyles}
          >
            {isProcessing ? "..." : "Send"}
          </button>
        </div>
      )}
    </div>
  );
}
