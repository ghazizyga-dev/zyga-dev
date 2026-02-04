import { DrizzleCompanyRepository } from "../repositories";
import {
  createCompany,
  getCompanyById,
  getCompanyByLinkedinProviderId,
  listCompanies,
  updateCompany,
  deleteCompany,
} from "../actions";
import type { CompanyCreateInput, CompanyUpdateInput } from "../objects";

const companyRepository = new DrizzleCompanyRepository();

export const CompanyService = {
  create: (ownerId: string, input: CompanyCreateInput) =>
    createCompany(companyRepository, ownerId, input),

  getById: (companyId: number, ownerId: string) =>
    getCompanyById(companyRepository, companyId, ownerId),

  getByLinkedinProviderId: (linkedinProviderId: string, ownerId: string) =>
    getCompanyByLinkedinProviderId(companyRepository, linkedinProviderId, ownerId),

  list: (ownerId: string) => listCompanies(companyRepository, ownerId),

  update: (companyId: number, ownerId: string, input: CompanyUpdateInput) =>
    updateCompany(companyRepository, companyId, ownerId, input),

  delete: (companyId: number, ownerId: string) =>
    deleteCompany(companyRepository, companyId, ownerId),
};
