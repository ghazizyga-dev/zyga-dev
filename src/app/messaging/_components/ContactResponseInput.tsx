"use client";

import { useState } from "react";
import posthog from "posthog-js";

interface ContactResponseInputProps {
  onSubmit: (content: string) => Promise<void>;
  isProcessing: boolean;
}

export function ContactResponseInput({
  onSubmit,
  isProcessing,
}: ContactResponseInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;

    setIsSending(true);
    try {
      await onSubmit(content.trim());
      posthog.capture("contact_response_sent", {
        response_length: content.trim().length,
      });
      setContent("");
    } catch (error) {
      posthog.captureException(error);
      alert("Failed to send response. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="border-t border-white/10 pt-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Type a fake contact response..."
          className="flex-1 rounded-lg bg-white/10 px-4 py-2 text-white placeholder:text-white/30"
          disabled={isSending || isProcessing}
        />
        <button
          type="submit"
          disabled={isSending || isProcessing || !content.trim()}
          className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/30 disabled:opacity-50"
        >
          {isSending || isProcessing ? "Processing..." : "Send"}
        </button>
      </form>
    </div>
  );
}
