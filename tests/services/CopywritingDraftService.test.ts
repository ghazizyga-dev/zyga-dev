import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DraftRequest } from "~/lib/domains/messaging/copywriting/objects";

// --- Mock Anthropic SDK ---

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
  },
}));

// --- Mock environment ---

vi.mock("~/env", () => ({
  env: { ANTHROPIC_API_KEY: "test-key" },
}));

// --- Import the repository AFTER mocks are set up ---

const { AnthropicCopywriterRepository } = await import(
  "~/lib/domains/messaging/copywriting/repositories/infrastructure/AnthropicCopywriterRepository"
);

// --- Helpers ---

const baseRequest: DraftRequest = {
  contactInfo: {
    firstName: "Alice",
    lastName: "Smith",
    company: null,
    jobTitle: null,
  },
  userAiContext: {
    companyKnowledge: "We sell enterprise SaaS products for workflow automation.",
    toneOfVoice: "Professional yet friendly, concise and value-focused.",
    exampleMessages: [],
  },
  conversationHistory: [],
};

function makeTextResponse(text: string) {
  return {
    content: [{ type: "text", text }],
    usage: { input_tokens: 10, output_tokens: 20 },
  };
}

let repository: InstanceType<typeof AnthropicCopywriterRepository>;

// --- Lifecycle ---

beforeEach(() => {
  mockCreate.mockReset();
  repository = new AnthropicCopywriterRepository();
});

// --- Tests ---

