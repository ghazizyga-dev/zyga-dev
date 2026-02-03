import type { AiPreferences, AiPreferencesInput } from "../objects";

export interface AiPreferencesRepository {
  findByUserId(userId: string): Promise<AiPreferences | null>;
  upsert(userId: string, input: AiPreferencesInput): Promise<AiPreferences>;
  markOnboardingCompleted(userId: string): Promise<void>;
}
