export interface AiPreferences {
  userId: string;
  companyKnowledge: string | null;
  toneOfVoice: string | null;
  exampleMessages: string[]; // Parsed from JSON, max 10
  onboardingCompleted: boolean;
}

export interface AiPreferencesInput {
  companyKnowledge?: string;
  toneOfVoice?: string;
  exampleMessages?: string[];
}
