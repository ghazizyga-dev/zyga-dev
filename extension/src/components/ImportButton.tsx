import { useState } from "react";
import { post } from "../lib/api-client";

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

interface ImportButtonProps {
  profile: LinkedInProfileData;
  company: LinkedInCompanyData | null;
  onImported: () => void;
}

export function ImportButton({ profile, company, onImported }: ImportButtonProps) {
  const [includeCompany, setIncludeCompany] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleImport() {
    setIsImporting(true);
    setErrorMessage(null);

    try {
      let companyId: number | undefined;

      if (includeCompany && company) {
        const companyResult = await post<{ id: number }>("/api/contacts/companies", {
          name: company.name,
          linkedinProviderId: company.providerId ?? undefined,
          linkedinUrl: company.linkedinUrl ?? undefined,
          industry: company.industry ?? undefined,
          size: company.size ?? undefined,
          website: company.website ?? undefined,
        });
        companyId = companyResult.id;
      }

      await post("/api/contacts", {
        firstName: profile.firstName,
        lastName: profile.lastName,
        company: company?.name ?? undefined,
        jobTitle: profile.currentJobTitle ?? undefined,
        notes: profile.headline ?? undefined,
        linkedinProviderId: profile.providerId,
        linkedinUrl: profile.linkedinUrl,
        companyId,
      });

      onImported();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to import contact";
      setErrorMessage(message);
    } finally {
      setIsImporting(false);
    }
  }

  const buttonStyles: React.CSSProperties = {
    width: "100%",
    background: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    opacity: isImporting ? 0.5 : 1,
  };

  return (
    <div>
      {company && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            marginBottom: "10px",
            color: "#374151",
          }}
        >
          <input
            type="checkbox"
            checked={includeCompany}
            onChange={(event) => setIncludeCompany(event.target.checked)}
          />
          Also import company: {company.name}
        </label>
      )}

      {errorMessage && (
        <p style={{ color: "#dc2626", fontSize: "12px", marginBottom: "8px" }}>
          {errorMessage}
        </p>
      )}

      <button onClick={() => void handleImport()} disabled={isImporting} style={buttonStyles}>
        {isImporting ? "Importing..." : "Import Contact"}
      </button>
    </div>
  );
}
