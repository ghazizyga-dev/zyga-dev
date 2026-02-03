import { IamService } from "~/lib/domains/iam";
import { withApiLogging } from "~/lib/logging";
import { resolveSessionUserId } from "~/server/better-auth";

async function handleGetOnboardingState() {
  const currentUser = await IamService.getCurrentUser();
  if (!currentUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isOnboardingCompleted = await IamService.isOnboardingCompleted(
    currentUser.id,
  );

  return Response.json({
    currentUser: {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
    },
    isOnboardingCompleted,
  });
}

const handlers = withApiLogging(
  "/api/onboarding/state",
  { GET: handleGetOnboardingState },
  resolveSessionUserId,
);

export const { GET } = handlers;
