import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LocationState {
  selectedCommune: string | null;     // clave normalizada, ej: "talagante"
  selectedCommuneName: string | null; // nombre display, ej: "Talagante"
  selectedRegion: string | null;      // ej: "Metropolitana De Santiago"
  setCommune: (commune: { key: string; nombre: string; region: string } | null) => void;
  clearCommune: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      selectedCommune: null,
      selectedCommuneName: null,
      selectedRegion: null,

      setCommune: (commune) =>
        set(commune
          ? { selectedCommune: commune.key, selectedCommuneName: commune.nombre, selectedRegion: commune.region }
          : { selectedCommune: null, selectedCommuneName: null, selectedRegion: null }
        ),

      clearCommune: () =>
        set({ selectedCommune: null, selectedCommuneName: null, selectedRegion: null }),
    }),
    {
      name: "location-v1",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
