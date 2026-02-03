"use client";

import { useState } from "react";

interface ExampleMessagesListProps {
  messages: string[];
  onChange: (messages: string[]) => void;
}

export function ExampleMessagesList({
  messages,
  onChange,
}: ExampleMessagesListProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  function handleAddMessage() {
    if (!newMessage.trim()) return;
    if (messages.length >= 10) return;

    onChange([...messages, newMessage.trim()]);
    setNewMessage("");
    setIsAdding(false);
  }

  function handleRemoveMessage(indexToRemove: number) {
    onChange(messages.filter((_, index) => index !== indexToRemove));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && event.metaKey) {
      event.preventDefault();
      handleAddMessage();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.length > 0 && (
        <ul className="flex flex-col gap-2">
          {messages.map((message, index) => (
            <li
              key={index}
              className="flex items-start gap-2 rounded-lg bg-white/5 px-4 py-3"
            >
              <p className="flex-1 text-sm text-white/80">{message}</p>
              <button
                type="button"
                onClick={() => handleRemoveMessage(index)}
                className="text-sm text-white/40 transition hover:text-red-400"
                aria-label="Remove message"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {isAdding ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter an example message..."
            className="rounded-lg bg-white/10 px-4 py-2 text-white placeholder:text-white/30"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddMessage}
              disabled={!newMessage.trim()}
              className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/30 disabled:opacity-50"
            >
              Add Message
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewMessage("");
              }}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          disabled={messages.length >= 10}
          className="self-start rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20 disabled:opacity-50"
        >
          + Add Example Message
        </button>
      )}

      <p className="text-sm text-white/40">{messages.length}/10 messages</p>
    </div>
  );
}
