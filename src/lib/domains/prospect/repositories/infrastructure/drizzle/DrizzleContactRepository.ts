import { eq, and } from "drizzle-orm";

import { db, contact } from "~/server/db";
import type { ContactRepository } from "../../ContactRepository";
import type {
  Contact,
  ContactCreateInput,
  ContactUpdateInput,
} from "../../../objects";

export class DrizzleContactRepository implements ContactRepository {
  async create(
    ownerId: string,
    input: ContactCreateInput,
  ): Promise<Contact> {
    const [insertedContact] = await db
      .insert(contact)
      .values({ ...input, ownerId })
      .returning();

    return insertedContact!;
  }

  async findById(contactId: number): Promise<Contact | null> {
    const foundContact = await db.query.contact.findFirst({
      where: eq(contact.id, contactId),
    });

    return foundContact ?? null;
  }

  async findByIdAndOwner(
    contactId: number,
    ownerId: string,
  ): Promise<Contact | null> {
    const foundContact = await db.query.contact.findFirst({
      where: and(eq(contact.id, contactId), eq(contact.ownerId, ownerId)),
    });

    return foundContact ?? null;
  }

  async findByLinkedinProviderId(
    linkedinProviderId: string,
    ownerId: string,
  ): Promise<Contact | null> {
    const foundContact = await db.query.contact.findFirst({
      where: and(
        eq(contact.linkedinProviderId, linkedinProviderId),
        eq(contact.ownerId, ownerId),
      ),
    });

    return foundContact ?? null;
  }

  async findAllByOwner(ownerId: string): Promise<Contact[]> {
    const contactList = await db.query.contact.findMany({
      where: eq(contact.ownerId, ownerId),
    });

    return contactList;
  }

  async findAllByCompanyAndOwner(companyId: number, ownerId: string): Promise<Contact[]> {
    const contactList = await db.query.contact.findMany({
      where: and(eq(contact.companyId, companyId), eq(contact.ownerId, ownerId)),
    });

    return contactList;
  }

  async update(
    contactId: number,
    input: ContactUpdateInput,
  ): Promise<Contact | null> {
    const [updatedContact] = await db
      .update(contact)
      .set(input)
      .where(eq(contact.id, contactId))
      .returning();

    return updatedContact ?? null;
  }

  async delete(contactId: number): Promise<boolean> {
    const deletedRows = await db
      .delete(contact)
      .where(eq(contact.id, contactId))
      .returning();

    return deletedRows.length > 0;
  }
}
