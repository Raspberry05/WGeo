import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAircraftStore } from '../../store/useAircraftStore';
import { getInterpolatedState } from '../../systems/interpolationSystem';

export function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const cameraMode = useAircraftStore((s) => s.cameraMode);
  const selectedId = useAircraftStore((s) => s.selectedId);
  const aircraft = useAircraftStore((s) => s.aircraft);

  // Set tower view on mount
  useEffect(() => {
    if (cameraMode === 'tower') {
      camera.position.set(0, 40, 60);
      camera.lookAt(0, 0, 0);
    }
  }, []);

  useFrame(() => {
    if (cameraMode === 'follow' && selectedId && aircraft[selectedId]) {
      const ac = aircraft[selectedId];
      const { position } = getInterpolatedState(ac);
      const target = new THREE.Vector3(...position);

      // Smooth follow
      camera.position.lerp(
        new THREE.Vector3(target.x - 10, target.y + 8, target.z - 10),
        0.05
      );
      camera.lookAt(target);

      if (controlsRef.current) {
        controlsRef.current.target.lerp(target, 0.05);
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={cameraMode === 'orbit'}
      target={[0, 0, 0]}
      minDistance={5}
      maxDistance={400}
      maxPolarAngle={Math.PI / 2.1}
      enableDamping
      dampingFactor={0.06}
    />
  );
}