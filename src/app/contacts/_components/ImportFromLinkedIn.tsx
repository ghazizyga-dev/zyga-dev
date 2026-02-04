"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import posthog from "posthog-js";

const INPUT_CLASS_NAME =
  "w-full rounded-lg bg-white/10 px-3 py-2 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-white/30";

interface LinkedInProfileData {
  providerId: string;
  firstName: string;
  lastName: string;
  headline: string | null;
  linkedinUrl: string;
  currentJobTitle: string | null;
}

interface LinkedInCompanyData {
  providerId: string | null;
  name: string;
  industry: string | null;
  size: string | null;
  website: string | null;
  linkedinUrl: string | null;
}

interface ExistingContact {
  id: number;
  firstName: string;
  lastName: string;
}

interface PreviewData {
  profile: LinkedInProfileData;
  company: LinkedInCompanyData | null;
  existingContact: ExistingContact | null;
}

interface ImportFromLinkedInProps {
  onContactCreated: () => void;
  onCancel?: () => void;
}

type ImportState = "idle" | "loading" | "preview" | "submitting";

export function ImportFromLinkedIn({
  onContactCreated,
  onCancel,
}: ImportFromLinkedInProps) {
  const [state, setState] = useState<ImportState>("idle");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: "",
    phone: "",
    notes: "",
  });
  const [createCompany, setCreateCompany] = useState(true);

  async function handleFetchProfile(event: FormEvent) {
    event.preventDefault();
    setState("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contacts/linkedin-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl }),
      });

      const data = (await response.json()) as
        | PreviewData
        | { error: string; code?: string };

      if (!response.ok) {
        const errorData = data as { error: string };
        throw new Error(errorData.error);
      }

      const preview = data as PreviewData;
      setPreviewData(preview);
      setFormData({
        firstName: preview.profile.firstName,
        lastName: preview.profile.lastName,
        email: "",
        jobTitle: preview.profile.currentJobTitle ?? "",
        phone: "",
        notes: preview.profile.headline ?? "",
      });
      setState("preview");

      posthog.capture("linkedin_profile_fetched", {
        has_company: Boolean(preview.company),
        is_duplicate: Boolean(preview.existingContact),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch profile";
      setErrorMessage(message);
      setState("idle");
      posthog.captureException(error);
    }
  }

  async function handleCreateContact(event: FormEvent) {
    event.preventDefault();
    if (!previewData) return;

    setState("submitting");
    setErrorMessage(null);

    try {
      let companyId: number | undefined;

      if (createCompany && previewData.company) {
        const companyResponse = await fetch("/api/contacts/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: previewData.company.name,
            linkedinProviderId: previewData.company.providerId ?? undefined,
            linkedinUrl: previewData.company.linkedinUrl ?? undefined,
            industry: previewData.company.industry ?? undefined,
            size: previewData.company.size ?? undefined,
            website: previewData.company.website ?? undefined,
          }),
        });

        if (!companyResponse.ok) {
          throw new Error("Failed to create company");
        }

        const companyData = (await companyResponse.json()) as { id: number };
        companyId = companyData.id;
      }

      const contactResponse = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email || undefined,
          company: previewData.company?.name ?? undefined,
          jobTitle: formData.jobTitle || undefined,
          phone: formData.phone || undefined,
          notes: formData.notes || undefined,
          linkedinProviderId: previewData.profile.providerId,
          linkedinUrl: previewData.profile.linkedinUrl,
          companyId,
        }),
      });

      if (!contactResponse.ok) {
        throw new Error("Failed to create contact");
      }

      posthog.capture("contact_created_from_linkedin", {
        has_company: Boolean(companyId),
        has_email: Boolean(formData.email),
      });

      resetFormState();
      onContactCreated();
    } catch (error) {
      posthog.captureException(error);
      setErrorMessage("Failed to create contact. Please try again.");
      setState("preview");
    }
  }

  function resetFormState() {
    setState("idle");
    setLinkedinUrl("");
    setPreviewData(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      jobTitle: "",
      phone: "",
      notes: "",
    });
    setCreateCompany(true);
    setErrorMessage(null);
  }

  function handleCancel() {
    if (state === "loading" || state === "submitting") {
      return;
    }
    resetFormState();
    onCancel?.();
  }

  if (state === "idle" || state === "loading") {
    return (
      <form
        onSubmit={handleFetchProfile}
        className="w-full max-w-md rounded-xl bg-white/10 p-6"
      >
        <h2 className="mb-4 text-xl font-bold">Import from LinkedIn</h2>
        {errorMessage && (
          <p className="mb-4 text-sm text-red-400">{errorMessage}</p>
        )}
        <div className="flex flex-col gap-3">
          <input
            type="url"
            placeholder="LinkedIn profile URL"
            value={linkedinUrl}
            onChange={(event) => setLinkedinUrl(event.target.value)}
            required
            className={INPUT_CLASS_NAME}
          />
          <p className="text-xs text-white/60">
            Example: https://www.linkedin.com/in/username
          </p>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={state === "loading"}
            className="rounded-full bg-white/20 px-6 py-2 font-semibold transition hover:bg-white/30 disabled:opacity-50"
          >
            {state === "loading" ? "Fetching..." : "Fetch Profile"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={state === "loading"}
            className="rounded-full bg-white/10 px-6 py-2 font-semibold transition hover:bg-white/20 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleCreateContact}
      className="w-full max-w-md rounded-xl bg-white/10 p-6"
    >
      <h2 className="mb-4 text-xl font-bold">Review & Create Contact</h2>

      {errorMessage && (
        <p className="mb-4 text-sm text-red-400">{errorMessage}</p>
      )}

      {previewData?.existingContact && (
        <div className="mb-4 rounded-lg bg-yellow-500/20 p-3 text-sm text-yellow-200">
          A contact with this LinkedIn profile already exists:{" "}
          <strong>
            {previewData.existingContact.firstName}{" "}
            {previewData.existingContact.lastName}
          </strong>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="First name *"
          value={formData.firstName}
          onChange={(event) =>
            setFormData((previous) => ({
              ...previous,
              firstName: event.target.value,
            }))
          }
          required
          className={INPUT_CLASS_NAME}
        />
        <input
          type="text"
          placeholder="Last name *"
          value={formData.lastName}
          onChange={(event) =>
            setFormData((previous) => ({
              ...previous,
              lastName: event.target.value,
            }))
          }
          required
          className={INPUT_CLASS_NAME}
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(event) =>
            setFormData((previous) => ({
              ...previous,
              email: event.target.value,
            }))
          }
          className={INPUT_CLASS_NAME}
        />
        <input
          type="text"
          placeholder="Job title"
          value={formData.jobTitle}
          onChange={(event) =>
            setFormData((previous) => ({
              ...previous,
              jobTitle: event.target.value,
            }))
          }
          className={INPUT_CLASS_NAME}
        />
        <input
          type="tel"
          placeholder="Phone"
          value={formData.phone}
          onChange={(event) =>
            setFormData((previous) => ({
              ...previous,
              phone: event.target.value,
            }))
          }
          className={INPUT_CLASS_NAME}
        />
        <textarea
          placeholder="Notes"
          value={formData.notes}
          onChange={(event) =>
            setFormData((previous) => ({
              ...previous,
              notes: event.target.value,
            }))
          }
          rows={3}
          className={INPUT_CLASS_NAME}
        />

        {previewData?.company && (
          <div className="mt-2 rounded-lg bg-white/5 p-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={createCompany}
                onChange={(event) => setCreateCompany(event.target.checked)}
                className="rounded"
              />
              Also create company: <strong>{previewData.company.name}</strong>
            </label>
            {previewData.company.industry && (
              <p className="mt-1 text-xs text-white/60">
                Industry: {previewData.company.industry}
              </p>
            )}
            {previewData.company.size && (
              <p className="text-xs text-white/60">
                Size: {previewData.company.size}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={state === "submitting" || Boolean(previewData?.existingContact)}
          className="rounded-full bg-white/20 px-6 py-2 font-semibold transition hover:bg-white/30 disabled:opacity-50"
        >
          {state === "submitting" ? "Creating..." : "Create Contact"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={state === "submitting"}
          className="rounded-full bg-white/10 px-6 py-2 font-semibold transition hover:bg-white/20 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
