import { z } from "zod";

import { IamService, getEffectiveToneOfVoice, DEFAULT_TONE_OF_VOICE } from "~/lib/domains/iam";
import { ContactService } from "~/lib/domains/prospect";
import { ConversationService } from "~/lib/domains/messaging";
import type { ContactInfo, ConversationMessage, UserAiContext, DraftRequest } from "~/lib/domains/messaging";
import { withApiLogging } from "~/lib/logging";
import { resolveSessionUserId } from "~/server/better-auth";
import { generateDraftWithBilling } from "../../_generateDraftWithBilling";

const createMessageSchema = z.object({
  role: z.enum(["prospect", "contact"]),
  content: z.string().optional(),
});

interface Contact {
  firstName: string;
  lastName: string;
  company: string | null;
  jobTitle: string | null;
}

function buildContactInfo(contact: Contact): ContactInfo {
  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    company: contact.company,
    jobTitle: contact.jobTitle,
  };
}

const VALID_MESSAGE_ROLES = new Set(["prospect", "contact"]);

function isValidMessageRole(role: string): role is "prospect" | "contact" {
  return VALID_MESSAGE_ROLES.has(role);
}

function buildConversationHistory(messages: { role: string; content: string }[]): ConversationMessage[] {
  return messages
    .filter((message) => isValidMessageRole(message.role))
    .map((message) => ({
      role: message.role as "prospect" | "contact",
      content: message.content,
    }));
}

async function buildUserAiContext(userId: string): Promise<UserAiContext> {
  const aiPreferences = await IamService.getAiPreferences(userId);
  return {
    companyKnowledge: aiPreferences?.companyKnowledge ?? "",
    toneOfVoice: aiPreferences ? getEffectiveToneOfVoice(aiPreferences) : DEFAULT_TONE_OF_VOICE,
    exampleMessages: aiPreferences?.exampleMessages ?? [],
  };
}

async function buildDraftRequest(
  contact: Contact,
  conversationId: number,
  userId: string,
): Promise<DraftRequest> {
  const [existingMessages, userAiContext] = await Promise.all([
    ConversationService.getMessages(conversationId),
    buildUserAiContext(userId),
  ]);
  return {
    contactInfo: buildContactInfo(contact),
    conversationHistory: buildConversationHistory(existingMessages),
    userAiContext,
  };
}

async function handleListMessages(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await IamService.getCurrentUser();
  if (!currentUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const conversationId = Number(id);
  if (Number.isNaN(conversationId)) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  const foundConversation = await ConversationService.getById(
    conversationId,
    currentUser.id,
  );
  if (!foundConversation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await ConversationService.getMessages(conversationId);
  return Response.json(messages);
}

async function handleCreateMessage(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await IamService.getCurrentUser();
  if (!currentUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const conversationId = Number(id);
  if (Number.isNaN(conversationId)) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  const foundConversation = await ConversationService.getById(
    conversationId,
    currentUser.id,
  );
  if (!foundConversation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (jsonError) {
    const errorMessage =
      jsonError instanceof Error ? jsonError.message : "Could not parse JSON";
    return Response.json(
      { error: "Invalid JSON", details: errorMessage },
      { status: 400 },
    );
  }
  const parseResult = createMessageSchema.safeParse(body);
  if (!parseResult.success) {
    return Response.json(
      { error: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  const { role, content } = parseResult.data;

  if (role === "contact") {
    if (!content) {
      return Response.json(
        { error: "Content is required for contact messages" },
        { status: 400 },
      );
    }
    const savedMessage = await ConversationService.addContactResponse({
      conversationId,
      role: "contact",
      content,
    });
    await ConversationService.touch(conversationId, currentUser.id);
    return Response.json(savedMessage, { status: 201 });
  }

  const contact = await ContactService.getById(
    foundConversation.contactId,
    currentUser.id,
  );
  if (!contact) {
    return Response.json({ error: "Contact not found" }, { status: 404 });
  }

  const draftRequest = await buildDraftRequest(contact, conversationId, currentUser.id);
  const draftResult = await generateDraftWithBilling(currentUser.id, conversationId, draftRequest);

  if (!draftResult) {
    return Response.json(
      { error: "Insufficient credits" },
      { status: 402 },
    );
  }

  await ConversationService.touch(conversationId, currentUser.id);

  return Response.json({
    content: draftResult.content,
    stopped: draftResult.stopped,
    stoppedReason: draftResult.stoppedReason,
  }, { status: 201 });
}

const handlers = withApiLogging(
  "/api/conversations/[id]/messages",
  { GET: handleListMessages, POST: handleCreateMessage },
  resolveSessionUserId,
);

export const { GET, POST } = handlers;
