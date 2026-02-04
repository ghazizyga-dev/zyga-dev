import { ConversationService as _ConversationService } from "./services";
import { DraftService as _DraftService } from "./services";
import { withLogging } from "~/lib/logging";

export const ConversationService = withLogging("ConversationService", _ConversationService);
export const DraftService = withLogging("DraftService", _DraftService);

export type {
  AnalysisAndDraftResult,
  ContactInfo,
  ConversationAnalysisResult,
  ConversationMessage,
  ConversationStatus,
  DraftRequest,
  DraftResult,
  StopReason,
  UserAiContext,
} from "./copywriting";

export type { ConversationStopReason } from "./objects";
