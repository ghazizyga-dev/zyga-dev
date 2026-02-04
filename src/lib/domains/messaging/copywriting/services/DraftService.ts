import { AnthropicCopywriterRepository } from "../repositories";
import { analyzeAndDraftMessage, draftMessage } from "../actions";
import type { DraftRequest } from "../objects";

const copywriterRepository = new AnthropicCopywriterRepository();

export const DraftService = {
  generateDraft: (request: DraftRequest) =>
    draftMessage(copywriterRepository, request),

  analyzeAndDraft: (request: DraftRequest) =>
    analyzeAndDraftMessage(copywriterRepository, request),
};
