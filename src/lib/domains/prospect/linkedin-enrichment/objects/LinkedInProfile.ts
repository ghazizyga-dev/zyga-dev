export interface LinkedInProfileData {
  providerId: string;
  firstName: string;
  lastName: string;
  headline: string | null;
  linkedinUrl: string;
  currentJobTitle: string | null;
}

export interface LinkedInCompanyData {
  providerId: string | null;
  name: string;
  industry: string | null;
  size: string | null;
  website: string | null;
  linkedinUrl: string | null;
}

export interface LinkedInEnrichmentResult {
  profile: LinkedInProfileData;
  company: LinkedInCompanyData | null;
}

export class LinkedInEnrichmentError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "INVALID_URL"
      | "PROFILE_NOT_FOUND"
      | "PRIVATE_PROFILE"
      | "API_ERROR",
  ) {
    super(message);
    this.name = "LinkedInEnrichmentError";
  }
}
