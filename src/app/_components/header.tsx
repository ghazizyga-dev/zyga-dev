"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

import { SignOutButton } from "~/app/_components/sign-out-button";

interface HeaderProps {
  userName: string;
  userImage: string | null;
  remainingCredits: number;
}

function SettingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function UserAvatar({ userName, userImage }: { userName: string; userImage: string | null }) {
  if (userImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={userImage}
        alt={userName}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }

  const initials = userName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const displayInitials = initials || "?";

  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-medium"
      role="img"
      aria-label={`Avatar for ${userName || "user"}`}
      title={userName}
    >
      {displayInitials}
    </div>
  );
}

function UserMenu({ userName, userImage }: { userName: string; userImage: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center rounded-full transition hover:ring-2 hover:ring-white/30"
        aria-label="User menu"
      >
        <UserAvatar userName={userName} userImage={userImage} />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 min-w-30 rounded-lg bg-white/10 py-1 backdrop-blur-sm">
          <SignOutButton />
        </div>
      )}
    </div>
  );
}

export function Header({ userName, userImage, remainingCredits }: HeaderProps) {
  return (
    <header className="flex w-full items-center justify-between px-6 py-4">
      <Link href="/" className="no-underline">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/zyga-logo.svg" alt="Zyga" className="h-8 brightness-0 invert" />
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-white/70">{remainingCredits} credits</span>
        <Link
          href="/settings"
          className="text-white/70 transition hover:text-white"
          title="Settings"
        >
          <SettingsIcon />
        </Link>
        <UserMenu userName={userName} userImage={userImage} />
      </div>
    </header>
  );
}
