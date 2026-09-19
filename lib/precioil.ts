// lib/precioil.ts
// SERVER-ONLY — never import this from client components or hooks

import type { Station, FuelType, StationPrice, PriceHistoryEntry } from '@/types'

const BASE_URL = 'https://api.precioil.es'

function getApiKey(): string {
  const key = process.env.PRECIOIL_API_KEY
  if (!key) throw new Error('PRECIOIL_API_KEY is not set')
  return key
}

function buildHeaders(): HeadersInit {
  return {
    'X-Api-Key': getApiKey(),
    'Content-Type': 'application/json',
  }
}

// Mapping from API flat price fields to real precioil.es idFuelType values.
// IDs verified against GET /fuel-types response.
const FUEL_KEYS: Array<{ idFuelType: number; key: string; nombre: string }> = [
  { idFuelType: 6,  key: 'Diesel',        nombre: 'Gasoleo A' },
  { idFuelType: 8,  key: 'DieselPremium', nombre: 'Gasoleo Premium' },
  { idFuelType: 10, key: 'Gasolina95',    nombre: 'Gasolina 95 E5' },
  { idFuelType: 13, key: 'Gasolina98',    nombre: 'Gasolina 98 E5' },
  { idFuelType: 5,  key: 'GLP',           nombre: 'GLP' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeStation(raw: Record<string, any>): Station {
  const precios: StationPrice[] = FUEL_KEYS
    .filter((ft) => raw[ft.key] !== undefined)
    .map((ft) => ({
      idFuelType: ft.idFuelType,
      nombre: ft.nombre,
      precio: raw[ft.key] as number ?? null,
    }))

  return {
    id: raw.idEstacion as number,
    nombre: raw.nombreEstacion as string,
    direccion: raw.direccion as string,
    municipio: raw.nombreMunicipio as string,
    provincia: (raw.provinciaDistrito ?? raw.provincia ?? '') as string,
    latitud: raw.latitud as number,
    longitud: raw.longitud as number,
    distancia: raw.distancia as number | undefined,
    precios,
  }
}

export async function fetchStationsByRadius(
  lat: number,
  lng: number,
  radius: number,
  fuelTypeId?: number
): Promise<Station[]> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radio: radius.toString(),
    response: 'full',
  })

  // Map our internal idFuelType back to the API key for server-side filtering
  if (fuelTypeId) {
    const ft = FUEL_KEYS.find((f) => f.idFuelType === fuelTypeId)
    if (ft) params.set('idFuelType', fuelTypeId.toString())
  }

  const res = await fetch(`${BASE_URL}/estaciones/radio?${params}&limite=50`, {
    headers: buildHeaders(),
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error(`precioil.es /estaciones/radio returned ${res.status}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: Record<string, any>[] = await res.json()
  return raw.map(normalizeStation)
}

// Fuel types are derived from our static mapping (avoids relying on unknown API response shape)
export function fetchFuelTypes(): Promise<FuelType[]> {
  return Promise.resolve(
    FUEL_KEYS.map(({ idFuelType, nombre }) => ({ idFuelType, nombre }))
  )
}

export async function fetchPriceHistory(
  stationId: number,
  fuelTypeId: number
): Promise<PriceHistoryEntry[]> {
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  const params = new URLSearchParams({
    idEstacion: stationId.toString(),
    idFuelType: fuelTypeId.toString(),
    fechaInicio: thirtyDaysAgo.toISOString(),
    fechaFin: today.toISOString(),
    limite: '100',
  })

  const res = await fetch(`${BASE_URL}/cambios/precios/historico?${params}`, {
    headers: buildHeaders(),
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error(`precioil.es /cambios/precios/historico returned ${res.status}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json: { data: Record<string, any>[] } = await res.json()
  return json.data.reverse().map((item) => ({
    fecha: item.fechaCambio as string,
    precio: parseFloat(item.precioNuevo as string),
    idFuelType: item.idFuelType as number,
  }))
}
