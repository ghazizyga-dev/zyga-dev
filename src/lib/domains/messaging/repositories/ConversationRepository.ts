import type { Conversation, ConversationCreateInput } from "../objects";

export interface ConversationRepository {
  create(ownerId: string, input: ConversationCreateInput): Promise<Conversation>;
  findByIdAndOwner(conversationId: number, ownerId: string): Promise<Conversation | null>;
  findAllByOwner(ownerId: string): Promise<Conversation[]>;
  touch(conversationId: number, ownerId: string): Promise<void>;
  findByContactAndOwner(contactId: number, ownerId: string): Promise<Conversation | null>;
}
