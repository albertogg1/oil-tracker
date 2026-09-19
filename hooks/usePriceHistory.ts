'use client'

import { useQuery } from '@tanstack/react-query'
import type { PriceHistoryEntry } from '@/types'

export function usePriceHistory(stationId: number | null, fuelTypeId: number | null) {
  return useQuery<PriceHistoryEntry[]>({
    queryKey: ['price-history', stationId, fuelTypeId],
    queryFn: async () => {
      const res = await fetch(
        `/api/price-history/${stationId}?fuelTypeId=${fuelTypeId}`
      )
      if (!res.ok) throw new Error('Failed to fetch price history')
      return res.json() as Promise<PriceHistoryEntry[]>
    },
    enabled: stationId !== null && fuelTypeId !== null,
  })
}
