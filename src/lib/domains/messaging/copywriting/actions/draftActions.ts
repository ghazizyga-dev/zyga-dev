import type { CopywriterRepository } from "../repositories";
import type { AnalysisAndDraftResult, DraftRequest } from "../objects";

export async function draftMessage(
  repository: CopywriterRepository,
  request: DraftRequest,
) {
  return repository.generateDraft(request);
}

export async function analyzeAndDraftMessage(
  repository: CopywriterRepository,
  request: DraftRequest,
): Promise<AnalysisAndDraftResult> {
  return repository.analyzeAndDraft(request);
}
