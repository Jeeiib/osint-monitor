import { http, HttpResponse } from "msw";

// Sample data factories
export const mockEarthquakes = [
  {
    id: "us7000test1",
    magnitude: 6.2,
    place: "10km NE of Test City",
    time: 1700000000000,
    latitude: 35.5,
    longitude: 139.5,
    depth: 10,
    url: "https://earthquake.usgs.gov/earthquakes/eventpage/us7000test1",
    felt: 100,
    significance: 500,
  },
];

export const mockAircraft = [
  {
    icao24: "ae1234",
    callsign: "TEST01",
    registration: "12-3456",
    aircraftType: "C17",
    originCountry: "USA",
    latitude: 48.8566,
    longitude: 2.3522,
    altitude: 10000,
    velocity: 250,
    heading: 180,
    verticalRate: 0,
    onGround: false,
    isMilitary: true,
    squawk: "1234",
    lastSeen: 0,
  },
];

export const mockEvents = [
  {
    title: "Test conflict event",
    url: "https://example.com/article",
    image: "https://example.com/image.jpg",
    sourceDomain: "example.com",
    latitude: 48.8,
    longitude: 2.3,
    locationName: "Paris, France",
    count: 5,
    shareImage: "https://example.com/image.jpg",
  },
];

export const handlers = [
  http.get("/api/earthquakes", () => {
    return HttpResponse.json(mockEarthquakes);
  }),

  http.get("/api/aircraft", () => {
    return HttpResponse.json(mockAircraft);
  }),

  http.get("/api/events", () => {
    return HttpResponse.json(mockEvents);
  }),
];
