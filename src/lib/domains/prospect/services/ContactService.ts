import { DrizzleContactRepository } from "../repositories";
import {
  createContact,
  getContactById,
  getContactByLinkedinProviderId,
  listContacts,
  updateContact,
  deleteContact,
} from "../actions";
import type { ContactCreateInput, ContactUpdateInput } from "../objects";

const contactRepository = new DrizzleContactRepository();

export const ContactService = {
  create: (ownerId: string, input: ContactCreateInput) =>
    createContact(contactRepository, ownerId, input),

  getById: (contactId: number, ownerId: string) =>
    getContactById(contactRepository, contactId, ownerId),

  getByLinkedinProviderId: (linkedinProviderId: string, ownerId: string) =>
    getContactByLinkedinProviderId(contactRepository, linkedinProviderId, ownerId),

  list: (ownerId: string) => listContacts(contactRepository, ownerId),

  update: (contactId: number, ownerId: string, input: ContactUpdateInput) =>
    updateContact(contactRepository, contactId, ownerId, input),

  delete: (contactId: number, ownerId: string) =>
    deleteContact(contactRepository, contactId, ownerId),
};
