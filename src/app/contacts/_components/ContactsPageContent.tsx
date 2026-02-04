"use client";

import { useState } from "react";

import { ContactList } from "~/app/contacts/_components/ContactList";
import { CreateContactForm } from "~/app/contacts/_components/CreateContactForm";
import { ImportFromLinkedIn } from "~/app/contacts/_components/ImportFromLinkedIn";

type CreateMode = "closed" | "manual" | "linkedin";

export function ContactsPageContent() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [createMode, setCreateMode] = useState<CreateMode>("closed");

  function handleContactCreated() {
    setRefreshKey((previousKey) => previousKey + 1);
    setCreateMode("closed");
  }

  if (createMode === "closed") {
    return (
      <>
        <div className="flex gap-3">
          <button
            onClick={() => setCreateMode("manual")}
            className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
          >
            New Contact
          </button>
          <button
            onClick={() => setCreateMode("linkedin")}
            className="rounded-full bg-blue-600/80 px-10 py-3 font-semibold no-underline transition hover:bg-blue-600"
          >
            Import from LinkedIn
          </button>
        </div>
        <ContactList refreshKey={refreshKey} />
      </>
    );
  }

  if (createMode === "linkedin") {
    return (
      <>
        <ImportFromLinkedIn
          onContactCreated={handleContactCreated}
          onCancel={() => setCreateMode("closed")}
        />
        <ContactList refreshKey={refreshKey} />
      </>
    );
  }

  return (
    <>
      <CreateContactForm
        onContactCreated={handleContactCreated}
        onCancel={() => setCreateMode("closed")}
      />
      <ContactList refreshKey={refreshKey} />
    </>
  );
}
