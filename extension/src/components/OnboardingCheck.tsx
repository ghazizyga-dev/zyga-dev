import { useState, useEffect } from "react";
import { get } from "../lib/api-client";

const BASE_URL = import.meta.env.WXT_API_URL ?? "http://localhost:3000";

interface OnboardingState {
  currentUser: { id: string; name: string; email: string };
  isOnboardingCompleted: boolean;
}

interface OnboardingCheckProps {
  userName: string;
}

export function OnboardingCheck({ userName }: OnboardingCheckProps) {
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetchOnboardingState();
  }, []);

  async function fetchOnboardingState() {
    try {
      const data = await get<OnboardingState>("/api/onboarding/state");
      setIsOnboardingCompleted(data.isOnboardingCompleted);
    } catch {
      setErrorMessage("Failed to check onboarding status");
    }
  }

  return (
    <>
      <div className="user-info">
        <p>
          Signed in as <span className="name">{userName}</span>
        </p>
      </div>

      {errorMessage && <p className="error">{errorMessage}</p>}

      {isOnboardingCompleted === false && (
        <div className="warning">
          <p>
            Complete your{" "}
            <a href={`${BASE_URL}/onboarding`} target="_blank" rel="noreferrer">
              onboarding setup
            </a>{" "}
            to use all features.
          </p>
        </div>
      )}

      {isOnboardingCompleted === true && (
        <p className="success">Ready! Visit a LinkedIn profile to get started.</p>
      )}
    </>
  );
}
