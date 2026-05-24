import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

export function Atmosphere() {
  const { scene, gl } = useThree();

  useEffect(() => {
    // Deep charcoal background — no sky
    scene.background = new THREE.Color("#0d0d0f");
    scene.fog = new THREE.FogExp2("#0d0d0f", 0.006);
    gl.setClearColor("#0d0d0f");

    return () => {
      scene.fog = null;
    };
  }, [scene, gl]);

  return (
    <>
      {/* Flat, even ambient — Tesla-style no dramatic shadows */}
      <ambientLight intensity={1.4} color="#c8ccd4" />

      {/* Soft top-down fill, not a sun */}
      <directionalLight
        position={[0, 100, 0]}
        intensity={0.6}
        color="#e0e4f0"
      />

      {/* Subtle side fill to kill harsh shadows */}
      <directionalLight
        position={[-80, 40, -80]}
        intensity={0.3}
        color="#9aa0b8"
      />
    </>
  );
}
