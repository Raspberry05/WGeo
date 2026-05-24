import type { AircraftState } from '../store/useAircraftStore';
import { geoToScene, classifyStatus } from '../utils/geoMath';
import { ATL_CENTER } from '../utils/geoMath';

const MOCK_CALLSIGNS = [
  'DAL101', 'UAL442', 'AAL890', 'SWA234', 'FDX567',
  'DAL205', 'UAL881', 'AAL112', 'SWA999', 'DLH401',
  'BAW172', 'AFR682', 'SWA500', 'DAL777', 'UAL330',
];

interface MockFlight {
  id: string;
  callsign: string;
  lat: number;
  lon: number;
  altitude: number;
  heading: number;
  velocity: number;
  onGround: boolean;
  dLat: number;
  dLon: number;
  dAlt: number;
}

const flights: MockFlight[] = MOCK_CALLSIGNS.map((callsign, i) => {
  const onGround = i < 5;
  const angle = (i / MOCK_CALLSIGNS.length) * Math.PI * 2;
  const radius = onGround ? 0.01 + Math.random() * 0.005 : 0.05 + Math.random() * 0.1;

  return {
    id: `mock_${callsign}`,
    callsign,
    lat: ATL_CENTER.lat + Math.sin(angle) * radius,
    lon: ATL_CENTER.lon + Math.cos(angle) * radius,
    altitude: onGround ? 0 : 3000 + Math.random() * 25000,
    heading: Math.random() * 360,
    velocity: onGround ? 10 + Math.random() * 20 : 400 + Math.random() * 300,
    onGround,
    dLat: (Math.random() - 0.5) * 0.0002,
    dLon: (Math.random() - 0.5) * 0.0002,
    dAlt: onGround ? 0 : (Math.random() - 0.5) * 50,
  };
});

export function tickMockSimulation(): AircraftState[] {
  return flights.map((f) => {
    // Move aircraft
    f.lat += f.dLat;
    f.lon += f.dLon;
    f.altitude = Math.max(0, f.altitude + f.dAlt);

    // Gradually adjust heading toward movement direction
    const movHeading = (Math.atan2(f.dLon, f.dLat) * 180) / Math.PI;
    f.heading = f.heading * 0.95 + movHeading * 0.05;

    const position = geoToScene(f.lat, f.lon, f.altitude);
    const status = classifyStatus(f.altitude, f.velocity, f.onGround);

    return {
      id: f.id,
      callsign: f.callsign,
      icao24: f.id,
      position,
      rawLat: f.lat,
      rawLon: f.lon,
      velocity: f.velocity,
      heading: f.heading,
      altitude: f.altitude,
      onGround: f.onGround,
      status,
      lastUpdated: Date.now(),
    };
  });
}