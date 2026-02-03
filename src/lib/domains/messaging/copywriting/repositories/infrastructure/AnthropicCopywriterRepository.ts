import Anthropic from "@anthropic-ai/sdk";
import { env } from "~/env";
import type { CopywriterRepository } from "../CopywriterRepository";
import type { DraftRequest, DraftResult } from "../../objects";

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
}
