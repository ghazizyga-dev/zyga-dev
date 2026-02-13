"use client";

import { useRouter } from "next/navigation";
import posthog from "posthog-js";

import { authClient } from "~/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    posthog.capture("sign_out_clicked");
    await authClient.signOut();
    posthog.reset();
    router.refresh();
  }

  return (
    <button
      className="w-full px-4 py-2 text-left text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
      onClick={handleSignOut}
    >
      Sign out
    </button>
  );
}
