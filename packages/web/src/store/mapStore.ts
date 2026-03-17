import { create } from 'zustand';
import type { Location, LocationCategory } from '../types';

interface MapState {
  selectedLocation: Location | null;
  activeFilter: LocationCategory | null;
  mapBounds: { north: number; south: number; east: number; west: number } | null;
  setSelectedLocation: (loc: Location | null) => void;
  setActiveFilter: (filter: LocationCategory | null) => void;
  setMapBounds: (bounds: MapState['mapBounds']) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedLocation: null,
  activeFilter: null,
  mapBounds: null,
  setSelectedLocation: (loc) => set({ selectedLocation: loc }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setMapBounds: (bounds) => set({ mapBounds: bounds }),
}));
