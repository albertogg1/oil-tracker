'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { StationCard, getActivePrice } from './StationCard'
import { getPriceColor } from '@/lib/price-color'
import type { Station, SortOrder } from '@/types'

interface StationListProps {
  stations: Station[]
  activeFuelTypeId: number | null
  onStationClick: (station: Station) => void
}

export function StationList({ stations, activeFuelTypeId, onStationClick }: StationListProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>('price')

  const { sorted, min, max } = useMemo(() => {
    const withPrices = stations.map((s) => ({
      station: s,
      price: getActivePrice(s, activeFuelTypeId),
    }))

    const prices = withPrices.map((s) => s.price).filter((p): p is number => p !== null)
    const min = prices.length ? Math.min(...prices) : 0
    const max = prices.length ? Math.max(...prices) : 0

    const sorted = [...withPrices].sort((a, b) => {
      if (sortOrder === 'price') {
        if (a.price === null) return 1
        if (b.price === null) return -1
        return a.price - b.price
      }
      // distance
      const da = a.station.distancia ?? Infinity
      const db = b.station.distancia ?? Infinity
      return da - db
    })

    return { sorted, min, max }
  }, [stations, activeFuelTypeId, sortOrder])

  if (stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-apple-gray1">
        <p className="text-base font-medium">No se encontraron gasolineras</p>
        <p className="text-sm mt-1">Prueba a aumentar el radio de búsqueda</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <ArrowUpDown size={14} className="text-apple-gray1" />
        <span className="text-xs text-apple-gray1 font-medium">Ordenar por:</span>
        <div className="flex rounded-pill border border-apple-gray3 overflow-hidden">
          {(['price', 'distance'] as SortOrder[]).map((order) => (
            <button
              key={order}
              onClick={() => setSortOrder(order)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                sortOrder === order
                  ? 'bg-apple-blue text-white'
                  : 'bg-white text-apple-gray1 hover:bg-apple-bg'
              }`}
            >
              {order === 'price' ? 'Precio' : 'Distancia'}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {sorted.map(({ station, price }) => (
        <StationCard
          key={station.id}
          station={station}
          activeFuelTypeId={activeFuelTypeId}
          priceColor={price !== null ? getPriceColor(price, min, max) : 'green'}
          onClick={() => onStationClick(station)}
        />
      ))}
    </div>
  )
}
