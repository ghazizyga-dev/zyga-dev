"use client";

import { useEffect, useState } from "react";

import { ExampleMessagesList } from "./ExampleMessagesList";

const DEFAULT_TONE_OF_VOICE =
  "Professional yet approachable. Clear and concise. Focus on demonstrating value to the prospect without being pushy. Use natural language, avoid jargon.";

interface AiPreferences {
  companyKnowledge: string | null;
  toneOfVoice: string | null;
  exampleMessages: string[];
  signature: string | null;
  userName: string;
}

export function AiPreferencesForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [companyKnowledge, setCompanyKnowledge] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState(DEFAULT_TONE_OF_VOICE);
  const [exampleMessages, setExampleMessages] = useState<string[]>([]);
  const [signature, setSignature] = useState("");

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const response = await fetch("/api/ai-preferences");
        if (!response.ok) {
          throw new Error("Failed to load preferences");
        }
        const preferences = (await response.json()) as AiPreferences;

        setCompanyKnowledge(preferences.companyKnowledge ?? "");
        setToneOfVoice(preferences.toneOfVoice ?? DEFAULT_TONE_OF_VOICE);
        setExampleMessages(preferences.exampleMessages ?? []);
        setSignature(preferences.signature ?? preferences.userName);
      } catch {
        setErrorMessage("Failed to load preferences. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    }
    void fetchPreferences();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/ai-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyKnowledge: companyKnowledge || undefined,
          toneOfVoice: toneOfVoice || undefined,
          exampleMessages,
          signature: signature.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      setSuccessMessage("Preferences saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setErrorMessage("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-white/50">Loading preferences...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-2xl flex-col gap-8">
      {errorMessage && (
        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {successMessage}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="signature" className="text-sm font-medium">
          Message Signature
        </label>
        <input
          id="signature"
          type="text"
          value={signature}
          onChange={(event) => setSignature(event.target.value)}
          placeholder="Your name"
          className="rounded-lg bg-white/10 px-4 py-3 text-white placeholder:text-white/30"
        />
        <p className="text-sm text-white/40">
          How the AI will sign your messages
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="company-knowledge" className="text-sm font-medium">
          Company & Product Knowledge <span className="text-red-400">*</span>
        </label>
        <textarea
          id="company-knowledge"
          value={companyKnowledge}
          onChange={(event) => setCompanyKnowledge(event.target.value)}
          placeholder="Describe your company, products, value propositions, and target market..."
          className="rounded-lg bg-white/10 px-4 py-3 text-white placeholder:text-white/30"
          rows={6}
          required
        />
        <p className="text-sm text-white/40">
          This information helps the AI craft relevant messages
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="tone-of-voice" className="text-sm font-medium">
          Tone of Voice
        </label>
        <textarea
          id="tone-of-voice"
          value={toneOfVoice}
          onChange={(event) => setToneOfVoice(event.target.value)}
          className="rounded-lg bg-white/10 px-4 py-3 text-white placeholder:text-white/30"
          rows={3}
        />
        <p className="text-sm text-white/40">
          Describe the writing style you want the AI to use
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Example Messages (Optional)</label>
        <p className="text-sm text-white/40">
          Provide up to 10 example messages that represent your preferred style
        </p>
        <ExampleMessagesList
          messages={exampleMessages}
          onChange={setExampleMessages}
        />
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="self-start rounded-lg bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-500 disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save Preferences"}
      </button>
    </form>
  );
}
