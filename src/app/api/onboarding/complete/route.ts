import { IamService } from "~/lib/domains/iam";
import { withApiLogging } from "~/lib/logging";
import { resolveSessionUserId } from "~/server/better-auth";

async function handleCompleteOnboarding() {
  const currentUser = await IamService.getCurrentUser();
  if (!currentUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await IamService.completeOnboarding(currentUser.id);

  return Response.json({ success: true });
}

const handlers = withApiLogging(
  "/api/onboarding/complete",
  { POST: handleCompleteOnboarding },
  resolveSessionUserId,
);

export const { POST } = handlers;
