import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import {
  initializeTestDb,
  cleanTestDb,
  teardownTestDb,
} from "../helpers/setupTestDb";

// --- Mock ~/server/db before any domain code loads ---

const testDbPromise = initializeTestDb();

vi.mock("~/server/db", async () => {
  const { db } = await testDbPromise;
  const { contact, conversation, message } = await import(
    "~/server/db/schema"
  );
  return { db, contact, conversation, message };
});

// --- Import the service AFTER the mock is set up ---

const { ConversationService } = await import(
  "~/lib/domains/messaging/services/ConversationService"
);

// --- Helpers ---

const OWNER_A = "user-owner-a";
const OWNER_B = "user-owner-b";

async function seedTestUsers() {
  const { db } = await testDbPromise;
  const { user } = await import("~/server/db/schema");

  await db.insert(user).values([
    {
      id: OWNER_A,
      name: "Owner A",
      email: "owner-a@test.com",
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: OWNER_B,
      name: "Owner B",
      email: "owner-b@test.com",
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

async function seedTestContacts() {
  const { db } = await testDbPromise;
  const { contact } = await import("~/server/db/schema");

  const [contactA] = await db
    .insert(contact)
    .values({
      firstName: "Alice",
      lastName: "Smith",
      ownerId: OWNER_A,
    })
    .returning();

  const [contactB] = await db
    .insert(contact)
    .values({
      firstName: "Bob",
      lastName: "Jones",
      ownerId: OWNER_B,
    })
    .returning();

  return { contactA: contactA!, contactB: contactB! };
}

let contactA: { id: number };
let contactB: { id: number };

// --- Lifecycle ---

beforeEach(async () => {
  await cleanTestDb();
  await seedTestUsers();
  const contacts = await seedTestContacts();
  contactA = contacts.contactA;
  contactB = contacts.contactB;
});

afterAll(async () => {
  await teardownTestDb();
});

// --- Tests ---

describe("ConversationService.create", () => {
  it("creates conversation with all fields", async () => {
    const created = await ConversationService.create(OWNER_A, {
      contactId: contactA.id,
      sellingContext: "Selling SaaS product",
    });

    expect(created).toMatchObject({
      ownerId: OWNER_A,
      contactId: contactA.id,
      sellingContext: "Selling SaaS product",
    });
    expect(created.id).toBeTypeOf("number");
    expect(created.createdAt).toBeInstanceOf(Date);
  });

  it("assigns unique ids", async () => {
    const firstConversation = await ConversationService.create(OWNER_A, {
      contactId: contactA.id,
      sellingContext: "Context 1",
    });
    const secondConversation = await ConversationService.create(OWNER_A, {
      contactId: contactA.id,
      sellingContext: "Context 2",
    });

    expect(firstConversation.id).not.toBe(secondConversation.id);
  });

  it("allows multiple conversations for same contact", async () => {
    await ConversationService.create(OWNER_A, {
      contactId: contactA.id,
      sellingContext: "Context 1",
    });
    await ConversationService.create(OWNER_A, {
      contactId: contactA.id,
      sellingContext: "Context 2",
    });

    const conversationList = await ConversationService.list(OWNER_A);

    expect(conversationList).toHaveLength(2);
  });
});

describe("ConversationService.getById", () => {
  it("returns conversation when owned by caller", async () => {
    const created = await ConversationService.create(OWNER_A, {
      contactId: contactA.id,
      sellingContext: "Selling SaaS",
    });

    const found = await ConversationService.getById(created.id, OWNER_A);

    expect(found).toMatchObject({
      id: created.id,
      sellingContext: "Selling SaaS",
    });
  });

  it("returns null for another owner's conversation", async () => {
    const created = await ConversationService.create(OWNER_A, {
      contactId: contactA.id,
      sellingContext: "Selling SaaS",
    });

    const found = await ConversationService.getById(created.id, OWNER_B);

    expect(found).toBeNull();
  });

  it("returns null for non-existent id", async () => {
    const found = await ConversationService.getById(99999, OWNER_A);

    expect(found).toBeNull();
  });
});

describe("ConversationService.list", () => {
  it("returns all conversations for owner", async () => {
    await ConversationService.create(OWNER_A, {
      contactId: contactA.id,
      sellingContext: "Context 1",
    });
    await ConversationService.create(OWNER_A, {
      contactId: contactA.id,
      sellingContext: "Context 2",
    });

    const conversationList = await ConversationService.list(OWNER_A);

    expect(conversationList).toHaveLength(2);
  });

  it("returns empty array when none exist", async () => {
    const conversationList = await ConversationService.list(OWNER_A);

    expect(conversationList).toEqual([]);
  });

  it("excludes other owner's conversations", async () => {
    await ConversationService.create(OWNER_A, {
      contactId: contactA.id,
      sellingContext: "Owner A context",
    });
    await ConversationService.create(OWNER_B, {
      contactId: contactB.id,
      sellingContext: "Owner B context",
    });

    const ownerAConversations = await ConversationService.list(OWNER_A);

    expect(ownerAConversations).toHaveLength(1);
    expect(ownerAConversations[0]!.sellingContext).toBe("Owner A context");
  });
});

describe("ConversationService.getMessages", () => {
  it("returns empty array for conversation with no messages", async () => {
    const created = await ConversationService.create(OWNER_A, {
      contactId: contactA.id,
      sellingContext: "Context",
    });

    const messageList = await ConversationService.getMessages(created.id);

    expect(messageList).toEqual([]);
  });

  it("returns messages after adding them", async () => {
    const created = await ConversationService.create(OWNER_A, {
      contactId: contactA.id,
      sellingContext: "Context",
    });

    await ConversationService.addContactResponse({
      conversationId: created.id,
      role: "prospect",
      content: "Hello!",
    });
    await ConversationService.addContactResponse({
      conversationId: created.id,
      role: "contact",
      content: "Hi there!",
    });

    const messageList = await ConversationService.getMessages(created.id);

    expect(messageList).toHaveLength(2);
  });

  it("returns only messages for the specified conversation", async () => {
    const conversationOne = await ConversationService.create(OWNER_A, {
      contactId: contactA.id,
      sellingContext: "Context 1",
    });
    const conversationTwo = await ConversationService.create(OWNER_A, {
      contactId: contactA.id,
      sellingContext: "Context 2",
    });

    await ConversationService.addContactResponse({
      conversationId: conversationOne.id,
      role: "prospect",
      content: "Message for conv 1",
    });
    await ConversationService.addContactResponse({
      conversationId: conversationTwo.id,
      role: "contact",
      content: "Message for conv 2",
    });

    const messagesForConvOne = await ConversationService.getMessages(
      conversationOne.id,
    );

    expect(messagesForConvOne).toHaveLength(1);
    expect(messagesForConvOne[0]!.content).toBe("Message for conv 1");
  });
});

describe("ConversationService.addContactResponse", () => {
  it("creates a message with correct fields", async () => {
    const created = await ConversationService.create(OWNER_A, {
      contactId: contactA.id,
      sellingContext: "Context",
    });

    const addedMessage = await ConversationService.addContactResponse({
      conversationId: created.id,
      role: "contact",
      content: "Thanks for reaching out!",
    });

    expect(addedMessage).toMatchObject({
      conversationId: created.id,
      role: "contact",
      content: "Thanks for reaching out!",
    });
    expect(addedMessage.id).toBeTypeOf("number");
    expect(addedMessage.createdAt).toBeInstanceOf(Date);
  });

  it("supports both prospect and contact roles", async () => {
    const created = await ConversationService.create(OWNER_A, {
      contactId: contactA.id,
      sellingContext: "Context",
    });

    const prospectMessage = await ConversationService.addContactResponse({
      conversationId: created.id,
      role: "prospect",
      content: "Initial outreach",
    });
    const contactMessage = await ConversationService.addContactResponse({
      conversationId: created.id,
      role: "contact",
      content: "Reply from contact",
    });

    expect(prospectMessage.role).toBe("prospect");
    expect(contactMessage.role).toBe("contact");
  });

  it("assigns unique ids to messages", async () => {
    const created = await ConversationService.create(OWNER_A, {
      contactId: contactA.id,
      sellingContext: "Context",
    });

    const firstMessage = await ConversationService.addContactResponse({
      conversationId: created.id,
      role: "prospect",
      content: "First",
    });
    const secondMessage = await ConversationService.addContactResponse({
      conversationId: created.id,
      role: "contact",
      content: "Second",
    });

    expect(firstMessage.id).not.toBe(secondMessage.id);
  });
});
