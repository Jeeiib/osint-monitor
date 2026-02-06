export interface GdeltGeoFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    name: string;
    html: string;
    shareimage: string;
    count: string;
    url: string;
  };
}

export interface GdeltGeoResponse {
  type: "FeatureCollection";
  features: GdeltGeoFeature[];
}

export interface GdeltArticle {
  title: string;
  url: string;
  image: string;
  sourceDomain: string;
  latitude: number;
  longitude: number;
  locationName: string;
  count: number;
  shareImage: string;
}
