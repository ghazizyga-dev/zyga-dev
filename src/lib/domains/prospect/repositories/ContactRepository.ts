import type {
  Contact,
  ContactCreateInput,
  ContactUpdateInput,
} from "../objects";

export interface ContactRepository {
  create(ownerId: string, input: ContactCreateInput): Promise<Contact>;
  findById(contactId: number): Promise<Contact | null>;
  findByIdAndOwner(
    contactId: number,
    ownerId: string,
  ): Promise<Contact | null>;
  findByLinkedinProviderId(
    linkedinProviderId: string,
    ownerId: string,
  ): Promise<Contact | null>;
  findAllByOwner(ownerId: string): Promise<Contact[]>;
  findAllByCompanyAndOwner(companyId: number, ownerId: string): Promise<Contact[]>;
  update(
    contactId: number,
    input: ContactUpdateInput,
  ): Promise<Contact | null>;
  delete(contactId: number): Promise<boolean>;
}
