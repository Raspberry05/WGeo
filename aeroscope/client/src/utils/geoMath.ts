// ATL center coordinates
export const ATL_CENTER = {
    lat: 33.6407,
    lon: -84.4277,
  };
  
  // Scale: 1 scene unit ≈ 100 meters
  const SCALE = 0.0009; // degrees per unit
  
  export function geoToScene(
    lat: number,
    lon: number,
    altitude: number = 0
  ): [number, number, number] {
    const x = (lon - ATL_CENTER.lon) / SCALE;
    const z = -(lat - ATL_CENTER.lat) / SCALE; // Z is inverted (south = positive Z)
    const y = altitude * 0.003; // altitude scaling
    return [x, y, z];
  }
  
  export function classifyStatus(
    altitude: number,
    velocity: number,
    onGround: boolean
  ): import('../store/useAircraftStore').AircraftStatus {
    if (onGround) {
      if (velocity > 5) return 'taxiing';
      return 'parked';
    }
    if (altitude < 1000 && velocity > 50) return 'landing';
    return 'airborne';
  }
  
  export function headingToRotation(heading: number): number {
    // Convert compass heading to Three.js Y rotation (radians)
    return -((heading * Math.PI) / 180);
  }
  
  // Linear interpolation
  export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
  
  export function lerpPosition(
    from: [number, number, number],
    to: [number, number, number],
    t: number
  ): [number, number, number] {
    return [lerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t)];
  }
  
  // Shortest angle lerp for heading
  export function lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  }