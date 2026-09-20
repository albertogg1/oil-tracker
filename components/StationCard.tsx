'use client'

import { MapPin } from 'lucide-react'
import type { Station, PriceColor } from '@/types'

interface StationCardProps {
  station: Station
  activeFuelTypeId: number | null
  priceColor: PriceColor
  onClick: () => void
}

const colorClasses: Record<PriceColor, string> = {
  green: 'bg-apple-green/10 text-apple-green border-apple-green/20',
  yellow: 'bg-apple-yellow/10 text-apple-yellow border-apple-yellow/20',
  red: 'bg-apple-red/10 text-apple-red border-apple-red/20',
}

export function getActivePrice(
  station: Station,
  fuelTypeId: number | null
): number | null {
  if (!fuelTypeId) {
    // Show lowest available price when no fuel filter active
    const prices = station.precios.map((p) => p.precio).filter((p): p is number => p !== null)
    return prices.length ? Math.min(...prices) : null
  }
  const match = station.precios.find((p) => p.idFuelType === fuelTypeId)
  return match?.precio ?? null
}

export function StationCard({ station, activeFuelTypeId, priceColor, onClick }: StationCardProps) {
  const price = getActivePrice(station, activeFuelTypeId)

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-card bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{station.nombre}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={12} className="text-apple-gray1 shrink-0" />
            <a
              href={`geo:${station.latitud},${station.longitud}?q=${station.latitud},${station.longitud}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-apple-gray1 truncate hover:text-apple-blue hover:underline"
            >
              {station.direccion}
            </a>
          </div>
          <p className="text-xs text-apple-gray2 mt-0.5">{station.municipio}</p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {price !== null ? (
            <span
              className={`rounded-full border px-3 py-1 text-sm font-bold tabular-nums ${colorClasses[priceColor]}`}
            >
              {price.toFixed(3)} €/L
            </span>
          ) : (
            <span className="rounded-full border border-apple-gray3 px-3 py-1 text-xs text-apple-gray1">
              Sin precio
            </span>
          )}
          {station.distancia !== undefined && (
            <span className="text-xs text-apple-gray2">{station.distancia.toFixed(1)} km</span>
          )}
        </div>
      </div>
    </button>
  )
}
