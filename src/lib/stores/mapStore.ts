import { create } from "zustand";

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

interface MapStore {
  viewState: ViewState;
  setViewState: (viewState: ViewState) => void;
  flyTo: (longitude: number, latitude: number, zoom?: number) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  viewState: {
    longitude: 0,
    latitude: 20,
    zoom: 1.3,
  },
  setViewState: (viewState) => set({ viewState }),
  flyTo: (longitude, latitude, zoom = 8) =>
    set({ viewState: { longitude, latitude, zoom } }),
}));
