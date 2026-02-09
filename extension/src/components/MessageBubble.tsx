interface MessageBubbleProps {
  role: "prospect" | "contact";
  content: string;
}

const PROSPECT_STYLES: React.CSSProperties = {
  alignSelf: "flex-end",
  background: "#7c3aed",
  color: "white",
  borderRadius: "12px 12px 4px 12px",
  padding: "8px 12px",
  maxWidth: "85%",
  fontSize: "13px",
  lineHeight: "1.4",
};

const CONTACT_STYLES: React.CSSProperties = {
  alignSelf: "flex-start",
  background: "#f3f4f6",
  color: "#1a1a2e",
  borderRadius: "12px 12px 12px 4px",
  padding: "8px 12px",
  maxWidth: "85%",
  fontSize: "13px",
  lineHeight: "1.4",
};

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const styles = role === "prospect" ? PROSPECT_STYLES : CONTACT_STYLES;

  return (
    <div style={styles}>
      <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{content}</p>
    </div>
  );
}
