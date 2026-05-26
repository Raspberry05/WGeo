"use client";

import { useEffect, useRef } from "react";
import {
  Cartesian3,
  Color,
  PolylineCollection,
  PolylineMaterialAppearance,
  Material,
} from "cesium";
import { useAircraftStore } from "@/store/useAircraftStore";
import { useCesiumStore } from "@/store/useCesiumStore";

const TRAIL_COLOR = Color.fromCssColorString("#00ff8866");
const MIN_TRACK_POINTS = 2;

export function FlightTrailLayer() {
  const viewer = useCesiumStore((s) => s.viewer);
  const selectedId = useAircraftStore((s) => s.selectedId);
  const showTrail = useAircraftStore((s) => s.showTrail);
  const trackByFlightId = useAircraftStore((s) => s.trackByFlightId);

  const collectionRef = useRef<PolylineCollection | null>(null);

  useEffect(() => {
    if (!viewer) return;

    const collection = new PolylineCollection();
    viewer.scene.primitives.add(collection);
    collectionRef.current = collection;

    return () => {
      if (!collection.isDestroyed()) {
        viewer.scene.primitives.remove(collection);
      }
      collectionRef.current = null;
    };
  }, [viewer]);

  useEffect(() => {
    const collection = collectionRef.current;
    if (!viewer || !collection) return;

    collection.removeAll();

    if (!showTrail || !selectedId) return;

    const apiTrack = trackByFlightId[selectedId];
    if (!apiTrack || apiTrack.length < MIN_TRACK_POINTS) return;

    const positions = apiTrack.map((p) =>
      Cartesian3.fromDegrees(p.lon, p.lat, p.altMeters),
    );

    collection.add({
      positions,
      width: 2,
      material: Material.fromType("Color", { color: TRAIL_COLOR }),
      appearance: new PolylineMaterialAppearance(),
    });
  }, [viewer, selectedId, showTrail, trackByFlightId]);

  return null;
}
