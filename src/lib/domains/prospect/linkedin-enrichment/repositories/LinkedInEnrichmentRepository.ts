import type { LinkedInEnrichmentResult } from "../objects";

export interface LinkedInEnrichmentRepository {
  fetchProfile(linkedinUrl: string): Promise<LinkedInEnrichmentResult>;
}
