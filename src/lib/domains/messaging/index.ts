import { ConversationService as _ConversationService } from "./services";
import { DraftService as _DraftService } from "./services";
import { withLogging } from "~/lib/logging";

export const ConversationService = withLogging("ConversationService", _ConversationService);
export const DraftService = withLogging("DraftService", _DraftService);

export type { ContactInfo, ConversationMessage, DraftRequest, DraftResult, UserAiContext } from "./copywriting";
