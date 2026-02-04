import type { CompanyRepository } from "../repositories";
import type { CompanyCreateInput, CompanyUpdateInput } from "../objects";

export async function createCompany(
  repository: CompanyRepository,
  ownerId: string,
  input: CompanyCreateInput,
) {
  return repository.create(ownerId, input);
}

export async function getCompanyById(
  repository: CompanyRepository,
  companyId: number,
  ownerId: string,
) {
  return repository.findByIdAndOwner(companyId, ownerId);
}

export async function getCompanyByLinkedinProviderId(
  repository: CompanyRepository,
  linkedinProviderId: string,
  ownerId: string,
) {
  return repository.findByLinkedinProviderId(linkedinProviderId, ownerId);
}

export async function listCompanies(
  repository: CompanyRepository,
  ownerId: string,
) {
  return repository.findAllByOwner(ownerId);
}

export async function updateCompany(
  repository: CompanyRepository,
  companyId: number,
  ownerId: string,
  input: CompanyUpdateInput,
) {
  const existingCompany = await repository.findByIdAndOwner(
    companyId,
    ownerId,
  );
  if (!existingCompany) return null;

  return repository.update(companyId, input);
}

export async function deleteCompany(
  repository: CompanyRepository,
  companyId: number,
  ownerId: string,
) {
  const existingCompany = await repository.findByIdAndOwner(
    companyId,
    ownerId,
  );
  if (!existingCompany) return false;

  return repository.delete(companyId);
}
