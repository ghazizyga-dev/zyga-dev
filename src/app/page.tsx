import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 overflow-auto flex-col items-center justify-center text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/zyga-logo.svg" alt="Zyga" className="h-16 brightness-0 invert" />
        <p className="max-w-lg text-center text-lg text-white/70">
          Automate your sales prospection with AI-powered messaging. Import your contacts,
          generate personalized outreach, and manage all your conversations in one place.
        </p>
        <div className="flex gap-4">
          <Link
            href="/contacts"
            className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
          >
            Import Contacts
          </Link>
          <Link
            href="/messaging"
            className="rounded-full bg-purple-600 px-10 py-3 font-semibold no-underline transition hover:bg-purple-500"
          >
            Messaging
          </Link>
        </div>
      </div>
    </main>
  );
}
