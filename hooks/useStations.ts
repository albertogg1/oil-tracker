'use client'

import { useQuery } from '@tanstack/react-query'
import type { SearchFilters, Station } from '@/types'

export function useStations(filters: SearchFilters) {
  return useQuery<Station[]>({
    queryKey: ['stations', filters.location?.lat, filters.location?.lng, filters.radius, filters.fuelTypeId],
    queryFn: async () => {
      if (!filters.location) return []
      const params = new URLSearchParams({
        lat: filters.location.lat.toString(),
        lng: filters.location.lng.toString(),
        radius: filters.radius.toString(),
      })
      if (filters.fuelTypeId) params.set('fuelTypeId', filters.fuelTypeId.toString())
      const res = await fetch(`/api/stations?${params}`)
      if (!res.ok) throw new Error('Failed to fetch stations')
      return res.json() as Promise<Station[]>
    },
    enabled: !!filters.location,
  })
}
