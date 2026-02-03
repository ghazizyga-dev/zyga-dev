import { IamService as _IamService } from "./services";
import { withLogging } from "~/lib/logging";

export const IamService = withLogging("IamService", _IamService);

// Re-export AI Preferences types and utilities
export type { AiPreferences, AiPreferencesInput } from "./subdomains";
export { DEFAULT_TONE_OF_VOICE, getEffectiveToneOfVoice } from "./subdomains";
