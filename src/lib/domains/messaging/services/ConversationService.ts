import { DrizzleConversationRepository, DrizzleMessageRepository } from "../repositories";
import {
  createConversation,
  getConversation,
  listConversations,
  touchConversation,
  findConversationByContact,
  addMessage,
  getConversationMessages,
} from "../actions";
import type { ConversationCreateInput, MessageCreateInput } from "../objects";

const conversationRepository = new DrizzleConversationRepository();
const messageRepository = new DrizzleMessageRepository();

export const ConversationService = {
  create: (ownerId: string, input: ConversationCreateInput) =>
    createConversation(conversationRepository, ownerId, input),

  getById: (conversationId: number, ownerId: string) =>
    getConversation(conversationRepository, conversationId, ownerId),

  list: (ownerId: string) =>
    listConversations(conversationRepository, ownerId),

  touch: (conversationId: number, ownerId: string) =>
    touchConversation(conversationRepository, conversationId, ownerId),

  findByContact: (contactId: number, ownerId: string) =>
    findConversationByContact(conversationRepository, contactId, ownerId),

  getMessages: (conversationId: number) =>
    getConversationMessages(messageRepository, conversationId),

  addContactResponse: (input: MessageCreateInput) =>
    addMessage(messageRepository, input),
};
