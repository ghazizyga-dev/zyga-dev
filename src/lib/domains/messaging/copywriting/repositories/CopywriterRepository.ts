import type { AnalysisAndDraftResult, DraftRequest, DraftResult } from "../objects";

export interface CopywriterRepository {
  generateDraft(request: DraftRequest): Promise<DraftResult>;
  analyzeAndDraft(request: DraftRequest): Promise<AnalysisAndDraftResult>;
}
