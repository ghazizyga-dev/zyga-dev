import { eq, and, desc, sql } from "drizzle-orm";
import { db, conversation } from "~/server/db";
import type { ConversationRepository } from "../../ConversationRepository";
import type { Conversation, ConversationCreateInput } from "../../../objects";

export class DrizzleConversationRepository implements ConversationRepository {
  async create(ownerId: string, input: ConversationCreateInput): Promise<Conversation> {
    const [insertedConversation] = await db
      .insert(conversation)
      .values({
        contactId: input.contactId,
        sellingContext: input.sellingContext ?? "",
        ownerId,
      })
      .returning();
    return insertedConversation!;
  }

  async findByIdAndOwner(conversationId: number, ownerId: string): Promise<Conversation | null> {
    const foundConversation = await db.query.conversation.findFirst({
      where: and(eq(conversation.id, conversationId), eq(conversation.ownerId, ownerId)),
    });
    return foundConversation ?? null;
  }

  async findAllByOwner(ownerId: string): Promise<Conversation[]> {
    const conversationList = await db.query.conversation.findMany({
      where: eq(conversation.ownerId, ownerId),
      orderBy: [desc(sql`COALESCE(${conversation.updatedAt}, ${conversation.createdAt})`)],
    });
    return conversationList;
  }

  async touch(conversationId: number, ownerId: string): Promise<void> {
    await db
      .update(conversation)
      .set({ updatedAt: new Date() })
      .where(and(eq(conversation.id, conversationId), eq(conversation.ownerId, ownerId)));
  }

  async findByContactAndOwner(contactId: number, ownerId: string): Promise<Conversation | null> {
    const foundConversation = await db.query.conversation.findFirst({
      where: and(eq(conversation.contactId, contactId), eq(conversation.ownerId, ownerId)),
    });
    return foundConversation ?? null;
  }
}
