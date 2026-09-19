import { getPriceColor } from '@/lib/price-color'

describe('getPriceColor', () => {
  // range: 1.40 to 1.70, band size = 0.10
  // green: <= 1.50, yellow: <= 1.60, red: > 1.60

  it('returns green for price in the lower third', () => {
    expect(getPriceColor(1.40, 1.40, 1.70)).toBe('green')
    expect(getPriceColor(1.45, 1.40, 1.70)).toBe('green')
  })

  it('returns yellow for price in the middle third', () => {
    expect(getPriceColor(1.55, 1.40, 1.70)).toBe('yellow')
  })

  it('returns red for price in the upper third', () => {
    expect(getPriceColor(1.65, 1.40, 1.70)).toBe('red')
    expect(getPriceColor(1.70, 1.40, 1.70)).toBe('red')
  })

  it('returns green when all prices are equal (no range)', () => {
    expect(getPriceColor(1.50, 1.50, 1.50)).toBe('green')
  })

  it('returns green for the minimum price', () => {
    expect(getPriceColor(1.40, 1.40, 1.70)).toBe('green')
  })

  it('returns red for the maximum price', () => {
    expect(getPriceColor(1.70, 1.40, 1.70)).toBe('red')
  })
})
