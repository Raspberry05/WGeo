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
import { useBootPhase } from "@/hooks/useBootPhase";

const CesiumViewer = lazy(() =>
  import("@/components/cesium/CesiumViewer").then((m) => ({
    default: m.CesiumViewer,
  })),
);

export default function AeroscopeApp() {
  const { catalogReady, catalogError } = useAirportCatalogBootstrap();
  const { phase: bootPhase, message: bootMessage } = useBootPhase(catalogError);
  useAircraftSystemLifecycle(catalogReady);
  useViewportFlightPoll();

  const showBootOverlay = bootPhase !== null;
  const showHud = catalogReady && !catalogError;

  return (
    <AppShell>
      <Suspense fallback={null}>
        <CesiumViewer />
      </Suspense>
      {showBootOverlay && <LoadingOverlay message={bootMessage} />}
      {showHud && (
        <>
          <AircraftEntities />
          <AirportEntities />
          <FlightTrailLayer />
          <ScenePickHandler />
          <HUD />
        </>
      )}
      {catalogError && (
        <LoadingOverlay message={catalogError} tone="error" />
      )}
    </AppShell>
  );
}
