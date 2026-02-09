"use client";

import Link from "next/link";
import { useState } from "react";
import posthog from "posthog-js";

import { ContactEditForm } from "~/app/contacts/_components/ContactEditForm";

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

interface ContactCardProps {
  contact: Contact;
  onDeleted: () => void;
  onUpdated: () => void;
}

export function ContactCard({ contact, onDeleted, onUpdated }: ContactCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  async function handleDelete() {
    posthog.capture("contact_delete_clicked", {
      contact_id: contact.id,
    });
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete contact");
      }
      onDeleted();
    } catch (error) {
      posthog.captureException(error);
      setIsDeleting(false);
      alert("Failed to delete contact. Please try again.");
    }
  }

  function handleSaved() {
    setIsEditing(false);
    onUpdated();
  }

  const fullName = `${contact.firstName} ${contact.lastName}`;

  if (isEditing) {
    return (
      <div className="rounded-xl bg-white/10 p-4">
        <ContactEditForm
          contact={contact}
          onSaved={handleSaved}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white/10 p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-bold">{fullName}</h3>
          {contact.jobTitle && <p className="text-sm text-white/70">{contact.jobTitle}</p>}
          {contact.company && (
            <p className="text-sm text-white/70">
              {contact.companyId ? (
                <Link href={`/companies/${contact.companyId}`} className="hover:text-white hover:underline">
                  {contact.company}
                </Link>
              ) : (
                contact.company
              )}
            </p>
          )}
          {contact.email && <p className="text-sm text-white/70">{contact.email}</p>}
          {contact.phone && <p className="text-sm text-white/70">{contact.phone}</p>}
          {contact.notes && <p className="mt-2 text-sm text-white/50 italic">{contact.notes}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {(() => {
            if (!contact.linkedinUrl) return null;
            try {
              const linkedinUrlParsed = new URL(contact.linkedinUrl);
              if (linkedinUrlParsed.protocol !== "https:" && linkedinUrlParsed.protocol !== "http:") return null;
              return (
                <a
                  href={linkedinUrlParsed.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-2 py-1 text-blue-400 transition hover:bg-blue-500/20"
                  title="Open LinkedIn profile"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              );
            } catch {
              return null;
            }
          })()}
          <Link
            href={`/messaging?contactId=${contact.id}`}
            className="rounded-lg bg-purple-500/20 px-3 py-1 text-sm text-purple-300 transition hover:bg-purple-500/30"
          >
            Message
          </Link>
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg bg-white/10 px-3 py-1 text-sm text-white/70 transition hover:bg-white/20"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg bg-red-500/20 px-3 py-1 text-sm text-red-300 transition hover:bg-red-500/30 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
