'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, Navigation } from 'lucide-react'
import { useGeocoder } from '@/hooks/useGeocoder'
import type { GeoLocation, NominatimResult } from '@/types'

interface SearchBarProps {
  onLocation: (loc: GeoLocation) => void
}

export function SearchBar({ onLocation }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: suggestions = [], isLoading } = useGeocoder(query)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelectSuggestion(result: NominatimResult) {
    setQuery(result.display_name.split(',')[0])
    setOpen(false)
    onLocation({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) })
  }

  function handleUseMyLocation() {
    setGeoError(null)
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setQuery('')
      },
      () => setGeoError('No se pudo obtener tu ubicación. Busca tu ciudad manualmente.')
    )
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin
            className="absolute left-3 top-1/2 -translate-y-1/2 text-apple-gray1"
            size={18}
          />
          <input
            type="text"
            placeholder="Busca una ciudad..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            className="w-full rounded-pill border border-apple-gray3 bg-white py-2.5 pl-9 pr-4 text-sm font-medium shadow-card outline-none transition-shadow focus:shadow-card-hover focus:ring-2 focus:ring-apple-blue/30"
          />
        </div>
        <button
          onClick={handleUseMyLocation}
          title="Usar mi ubicación actual"
          className="flex items-center gap-1.5 rounded-pill bg-apple-blue px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-opacity hover:opacity-90 active:opacity-75"
        >
          <Navigation size={16} />
          <span className="hidden sm:inline">Mi ubicación</span>
        </button>
      </div>

      {geoError && (
        <p className="mt-1.5 text-xs text-apple-red">{geoError}</p>
      )}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-card border border-apple-gray3 bg-white/90 py-1 shadow-card-hover backdrop-blur-xl">
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-apple-bg transition-colors"
                onClick={() => handleSelectSuggestion(s)}
              >
                <span className="font-medium">{s.display_name.split(',')[0]}</span>
                <span className="ml-1 text-apple-gray1 text-xs">
                  {s.display_name.split(',').slice(1, 3).join(',')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && isLoading && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-card border border-apple-gray3 bg-white/90 px-4 py-3 text-sm text-apple-gray1 shadow-card backdrop-blur-xl">
          Buscando...
        </div>
      )}
    </div>
  )
}
