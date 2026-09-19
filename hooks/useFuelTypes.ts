'use client'

import { useQuery } from '@tanstack/react-query'
import type { FuelType } from '@/types'

export function useFuelTypes() {
  return useQuery<FuelType[]>({
    queryKey: ['fuel-types'],
    queryFn: async () => {
      const res = await fetch('/api/fuel-types')
      if (!res.ok) throw new Error('Failed to fetch fuel types')
      return res.json() as Promise<FuelType[]>
    },
  })
}
