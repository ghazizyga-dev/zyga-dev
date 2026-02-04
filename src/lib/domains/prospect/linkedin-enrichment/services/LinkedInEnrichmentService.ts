import { UnipileLinkedInRepository } from "../repositories";
import type { LinkedInEnrichmentResult } from "../objects";

let repository: UnipileLinkedInRepository | null = null;

function getRepository(): UnipileLinkedInRepository {
  repository ??= new UnipileLinkedInRepository();
  return repository;
}

export const LinkedInEnrichmentService = {
  fetchProfile: (linkedinUrl: string): Promise<LinkedInEnrichmentResult> =>
    getRepository().fetchProfile(linkedinUrl),
};
