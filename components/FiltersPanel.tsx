'use client'

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
    onChange({ ...filters, radius: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Fuel type selector */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-apple-gray1 uppercase tracking-wide">
          Combustible
        </label>
        <select
          value={filters.fuelTypeId?.toString() ?? 'all'}
          onChange={(e) => setFuelType(e.target.value)}
          disabled={isLoading}
          className="rounded-pill border border-apple-gray3 bg-white px-4 py-2 text-sm font-medium shadow-card outline-none focus:ring-2 focus:ring-apple-blue/30 disabled:opacity-50"
        >
          <option value="all">Todos los combustibles</option>
          {fuelTypes.map((ft) => (
            <option key={ft.id} value={ft.id.toString()}>
              {ft.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Radius slider */}
      <div className="flex flex-col gap-1 min-w-[180px]">
        <label className="flex justify-between text-xs font-medium text-apple-gray1 uppercase tracking-wide">
          <span>Radio</span>
          <span className="text-apple-blue font-semibold">{filters.radius} km</span>
        </label>
        <input
          type="range"
          min={5}
          max={50}
          step={5}
          value={filters.radius}
          onChange={(e) => setRadius(parseInt(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-apple-gray3 accent-apple-blue"
        />
        <div className="flex justify-between text-xs text-apple-gray2">
          <span>5 km</span>
          <span>50 km</span>
        </div>
      </div>
    </div>
  )
}
