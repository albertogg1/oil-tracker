import { NextRequest, NextResponse } from 'next/server'
import { fetchStationsByRadius } from '@/lib/precioil'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius') ?? '5'
  const fuelTypeId = searchParams.get('fuelTypeId')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  try {
    const stations = await fetchStationsByRadius(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius),
      fuelTypeId ? parseInt(fuelTypeId) : undefined
    )
    return NextResponse.json(stations)
  } catch (err) {
    console.error('[/api/stations]', err)
    return NextResponse.json({ error: 'Failed to fetch stations' }, { status: 500 })
  }
}
