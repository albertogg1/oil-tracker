'use client'

import { Minus, Plus } from 'lucide-react'
import { useFuelTypes } from '@/hooks/useFuelTypes'
import type { SearchFilters } from '@/types'

interface FiltersPanelProps {
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
}

export function FiltersPanel({ filters, onChange }: FiltersPanelProps) {
  const { data: fuelTypes = [], isLoading } = useFuelTypes()

  function setFuelType(value: string) {
    onChange({ ...filters, fuelTypeId: value === 'all' ? null : parseInt(value) })
  }

  function setRadius(value: number) {
    onChange({ ...filters, radius: Math.min(50, Math.max(1, value)) })
  }

  return (
    <div className="flex items-center gap-3 w-full">
      {/* Fuel type selector */}
      <select
        value={filters.fuelTypeId?.toString() ?? 'all'}
        onChange={(e) => setFuelType(e.target.value)}
        disabled={isLoading}
        className="rounded-pill border border-apple-gray3 bg-white px-3 py-2 text-sm font-medium shadow-card outline-none focus:ring-2 focus:ring-apple-blue/30 disabled:opacity-50 shrink-0 max-w-[160px]"
      >
        <option value="all">Todos</option>
        {fuelTypes.map((ft) => (
          <option key={ft.idFuelType} value={ft.idFuelType.toString()}>
            {ft.nombre}
          </option>
        ))}
      </select>

      {/* Radius slider */}
      <div className="flex items-end gap-2 flex-1 min-w-0">
        <button
          onClick={() => setRadius(filters.radius - 1)}
          disabled={filters.radius <= 1}
          className="text-apple-gray1 hover:text-apple-blue active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 pb-px"
        >
          <Minus size={13} />
        </button>
        <div className="relative flex-1 min-w-0 pt-4">
          {/* Tooltip */}
          <div
            className="absolute top-0 -translate-x-1/2 pointer-events-none"
            style={{ left: `calc(${((filters.radius - 1) / 49) * 100}% + ${(0.5 - (filters.radius - 1) / 49) * 14}px)` }}
          >
            <div className="bg-apple-blue text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums whitespace-nowrap">
              {filters.radius} km
            </div>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            step={1}
            value={filters.radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="h-px w-full cursor-pointer appearance-none rounded-full bg-apple-gray3 accent-apple-blue"
          />
        </div>
        <button
          onClick={() => setRadius(filters.radius + 1)}
          disabled={filters.radius >= 50}
          className="text-apple-gray1 hover:text-apple-blue active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 pb-px"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  )
}
