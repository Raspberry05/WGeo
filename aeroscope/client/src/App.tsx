import { lazy, Suspense } from "react";
import { AppShell } from "./components/layout/AppShell";
import { LoadingOverlay } from "./components/ui/LoadingOverlay";
import { AircraftEntities } from "./components/cesium/AircraftEntities";
import { AirportEntities } from "./components/cesium/AirportEntities";
import { ScenePickHandler } from "./components/cesium/ScenePickHandler";
import { HUD } from "./components/hud/HUD";
import { useAircraftSystemLifecycle } from "./hooks/useAircraftSystemLifecycle";
import { useAirportCatalogBootstrap } from "./hooks/useAirportCatalogBootstrap";

const CesiumViewer = lazy(() =>
  import("./components/cesium/CesiumViewer").then((m) => ({
    default: m.CesiumViewer,
  })),
);

export default function App() {
  const { catalogReady, catalogError } = useAirportCatalogBootstrap();
  useAircraftSystemLifecycle(catalogReady);

  return (
    <AppShell>
      <Suspense fallback={<LoadingOverlay message="Loading globe…" />}>
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
        <LoadingOverlay message="Loading airport catalog…" />
      )}
      {catalogError && (
        <LoadingOverlay message={catalogError} tone="error" />
      )}
    </AppShell>
  );
}
