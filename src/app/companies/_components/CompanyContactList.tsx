"use client";

import Link from "next/link";

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
}

interface CompanyContactListProps {
  contacts: Contact[];
}

export function CompanyContactList({ contacts }: CompanyContactListProps) {
  if (contacts.length === 0) {
    return (
      <div>
        <h2 className="mb-2 text-lg font-semibold">Contacts</h2>
        <p className="text-white/50">No contacts for this company.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Contacts</h2>
      <div className="flex flex-col gap-2">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3"
          >
            <div>
              <p className="font-medium">
                {contact.firstName} {contact.lastName}
              </p>
              {contact.jobTitle && (
                <p className="text-sm text-white/70">{contact.jobTitle}</p>
              )}
            </div>
            <Link
              href={`/messaging?contactId=${contact.id}`}
              className="rounded-lg bg-purple-500/20 px-3 py-1 text-sm text-purple-300 transition hover:bg-purple-500/30"
            >
              Message
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
