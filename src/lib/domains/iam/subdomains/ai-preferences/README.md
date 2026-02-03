# AI Preferences Subdomain

Manages user-specific AI preferences for customizing AI-generated content.

## Mental Model

AI Preferences stores how each user wants the AI to behave when generating messages and content. This includes their company knowledge base, preferred tone of voice, and example messages that demonstrate their communication style.

## Responsibilities

- Store and retrieve user AI preferences
- Validate example messages (max 10)
- Provide default tone of voice when not customized
- Track onboarding completion status

## Child Subsystems

- **objects/** — `AiPreferences`, `AiPreferencesInput` type definitions
- **actions/** — Validation and helper functions for preferences
- **repositories/** — `AiPreferencesRepository` interface + infrastructure implementations
- **services/** — `AiPreferencesService` entry point for API layer

## Known Impurities

None.
