import type { AircraftState } from "../store/useAircraftStore";
import { geoToScene, classifyStatus } from "../utils/geoMath";
import { ATL_CENTER } from "../utils/geoMath";

const MOCK_CALLSIGNS = [
  "DAL101",
  "UAL442",
  "AAL890",
  "SWA234",
  "FDX567",
  "DAL205",
  "UAL881",
  "AAL112",
  "SWA999",
  "DLH401",
  "BAW172",
  "AFR682",
  "SWA500",
  "DAL777",
  "UAL330",
];

interface MockFlight {
  id: string;
  callsign: string;
  lat: number;
  lon: number;
  altitudeMeters: number;
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
    altitudeMeters: onGround ? 4 : 900 + Math.random() * 8000,
    heading: Math.random() * 360,
    velocity: onGround ? 10 + Math.random() * 20 : 120 + Math.random() * 80,
    onGround,
    dLat: (Math.random() - 0.5) * 0.0002,
    dLon: (Math.random() - 0.5) * 0.0002,
    dAlt: onGround ? 0 : (Math.random() - 0.5) * 15,
  };
});

export function tickMockSimulation(): AircraftState[] {
  return flights.map((f) => {
    f.lat += f.dLat;
    f.lon += f.dLon;
    f.altitudeMeters = Math.max(4, f.altitudeMeters + f.dAlt);

    const movHeading = (Math.atan2(f.dLon, f.dLat) * 180) / Math.PI;
    f.heading = f.heading * 0.95 + movHeading * 0.05;

    const position = geoToScene(f.lat, f.lon, f.altitudeMeters);
    const status = classifyStatus(f.altitudeMeters, f.velocity, f.onGround);

    return {
      id: f.id,
      faFlightId: f.id,
      registration: f.callsign,
      callsign: f.callsign,
      icao24: f.id,
      position,
      rawLat: f.lat,
      rawLon: f.lon,
      velocity: f.velocity,
      heading: f.heading,
      altitudeMeters: f.altitudeMeters,
      onGround: f.onGround,
      status,
      aircraftType: "Uncategorized",
      categoryCode: null,
      originCountry: "United States",
      operatorName: null,
      aircraftModel: null,
      originAirport: null,
      destinationAirport: null,
      flightDetail: null,
      lastUpdated: Date.now(),
      positionTimeMs: Date.now(),
    };
  });
}
