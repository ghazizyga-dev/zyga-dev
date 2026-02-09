"use client";

import { useState } from "react";
import type { FormEvent } from "react";

interface Company {
  id: number;
  name: string;
  industry: string | null;
  size: string | null;
  website: string | null;
}

interface CompanyEditFormProps {
  company: Company;
  onSaved: () => void;
  onCancel: () => void;
}

export function CompanyEditForm({
  company,
  onSaved,
  onCancel,
}: CompanyEditFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: company.name,
    industry: company.industry ?? "",
    size: company.size ?? "",
    website: company.website ?? "",
  });

  function handleFieldChange(field: keyof typeof formData, value: string) {
    setFormData((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/contacts/companies/${company.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          industry: formData.industry || undefined,
          size: formData.size || undefined,
          website: formData.website || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update company");
      }

      onSaved();
    } catch {
      setErrorMessage("Failed to update company. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {errorMessage && (
        <p className="text-sm text-red-400">{errorMessage}</p>
      )}
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Company name *"
          value={formData.name}
          onChange={(event) => handleFieldChange("name", event.target.value)}
          className="rounded-lg bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
          required
        />
        <input
          type="text"
          placeholder="Industry"
          value={formData.industry}
          onChange={(event) => handleFieldChange("industry", event.target.value)}
          className="rounded-lg bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
        />
        <input
          type="text"
          placeholder="Size"
          value={formData.size}
          onChange={(event) => handleFieldChange("size", event.target.value)}
          className="rounded-lg bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
        />
        <input
          type="url"
          placeholder="Website"
          value={formData.website}
          onChange={(event) => handleFieldChange("website", event.target.value)}
          className="rounded-lg bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-white/20 px-6 py-2 font-semibold transition hover:bg-white/30 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-full bg-white/10 px-6 py-2 font-semibold transition hover:bg-white/20 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
