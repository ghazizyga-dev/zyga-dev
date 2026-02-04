import {
  ContactService as _ContactService,
  CompanyService as _CompanyService,
} from "./services";
import {
  LinkedInEnrichmentService as _LinkedInEnrichmentService,
  LinkedInEnrichmentError,
} from "./linkedin-enrichment";
import { withLogging } from "~/lib/logging";

export const ContactService = withLogging("ContactService", _ContactService);
export const CompanyService = withLogging("CompanyService", _CompanyService);
export const LinkedInEnrichmentService = withLogging(
  "LinkedInEnrichmentService",
  _LinkedInEnrichmentService,
);

export { LinkedInEnrichmentError };

export type {
  LinkedInProfileData,
  LinkedInCompanyData,
  LinkedInEnrichmentResult,
} from "./linkedin-enrichment";
