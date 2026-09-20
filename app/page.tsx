'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { Fuel } from 'lucide-react'
import { SearchBar } from '@/components/SearchBar'
import { FiltersPanel } from '@/components/FiltersPanel'
import { ViewToggle } from '@/components/ViewToggle'
import { StationList } from '@/components/StationList'
import { StationDrawer } from '@/components/StationDrawer'
import { useStations } from '@/hooks/useStations'
import { useFuelTypes } from '@/hooks/useFuelTypes'
import type { SearchFilters, Station, ViewMode, GeoLocation } from '@/types'

// Leaflet cannot run on the server — must be a dynamic import
const MapView = dynamic(
  () => import('@/components/MapView').then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full rounded-card bg-apple-gray3/30 animate-pulse" />
    ),
  }
)

const SESSION_KEY = 'oil-tracker-session'

function loadSession(): Partial<SearchFilters> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Partial<SearchFilters>
  } catch {
    return {}
  }
}

function saveSession(filters: SearchFilters) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      location: filters.location,
      fuelTypeId: filters.fuelTypeId,
      radius: filters.radius,
    }))
  } catch {}
}

const DEFAULT_FILTERS: SearchFilters = {
  location: null,
  radius: 5,
  fuelTypeId: null,
}

export default function HomePage() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [view, setView] = useState<ViewMode>('map')
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)

  const { data: stations = [], isLoading, error } = useStations(filters)
  const { data: fuelTypes = [] } = useFuelTypes()

  // Restore session after mount (avoids SSR/client mismatch)
  useEffect(() => {
    const saved = loadSession()
    if (saved.location || saved.fuelTypeId || saved.radius) {
      setFilters((prev) => ({ ...prev, ...saved }))
    }
  }, [])

  // Persist session whenever filters change
  useEffect(() => {
    saveSession(filters)
  }, [filters])

  function handleLocation(loc: GeoLocation) {
    setFilters((prev) => ({ ...prev, location: loc }))
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      {/* Top bar */}
      <header className="z-30 bg-white/80 backdrop-blur-xl border-b border-apple-gray3">
        {/* Row 1: title + view toggle */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <h1 className="text-base font-bold flex items-center gap-1.5">
            <Fuel size={18} className="text-apple-blue" />
            Precio Gasolina
          </h1>
          <ViewToggle view={view} onChange={setView} />
        </div>

        {/* Row 2: search */}
        <div className="px-4 pb-2">
          <SearchBar onLocation={handleLocation} />
        </div>

        {/* Row 3: filters */}
        <div className="px-4 pb-3 border-t border-apple-gray3/50 pt-2">
          <FiltersPanel filters={filters} onChange={setFilters} />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden relative">
        {/* No location state */}
        {!filters.location && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div style={{ fontSize: '3rem' }}>⛽</div>
            <h2 className="text-2xl font-bold">Encuentra la gasolina más barata</h2>
            <p className="text-apple-gray1 max-w-sm">
              Busca tu ciudad o permite el acceso a tu ubicación para ver los precios cerca de ti.
            </p>
          </div>
        )}

        {/* Loading */}
        {filters.location && isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-card bg-white/90 px-6 py-4 shadow-card-hover backdrop-blur-xl text-sm text-apple-gray1">
              Buscando gasolineras...
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="rounded-card bg-apple-red/10 border border-apple-red/20 px-6 py-4 text-apple-red text-sm">
              Error al cargar datos. Comprueba tu conexión e inténtalo de nuevo.
            </div>
          </div>
        )}

        {/* Map view */}
        {filters.location && !isLoading && !error && view === 'map' && (
          <div className="absolute inset-0 sm:p-4">
            <MapView
              stations={stations}
              center={filters.location}
              radius={filters.radius}
              activeFuelTypeId={filters.fuelTypeId}
              onStationClick={setSelectedStation}
            />
          </div>
        )}

        {/* List view */}
        {filters.location && !isLoading && !error && view === 'list' && (
          <div className="absolute inset-0 overflow-y-auto p-4">
            <StationList
              stations={stations}
              activeFuelTypeId={filters.fuelTypeId}
              onStationClick={setSelectedStation}
            />
          </div>
        )}
      </main>

      {/* Station detail drawer */}
      <StationDrawer
        station={selectedStation}
        fuelTypes={fuelTypes}
        activeFuelTypeId={filters.fuelTypeId}
        onClose={() => setSelectedStation(null)}
      />
    </div>
  )
}
