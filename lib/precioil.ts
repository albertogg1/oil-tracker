// lib/precioil.ts
// SERVER-ONLY — never import this from client components or hooks

import type { Station, FuelType, PriceHistoryEntry } from '@/types'

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
  if (fuelTypeId) params.set('idFuelType', fuelTypeId.toString())

  const res = await fetch(`${BASE_URL}/estaciones/radio?${params}`, {
    headers: buildHeaders(),
    next: { revalidate: 300 }, // 5 min cache at the edge
  })

  if (!res.ok) {
    throw new Error(`precioil.es /estaciones/radio returned ${res.status}`)
  }

  return res.json() as Promise<Station[]>
}

export async function fetchFuelTypes(): Promise<FuelType[]> {
  const res = await fetch(`${BASE_URL}/fuel-types`, {
    headers: buildHeaders(),
    next: { revalidate: 3600 }, // 1 hour — fuel types rarely change
  })

  if (!res.ok) {
    throw new Error(`precioil.es /fuel-types returned ${res.status}`)
  }

  return res.json() as Promise<FuelType[]>
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
    fechaInicio: thirtyDaysAgo.toISOString().split('T')[0],
    fechaFin: today.toISOString().split('T')[0],
  })

  const res = await fetch(`${BASE_URL}/cambios/precios/historico?${params}`, {
    headers: buildHeaders(),
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error(`precioil.es /cambios/precios/historico returned ${res.status}`)
  }

  return res.json() as Promise<PriceHistoryEntry[]>
}
