export interface Aircraft {
  icao24: string;           // Unique identifier
  callsign: string | null;  // Flight callsign (e.g., "AFR123")
  originCountry: string;
  longitude: number | null;
  latitude: number | null;
  altitude: number | null;  // meters
  velocity: number | null;  // m/s
  heading: number | null;   // degrees (0 = north)
  verticalRate: number | null;
  onGround: boolean;
  lastContact: number;      // Unix timestamp
}

export interface OpenSkyResponse {
  time: number;
  states: (string | number | boolean | null)[][] | null;
}
