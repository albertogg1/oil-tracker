/**
 * @jest-environment node
 */
import { GET } from '@/app/api/stations/route'
import { NextRequest } from 'next/server'

// Mock the server lib — never call real API in tests
jest.mock('@/lib/precioil', () => ({
  fetchStationsByRadius: jest.fn(),
}))

import { fetchStationsByRadius } from '@/lib/precioil'
const mockFetch = fetchStationsByRadius as jest.MockedFunction<typeof fetchStationsByRadius>

describe('GET /api/stations', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 400 when lat/lng are missing', async () => {
    const req = new NextRequest('http://localhost/api/stations')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/lat.*lng/i)
  })

  it('calls fetchStationsByRadius and returns stations', async () => {
    const mockStations = [{ id: 1, nombre: 'Test', precios: [] }]
    mockFetch.mockResolvedValue(mockStations as any)

    const req = new NextRequest(
      'http://localhost/api/stations?lat=40.4168&lng=-3.7038&radius=5'
    )
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(mockStations)
    expect(mockFetch).toHaveBeenCalledWith(40.4168, -3.7038, 5, undefined)
  })

  it('returns 500 when precioil.es call fails', async () => {
    mockFetch.mockRejectedValue(new Error('API down'))

    const req = new NextRequest(
      'http://localhost/api/stations?lat=40.4168&lng=-3.7038&radius=5'
    )
    const res = await GET(req)
    expect(res.status).toBe(500)
  })
})
