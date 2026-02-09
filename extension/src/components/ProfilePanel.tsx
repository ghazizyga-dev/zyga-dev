import { useState, useEffect } from "react";
import { post, ApiError } from "../lib/api-client";
import { ImportButton } from "./ImportButton";
import { MessagingPanel } from "./MessagingPanel";

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

interface ProfilePanelProps {
  linkedinUrl: string;
}

type PanelState = "loading" | "error" | "unauthenticated" | "preview";

const PANEL_STYLES: React.CSSProperties = {
  position: "fixed",
  bottom: "20px",
  right: "20px",
  width: "340px",
  maxHeight: "500px",
  overflowY: "auto",
  background: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: "14px",
  color: "#1a1a2e",
  zIndex: 2147483647,
};

const HEADER_STYLES: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  borderBottom: "1px solid #e5e7eb",
  background: "#7c3aed",
  color: "white",
  borderRadius: "12px 12px 0 0",
  cursor: "pointer",
};

const BODY_STYLES: React.CSSProperties = {
  padding: "16px",
};

export function ProfilePanel({ linkedinUrl }: ProfilePanelProps) {
  const [panelState, setPanelState] = useState<PanelState>("loading");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    void fetchPreview();
  }, [linkedinUrl]);

  async function fetchPreview() {
    setPanelState("loading");
    setErrorMessage(null);

    try {
      const data = await post<PreviewData>("/api/contacts/linkedin-preview", {
        linkedinUrl,
      });
      setPreviewData(data);
      setPanelState("preview");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setPanelState("unauthenticated");
      } else {
        const message =
          error instanceof Error ? error.message : "Failed to load profile";
        setErrorMessage(message);
        setPanelState("error");
      }
    }
  }

  if (isMinimized) {
    return (
      <div style={PANEL_STYLES}>
        <div style={HEADER_STYLES} onClick={() => setIsMinimized(false)}>
          <strong>AI Boilerplate</strong>
          <span style={{ fontSize: "12px" }}>expand</span>
        </div>
      </div>
    );
  }

  return (
    <div style={PANEL_STYLES}>
      <div style={HEADER_STYLES} onClick={() => setIsMinimized(true)}>
        <strong>AI Boilerplate</strong>
        <span style={{ fontSize: "12px" }}>minimize</span>
      </div>

      <div style={BODY_STYLES}>
        {panelState === "loading" && (
          <p style={{ color: "#6b7280", textAlign: "center" }}>Loading profile...</p>
        )}

        {panelState === "unauthenticated" && (
          <p style={{ color: "#dc2626" }}>
            Please sign in via the extension popup first.
          </p>
        )}

        {panelState === "error" && (
          <div>
            <p style={{ color: "#dc2626", marginBottom: "8px" }}>{errorMessage}</p>
            <button
              onClick={fetchPreview}
              style={{
                background: "#7c3aed",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {panelState === "preview" && previewData && (
          <>
            <div style={{ marginBottom: "12px" }}>
              <p style={{ fontWeight: 600 }}>
                {previewData.profile.firstName} {previewData.profile.lastName}
              </p>
              {previewData.profile.headline && (
                <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                  {previewData.profile.headline}
                </p>
              )}
              {previewData.company && (
                <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                  {previewData.company.name}
                  {previewData.company.industry ? ` · ${previewData.company.industry}` : ""}
                </p>
              )}
            </div>

            {previewData.existingContact === null ? (
              <ImportButton
                profile={previewData.profile}
                company={previewData.company}
                onImported={() => void fetchPreview()}
              />
            ) : (
              <MessagingPanel
                contactId={previewData.existingContact.id}
                contactName={`${previewData.existingContact.firstName} ${previewData.existingContact.lastName}`}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
