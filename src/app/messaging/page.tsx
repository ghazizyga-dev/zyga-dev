import { redirect } from "next/navigation";

import { IamService } from "~/lib/domains/iam";
import { MessagingPageContent } from "~/app/messaging/_components/MessagingPageContent";

interface MessagingPageProps {
  searchParams: Promise<{ contactId?: string }>;
}

export default async function MessagingPage({ searchParams }: MessagingPageProps) {
  const currentUser = await IamService.getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const initialContactId = resolvedSearchParams.contactId
    ? Number(resolvedSearchParams.contactId) || null
    : null;

  return (
    <main className="flex flex-1 overflow-auto flex-col items-center text-white">
      <div className="container flex flex-col items-center gap-8 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight">Messaging</h1>
        <MessagingPageContent initialContactId={initialContactId} />
      </div>
    </main>
  );
}
