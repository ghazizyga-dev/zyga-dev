import { IamService } from "~/lib/domains/iam";
import { withApiLogging } from "~/lib/logging";
import { resolveSessionUserId } from "~/server/better-auth";

async function handleGetOnboardingStatus() {
  const currentUser = await IamService.getCurrentUser();
  if (!currentUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [completed, hasCompanyKnowledge] = await Promise.all([
    IamService.isOnboardingCompleted(currentUser.id),
    IamService.hasCompanyKnowledge(currentUser.id),
  ]);

  return Response.json({ completed, hasCompanyKnowledge });
}

const handlers = withApiLogging(
  "/api/onboarding",
  { GET: handleGetOnboardingStatus },
  resolveSessionUserId,
);

export const { GET } = handlers;
