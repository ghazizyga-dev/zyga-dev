"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import posthog from "posthog-js";

import { ContactFormFields } from "~/app/contacts/_components/ContactFormFields";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  jobTitle: "",
  phone: "",
  notes: "",
};

interface CreateContactFormProps {
  onContactCreated: () => void;
  onCancel?: () => void;
}

export function CreateContactForm({
  onContactCreated,
  onCancel,
}: CreateContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  function handleFieldChange(field: keyof typeof EMPTY_FORM, value: string) {
    setFormData((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email || undefined,
          company: formData.company || undefined,
          jobTitle: formData.jobTitle || undefined,
          phone: formData.phone || undefined,
          notes: formData.notes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create contact");
      }

      posthog.capture("contact_created", {
        has_email: Boolean(formData.email),
        has_company: Boolean(formData.company),
        has_job_title: Boolean(formData.jobTitle),
        has_phone: Boolean(formData.phone),
        has_notes: Boolean(formData.notes),
      });

      setFormData(EMPTY_FORM);
      setErrorMessage(null);
      onContactCreated();
    } catch (error) {
      posthog.captureException(error);
      setErrorMessage("Failed to create contact. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    setFormData(EMPTY_FORM);
    setErrorMessage(null);
    onCancel?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-xl bg-white/10 p-6"
    >
      <h2 className="mb-4 text-xl font-bold">New Contact</h2>
      {errorMessage && (
        <p className="mb-4 text-sm text-red-400">{errorMessage}</p>
      )}
      <ContactFormFields formData={formData} onChange={handleFieldChange} />
      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-white/20 px-6 py-2 font-semibold transition hover:bg-white/30 disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-full bg-white/10 px-6 py-2 font-semibold transition hover:bg-white/20"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
