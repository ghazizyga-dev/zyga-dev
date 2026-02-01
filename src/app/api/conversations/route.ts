import { z } from "zod";

import { IamService } from "~/lib/domains/iam";
import { ContactService } from "~/lib/domains/prospect";
import { ConversationService } from "~/lib/domains/messaging";
import type { ContactInfo } from "~/lib/domains/messaging";
import { withApiLogging } from "~/lib/logging";
import { resolveSessionUserId } from "~/server/better-auth";
import { generateDraftWithBilling } from "./_generateDraftWithBilling";

const createConversationSchema = z.object({
  contactId: z.number().int().positive(),
  sellingContext: z.string().min(1),
});

async function handleListConversations() {
  const currentUser = await IamService.getCurrentUser();
  if (!currentUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await ConversationService.list(currentUser.id);
  return Response.json(conversations);
}

async function handleCreateConversation(request: Request) {
  const currentUser = await IamService.getCurrentUser();
  if (!currentUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: `Invalid JSON: ${message}` },
      { status: 400 },
    );
  }

  const parseResult = createConversationSchema.safeParse(body);
  if (!parseResult.success) {
    return Response.json(
      { error: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  const { contactId, sellingContext } = parseResult.data;

  const contact = await ContactService.getById(contactId, currentUser.id);
  if (!contact) {
    return Response.json({ error: "Contact not found" }, { status: 404 });
  }

  const { hasCredits } = await IamService.checkCredits(currentUser.id);
  if (!hasCredits) {
    return Response.json(
      { error: "Insufficient credits" },
      { status: 402 },
    );
  }

  const createdConversation = await ConversationService.create(
    currentUser.id,
    { contactId, sellingContext },
  );

  const contactInfo: ContactInfo = {
    firstName: contact.firstName,
    lastName: contact.lastName,
    company: contact.company,
    jobTitle: contact.jobTitle,
  };

  const draftResult = await generateDraftWithBilling(
    currentUser.id,
    createdConversation.id,
    { contactInfo, sellingContext, conversationHistory: [] },
  );

  return Response.json(
    { conversation: createdConversation, firstMessage: draftResult },
    { status: 201 },
  );
}

const handlers = withApiLogging(
  "/api/conversations",
  { GET: handleListConversations, POST: handleCreateConversation },
  resolveSessionUserId,
);

export const { GET, POST } = handlers;
