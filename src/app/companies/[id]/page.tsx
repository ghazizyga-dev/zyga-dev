import { redirect } from "next/navigation";

import { IamService } from "~/lib/domains/iam";
import { CompanyPageContent } from "~/app/companies/_components";

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await IamService.getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  const { id } = await params;
  const companyId = Number(id);
  if (Number.isNaN(companyId)) {
    redirect("/contacts");
  }

  return (
    <main className="flex flex-1 overflow-auto flex-col items-center text-white">
      <div className="container flex flex-col items-center gap-8 px-4 py-16">
        <CompanyPageContent companyId={companyId} />
      </div>
    </main>
  );
}
