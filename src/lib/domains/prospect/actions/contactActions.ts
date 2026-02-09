import type { ContactRepository } from "../repositories";
import type { ContactCreateInput, ContactUpdateInput } from "../objects";

export async function createContact(
  repository: ContactRepository,
  ownerId: string,
  input: ContactCreateInput,
) {
  return repository.create(ownerId, input);
}

export async function getContactById(
  repository: ContactRepository,
  contactId: number,
  ownerId: string,
) {
  return repository.findByIdAndOwner(contactId, ownerId);
}

export async function getContactByLinkedinProviderId(
  repository: ContactRepository,
  linkedinProviderId: string,
  ownerId: string,
) {
  return repository.findByLinkedinProviderId(linkedinProviderId, ownerId);
}

export async function listContacts(
  repository: ContactRepository,
  ownerId: string,
) {
  return repository.findAllByOwner(ownerId);
}

export async function listContactsByCompany(
  repository: ContactRepository,
  companyId: number,
  ownerId: string,
) {
  return repository.findAllByCompanyAndOwner(companyId, ownerId);
}

export async function updateContact(
  repository: ContactRepository,
  contactId: number,
  ownerId: string,
  input: ContactUpdateInput,
) {
  const existingContact = await repository.findByIdAndOwner(
    contactId,
    ownerId,
  );
  if (!existingContact) return null;

  return repository.update(contactId, input);
}

export async function deleteContact(
  repository: ContactRepository,
  contactId: number,
  ownerId: string,
) {
  const existingContact = await repository.findByIdAndOwner(
    contactId,
    ownerId,
  );
  if (!existingContact) return false;

  return repository.delete(contactId);
}
