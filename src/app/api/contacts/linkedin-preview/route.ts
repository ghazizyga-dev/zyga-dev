import { z } from "zod";

import {
  ContactService,
  LinkedInEnrichmentService,
  LinkedInEnrichmentError,
} from "~/lib/domains/prospect";
import { IamService } from "~/lib/domains/iam";
import { withApiLogging } from "~/lib/logging";
import { resolveSessionUserId } from "~/server/better-auth";

const linkedinPreviewSchema = z.object({
  linkedinUrl: z.string().min(1, "LinkedIn URL is required"),
});

const handlers = withApiLogging(
  "/api/contacts/linkedin-preview",
  {
    POST: async (request: Request) => {
      const currentUser = await IamService.getCurrentUser();
      if (!currentUser) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body: unknown = await request.json();
      const parseResult = linkedinPreviewSchema.safeParse(body);
      if (!parseResult.success) {
        return Response.json(
          { error: parseResult.error.flatten() },
          { status: 400 },
        );
      }

      try {
        const enrichmentResult = await LinkedInEnrichmentService.fetchProfile(
          parseResult.data.linkedinUrl,
        );

        const existingContact = await ContactService.getByLinkedinProviderId(
          enrichmentResult.profile.providerId,
          currentUser.id,
        );

        return Response.json({
          ...enrichmentResult,
          existingContact: existingContact
            ? {
                id: existingContact.id,
                firstName: existingContact.firstName,
                lastName: existingContact.lastName,
              }
            : null,
        });
      } catch (error) {
        if (error instanceof LinkedInEnrichmentError) {
          const statusCode = error.code === "INVALID_URL" ? 400 : 422;
          return Response.json(
            { error: error.message, code: error.code },
            { status: statusCode },
          );
        }

        return Response.json(
          { error: "An unexpected error occurred" },
          { status: 500 },
        );
      }
    },
  },
  resolveSessionUserId,
);

export const { POST } = handlers;
