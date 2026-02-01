"use client";

import { SignInButton } from "~/app/_components/sign-in-button";

export function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center text-white">
      <div className="flex flex-col items-center gap-8 px-4">
        <h1 className="text-5xl font-extrabold tracking-tight">Ai Boilerplate</h1>
        <p className="max-w-md text-center text-lg text-white/70">
          Automate your sales prospection with AI-powered messaging. Generate personalized outreach,
          manage conversations, and close more deals.
        </p>
        <SignInButton />
      </div>
    </main>
  );
}
