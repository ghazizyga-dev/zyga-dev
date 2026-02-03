export interface Conversation {
  id: number;
  contactId: number;
  ownerId: string;
  sellingContext: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface ConversationCreateInput {
  contactId: number;
  sellingContext?: string;
}
