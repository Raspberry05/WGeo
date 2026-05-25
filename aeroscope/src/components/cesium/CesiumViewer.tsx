import { useRef } from "react";
import { useCesiumViewerInit } from "../../hooks/useCesiumViewerInit";

export function CesiumViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  useCesiumViewerInit(containerRef);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, zIndex: 0 }}
    />
  );
}
