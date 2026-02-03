import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import {
  initializeTestDb,
  cleanTestDb,
  teardownTestDb,
} from "../helpers/setupTestDb";
import type { DraftRequest } from "~/lib/domains/messaging/copywriting/objects";

// --- Mock ~/server/db before any domain code loads ---

const testDbPromise = initializeTestDb();

vi.mock("~/server/db", async () => {
  const { db } = await testDbPromise;
  const { contact, conversation, message } = await import(
    "~/server/db/schema"
  );
  return { db, contact, conversation, message };
});

// --- Mock copywriting subdomain ---

const mockGenerateDraft = vi.fn();

vi.mock("~/lib/domains/messaging/copywriting", () => ({
  DraftService: {
    generateDraft: mockGenerateDraft,
  },
}));

// --- Import services AFTER mocks are set up ---

const { DraftService } = await import(
  "~/lib/domains/messaging/services/DraftService"
);

const { ConversationService } = await import(
  "~/lib/domains/messaging/services/ConversationService"
);

// --- Helpers ---

const OWNER_A = "user-owner-a";

async function seedTestUsers() {
  const { db } = await testDbPromise;
  const { user } = await import("~/server/db/schema");

  await db.insert(user).values({
    id: OWNER_A,
    name: "Owner A",
    email: "owner-a@test.com",
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function seedTestContact() {
  const { db } = await testDbPromise;
  const { contact } = await import("~/server/db/schema");

  const [seededContact] = await db
    .insert(contact)
    .values({
      firstName: "Alice",
      lastName: "Smith",
      ownerId: OWNER_A,
    })
    .returning();

  return seededContact!;
}

const baseDraftRequest: DraftRequest = {
  contactInfo: {
    firstName: "Alice",
    lastName: "Smith",
    company: null,
    jobTitle: null,
  },
  userAiContext: {
    companyKnowledge: "We sell enterprise SaaS products.",
    toneOfVoice: "Professional and concise.",
    exampleMessages: [],
  },
  conversationHistory: [],
};

let testConversationId: number;

// --- Lifecycle ---

beforeEach(async () => {
  await cleanTestDb();
  await seedTestUsers();
  const seededContact = await seedTestContact();

  const createdConversation = await ConversationService.create(OWNER_A, {
    contactId: seededContact.id,
    sellingContext: "Selling SaaS product",
  });
  testConversationId = createdConversation.id;

  mockGenerateDraft.mockReset();
});

afterAll(async () => {
  await teardownTestDb();
});

// --- Tests ---

describe("DraftService.generateAndPersist", () => {
  it("calls copywriting generateDraft with the request", async () => {
    mockGenerateDraft.mockResolvedValue({ content: "Hello Alice!" });

    await DraftService.generateAndPersist(testConversationId, baseDraftRequest);

    expect(mockGenerateDraft).toHaveBeenCalledWith(baseDraftRequest);
  });

  it("returns the draft result from copywriting service", async () => {
    mockGenerateDraft.mockResolvedValue({ content: "Hello Alice!" });

    const draftResult = await DraftService.generateAndPersist(
      testConversationId,
      baseDraftRequest,
    );

    expect(draftResult).toEqual({ content: "Hello Alice!" });
  });

  it("persists the draft as a prospect message in the conversation", async () => {
    mockGenerateDraft.mockResolvedValue({ content: "Hello Alice!" });

    await DraftService.generateAndPersist(testConversationId, baseDraftRequest);

    const messageList = await ConversationService.getMessages(
      testConversationId,
    );
    expect(messageList).toHaveLength(1);
    expect(messageList[0]).toMatchObject({
      conversationId: testConversationId,
      role: "prospect",
      content: "Hello Alice!",
    });
  });

  it("handles empty string content", async () => {
    mockGenerateDraft.mockResolvedValue({ content: "" });

    const draftResult = await DraftService.generateAndPersist(
      testConversationId,
      baseDraftRequest,
    );

    expect(draftResult).toEqual({ content: "" });

    const messageList = await ConversationService.getMessages(
      testConversationId,
    );
    expect(messageList).toHaveLength(1);
    expect(messageList[0]!.content).toBe("");
  });

  it("propagates errors from copywriting without persisting", async () => {
    mockGenerateDraft.mockRejectedValue(new Error("API failure"));

    await expect(
      DraftService.generateAndPersist(testConversationId, baseDraftRequest),
    ).rejects.toThrow("API failure");

    const messageList = await ConversationService.getMessages(
      testConversationId,
    );
    expect(messageList).toHaveLength(0);
  });

  it("preserves existing messages when adding a new draft", async () => {
    await ConversationService.addContactResponse({
      conversationId: testConversationId,
      role: "prospect",
      content: "Previous outreach",
    });
    await ConversationService.addContactResponse({
      conversationId: testConversationId,
      role: "contact",
      content: "Contact reply",
    });

    mockGenerateDraft.mockResolvedValue({ content: "Follow-up message" });

    await DraftService.generateAndPersist(testConversationId, baseDraftRequest);

    const messageList = await ConversationService.getMessages(
      testConversationId,
    );
    expect(messageList).toHaveLength(3);
  });
});
