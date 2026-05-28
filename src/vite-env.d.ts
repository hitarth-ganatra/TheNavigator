/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  readonly VITE_GOOGLE_MAP_ID?: string
  readonly VITE_GOOGLE_MAPS_REGION?: string
  readonly VITE_GOOGLE_MAPS_LANGUAGE?: string
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}
