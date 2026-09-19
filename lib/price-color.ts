// lib/price-color.ts
import type { PriceColor } from '@/types'

/**
 * Classifies a price into a semaphore color band relative to the
 * min–max range of all currently displayed stations.
 * If min === max (single result or all same price), returns 'green'.
 */
export function getPriceColor(price: number, min: number, max: number): PriceColor {
  if (max === min) return 'green'
  const range = max - min
  const normalized = (price - min) / range
  if (normalized <= 1 / 3) return 'green'
  if (normalized <= 2 / 3) return 'yellow'
  return 'red'
}
