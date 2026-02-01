import { redirect } from "next/navigation";

import { IamService } from "~/lib/domains/iam";
import { MessagingPageContent } from "~/app/messaging/_components/MessagingPageContent";

export default async function MessagingPage() {
  const currentUser = await IamService.getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center text-white">
      <div className="container flex flex-col items-center gap-8 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight">Messaging</h1>
        <MessagingPageContent />
      </div>
    </main>
  );
}
