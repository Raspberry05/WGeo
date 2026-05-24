export function AirportGround() {
  return (
    <group>
      {/* Main ground — dark charcoal base */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
        receiveShadow
      >
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial color="#111214" roughness={1} metalness={0} />
      </mesh>

      {/* Tarmac — slightly lighter than ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#16181c" roughness={0.95} metalness={0} />
      </mesh>

      {/* Grid — very subtle, Tesla-style reference lines */}
      <gridHelper
        args={[600, 120, "#1c1e24", "#1c1e24"]}
        position={[0, -0.09, 0]}
      />
    </group>
  );
}
