import type { ReactNode } from "react";

export interface InspectorGridProps {
  children: ReactNode;
  columns?: number;
  isMobile?: boolean;
}

export function InspectorGrid({
  children,
  columns,
  isMobile = false,
}: InspectorGridProps) {
  const minCol = isMobile ? 120 : 140;
  const template =
    columns != null
      ? `repeat(${columns}, minmax(0, 1fr))`
      : `repeat(auto-fit, minmax(${minCol}px, 1fr))`;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: template,
        gap: "8px 12px",
        marginBottom: "4px",
      }}
    >
      {children}
    </div>
  );
}
