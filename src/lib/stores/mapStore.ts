import { create } from "zustand";
import type { MapRef } from "react-map-gl/mapbox";

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

interface MapStore {
  viewState: ViewState;
  mapRef: MapRef | null;
  setViewState: (viewState: ViewState) => void;
  setMapRef: (ref: MapRef | null) => void;
  flyTo: (longitude: number, latitude: number, zoom?: number) => void;
}

export const useMapStore = create<MapStore>((set, get) => ({
  viewState: {
    longitude: 0,
    latitude: 30,
    zoom: 2,
  },
  mapRef: null,

  setViewState: (viewState) => set({ viewState }),

  setMapRef: (ref) => set({ mapRef: ref }),

  flyTo: (longitude, latitude, zoom = 6) => {
    const { mapRef } = get();
    if (mapRef) {
      mapRef.flyTo({
        center: [longitude, latitude],
        zoom,
        duration: 1500,
        essential: true,
      });
    } else {
      set({ viewState: { longitude, latitude, zoom } });
    }
  },
}));
