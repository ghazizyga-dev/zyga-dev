import type { TokenUsage } from "./DraftTypes";

export type ConversationStatus = "continue" | "stop";
export type StopReason = "positive_outcome" | "unresponsive" | "negative_outcome";

export interface ConversationAnalysisResult {
  status: ConversationStatus;
  stopReason: StopReason | null; // null if status is "continue"
  draftContent: string | null; // null if status is "stop"
}

export interface AnalysisAndDraftResult {
  analysis: ConversationAnalysisResult;
  usage: TokenUsage;
}
