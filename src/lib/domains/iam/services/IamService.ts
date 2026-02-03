import { BetterAuthUserRepository } from "../repositories";
import { AiPreferencesService, BillingService } from "../subdomains";
import type { AiPreferences, AiPreferencesInput } from "../subdomains";
import type { User } from "../objects";

const userRepository = new BetterAuthUserRepository();

export const IamService = {
  getCurrentUser: (): Promise<User | null> => userRepository.getCurrentUser(),

  checkCredits: (userId: string) =>
    BillingService.checkCredits(userId),

  recordUsage: (userId: string, inputTokens: number, outputTokens: number, model: string) =>
    BillingService.recordUsage(userId, inputTokens, outputTokens, model),

  // AI Preferences
  getAiPreferences: (userId: string): Promise<AiPreferences | null> =>
    AiPreferencesService.getByUserId(userId),

  updateAiPreferences: (userId: string, input: AiPreferencesInput): Promise<AiPreferences> =>
    AiPreferencesService.upsert(userId, input),

  isOnboardingCompleted: (userId: string): Promise<boolean> =>
    AiPreferencesService.isOnboardingCompleted(userId),

  completeOnboarding: (userId: string): Promise<void> =>
    AiPreferencesService.completeOnboarding(userId),

  hasCompanyKnowledge: (userId: string): Promise<boolean> =>
    AiPreferencesService.hasCompanyKnowledge(userId),
};
