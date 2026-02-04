export type ConversationStopReason =
  | "positive_outcome"
  | "unresponsive"
  | "negative_outcome";

export interface Conversation {
  id: number;
  contactId: number;
  ownerId: string;
  sellingContext: string;
  createdAt: Date;
  updatedAt: Date | null;
  stoppedAt: Date | null;
  stoppedReason: ConversationStopReason | null;
}

export interface ConversationCreateInput {
  contactId: number;
  sellingContext?: string;
}
