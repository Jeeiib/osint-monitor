export interface Aircraft {
  icao24: string;           // hex identifier
  callsign: string | null;  // Flight callsign (e.g., "AFR123")
  registration: string | null; // Aircraft registration
  aircraftType: string | null; // ICAO type code (e.g., "B738")
  longitude: number | null;
  latitude: number | null;
  altitude: number | null;  // meters (barometric)
  velocity: number | null;  // m/s (ground speed)
  heading: number | null;   // degrees (0 = north)
  verticalRate: number | null; // feet/minute
  onGround: boolean;
  isMilitary: boolean;
  squawk: string | null;
  lastSeen: number;         // seconds since last message
}

export interface AirplanesLiveAircraft {
  hex: string;
  flight?: string;
  r?: string;  // registration
  t?: string;  // type
  lat?: number;
  lon?: number;
  alt_baro?: number | "ground";
  gs?: number;  // ground speed (knots)
  track?: number;
  baro_rate?: number;
  squawk?: string;
  dbFlags?: number;  // bit 0 = military
  seen?: number;
}

export interface AirplanesLiveResponse {
  ac: AirplanesLiveAircraft[];
  msg?: string;
  now?: number;
  total?: number;
}

// Legacy OpenSky types (kept for reference)
export interface OpenSkyResponse {
  time: number;
  states: (string | number | boolean | null)[][] | null;
}
