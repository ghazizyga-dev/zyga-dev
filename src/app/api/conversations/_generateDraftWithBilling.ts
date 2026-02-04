import { IamService } from "~/lib/domains/iam";
import { ConversationService, DraftService } from "~/lib/domains/messaging";
import type { DraftRequest, StopReason } from "~/lib/domains/messaging";

export interface GenerateDraftResult {
  content: string | null;
  stopped: boolean;
  stoppedReason: StopReason | null;
}

export async function generateDraftWithBilling(
  userId: string,
  conversationId: number,
  request: DraftRequest,
): Promise<GenerateDraftResult | null> {
  const { hasCredits } = await IamService.checkCredits(userId);
  if (!hasCredits) return null;

  const analysisResult = await DraftService.generateDraftWithAnalysis(conversationId, request);

  try {
    const { usage } = analysisResult;
    await IamService.recordUsage(userId, usage.inputTokens, usage.outputTokens, usage.model);
  } catch (error) {
    console.error("Failed to record credit usage:", error);
  }

  const { analysis } = analysisResult;
  const shouldStop = analysis.status === "stop";

  if (shouldStop && analysis.stopReason) {
    await ConversationService.stop(conversationId, analysis.stopReason);
  }

  return {
    content: analysis.draftContent,
    stopped: shouldStop,
    stoppedReason: analysis.stopReason,
  };
}
