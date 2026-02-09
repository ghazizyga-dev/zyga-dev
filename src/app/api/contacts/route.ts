import { z } from "zod";

import { ContactService } from "~/lib/domains/prospect";
import { IamService } from "~/lib/domains/iam";
import { withApiLogging } from "~/lib/logging";
import { resolveSessionUserId } from "~/server/better-auth";

const createContactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  linkedinProviderId: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  companyId: z.number().optional(),
});

const handlers = withApiLogging(
  "/api/contacts",
  {
    GET: async (request: Request) => {
      const currentUser = await IamService.getCurrentUser();
      if (!currentUser) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const companyIdParam = searchParams.get("companyId");

      if (companyIdParam) {
        const companyId = Number(companyIdParam);
        if (Number.isNaN(companyId)) {
          return Response.json({ error: "Invalid companyId" }, { status: 400 });
        }
        const contacts = await ContactService.listByCompany(companyId, currentUser.id);
        return Response.json(contacts);
      }

      const contacts = await ContactService.list(currentUser.id);
      return Response.json(contacts);
    },

    POST: async (request: Request) => {
      const currentUser = await IamService.getCurrentUser();
      if (!currentUser) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body: unknown = await request.json();
      const parseResult = createContactSchema.safeParse(body);
      if (!parseResult.success) {
        return Response.json(
          { error: parseResult.error.flatten() },
          { status: 400 },
        );
      }

      const createdContact = await ContactService.create(
        currentUser.id,
        parseResult.data,
      );

      return Response.json(createdContact, { status: 201 });
    },
  },
  resolveSessionUserId,
);

export const { GET, POST } = handlers;
