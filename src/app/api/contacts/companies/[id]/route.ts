import { z } from "zod";

import { CompanyService } from "~/lib/domains/prospect";
import { IamService } from "~/lib/domains/iam";
import { withApiLogging } from "~/lib/logging";
import { resolveSessionUserId } from "~/server/better-auth";

const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  linkedinUrl: z.string().url().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  website: z.string().url().optional(),
});

const handlers = withApiLogging(
  "/api/contacts/companies/[id]",
  {
    GET: async (
      _request: Request,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const currentUser = await IamService.getCurrentUser();
      if (!currentUser) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { id } = await params;
      const companyId = Number(id);
      if (Number.isNaN(companyId)) {
        return Response.json({ error: "Invalid id" }, { status: 400 });
      }

      const company = await CompanyService.getById(companyId, currentUser.id);
      if (!company) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }

      return Response.json(company);
    },

    PUT: async (
      request: Request,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const currentUser = await IamService.getCurrentUser();
      if (!currentUser) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return Response.json(
          { error: "Invalid or missing JSON body" },
          { status: 400 },
        );
      }
      const parseResult = updateCompanySchema.safeParse(body);
      if (!parseResult.success) {
        return Response.json(
          { error: parseResult.error.flatten() },
          { status: 400 },
        );
      }

      const { id } = await params;
      const companyId = Number(id);
      if (Number.isNaN(companyId)) {
        return Response.json({ error: "Invalid id" }, { status: 400 });
      }

      const updatedCompany = await CompanyService.update(
        companyId,
        currentUser.id,
        parseResult.data,
      );
      if (!updatedCompany) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }

      return Response.json(updatedCompany);
    },

    DELETE: async (
      _request: Request,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const currentUser = await IamService.getCurrentUser();
      if (!currentUser) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { id } = await params;
      const companyId = Number(id);
      if (Number.isNaN(companyId)) {
        return Response.json({ error: "Invalid id" }, { status: 400 });
      }

      const wasDeleted = await CompanyService.delete(companyId, currentUser.id);
      if (!wasDeleted) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }

      return new Response(null, { status: 204 });
    },
  },
  resolveSessionUserId,
);

export const { GET, PUT, DELETE } = handlers;
