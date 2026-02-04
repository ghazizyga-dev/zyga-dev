import Anthropic from "@anthropic-ai/sdk";
import { env } from "~/env";
import type { CopywriterRepository } from "../CopywriterRepository";
import type { AnalysisAndDraftResult, DraftRequest, DraftResult } from "../../objects";

function buildSystemPrompt(request: DraftRequest): string {
  const { contactInfo, userAiContext } = request;
  const contactName = `${contactInfo.firstName} ${contactInfo.lastName}`;
  const contactDetails = [
    contactInfo.jobTitle && `Job title: ${contactInfo.jobTitle}`,
    contactInfo.company && `Company: ${contactInfo.company}`,
  ].filter(Boolean).join("\n");

  const sections = [
    "You are a professional sales copywriter. Write concise, natural prospection messages.",
    "",
    "## Contact Information",
    `Name: ${contactName}`,
    contactDetails,
  ];

  if (userAiContext.companyKnowledge) {
    sections.push("", "## About the User's Company and Product", userAiContext.companyKnowledge);
  }

  if (userAiContext.toneOfVoice) {
    sections.push("", "## Writing Style", `Follow this tone: ${userAiContext.toneOfVoice}`);
  }

  if (userAiContext.exampleMessages.length > 0) {
    sections.push("", "## Example Messages (Use these as style reference)");
    userAiContext.exampleMessages.forEach((message, index) => {
      sections.push(`Example ${index + 1}: ${message}`);
    });
  }

  sections.push("", "Write a short, personalized message. Be direct and professional, not pushy.");

  return sections.join("\n");
}

function buildMessages(request: DraftRequest): Anthropic.MessageParam[] {
  const { conversationHistory } = request;
  if (conversationHistory.length === 0) {
    return [{ role: "user", content: "Write the initial prospection message." }];
  }

  const messages: Anthropic.MessageParam[] = conversationHistory.map((message) => ({
    role: message.role === "prospect" ? "assistant" as const : "user" as const,
    content: message.content,
  }));
  messages.push({ role: "user", content: "Write a follow-up reply to continue the conversation." });
  return messages;
}

function buildAnalysisSystemPrompt(request: DraftRequest): string {
  const { contactInfo, userAiContext } = request;
  const contactName = `${contactInfo.firstName} ${contactInfo.lastName}`;
  const contactDetails = [
    contactInfo.jobTitle && `Job title: ${contactInfo.jobTitle}`,
    contactInfo.company && `Company: ${contactInfo.company}`,
  ].filter(Boolean).join("\n");

  const sections = [
    "You are a professional sales copywriter analyzing a prospection conversation.",
    "",
    "## Your Task",
    "1. Analyze the conversation to determine if you should continue or stop outreach",
    "2. ALWAYS write a message, even when stopping - never leave the prospect without a reply",
    "",
    "## Stop Criteria",
    "- **positive_outcome**: Prospect shows clear interest, wants to meet, or is ready to buy. Write a final message thanking them and suggesting next steps (e.g., 'I'll have our team reach out to schedule a call').",
    "- **unresponsive**: The last 3+ consecutive messages are from you (the salesperson) with no reply from the contact. Write a polite final follow-up acknowledging you'll stop reaching out.",
    "- **negative_outcome**: Prospect explicitly says no, not interested, or asks to stop being contacted. Write a gracious closing message respecting their decision.",
    "",
    "## Continue Criteria",
    "- None of the stop criteria apply - keep conversing naturally",
    "- For 'maybe later' responses: Use your judgment. Acknowledge their response, but consider if this leans positive or negative.",
    "",
    "## Important",
    "- ALWAYS provide a draftMessage, whether continuing or stopping",
    "- When stopping, the message should provide appropriate closure for that reason",
    "",
    "## Contact Information",
    `Name: ${contactName}`,
    contactDetails,
  ];

  if (userAiContext.companyKnowledge) {
    sections.push("", "## About the User's Company and Product", userAiContext.companyKnowledge);
  }

  if (userAiContext.toneOfVoice) {
    sections.push("", "## Writing Style", `Follow this tone: ${userAiContext.toneOfVoice}`);
  }

  if (userAiContext.exampleMessages.length > 0) {
    sections.push("", "## Example Messages (Use these as style reference)");
    userAiContext.exampleMessages.forEach((message, index) => {
      sections.push(`Example ${index + 1}: ${message}`);
    });
  }

  sections.push("", "Use the analyze_conversation tool to provide your analysis and draft (if continuing).");

  return sections.join("\n");
}

function buildAnalysisMessages(request: DraftRequest): Anthropic.MessageParam[] {
  const { conversationHistory } = request;
  if (conversationHistory.length === 0) {
    return [{ role: "user", content: "This is a new conversation. Analyze and write the initial prospection message." }];
  }

  const formattedHistory = conversationHistory.map((message) => {
    const sender = message.role === "prospect" ? "Salesperson (you)" : "Contact";
    return `${sender}: ${message.content}`;
  }).join("\n\n");

  return [{
    role: "user",
    content: `Analyze this conversation and determine next steps:\n\n${formattedHistory}`,
  }];
}

const ANALYZE_CONVERSATION_TOOL: Anthropic.Tool = {
  name: "analyze_conversation",
  description: "Analyze the conversation status and optionally provide a draft message",
  input_schema: {
    type: "object" as const,
    properties: {
      conversationStatus: {
        type: "string",
        enum: ["continue", "stop"],
        description: "Whether to continue the conversation or stop outreach",
      },
      stopReason: {
        type: "string",
        enum: ["positive_outcome", "unresponsive", "negative_outcome"],
        description: "Reason for stopping (required if conversationStatus is 'stop', null otherwise)",
        nullable: true,
      },
      draftMessage: {
        type: "string",
        description: "The message to send. Always required - provide a closing message when stopping.",
      },
    },
    required: ["conversationStatus", "draftMessage"],
  },
};

export class AnthropicCopywriterRepository implements CopywriterRepository {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }

  async generateDraft(request: DraftRequest): Promise<DraftResult> {
    const modelId = "claude-sonnet-4-5-20250929";
    const response = await this.client.messages.create({
      model: modelId,
      max_tokens: 1024,
      system: buildSystemPrompt(request),
      messages: buildMessages(request),
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return {
      content: textBlock?.text ?? "",
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        model: modelId,
      },
    };
  }

  async analyzeAndDraft(request: DraftRequest): Promise<AnalysisAndDraftResult> {
    const modelId = "claude-sonnet-4-5-20250929";
    const response = await this.client.messages.create({
      model: modelId,
      max_tokens: 1024,
      system: buildAnalysisSystemPrompt(request),
      messages: buildAnalysisMessages(request),
      tools: [ANALYZE_CONVERSATION_TOOL],
      tool_choice: { type: "tool", name: "analyze_conversation" },
    });

    const toolUseBlock = response.content.find((block) => block.type === "tool_use");
    if (toolUseBlock?.type !== "tool_use") {
      throw new Error("Expected tool_use response from LLM");
    }

    const toolInput = toolUseBlock.input as {
      conversationStatus: "continue" | "stop";
      stopReason?: "positive_outcome" | "unresponsive" | "negative_outcome" | null;
      draftMessage: string;
    };

    return {
      analysis: {
        status: toolInput.conversationStatus,
        stopReason: toolInput.conversationStatus === "stop" ? (toolInput.stopReason ?? null) : null,
        draftContent: toolInput.draftMessage,
      },
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        model: modelId,
      },
    };
  }
}
