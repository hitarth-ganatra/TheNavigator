import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DEFAULT_PLACE_COUNT, DEFAULT_RADIUS_KM, sanitizePlaceCount, sanitizeRadiusKm } from '../config/trip'
import type {
  PlaceSummary,
  RouteMode,
  RouteResult,
  SearchHistoryItem,
  TripConfig,
  User,
} from '../types/googleMaps'

type AppState = {
  authUser: User | null
  origin: PlaceSummary | null
  searchHistory: SearchHistoryItem[]
  nearbyPlaces: PlaceSummary[]
  selectedPlaces: PlaceSummary[]
  tripConfig: TripConfig
  routeMode: RouteMode | null
  routeResult: RouteResult | null
  login: (email: string) => void
  logout: () => void
  setOrigin: (place: PlaceSummary) => void
  setNearbyPlaces: (places: PlaceSummary[]) => void
  addSelectedPlace: (place: PlaceSummary) => void
  removeSelectedPlace: (placeId: string) => void
  reorderSelectedPlaces: (activeId: string, overId: string) => void
  updateTripConfig: (config: Partial<TripConfig>) => void
  setRouteData: (mode: RouteMode, result: RouteResult | null) => void
  clearRouteData: () => void
}

const DEFAULT_TRIP_CONFIG: TripConfig = {
  placeCount: DEFAULT_PLACE_COUNT,
  radiusKm: DEFAULT_RADIUS_KM,
}

const dedupeHistory = (history: SearchHistoryItem[], place: PlaceSummary): SearchHistoryItem[] => {
  const nextItem: SearchHistoryItem = {
    ...place,
    searchedAt: new Date().toISOString(),
  }

  return [nextItem, ...history.filter((item) => item.placeId !== place.placeId)].slice(0, 6)
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      authUser: null,
      origin: null,
      searchHistory: [],
      nearbyPlaces: [],
      selectedPlaces: [],
      tripConfig: DEFAULT_TRIP_CONFIG,
      routeMode: null,
      routeResult: null,
      login: (email) =>
        set({
          authUser: {
            id: crypto.randomUUID(),
            email,
          },
        }),
      logout: () =>
        set({
          authUser: null,
          origin: null,
          nearbyPlaces: [],
          selectedPlaces: [],
          routeMode: null,
          routeResult: null,
        }),
      setOrigin: (place) =>
        set((state) => ({
          origin: place,
          searchHistory: dedupeHistory(state.searchHistory, place),
          routeResult: null,
          routeMode: null,
        })),
      setNearbyPlaces: (places) => set({ nearbyPlaces: places }),
      addSelectedPlace: (place) =>
        set((state) => {
          if (state.selectedPlaces.some((item) => item.placeId === place.placeId)) {
            return state
          }

          return {
            selectedPlaces: [...state.selectedPlaces, place],
            routeResult: null,
            routeMode: null,
          }
        }),
      removeSelectedPlace: (placeId) =>
        set((state) => ({
          selectedPlaces: state.selectedPlaces.filter((item) => item.placeId !== placeId),
          routeResult: null,
        })),
      reorderSelectedPlaces: (activeId, overId) =>
        set((state) => {
          const currentIndex = state.selectedPlaces.findIndex((item) => item.placeId === activeId)
          const nextIndex = state.selectedPlaces.findIndex((item) => item.placeId === overId)

          if (currentIndex === -1 || nextIndex === -1 || currentIndex === nextIndex) {
            return state
          }

          const updated = [...state.selectedPlaces]
          const [moved] = updated.splice(currentIndex, 1)
          updated.splice(nextIndex, 0, moved)

          return {
            selectedPlaces: updated,
            routeResult: null,
            routeMode: null,
          }
        }),
      updateTripConfig: (config) =>
        set((state) => ({
          tripConfig: {
            ...state.tripConfig,
            placeCount: sanitizePlaceCount(config.placeCount ?? state.tripConfig.placeCount),
            radiusKm: sanitizeRadiusKm(config.radiusKm ?? state.tripConfig.radiusKm),
          },
          routeResult: null,
          routeMode: null,
        })),
      setRouteData: (mode, result) => set({ routeMode: mode, routeResult: result }),
      clearRouteData: () => set({ routeMode: null, routeResult: null }),
    }),
    {
      name: 'the-navigator-store',
      merge: (persistedState, currentState) => {
        const nextState = (persistedState as Partial<AppState>) || {}
        const nextTripConfig = nextState.tripConfig || currentState.tripConfig

        return {
          ...currentState,
          ...nextState,
          tripConfig: {
            placeCount: sanitizePlaceCount(nextTripConfig.placeCount),
            radiusKm: sanitizeRadiusKm(nextTripConfig.radiusKm),
          },
        }
      },
      partialize: (state) => ({
        authUser: state.authUser,
        origin: state.origin,
        searchHistory: state.searchHistory,
        selectedPlaces: state.selectedPlaces,
        tripConfig: state.tripConfig,
        routeMode: state.routeMode,
        routeResult: state.routeResult,
      }),
    },
  ),
)
