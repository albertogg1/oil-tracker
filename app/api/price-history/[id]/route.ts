import { NextRequest, NextResponse } from 'next/server'
import { fetchPriceHistory } from '@/lib/precioil'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const stationId = parseInt(params.id)
  const fuelTypeId = req.nextUrl.searchParams.get('fuelTypeId')

  if (isNaN(stationId) || !fuelTypeId) {
    return NextResponse.json(
      { error: 'Valid stationId and fuelTypeId are required' },
      { status: 400 }
    )
  }

  try {
    const history = await fetchPriceHistory(stationId, parseInt(fuelTypeId))
    return NextResponse.json(history)
  } catch (err) {
    console.error('[/api/price-history]', err)
    return NextResponse.json({ error: 'Failed to fetch price history' }, { status: 500 })
  }
}
