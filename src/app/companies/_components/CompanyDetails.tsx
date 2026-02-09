"use client";

import { useState } from "react";

import { CompanyEditForm } from "~/app/companies/_components/CompanyEditForm";

interface Company {
  id: number;
  name: string;
  linkedinUrl: string | null;
  industry: string | null;
  size: string | null;
  website: string | null;
}

interface CompanyDetailsProps {
  company: Company;
  onUpdated: () => void;
}

export function CompanyDetails({ company, onUpdated }: CompanyDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);

  function handleSaved() {
    setIsEditing(false);
    onUpdated();
  }

  if (isEditing) {
    return (
      <div className="rounded-xl bg-white/10 p-4">
        <CompanyEditForm
          company={company}
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
          <h1 className="text-2xl font-bold">{company.name}</h1>
          {company.industry && (
            <p className="text-sm text-white/70">{company.industry}</p>
          )}
          {company.size && (
            <p className="text-sm text-white/70">{company.size}</p>
          )}
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:underline"
            >
              {company.website}
            </a>
          )}
          {company.linkedinUrl && (
            <a
              href={company.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:underline"
            >
              LinkedIn
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg bg-white/10 px-3 py-1 text-sm text-white/70 transition hover:bg-white/20"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
