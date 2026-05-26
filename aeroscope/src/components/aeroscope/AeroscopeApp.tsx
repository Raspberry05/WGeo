"use client";

import { lazy, Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { AircraftEntities } from "@/components/cesium/AircraftEntities";
import { AirportEntities } from "@/components/cesium/AirportEntities";
import { FlightTrailLayer } from "@/components/cesium/FlightTrailLayer";
import { ScenePickHandler } from "@/components/cesium/ScenePickHandler";
import { HUD } from "@/components/hud/HUD";
import { useAircraftSystemLifecycle } from "@/hooks/useAircraftSystemLifecycle";
import { useViewportFlightPoll } from "@/hooks/useViewportFlightPoll";
import { useAirportCatalogBootstrap } from "@/hooks/useAirportCatalogBootstrap";
import { useCesiumStore } from "@/store/useCesiumStore";

const CesiumViewer = lazy(() =>
  import("@/components/cesium/CesiumViewer").then((m) => ({
    default: m.CesiumViewer,
  })),
);

export default function AeroscopeApp() {
  const { catalogReady, catalogError } = useAirportCatalogBootstrap();
  const globeBootReady = useCesiumStore((s) => s.globeBootReady);
  useAircraftSystemLifecycle(catalogReady);
  useViewportFlightPoll();

  return (
    <AppShell>
      <Suspense fallback={null}>
        <CesiumViewer />
      </Suspense>
      {!globeBootReady && (
        <LoadingOverlay message="Loading globe…" />
      )}
      {catalogReady && (
        <>
          <AircraftEntities />
          <AirportEntities />
          <FlightTrailLayer />
          <ScenePickHandler />
          <HUD />
        </>
      )}
      {!catalogReady && !catalogError && (
        <LoadingOverlay message="Loading airport catalog…" />
      )}
      {catalogError && (
        <LoadingOverlay message={catalogError} tone="error" />
      )}
    </AppShell>
  );
}
