interface RunwayDef {
  x: number;
  z: number;
  length: number;
  width: number;
  rotation: number;
  label: string;
}

const ATL_RUNWAYS: RunwayDef[] = [
  { x: 0, z: -20, length: 120, width: 3.5, rotation: 0.14, label: "08L/26R" },
  { x: 0, z: 5, length: 120, width: 3.5, rotation: 0.14, label: "09R/27L" },
  { x: 0, z: 30, length: 110, width: 3.5, rotation: 0.17, label: "10/28" },
];

function RunwayStrip({ x, z, length, width, rotation }: RunwayDef) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      {/* Runway surface — medium grey, clearly readable */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color="#2a2c32" roughness={0.9} />
      </mesh>

      {/* Center line — bright white stripe */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[0.18, length * 0.88]} />
        <meshStandardMaterial color="#e8eaf0" roughness={0.6} />
      </mesh>

      {/* Edge stripes */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[side * (width / 2 - 0.2), 0.01, 0]}
        >
          <planeGeometry args={[0.12, length * 0.85]} />
          <meshStandardMaterial
            color="#c0c4d0"
            opacity={0.5}
            transparent
            roughness={0.6}
          />
        </mesh>
      ))}

      {/* Threshold tick marks */}
      {[-1, 1].map((end) =>
        [-0.8, -0.3, 0.3, 0.8].map((offset) => (
          <mesh
            key={`${end}-${offset}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[offset * width * 0.3, 0.01, end * (length / 2 - 4)]}
          >
            <planeGeometry args={[0.4, 3]} />
            <meshStandardMaterial color="#d0d4e0" opacity={0.4} transparent />
          </mesh>
        )),
      )}

      {/* Runway edge lights — white dots, Tesla-style clean markers */}
      {Array.from({ length: 18 }, (_, i) => {
        const t = (i / 17 - 0.5) * length;
        return (
          <group key={i}>
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * (width / 2 + 0.4), 0.08, t]}>
                <sphereGeometry args={[0.09, 6, 6]} />
                <meshStandardMaterial
                  color="#dde0ea"
                  emissive="#ffffff"
                  emissiveIntensity={0.4}
                />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

export function Runways() {
  return (
    <group>
      {ATL_RUNWAYS.map((r) => (
        <RunwayStrip key={r.label} {...r} />
      ))}

      {/* Taxiways — slightly lighter than ground, darker than runway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 5]}>
        <planeGeometry args={[90, 2.5]} />
        <meshStandardMaterial color="#202228" roughness={0.92} />
      </mesh>

      {/* Terminal aprons — left and right */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-50, 0.01, 7]}>
        <planeGeometry args={[28, 60]} />
        <meshStandardMaterial color="#1a1c20" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[50, 0.01, 7]}>
        <planeGeometry args={[28, 60]} />
        <meshStandardMaterial color="#1a1c20" roughness={0.95} />
      </mesh>

      {/* Gate position dots */}
      {[-45, -30, -15, 0, 15, 30, 45].map((x) =>
        [-1, 1].map((side) => (
          <mesh
            key={`${x}-${side}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[x, 0.02, 7 + side * 25]}
          >
            <circleGeometry args={[0.6, 12]} />
            <meshStandardMaterial color="#2e3038" />
          </mesh>
        )),
      )}
    </group>
  );
}
