import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { AirportGround } from './AirportGround';
import { Runways } from './Runways';
import { Atmosphere } from './Atmosphere';
import { AircraftMesh } from '../aircraft/AircraftMesh';
import { CameraController } from '../camera/CameraController';
import { useAircraftStore } from '../../store/useAircraftStore';
import * as THREE from 'three';

export function SceneRoot() {
  const aircraft = useAircraftStore((s) => s.aircraft);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 40, 60], fov: 60, near: 0.1, far: 5000 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      style={{ background: '#020a0e' }}
    >
      <Suspense fallback={null}>
        <Atmosphere />
        <AirportGround />
        <Runways />

        {Object.values(aircraft).map((ac) => (
          <AircraftMesh key={ac.id} aircraft={ac} />
        ))}

        <CameraController />
      </Suspense>
    </Canvas>
  );
}