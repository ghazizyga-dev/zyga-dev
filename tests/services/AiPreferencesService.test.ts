import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import {
  initializeTestDb,
  cleanTestDb,
  teardownTestDb,
} from "../helpers/setupTestDb";

// ============================================================
// Pure unit tests (no DB needed)
// ============================================================

const {
  validateExampleMessages,
  getEffectiveToneOfVoice,
  DEFAULT_TONE_OF_VOICE,
  TooManyExampleMessagesError,
} = await import(
  "~/lib/domains/iam/subdomains/ai-preferences/actions/preferencesActions"
);

describe("preferencesActions.validateExampleMessages", () => {
  it("allows empty array", () => {
    expect(() => validateExampleMessages([])).not.toThrow();
  });

  it("allows exactly 10 messages", () => {
    const tenMessages = Array.from({ length: 10 }, (_, index) => `msg-${index}`);
    expect(() => validateExampleMessages(tenMessages)).not.toThrow();
  });

  it("throws TooManyExampleMessagesError at 11 messages", () => {
    const elevenMessages = Array.from(
      { length: 11 },
      (_, index) => `msg-${index}`,
    );
    expect(() => validateExampleMessages(elevenMessages)).toThrow(
      TooManyExampleMessagesError,
    );
  });
});

describe("preferencesActions.getEffectiveToneOfVoice", () => {
  it("returns custom tone when set", () => {
    const preferences = {
      userId: "u1",
      companyKnowledge: null,
      toneOfVoice: "Casual and friendly",
      exampleMessages: [],
      signature: null,
      onboardingCompleted: false,
    };

    expect(getEffectiveToneOfVoice(preferences)).toBe("Casual and friendly");
  });

  it("returns DEFAULT_TONE_OF_VOICE when null", () => {
    const preferences = {
      userId: "u1",
      companyKnowledge: null,
      toneOfVoice: null,
      exampleMessages: [],
      signature: null,
      onboardingCompleted: false,
    };

    expect(getEffectiveToneOfVoice(preferences)).toBe(DEFAULT_TONE_OF_VOICE);
  });
});

// ============================================================
// Integration tests (PGlite)
// ============================================================

const testDbPromise = initializeTestDb();

vi.mock("~/server/db", async () => {
  const { db } = await testDbPromise;
  const { aiPreferences } = await import("~/server/db/schema");
  return { db, aiPreferences };
});

const { AiPreferencesService } = await import(
  "~/lib/domains/iam/subdomains/ai-preferences/services/AiPreferencesService"
);

// --- Helpers ---

const USER_A = "user-a";

async function seedTestUsers() {
  const { db } = await testDbPromise;
  const { user } = await import("~/server/db/schema");

  await db.insert(user).values([
    {
      id: USER_A,
      name: "User A",
      email: "user-a@test.com",
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

// --- Lifecycle ---

beforeEach(async () => {
  await cleanTestDb();
  await seedTestUsers();
});

afterAll(async () => {
  await teardownTestDb();
});

// --- Tests ---

describe("AiPreferencesService.getByUserId", () => {
  it("returns null for non-existent user", async () => {
    const result = await AiPreferencesService.getByUserId(USER_A);

    expect(result).toBeNull();
  });

  it("returns preferences after upsert", async () => {
    await AiPreferencesService.upsert(USER_A, {
      companyKnowledge: "We sell widgets",
    });

    const result = await AiPreferencesService.getByUserId(USER_A);

    expect(result).not.toBeNull();
    expect(result!.companyKnowledge).toBe("We sell widgets");
  });
});

describe("AiPreferencesService.upsert", () => {
  it("creates new preferences", async () => {
    const created = await AiPreferencesService.upsert(USER_A, {
      companyKnowledge: "We sell widgets",
      toneOfVoice: "Formal",
    });

    expect(created.userId).toBe(USER_A);
    expect(created.companyKnowledge).toBe("We sell widgets");
    expect(created.toneOfVoice).toBe("Formal");
  });

  it("updates existing fields", async () => {
    await AiPreferencesService.upsert(USER_A, {
      companyKnowledge: "We sell widgets",
    });

    const updated = await AiPreferencesService.upsert(USER_A, {
      companyKnowledge: "We sell premium widgets",
    });

    expect(updated.companyKnowledge).toBe("We sell premium widgets");
  });

  it("preserves untouched fields on partial update", async () => {
    await AiPreferencesService.upsert(USER_A, {
      companyKnowledge: "We sell widgets",
      toneOfVoice: "Formal",
    });

    const updated = await AiPreferencesService.upsert(USER_A, {
      toneOfVoice: "Casual",
    });

    expect(updated.toneOfVoice).toBe("Casual");
    expect(updated.companyKnowledge).toBe("We sell widgets");
  });

  it("stores and retrieves example messages (JSON round-trip)", async () => {
    const messages = ["Hello!", "How can I help?", "Let me know."];

    const created = await AiPreferencesService.upsert(USER_A, {
      exampleMessages: messages,
    });

    expect(created.exampleMessages).toEqual(messages);

    const fetched = await AiPreferencesService.getByUserId(USER_A);
    expect(fetched!.exampleMessages).toEqual(messages);
  });

  it("rejects more than 10 example messages", async () => {
    const tooManyMessages = Array.from(
      { length: 11 },
      (_, index) => `msg-${index}`,
    );

    await expect(
      AiPreferencesService.upsert(USER_A, {
        exampleMessages: tooManyMessages,
      }),
    ).rejects.toThrow(TooManyExampleMessagesError);
  });
});

describe("AiPreferencesService.isOnboardingCompleted", () => {
  it("returns false by default (no record)", async () => {
    const result = await AiPreferencesService.isOnboardingCompleted(USER_A);

    expect(result).toBe(false);
  });

  it("returns true after completeOnboarding", async () => {
    await AiPreferencesService.completeOnboarding(USER_A);

    const result = await AiPreferencesService.isOnboardingCompleted(USER_A);

    expect(result).toBe(true);
  });
});

describe("AiPreferencesService.completeOnboarding", () => {
  it("marks onboarding completed", async () => {
    await AiPreferencesService.completeOnboarding(USER_A);

    const preferences = await AiPreferencesService.getByUserId(USER_A);
    expect(preferences!.onboardingCompleted).toBe(true);
  });

  it("is idempotent (can call twice)", async () => {
    await AiPreferencesService.completeOnboarding(USER_A);
    await AiPreferencesService.completeOnboarding(USER_A);

    const result = await AiPreferencesService.isOnboardingCompleted(USER_A);
    expect(result).toBe(true);
  });
});

describe("AiPreferencesService.hasCompanyKnowledge", () => {
  it("returns false when no record exists", async () => {
    const result = await AiPreferencesService.hasCompanyKnowledge(USER_A);

    expect(result).toBe(false);
  });

  it("returns false when company knowledge is empty string", async () => {
    await AiPreferencesService.upsert(USER_A, {
      companyKnowledge: "",
    });

    const result = await AiPreferencesService.hasCompanyKnowledge(USER_A);

    expect(result).toBe(false);
  });

  it("returns true when company knowledge is set", async () => {
    await AiPreferencesService.upsert(USER_A, {
      companyKnowledge: "We sell widgets",
    });

    const result = await AiPreferencesService.hasCompanyKnowledge(USER_A);

    expect(result).toBe(true);
  });
});
