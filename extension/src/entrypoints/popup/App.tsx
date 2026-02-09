import { useState, useEffect, useCallback } from "react";
import { authClient } from "../../lib/auth";
import { LoginForm } from "../../components/LoginForm";
import { OnboardingCheck } from "../../components/OnboardingCheck";

type AppState = "loading" | "unauthenticated" | "authenticated";

interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export function App() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  const checkSession = useCallback(async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (session?.user) {
        setCurrentUser(session.user as SessionUser);
        setAppState("authenticated");
      } else {
        setAppState("unauthenticated");
      }
    } catch {
      setAppState("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  async function handleSignOut() {
    await authClient.signOut();
    setCurrentUser(null);
    setAppState("unauthenticated");
  }

  if (appState === "loading") {
    return (
      <div className="container">
        <div className="loading">Checking session...</div>
      </div>
    );
  }

  if (appState === "unauthenticated") {
    return (
      <div className="container">
        <h1>AI Boilerplate</h1>
        <LoginForm onSuccess={() => void checkSession()} />
      </div>
    );
  }

  return (
    <div className="container">
      <h1>AI Boilerplate</h1>
      <OnboardingCheck userName={currentUser?.name ?? currentUser?.email ?? "User"} />
      <button className="sign-out" onClick={() => void handleSignOut()}>
        Sign out
      </button>
    </div>
  );
}
