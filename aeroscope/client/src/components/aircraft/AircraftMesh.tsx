import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { AircraftState } from "../../store/useAircraftStore";
import { getInterpolatedState } from "../../systems/interpolationSystem";
import { useAircraftStore } from "../../store/useAircraftStore";

interface Props {
  aircraft: AircraftState;
}

const STATUS_COLORS: Record<string, string> = {
  airborne: "#00ff88",
  landing: "#ffaa00",
  taxiing: "#00aaff",
  parked: "#888888",
};

export function AircraftMesh({ aircraft }: Props) {
  const meshRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const selectedId = useAircraftStore((s) => s.selectedId);
  const selectAircraft = useAircraftStore((s) => s.selectAircraft);
  const isSelected = selectedId === aircraft.id;
  const color = STATUS_COLORS[aircraft.status] ?? "#ffffff";

  useFrame(() => {
    if (!meshRef.current) return;
    const { position, headingRad } = getInterpolatedState(aircraft);

    meshRef.current.position.set(...position);
    meshRef.current.rotation.y = headingRad;

    // Pulse glow on selected
    if (glowRef.current && isSelected) {
      const s = 1 + Math.sin(Date.now() * 0.005) * 0.3;
      glowRef.current.scale.setScalar(s);
    }
  });

  const scale = aircraft.onGround ? 0.4 : 0.6;

  return (
    <group ref={meshRef}>
      {/* Aircraft body - simplified plane silhouette */}
      <group scale={scale}>
        {/* Fuselage */}
        <mesh castShadow>
          <capsuleGeometry args={[0.15, 1.2, 4, 8]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isSelected ? 0.6 : 0.2}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>

        {/* Wings */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.08, 1.8, 2, 6]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.1}
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>

        {/* Tail */}
        <mesh position={[0, 0.2, 0.55]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.05, 0.5, 2, 4]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.1}
          />
        </mesh>

        {/* Nav lights */}
        <pointLight
          color="#ff3333"
          intensity={0.3}
          distance={3}
          position={[-0.9, 0, 0]}
        />
        <pointLight
          color="#33ff33"
          intensity={0.3}
          distance={3}
          position={[0.9, 0, 0]}
        />
      </group>

      {/* Selection ring */}
      {isSelected && (
        <mesh
          ref={glowRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.05, 0]}
        >
          <ringGeometry args={[0.7, 0.85, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Callsign label */}
      <Html
        position={[0, (aircraft.onGround ? 0.6 : 1.2) * scale, 0]}
        center
        distanceFactor={40}
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            color: color,
            fontSize: "10px",
            fontFamily: "monospace",
            fontWeight: "bold",
            background: "rgba(0,0,0,0.6)",
            padding: "1px 4px",
            borderRadius: "2px",
            border: `1px solid ${color}44`,
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          {aircraft.callsign}
        </div>
      </Html>

      {/* Clickable hitbox */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          selectAircraft(isSelected ? null : aircraft.id);
        }}
        visible={false}
      >
        <sphereGeometry args={[1.5, 8, 8]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}
