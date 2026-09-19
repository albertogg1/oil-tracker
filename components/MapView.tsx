'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet'
import { getPriceColor } from '@/lib/price-color'
import { getActivePrice } from '@/components/StationCard'
import type { Station, GeoLocation } from '@/types'

// Fix Leaflet default icon paths broken by webpack
import L from 'leaflet'
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const PRICE_COLORS: Record<string, string> = {
  green: '#34C759',
  yellow: '#FF9500',
  red: '#FF3B30',
}

function RecenterMap({ center }: { center: GeoLocation }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom())
  }, [center.lat, center.lng, map])
  return null
}

interface MapViewProps {
  stations: Station[]
  center: GeoLocation
  radius: number
  activeFuelTypeId: number | null
  onStationClick: (station: Station) => void
}

export function MapView({ stations, center, radius, activeFuelTypeId, onStationClick }: MapViewProps) {
  const prices = stations
    .map((s) => getActivePrice(s, activeFuelTypeId))
    .filter((p): p is number => p !== null)
  const min = prices.length ? Math.min(...prices) : 0
  const max = prices.length ? Math.max(...prices) : 0

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      className="h-full w-full sm:rounded-card"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />

      {/* Search radius */}
      <Circle
        center={[center.lat, center.lng]}
        radius={radius * 1000}
        pathOptions={{ color: '#007AFF', fillColor: '#007AFF', fillOpacity: 0.12, weight: 1.5, dashArray: '6 4' }}
      />

      {/* User location marker */}
      <CircleMarker
        center={[center.lat, center.lng]}
        radius={8}
        pathOptions={{ color: '#007AFF', fillColor: '#007AFF', fillOpacity: 0.9, weight: 2 }}
      />

      {stations.map((station) => {
        const price = getActivePrice(station, activeFuelTypeId)
        const color = price !== null ? PRICE_COLORS[getPriceColor(price, min, max)] : '#8E8E93'
        return (
          <CircleMarker
            key={station.id}
            center={[station.latitud, station.longitud]}
            radius={10}
            pathOptions={{
              color: '#FFFFFF',
              fillColor: color,
              fillOpacity: 0.95,
              weight: 2,
            }}
            eventHandlers={{ click: () => onStationClick(station) }}
          >
            <Popup>
              <div className="text-sm font-semibold">{station.nombre}</div>
              {price !== null && (
                <div className="text-base font-bold mt-1" style={{ color }}>
                  {price.toFixed(3)} €/L
                </div>
              )}
              <button
                onClick={() => onStationClick(station)}
                className="mt-2 text-xs text-blue-600 underline"
              >
                Ver detalle
              </button>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
