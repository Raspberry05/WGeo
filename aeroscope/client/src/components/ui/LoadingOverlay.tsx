export type LoadingOverlayTone = "muted" | "error";

export interface LoadingOverlayProps {
  message: string;
  tone?: LoadingOverlayTone;
}

const TONE_STYLES: Record<LoadingOverlayTone, { color: string }> = {
  muted: { color: "#7a9a8a" },
  error: { color: "#ff6666" },
};

export function LoadingOverlay({
  message,
  tone = "muted",
}: LoadingOverlayProps) {
  const { color } = TONE_STYLES[tone];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        fontFamily: "monospace",
        fontSize: tone === "error" ? "14px" : "15px",
        zIndex: 200,
        pointerEvents: tone === "error" ? "auto" : "none",
        padding: tone === "error" ? "24px" : undefined,
        textAlign: "center",
      }}
    >
      {message}
    </div>
  );
}
