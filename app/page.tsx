'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
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

const DEFAULT_FILTERS: SearchFilters = {
  location: null,
  radius: 10,
  fuelTypeId: null,
}

export default function HomePage() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [view, setView] = useState<ViewMode>('map')
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)

  const { data: stations = [], isLoading, error } = useStations(filters)
  const { data: fuelTypes = [] } = useFuelTypes()

  function handleLocation(loc: GeoLocation) {
    setFilters((prev) => ({ ...prev, location: loc }))
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <header className="z-30 bg-white/80 backdrop-blur-xl border-b border-apple-gray3 px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-bold shrink-0">
            <span className="text-apple-blue">&#9981;</span> Precio Gasolina
          </h1>
          <SearchBar onLocation={handleLocation} />
          <ViewToggle view={view} onChange={setView} />
        </div>
        <FiltersPanel filters={filters} onChange={setFilters} />
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden relative">
        {/* No location state */}
        {!filters.location && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="text-6xl">&#9981;</div>
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
          <div className="absolute inset-0 p-4">
            <MapView
              stations={stations}
              center={filters.location}
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
