import { eq, and } from "drizzle-orm";

import { db, company } from "~/server/db";
import type { CompanyRepository } from "../../CompanyRepository";
import type {
  Company,
  CompanyCreateInput,
  CompanyUpdateInput,
} from "../../../objects";

export class DrizzleCompanyRepository implements CompanyRepository {
  async create(
    ownerId: string,
    input: CompanyCreateInput,
  ): Promise<Company> {
    const [insertedCompany] = await db
      .insert(company)
      .values({ ...input, ownerId })
      .returning();

    return insertedCompany!;
  }

  async findById(companyId: number): Promise<Company | null> {
    const foundCompany = await db.query.company.findFirst({
      where: eq(company.id, companyId),
    });

    return foundCompany ?? null;
  }

  async findByIdAndOwner(
    companyId: number,
    ownerId: string,
  ): Promise<Company | null> {
    const foundCompany = await db.query.company.findFirst({
      where: and(eq(company.id, companyId), eq(company.ownerId, ownerId)),
    });

    return foundCompany ?? null;
  }

  async findByLinkedinProviderId(
    linkedinProviderId: string,
    ownerId: string,
  ): Promise<Company | null> {
    const foundCompany = await db.query.company.findFirst({
      where: and(
        eq(company.linkedinProviderId, linkedinProviderId),
        eq(company.ownerId, ownerId),
      ),
    });

    return foundCompany ?? null;
  }

  async findAllByOwner(ownerId: string): Promise<Company[]> {
    const companyList = await db.query.company.findMany({
      where: eq(company.ownerId, ownerId),
    });

    return companyList;
  }

  async update(
    companyId: number,
    input: CompanyUpdateInput,
  ): Promise<Company | null> {
    const [updatedCompany] = await db
      .update(company)
      .set(input)
      .where(eq(company.id, companyId))
      .returning();

    return updatedCompany ?? null;
  }

  async delete(companyId: number): Promise<boolean> {
    const deletedRows = await db
      .delete(company)
      .where(eq(company.id, companyId))
      .returning();

    return deletedRows.length > 0;
  }
}
