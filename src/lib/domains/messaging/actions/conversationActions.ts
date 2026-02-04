import type { ConversationRepository } from "../repositories";
import type { ConversationCreateInput, ConversationStopReason } from "../objects";

export async function createConversation(
  repository: ConversationRepository,
  ownerId: string,
  input: ConversationCreateInput,
) {
  return repository.create(ownerId, input);
}

export async function getConversation(
  repository: ConversationRepository,
  conversationId: number,
  ownerId: string,
) {
  return repository.findByIdAndOwner(conversationId, ownerId);
}

export async function listConversations(
  repository: ConversationRepository,
  ownerId: string,
) {
  return repository.findAllByOwner(ownerId);
}

export async function touchConversation(
  repository: ConversationRepository,
  conversationId: number,
  ownerId: string,
) {
  return repository.touch(conversationId, ownerId);
}

export async function findConversationByContact(
  repository: ConversationRepository,
  contactId: number,
  ownerId: string,
) {
  return repository.findByContactAndOwner(contactId, ownerId);
}

export async function stopConversation(
  repository: ConversationRepository,
  conversationId: number,
  reason: ConversationStopReason,
) {
  return repository.stop(conversationId, reason);
}
