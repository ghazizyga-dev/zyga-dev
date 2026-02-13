"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OnboardingWizard } from "~/app/onboarding/_components";

interface OnboardingState {
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
  isOnboardingCompleted: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowWizard, setShouldShowWizard] = useState(false);

  useEffect(() => {
    async function checkOnboardingState() {
      try {
        const response = await fetch("/api/onboarding/state");

        if (!response.ok) {
          router.push("/");
          return;
        }

        const state = (await response.json()) as OnboardingState;

        if (state.isOnboardingCompleted) {
          router.push("/contacts");
          return;
        }

        setShouldShowWizard(true);
        setIsLoading(false);
      } catch {
        router.push("/");
      }
    }

    void checkOnboardingState();
  }, [router]);

  if (isLoading || !shouldShowWizard) {
    return (
      <main className="flex flex-1 flex-col items-center overflow-y-auto text-white">
        <div className="container flex flex-col items-center gap-8 px-4 py-16">
          <p className="text-white/50">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center overflow-y-auto text-white">
      <div className="container flex flex-col items-center gap-8 px-4 py-16">
        <OnboardingWizard />
      </div>
    </main>
  );
}
