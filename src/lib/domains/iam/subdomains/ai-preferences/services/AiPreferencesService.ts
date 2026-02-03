import { DrizzleAiPreferencesRepository } from "../repositories";
import { validateExampleMessages } from "../actions";
import type { AiPreferences, AiPreferencesInput } from "../objects";

const aiPreferencesRepository = new DrizzleAiPreferencesRepository();

export const AiPreferencesService = {
  getByUserId: (userId: string): Promise<AiPreferences | null> =>
    aiPreferencesRepository.findByUserId(userId),

  upsert: async (userId: string, input: AiPreferencesInput): Promise<AiPreferences> => {
    if (input.exampleMessages) {
      validateExampleMessages(input.exampleMessages);
    }
    return aiPreferencesRepository.upsert(userId, input);
  },

  isOnboardingCompleted: async (userId: string): Promise<boolean> => {
    const preferences = await aiPreferencesRepository.findByUserId(userId);
    return preferences?.onboardingCompleted ?? false;
  },

  completeOnboarding: (userId: string): Promise<void> =>
    aiPreferencesRepository.markOnboardingCompleted(userId),

  hasCompanyKnowledge: async (userId: string): Promise<boolean> => {
    const preferences = await aiPreferencesRepository.findByUserId(userId);
    return preferences?.companyKnowledge != null && preferences.companyKnowledge.length > 0;
  },
};
