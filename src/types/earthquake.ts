export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  latitude: number;
  longitude: number;
  depth: number;
  url: string;
  felt: number | null;
  significance: number;
}

export interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
    felt: number | null;
    sig: number;
  };
  geometry: {
    coordinates: [number, number, number]; // [longitude, latitude, depth]
  };
}

export interface USGSResponse {
  features: USGSFeature[];
  metadata: {
    generated: number;
    count: number;
    title: string;
  };
}
