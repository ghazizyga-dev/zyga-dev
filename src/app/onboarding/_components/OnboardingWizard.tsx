"use client";

import { useRouter } from "next/navigation";
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

export function OnboardingWizard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [companyKnowledge, setCompanyKnowledge] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState(DEFAULT_TONE_OF_VOICE);
  const [exampleMessages, setExampleMessages] = useState<string[]>([]);
  const [signature, setSignature] = useState("");

  useEffect(() => {
    async function fetchPreferences() {
      console.log("[OnboardingWizard] Fetching preferences...");
      try {
        const response = await fetch("/api/ai-preferences");
        console.log("[OnboardingWizard] Response status:", response.status);
        if (!response.ok) {
          throw new Error("Failed to load preferences");
        }
        const preferences = (await response.json()) as AiPreferences;
        console.log("[OnboardingWizard] Preferences loaded:", preferences);

        setCompanyKnowledge(preferences.companyKnowledge ?? "");
        setToneOfVoice(preferences.toneOfVoice ?? DEFAULT_TONE_OF_VOICE);
        setExampleMessages(preferences.exampleMessages ?? []);
        setSignature(preferences.signature ?? preferences.userName);
      } catch (error) {
        console.log("[OnboardingWizard] Error:", error);
        // Preferences may not exist yet for new users, which is fine
      } finally {
        console.log("[OnboardingWizard] Setting isLoading to false");
        setIsLoading(false);
      }
    }
    void fetchPreferences();
  }, []);

  async function completeOnboarding() {
    const response = await fetch("/api/onboarding/complete", {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Failed to complete onboarding");
    }
  }

  async function handleCompleteSetup(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const preferencesResponse = await fetch("/api/ai-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyKnowledge: companyKnowledge || undefined,
          toneOfVoice: toneOfVoice || undefined,
          exampleMessages,
          signature: signature.trim() || null,
        }),
      });

      if (!preferencesResponse.ok) {
        throw new Error("Failed to save preferences");
      }

      await completeOnboarding();
      router.push("/contacts");
    } catch {
      setErrorMessage("Failed to complete setup. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSkip() {
    setIsSkipping(true);
    setErrorMessage(null);

    try {
      await completeOnboarding();
      router.push("/contacts");
    } catch {
      setErrorMessage("Failed to skip onboarding. Please try again.");
    } finally {
      setIsSkipping(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/50">Loading...</p>
      </div>
    );
  }

  const isSubmitting = isSaving || isSkipping;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Welcome to Ai Boilerplate!
        </h1>
        <p className="mt-4 text-lg text-white/70">
          Help your AI write better messages by telling it about your company
          and style.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleCompleteSetup} className="flex flex-col gap-8">
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
          <p className="text-sm text-white/40">
            Describe the writing style you want the AI to use
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Example Messages (Optional)
          </label>
          <p className="text-sm text-white/40">
            Provide up to 10 example messages that represent your preferred
            style
          </p>
          <ExampleMessagesList
            messages={exampleMessages}
            onChange={setExampleMessages}
          />
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-500 disabled:opacity-50"
          >
            {isSaving ? "Setting up..." : "Complete Setup"}
          </button>

          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="text-sm text-white/60 underline transition hover:text-white/80 disabled:opacity-50"
            >
              {isSkipping ? "Skipping..." : "Skip for now"}
            </button>
            <p className="text-xs text-white/40">
              You can set this up later in Settings
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
