// types/index.ts

export interface FuelType {
  id: number
  nombre: string
}

export interface StationPrice {
  idFuelType: number
  nombre: string
  precio: number | null
}

export interface Station {
  id: number
  nombre: string
  direccion: string
  municipio: string
  provincia: string
  latitud: number
  longitud: number
  distancia?: number          // km from search center, present in /radio responses
  precios: StationPrice[]
}

export interface PriceHistoryEntry {
  fecha: string              // ISO 8601 datetime string
  precio: number
  idFuelType: number
}

export interface GeoLocation {
  lat: number
  lng: number
}

export interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

export interface SearchFilters {
  location: GeoLocation | null
  radius: number              // km, 5–50
  fuelTypeId: number | null
}

export type SortOrder = 'price' | 'distance'
export type ViewMode = 'map' | 'list'
export type PriceColor = 'green' | 'yellow' | 'red'
