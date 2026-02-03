import { IamService } from "~/lib/domains/iam";
import { withApiLogging } from "~/lib/logging";
import { resolveSessionUserId } from "~/server/better-auth";

async function handleGetCurrentUser() {
  const currentUser = await IamService.getCurrentUser();
  if (!currentUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
  });
}

const handlers = withApiLogging(
  "/api/current-user",
  { GET: handleGetCurrentUser },
  resolveSessionUserId,
);

export const { GET } = handlers;
