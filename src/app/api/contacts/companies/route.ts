import { z } from "zod";

import { CompanyService } from "~/lib/domains/prospect";
import { IamService } from "~/lib/domains/iam";
import { withApiLogging } from "~/lib/logging";
import { resolveSessionUserId } from "~/server/better-auth";

const createCompanySchema = z.object({
  name: z.string().min(1),
  linkedinProviderId: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  website: z.string().url().optional(),
});

const handlers = withApiLogging(
  "/api/companies",
  {
    GET: async () => {
      const currentUser = await IamService.getCurrentUser();
      if (!currentUser) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const companies = await CompanyService.list(currentUser.id);
      return Response.json(companies);
    },

    POST: async (request: Request) => {
      const currentUser = await IamService.getCurrentUser();
      if (!currentUser) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body: unknown = await request.json();
      const parseResult = createCompanySchema.safeParse(body);
      if (!parseResult.success) {
        return Response.json(
          { error: parseResult.error.flatten() },
          { status: 400 },
        );
      }

      const createdCompany = await CompanyService.create(
        currentUser.id,
        parseResult.data,
      );

      return Response.json(createdCompany, { status: 201 });
    },
  },
  resolveSessionUserId,
);

export const { GET, POST } = handlers;
