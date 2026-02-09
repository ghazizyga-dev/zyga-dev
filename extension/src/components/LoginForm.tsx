import { useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "../lib/auth";

const BASE_URL = import.meta.env.WXT_API_URL ?? "http://localhost:3000";

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        setErrorMessage(error.message ?? "Sign in failed");
        return;
      }
      onSuccess();
    } catch {
      setErrorMessage("Failed to connect. Is the server running?");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {errorMessage && <p className="error">{errorMessage}</p>}
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
      <p style={{ marginTop: "12px", fontSize: "12px", color: "#6b7280", textAlign: "center" }}>
        Or{" "}
        <a
          href={`${BASE_URL}/auth/signin`}
          target="_blank"
          rel="noreferrer"
          style={{ color: "#7c3aed", fontWeight: 500 }}
        >
          sign in on the web app
        </a>{" "}
        (for Google login), then reopen this popup.
      </p>
    </form>
  );
}
