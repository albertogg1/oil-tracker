import { NextResponse } from 'next/server'
import { fetchFuelTypes } from '@/lib/precioil'

export async function GET() {
  try {
    const types = await fetchFuelTypes()
    return NextResponse.json(types)
  } catch (err) {
    console.error('[/api/fuel-types]', err)
    return NextResponse.json({ error: 'Failed to fetch fuel types' }, { status: 500 })
  }
}
