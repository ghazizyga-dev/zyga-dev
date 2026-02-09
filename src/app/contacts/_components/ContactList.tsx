"use client";

import { useEffect, useState } from "react";

import { ContactCard } from "~/app/contacts/_components/ContactCard";

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  company: string | null;
  companyId: number | null;
  jobTitle: string | null;
  phone: string | null;
  notes: string | null;
  linkedinUrl: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string | null;
}

interface ContactListProps {
  refreshKey: number;
}

export function ContactList({ refreshKey }: ContactListProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchContacts() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/contacts");
        if (!response.ok) {
          throw new Error("Failed to fetch contacts");
        }
        const contactsData = (await response.json()) as Contact[];
        setContacts(contactsData);
      } catch {
        setContacts([]);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchContacts();
  }, [refreshKey]);

  async function refreshContactList() {
    try {
      const response = await fetch("/api/contacts");
      if (response.ok) {
        const contactsData = (await response.json()) as Contact[];
        setContacts(contactsData);
      }
    } catch {
      // Silently fail on re-fetch
    }
  }

  if (isLoading) {
    return <p className="text-white/50">Loading contacts...</p>;
  }

  if (contacts.length === 0) {
    return <p className="text-white/50">No contacts yet.</p>;
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      {contacts.map((contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          onDeleted={refreshContactList}
          onUpdated={refreshContactList}
        />
      ))}
    </div>
  );
}
