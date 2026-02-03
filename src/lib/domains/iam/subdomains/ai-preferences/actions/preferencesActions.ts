import type { AiPreferences } from "../objects";

export const DEFAULT_TONE_OF_VOICE =
  "Professional yet approachable. Clear and concise. Focus on demonstrating value to the prospect without being pushy. Use natural language, avoid jargon.";

const MAX_EXAMPLE_MESSAGES = 10;

export class TooManyExampleMessagesError extends Error {
  constructor() {
    super(`Cannot have more than ${MAX_EXAMPLE_MESSAGES} example messages`);
    this.name = "TooManyExampleMessagesError";
  }
}

export function validateExampleMessages(messages: string[]): void {
  if (messages.length > MAX_EXAMPLE_MESSAGES) {
    throw new TooManyExampleMessagesError();
  }
}

export function getEffectiveToneOfVoice(preferences: AiPreferences): string {
  return preferences.toneOfVoice ?? DEFAULT_TONE_OF_VOICE;
}
