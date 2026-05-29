/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_ORS_PROXY_BASE_URL?: string
  readonly VITE_MAP_COUNTRY_CODE?: string
  readonly VITE_MAP_LANGUAGE?: string
  readonly VITE_MAP_TILE_URL?: string
  readonly VITE_MAP_TILE_ATTRIBUTION?: string
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}
