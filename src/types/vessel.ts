export interface Vessel {
  mmsi: number;
  name: string | null;
  shipType: number;
  latitude: number;
  longitude: number;
  heading: number | null;
  courseOverGround: number | null;
  speedOverGround: number | null;
  destination: string | null;
  lastUpdate: number;
}

export interface AISStreamMessage {
  MessageType: string;
  Message: {
    PositionReport?: {
      Latitude: number;
      Longitude: number;
      Cog: number;
      Sog: number;
      TrueHeading: number;
      NavigationalStatus: number;
    };
    ShipStaticData?: {
      Name: string;
      Destination: string;
      Type: number;
    };
  };
  MetaData: {
    MMSI: number;
    ShipName: string;
    latitude: number;
    longitude: number;
    time_utc: string;
  };
}
