export interface ContactInfo {
  firstName: string;
  lastName: string;
  company: string | null;
  jobTitle: string | null;
}

export interface ConversationMessage {
  role: "prospect" | "contact";
  content: string;
}

export interface UserAiContext {
  companyKnowledge: string;
  toneOfVoice: string;
  exampleMessages: string[];
}

export interface DraftRequest {
  contactInfo: ContactInfo;
  userAiContext: UserAiContext;
  conversationHistory: ConversationMessage[];
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface DraftResult {
  content: string;
  usage: TokenUsage;
}