describe("CopywritingDraftService.generateDraft", () => {
  describe("API call configuration", () => {
    it("calls Anthropic with correct model and max_tokens", async () => {
      mockCreate.mockResolvedValue(makeTextResponse("Hello"));

      await repository.generateDraft(baseRequest);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 1024,
        }),
      );
    });

    it("includes contact name in system prompt", async () => {
      mockCreate.mockResolvedValue(makeTextResponse("Hello"));

      await repository.generateDraft(baseRequest);

      const callArgs = mockCreate.mock.calls[0]![0] as { system: string };
      expect(callArgs.system).toContain("Alice Smith");
    });

    it("includes job title when provided", async () => {
      mockCreate.mockResolvedValue(makeTextResponse("Hello"));

      await repository.generateDraft({
        ...baseRequest,
        contactInfo: { ...baseRequest.contactInfo, jobTitle: "CTO" },
      });

      const callArgs = mockCreate.mock.calls[0]![0] as { system: string };
      expect(callArgs.system).toContain("Job title: CTO");
    });

    it("includes company when provided", async () => {
      mockCreate.mockResolvedValue(makeTextResponse("Hello"));

      await repository.generateDraft({
        ...baseRequest,
        contactInfo: { ...baseRequest.contactInfo, company: "Acme Corp" },
      });

      const callArgs = mockCreate.mock.calls[0]![0] as { system: string };
      expect(callArgs.system).toContain("Company: Acme Corp");
    });

    it("excludes job title when null", async () => {
      mockCreate.mockResolvedValue(makeTextResponse("Hello"));

      await repository.generateDraft(baseRequest);

      const callArgs = mockCreate.mock.calls[0]![0] as { system: string };
      expect(callArgs.system).not.toContain("Job title:");
    });

    it("excludes company when null", async () => {
      mockCreate.mockResolvedValue(makeTextResponse("Hello"));

      await repository.generateDraft(baseRequest);

      const callArgs = mockCreate.mock.calls[0]![0] as { system: string };
      expect(callArgs.system).not.toContain("Company:");
    });

    it("includes company knowledge in system prompt", async () => {
      mockCreate.mockResolvedValue(makeTextResponse("Hello"));

      await repository.generateDraft(baseRequest);

      const callArgs = mockCreate.mock.calls[0]![0] as { system: string };
      expect(callArgs.system).toContain("We sell enterprise SaaS products for workflow automation.");
    });

    it("includes tone of voice in system prompt", async () => {
      mockCreate.mockResolvedValue(makeTextResponse("Hello"));

      await repository.generateDraft(baseRequest);

      const callArgs = mockCreate.mock.calls[0]![0] as { system: string };
      expect(callArgs.system).toContain("Professional yet friendly, concise and value-focused.");
    });

    it("includes example messages when provided", async () => {
      mockCreate.mockResolvedValue(makeTextResponse("Hello"));

      await repository.generateDraft({
        ...baseRequest,
        userAiContext: {
          ...baseRequest.userAiContext,
          exampleMessages: ["Hi there! I noticed you're looking for solutions.", "Hope this helps with your workflow needs."],
        },
      });

      const callArgs = mockCreate.mock.calls[0]![0] as { system: string };
      expect(callArgs.system).toContain("Example Messages");
      expect(callArgs.system).toContain("Hi there! I noticed you're looking for solutions.");
      expect(callArgs.system).toContain("Hope this helps with your workflow needs.");
    });
  });

  describe("message construction (empty history)", () => {
    it("sends initial prospection prompt", async () => {
      mockCreate.mockResolvedValue(makeTextResponse("Hello"));

      await repository.generateDraft(baseRequest);

      const callArgs = mockCreate.mock.calls[0]![0] as {
        messages: Array<{ role: string; content: string }>;
      };
      expect(callArgs.messages).toHaveLength(1);
      expect(callArgs.messages[0]).toEqual({
        role: "user",
        content: "Write the initial prospection message.",
      });
    });
  });

  describe("message construction (with history)", () => {
    const requestWithHistory: DraftRequest = {
      ...baseRequest,
      conversationHistory: [
        { role: "prospect", content: "Hi Alice!" },
        { role: "contact", content: "Hello, tell me more." },
        { role: "prospect", content: "Sure, here are the details." },
      ],
    };

    it("maps prospect role to assistant", async () => {
      mockCreate.mockResolvedValue(makeTextResponse("Follow-up"));

      await repository.generateDraft(requestWithHistory);

      const callArgs = mockCreate.mock.calls[0]![0] as {
        messages: Array<{ role: string; content: string }>;
      };
      const assistantMessages = callArgs.messages.filter(
        (m) => m.role === "assistant",
      );
      expect(assistantMessages).toHaveLength(2);
      expect(assistantMessages[0]!.content).toBe("Hi Alice!");
      expect(assistantMessages[1]!.content).toBe(
        "Sure, here are the details.",
      );
    });

    it("maps contact role to user", async () => {
      mockCreate.mockResolvedValue(makeTextResponse("Follow-up"));

      await repository.generateDraft(requestWithHistory);

      const callArgs = mockCreate.mock.calls[0]![0] as {
        messages: Array<{ role: string; content: string }>;
      };
      const userMessages = callArgs.messages.filter(
        (m) => m.role === "user" && m.content !== expect.stringContaining("follow-up"),
      );
      // The history has one "contact" message → mapped to "user"
      // Plus the final follow-up instruction is also "user"
      const contactMappedMessages = callArgs.messages.filter(
        (m) => m.role === "user" && m.content === "Hello, tell me more.",
      );
      expect(contactMappedMessages).toHaveLength(1);
    });

    it("appends follow-up instruction after history", async () => {
      mockCreate.mockResolvedValue(makeTextResponse("Follow-up"));

      await repository.generateDraft(requestWithHistory);

      const callArgs = mockCreate.mock.calls[0]![0] as {
        messages: Array<{ role: string; content: string }>;
      };
      const lastMessage = callArgs.messages[callArgs.messages.length - 1]!;
      expect(lastMessage.role).toBe("user");
      expect(lastMessage.content).toContain("follow-up");
    });

    it("preserves message order", async () => {
      mockCreate.mockResolvedValue(makeTextResponse("Follow-up"));

      await repository.generateDraft(requestWithHistory);

      const callArgs = mockCreate.mock.calls[0]![0] as {
        messages: Array<{ role: string; content: string }>;
      };
      // 3 history messages + 1 follow-up instruction
      expect(callArgs.messages).toHaveLength(4);
      expect(callArgs.messages[0]).toEqual({
        role: "assistant",
        content: "Hi Alice!",
      });
      expect(callArgs.messages[1]).toEqual({
        role: "user",
        content: "Hello, tell me more.",
      });
      expect(callArgs.messages[2]).toEqual({
        role: "assistant",
        content: "Sure, here are the details.",
      });
      expect(callArgs.messages[3]!.role).toBe("user");
    });
  });

  describe("response handling", () => {
    it("extracts text from first text block", async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: "Generated message" }],
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const draftResult = await repository.generateDraft(baseRequest);

      expect(draftResult.content).toBe("Generated message");
    });

    it("returns empty string when no text blocks", async () => {
      mockCreate.mockResolvedValue({
        content: [],
        usage: { input_tokens: 10, output_tokens: 0 },
      });

      const draftResult = await repository.generateDraft(baseRequest);

      expect(draftResult.content).toBe("");
    });

    it("uses first text block when multiple exist", async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: "text", text: "First block" },
          { type: "text", text: "Second block" },
        ],
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const draftResult = await repository.generateDraft(baseRequest);

      expect(draftResult.content).toBe("First block");
    });

    it("returns empty string when only non-text blocks", async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: "tool_use", id: "123", name: "tool", input: {} }],
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const draftResult = await repository.generateDraft(baseRequest);

      expect(draftResult.content).toBe("");
    });

    it("propagates API errors", async () => {
      mockCreate.mockRejectedValue(new Error("Rate limit exceeded"));

      await expect(repository.generateDraft(baseRequest)).rejects.toThrow(
        "Rate limit exceeded",
      );
    });
  });
});
