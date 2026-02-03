"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface OnboardingStatus {
  completed: boolean;
}

const EXCLUDED_PATHS = ["/onboarding", "/api"];

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isExcludedPath = useMemo(
    () => EXCLUDED_PATHS.some((path) => pathname.startsWith(path)),
    [pathname],
  );

  const [isChecking, setIsChecking] = useState(!isExcludedPath);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Reset guard state when path changes to avoid flashing gated content
    /* eslint-disable react-hooks/set-state-in-effect */
    if (isExcludedPath) {
      setIsChecking(false);
      setShouldRedirect(false);
      return;
    }

    // Reset state when a non-excluded path begins a new check
    setIsChecking(true);
    setShouldRedirect(false);
    /* eslint-enable react-hooks/set-state-in-effect */

    async function checkOnboardingStatus() {
      try {
        const response = await fetch("/api/onboarding");
        if (!response.ok) {
          setIsChecking(false);
          return;
        }

        const status = (await response.json()) as OnboardingStatus;
        if (!status.completed) {
          setShouldRedirect(true);
          router.push("/onboarding");
        } else {
          setIsChecking(false);
        }
      } catch {
        setIsChecking(false);
      }
    }

    void checkOnboardingStatus();
  }, [isExcludedPath, router]);

  // Always render children on excluded paths
  if (isExcludedPath) {
    return <>{children}</>;
  }

  if (shouldRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/50">Redirecting to onboarding...</p>
      </div>
    );
  }

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/50">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
