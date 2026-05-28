import { Loader } from '@googlemaps/js-api-loader'

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

let loader: Loader | null = null

const getLoader = () => {
  if (!apiKey) {
    throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY. Add it to your .env file to enable Google Maps.')
  }

  if (!loader) {
    loader = new Loader({
      apiKey,
      version: 'weekly',
      language: import.meta.env.VITE_GOOGLE_MAPS_LANGUAGE || 'en',
      region: import.meta.env.VITE_GOOGLE_MAPS_REGION || 'IN',
    })
  }

  return loader
}

export const googleMapsConfig = {
  apiKey,
  mapId: import.meta.env.VITE_GOOGLE_MAP_ID,
}

export const loadMapsLibrary = async () =>
  (await getLoader().importLibrary('maps')) as google.maps.MapsLibrary

export const loadMarkerLibrary = async () =>
  (await getLoader().importLibrary('marker')) as google.maps.MarkerLibrary
