'use client'

import { useQuery } from '@tanstack/react-query'
import type { NominatimResult } from '@/types'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

export function useGeocoder(query: string) {
  return useQuery<NominatimResult[]>({
    queryKey: ['geocoder', query],
    queryFn: async () => {
      if (query.trim().length < 2) return []
      const params = new URLSearchParams({
        q: query,
        countrycodes: 'es',
        format: 'json',
        limit: '5',
      })
      const res = await fetch(`${NOMINATIM_URL}?${params}`, {
        headers: { 'Accept-Language': 'es' },
      })
      if (!res.ok) throw new Error('Geocoder failed')
      return res.json() as Promise<NominatimResult[]>
    },
    enabled: query.trim().length >= 2,
  })
}
