import type {
  Company,
  CompanyCreateInput,
  CompanyUpdateInput,
} from "../objects";

export interface CompanyRepository {
  create(ownerId: string, input: CompanyCreateInput): Promise<Company>;
  findById(companyId: number): Promise<Company | null>;
  findByIdAndOwner(
    companyId: number,
    ownerId: string,
  ): Promise<Company | null>;
  findByLinkedinProviderId(
    linkedinProviderId: string,
    ownerId: string,
  ): Promise<Company | null>;
  findAllByOwner(ownerId: string): Promise<Company[]>;
  update(
    companyId: number,
    input: CompanyUpdateInput,
  ): Promise<Company | null>;
  delete(companyId: number): Promise<boolean>;
}
