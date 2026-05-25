import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AircraftEntities } from "./components/cesium/AircraftEntities";
import { AirportEntities } from "./components/cesium/AirportEntities";
import { ScenePickHandler } from "./components/cesium/ScenePickHandler";
import { HUD } from "./components/hud/HUD";
import { loadAirportCatalog } from "./data/airports";
import { startAircraftSystem } from "./systems/aircraftSystem";
import { useAircraftStore } from "./store/useAircraftStore";

const CesiumViewer = lazy(() =>
  import("./components/cesium/CesiumViewer").then((m) => ({
    default: m.CesiumViewer,
  })),
);

export default function App() {
  const cleanupRef = useRef<(() => void) | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const catalogReady = useAircraftStore((s) => s.airportCatalogReady);

  useEffect(() => {
    let cancelled = false;
    void loadAirportCatalog()
      .then(() => {
        if (!cancelled) {
          useAircraftStore.getState().setAirportCatalogReady(true);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCatalogError(
            err instanceof Error ? err.message : "Failed to load airports",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!catalogReady) return;
    startAircraftSystem().then((cleanup) => {
      cleanupRef.current = cleanup;
    });
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [catalogReady]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "#0d0d0f",
      }}
    >
      <Suspense
        fallback={
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#7a9a8a",
              fontFamily: "monospace",
              fontSize: "15px",
            }}
          >
            Loading globe…
          </div>
        }
      >
        <CesiumViewer />
      </Suspense>
      {catalogReady && (
        <>
          <AircraftEntities />
          <AirportEntities />
          <ScenePickHandler />
          <HUD />
        </>
      )}
      {!catalogReady && !catalogError && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#7a9a8a",
            fontFamily: "monospace",
            fontSize: "15px",
            zIndex: 200,
            pointerEvents: "none",
          }}
        >
          Loading airport catalog…
        </div>
      )}
      {catalogError && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ff6666",
            fontFamily: "monospace",
            fontSize: "14px",
            zIndex: 200,
            padding: "24px",
            textAlign: "center",
          }}
        >
          {catalogError}
        </div>
      )}
    </div>
  );
}
