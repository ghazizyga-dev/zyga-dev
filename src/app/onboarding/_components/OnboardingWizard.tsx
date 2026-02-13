"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AiPreferencesFields } from "~/app/_components/AiPreferencesFields";

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
          Welcome to Zyga!
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
        <AiPreferencesFields
          signature={signature}
          onSignatureChange={setSignature}
          companyKnowledge={companyKnowledge}
          onCompanyKnowledgeChange={setCompanyKnowledge}
          toneOfVoice={toneOfVoice}
          onToneOfVoiceChange={setToneOfVoice}
          exampleMessages={exampleMessages}
          onExampleMessagesChange={setExampleMessages}
          disabled={isSubmitting}
        />

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
