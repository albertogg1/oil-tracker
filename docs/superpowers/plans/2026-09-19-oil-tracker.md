# Oil Tracker — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a gas price tracking web app for Spain with map + list views, fuel type filters, geolocation, and price history charts, deployed on Vercel.

**Architecture:** Next.js 14 App Router with server-side API Routes proxying all precioil.es calls (keeping API key server-only). Client state managed with TanStack Query v5. UI: Leaflet map + sortable card list + Framer Motion slide drawer with Recharts chart. Tailwind CSS with Apple-inspired design tokens throughout.

**Tech Stack:** Next.js 14 (App Router), TypeScript strict, Tailwind CSS, shadcn/ui, TanStack Query v5, Leaflet + react-leaflet, Recharts, Framer Motion, Jest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-09-19-oil-tracker-design.md`

## Global Constraints

- Node.js >= 18
- Next.js 14 with App Router (not Pages Router)
- TypeScript strict mode enabled
- `PRECIOIL_API_KEY` must NEVER appear in any client-side code or bundle
- All precioil.es HTTP calls live exclusively in `lib/precioil.ts` and are called only from `app/api/` routes
- Leaflet MapView must be dynamically imported with `{ ssr: false }` to avoid SSR crashes
- All Tailwind classes; no inline `style={}` except for dynamic values Tailwind cannot express (e.g. computed percentage widths)
- Spain only: Nominatim geocoder always uses `countrycodes=es`
- `staleTime: 5 * 60 * 1000` and `gcTime: 10 * 60 * 1000` on all TanStack Query calls
- Vercel deployment: `PRECIOIL_API_KEY` is added in Vercel → Settings → Environment Variables

## File Map

```
oil-tracker/
├── app/
│   ├── layout.tsx                        ← Root layout, Inter font, QueryProvider, Apple bg
│   ├── globals.css                       ← Leaflet CSS import, base resets
│   ├── page.tsx                          ← Main page: state, geolocation, wires all components
│   └── api/
│       ├── stations/route.ts             ← GET proxy → /estaciones/radio
│       ├── fuel-types/route.ts           ← GET proxy → /fuel-types
│       └── price-history/[id]/route.ts   ← GET proxy → /cambios/precios/historico
├── components/
│   ├── providers/
│   │   └── QueryProvider.tsx             ← TanStack Query client wrapper
│   ├── SearchBar.tsx                     ← City search (Nominatim suggestions) + geolocation btn
│   ├── FiltersPanel.tsx                  ← Fuel type select + radius slider (5–50 km)
│   ├── ViewToggle.tsx                    ← Map / List tab switch
│   ├── MapView.tsx                       ← react-leaflet map with colored markers
│   ├── StationCard.tsx                   ← Individual station card with semaphore price badge
│   ├── StationList.tsx                   ← Sortable list of StationCards
│   └── StationDrawer.tsx                 ← Framer Motion slide panel with detail + Recharts chart
├── hooks/
│   ├── useStations.ts                    ← TanStack Query: GET /api/stations
│   ├── useFuelTypes.ts                   ← TanStack Query: GET /api/fuel-types
│   ├── usePriceHistory.ts                ← TanStack Query: GET /api/price-history/[id]
│   └── useGeocoder.ts                    ← TanStack Query: Nominatim city → {lat, lng}[]
├── lib/
│   ├── precioil.ts                       ← Server-only fetch helpers (uses PRECIOIL_API_KEY)
│   └── price-color.ts                    ← Pure utility: classify price into green/yellow/red band
├── types/
│   └── index.ts                          ← All shared TypeScript types
├── __tests__/
│   ├── price-color.test.ts               ← Unit tests for price-color.ts
│   └── api-stations.test.ts              ← Unit tests for /api/stations route handler
├── .env.local                            ← PRECIOIL_API_KEY (gitignored)
├── .gitignore
├── tailwind.config.ts
├── jest.config.ts
└── jest.setup.ts
```

---

### Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `oil-tracker/` (entire project scaffold)
- Create: `tailwind.config.ts`
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Create: `.env.local`
- Modify: `.gitignore`

**Interfaces:**
- Produces: runnable `npm run dev`, `npm test`, configured Tailwind with Apple tokens

> **IMPORTANT:** The exact field names in precioil.es API responses are not verified in this plan.
> Before implementing Task 3, call one endpoint manually with your API key and inspect the JSON shape.
> Adjust types in `types/index.ts` accordingly.
> Authentication mechanism (header vs query param) must also be verified from the API docs.

- [ ] **Step 1: Create Next.js app**

Run from the parent directory `D:/alberto/`:
```bash
npx create-next-app@14 "oil tracker" \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-eslint
```

- [ ] **Step 2: Install all dependencies**

```bash
cd "D:/alberto/oil tracker"
npm install \
  @tanstack/react-query@5 \
  leaflet \
  react-leaflet \
  recharts \
  framer-motion \
  @radix-ui/react-slider \
  @radix-ui/react-select \
  @radix-ui/react-dialog \
  lucide-react

npm install --save-dev \
  @types/leaflet \
  jest \
  jest-environment-jsdom \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  ts-jest \
  @types/jest
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```
When prompted:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

Then add needed components:
```bash
npx shadcn@latest add button input badge select slider
```

- [ ] **Step 4: Configure Tailwind with Apple design tokens**

Replace `tailwind.config.ts` with:
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#F5F5F7',
          surface: '#FFFFFF',
          gray1: '#8E8E93',
          gray2: '#AEAEB2',
          gray3: '#C7C7CC',
          blue: '#007AFF',
          green: '#34C759',
          yellow: '#FF9500',
          red: '#FF3B30',
        },
      },
      borderRadius: {
        card: '18px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 2px 20px rgba(0,0,0,0.07)',
        'card-hover': '0 4px 30px rgba(0,0,0,0.12)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

Install the animate plugin:
```bash
npm install tailwindcss-animate
```

- [ ] **Step 5: Configure Jest**

Create `jest.config.ts`:
```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default createJestConfig(config)
```

Create `jest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 6: Create .env.local**

Create `.env.local`:
```
PRECIOIL_API_KEY=your_api_key_here
```

- [ ] **Step 7: Update .gitignore**

Verify `.gitignore` contains (add if missing):
```
.env.local
.env*.local
```

- [ ] **Step 8: Verify scaffold works**

```bash
npm run dev
```
Expected: Next.js dev server starts at http://localhost:3000 with no errors.

- [ ] **Step 9: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js 14 project with Tailwind, shadcn/ui, jest"
```

---

### Task 2: Shared TypeScript Types

**Files:**
- Create: `types/index.ts`

**Interfaces:**
- Produces: All types used across the app. Every subsequent task imports from here.

> **NOTE:** Verify these field names match actual precioil.es API responses before Task 3.
> Call `GET /estaciones/radio?lat=40.4168&lng=-3.7038&radio=5` and inspect the JSON.

- [ ] **Step 1: Create types/index.ts**

```typescript
// types/index.ts

export interface FuelType {
  id: number
  nombre: string
}

export interface StationPrice {
  idFuelType: number
  nombre: string
  precio: number | null
}

export interface Station {
  id: number
  nombre: string
  direccion: string
  municipio: string
  provincia: string
  latitud: number
  longitud: number
  distancia?: number          // km from search center, present in /radio responses
  precios: StationPrice[]
}

export interface PriceHistoryEntry {
  fecha: string              // ISO 8601 datetime string
  precio: number
  idFuelType: number
}

export interface GeoLocation {
  lat: number
  lng: number
}

export interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

export interface SearchFilters {
  location: GeoLocation | null
  radius: number              // km, 5–50
  fuelTypeId: number | null
}

export type SortOrder = 'price' | 'distance'
export type ViewMode = 'map' | 'list'
export type PriceColor = 'green' | 'yellow' | 'red'
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

### Task 3: Price Color Utility + Server API Client

**Files:**
- Create: `lib/price-color.ts`
- Create: `lib/precioil.ts`
- Create: `__tests__/price-color.test.ts`

**Interfaces:**
- Consumes: `PriceColor`, `Station`, `StationPrice`, `PriceHistoryEntry`, `FuelType` from `types/index.ts`
- Produces:
  - `getPriceColor(price: number, min: number, max: number): PriceColor`
  - `fetchStationsByRadius(lat: number, lng: number, radius: number, fuelTypeId?: number): Promise<Station[]>`
  - `fetchFuelTypes(): Promise<FuelType[]>`
  - `fetchPriceHistory(stationId: number, fuelTypeId: number): Promise<PriceHistoryEntry[]>`

- [ ] **Step 1: Write failing tests for getPriceColor**

Create `__tests__/price-color.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- --testPathPattern=price-color
```
Expected: FAIL — "Cannot find module '@/lib/price-color'"

- [ ] **Step 3: Implement lib/price-color.ts**

```typescript
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
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- --testPathPattern=price-color
```
Expected: PASS, 6 tests.

- [ ] **Step 5: Create lib/precioil.ts**

> **IMPORTANT:** Verify the authentication mechanism against your API docs.
> The placeholder below uses `X-Api-Key` header. If the API uses a query param
> (e.g. `?apiKey=xxx`), adjust `buildHeaders` and `buildUrl` accordingly.

```typescript
// lib/precioil.ts
// SERVER-ONLY — never import this from client components or hooks

import type { Station, FuelType, PriceHistoryEntry } from '@/types'

const BASE_URL = 'https://api.precioil.es'

function getApiKey(): string {
  const key = process.env.PRECIOIL_API_KEY
  if (!key) throw new Error('PRECIOIL_API_KEY is not set')
  return key
}

function buildHeaders(): HeadersInit {
  return {
    'X-Api-Key': getApiKey(),
    'Content-Type': 'application/json',
  }
}

export async function fetchStationsByRadius(
  lat: number,
  lng: number,
  radius: number,
  fuelTypeId?: number
): Promise<Station[]> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radio: radius.toString(),
    response: 'full',
  })
  if (fuelTypeId) params.set('idFuelType', fuelTypeId.toString())

  const res = await fetch(`${BASE_URL}/estaciones/radio?${params}`, {
    headers: buildHeaders(),
    next: { revalidate: 300 }, // 5 min cache at the edge
  })

  if (!res.ok) {
    throw new Error(`precioil.es /estaciones/radio returned ${res.status}`)
  }

  return res.json() as Promise<Station[]>
}

export async function fetchFuelTypes(): Promise<FuelType[]> {
  const res = await fetch(`${BASE_URL}/fuel-types`, {
    headers: buildHeaders(),
    next: { revalidate: 3600 }, // 1 hour — fuel types rarely change
  })

  if (!res.ok) {
    throw new Error(`precioil.es /fuel-types returned ${res.status}`)
  }

  return res.json() as Promise<FuelType[]>
}

export async function fetchPriceHistory(
  stationId: number,
  fuelTypeId: number
): Promise<PriceHistoryEntry[]> {
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  const params = new URLSearchParams({
    idEstacion: stationId.toString(),
    idFuelType: fuelTypeId.toString(),
    fechaInicio: thirtyDaysAgo.toISOString().split('T')[0],
    fechaFin: today.toISOString().split('T')[0],
  })

  const res = await fetch(`${BASE_URL}/cambios/precios/historico?${params}`, {
    headers: buildHeaders(),
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error(`precioil.es /cambios/precios/historico returned ${res.status}`)
  }

  return res.json() as Promise<PriceHistoryEntry[]>
}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add lib/ __tests__/price-color.test.ts
git commit -m "feat: add price-color utility and precioil.es server client"
```

---

### Task 4: API Route Handlers

**Files:**
- Create: `app/api/stations/route.ts`
- Create: `app/api/fuel-types/route.ts`
- Create: `app/api/price-history/[id]/route.ts`
- Create: `__tests__/api-stations.test.ts`

**Interfaces:**
- Consumes: `fetchStationsByRadius`, `fetchFuelTypes`, `fetchPriceHistory` from `lib/precioil.ts`
- Produces:
  - `GET /api/stations?lat=&lng=&radius=&fuelTypeId=` → `Station[]` JSON
  - `GET /api/fuel-types` → `FuelType[]` JSON
  - `GET /api/price-history/[id]?fuelTypeId=` → `PriceHistoryEntry[]` JSON

- [ ] **Step 1: Write failing test for /api/stations route**

Create `__tests__/api-stations.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- --testPathPattern=api-stations
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create app/api/stations/route.ts**

```typescript
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
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- --testPathPattern=api-stations
```
Expected: PASS, 3 tests.

- [ ] **Step 5: Create app/api/fuel-types/route.ts**

```typescript
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
```

- [ ] **Step 6: Create app/api/price-history/[id]/route.ts**

```typescript
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
```

- [ ] **Step 7: Verify all tests pass**

```bash
npm test
```
Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add app/api/ __tests__/api-stations.test.ts
git commit -m "feat: add API route proxy handlers for precioil.es"
```

---

### Task 5: React Query Provider + Hooks

**Files:**
- Create: `components/providers/QueryProvider.tsx`
- Create: `hooks/useStations.ts`
- Create: `hooks/useFuelTypes.ts`
- Create: `hooks/usePriceHistory.ts`
- Create: `hooks/useGeocoder.ts`

**Interfaces:**
- Consumes: `Station`, `FuelType`, `PriceHistoryEntry`, `GeoLocation`, `NominatimResult`, `SearchFilters` from `types/index.ts`
- Produces:
  - `<QueryProvider>` — wraps app with QueryClient
  - `useStations(filters: SearchFilters)` → `{ data: Station[], isLoading, error }`
  - `useFuelTypes()` → `{ data: FuelType[], isLoading }`
  - `usePriceHistory(stationId: number | null, fuelTypeId: number | null)` → `{ data: PriceHistoryEntry[], isLoading }`
  - `useGeocoder(query: string)` → `{ data: NominatimResult[], isLoading }`

- [ ] **Step 1: Create QueryProvider**

```typescript
// components/providers/QueryProvider.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
```

- [ ] **Step 2: Create hooks/useStations.ts**

```typescript
// hooks/useStations.ts
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
      return res.json()
    },
    enabled: !!filters.location,
  })
}
```

- [ ] **Step 3: Create hooks/useFuelTypes.ts**

```typescript
// hooks/useFuelTypes.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import type { FuelType } from '@/types'

export function useFuelTypes() {
  return useQuery<FuelType[]>({
    queryKey: ['fuel-types'],
    queryFn: async () => {
      const res = await fetch('/api/fuel-types')
      if (!res.ok) throw new Error('Failed to fetch fuel types')
      return res.json()
    },
  })
}
```

- [ ] **Step 4: Create hooks/usePriceHistory.ts**

```typescript
// hooks/usePriceHistory.ts
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
      return res.json()
    },
    enabled: stationId !== null && fuelTypeId !== null,
  })
}
```

- [ ] **Step 5: Create hooks/useGeocoder.ts**

```typescript
// hooks/useGeocoder.ts
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
      return res.json()
    },
    enabled: query.trim().length >= 2,
  })
}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add components/providers/ hooks/
git commit -m "feat: add QueryProvider and TanStack Query hooks"
```

---

### Task 6: Layout + Global Styles

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `QueryProvider` from `components/providers/QueryProvider.tsx`
- Produces: Root layout with Inter font, apple-bg background, QueryProvider, Leaflet CSS imported

- [ ] **Step 1: Update app/globals.css**

Replace `app/globals.css` content with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Leaflet CSS — required for the map to render correctly */
@import 'leaflet/dist/leaflet.css';

@layer base {
  html {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'San Francisco',
      'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    background-color: #F5F5F7;
    color: #1D1D1F;
  }
}
```

- [ ] **Step 2: Update app/layout.tsx**

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Precio Gasolina — España',
  description: 'Consulta y compara precios de combustible en tiempo real',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Start dev server and verify**

```bash
npm run dev
```
Open http://localhost:3000 — should show default Next.js page with no console errors.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: configure root layout with Inter font, Apple background, QueryProvider"
```

---

### Task 7: SearchBar Component

**Files:**
- Create: `components/SearchBar.tsx`

**Interfaces:**
- Consumes: `useGeocoder` from `hooks/useGeocoder.ts`; `NominatimResult`, `GeoLocation` from `types/index.ts`
- Produces:
  - `<SearchBar onLocation={(loc: GeoLocation) => void} />`
  - Shows city search input with dropdown suggestions from Nominatim
  - Shows "Usar mi ubicación" button that triggers `navigator.geolocation`

- [ ] **Step 1: Create components/SearchBar.tsx**

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, Navigation } from 'lucide-react'
import { useGeocoder } from '@/hooks/useGeocoder'
import type { GeoLocation } from '@/types'

interface SearchBarProps {
  onLocation: (loc: GeoLocation) => void
}

export function SearchBar({ onLocation }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: suggestions = [], isLoading } = useGeocoder(query)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelectSuggestion(result: { lat: string; lon: string; display_name: string }) {
    setQuery(result.display_name.split(',')[0])
    setOpen(false)
    onLocation({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) })
  }

  function handleUseMyLocation() {
    setGeoError(null)
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setQuery('')
      },
      () => setGeoError('No se pudo obtener tu ubicación. Busca tu ciudad manualmente.')
    )
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin
            className="absolute left-3 top-1/2 -translate-y-1/2 text-apple-gray1"
            size={18}
          />
          <input
            type="text"
            placeholder="Busca una ciudad..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            className="w-full rounded-pill border border-apple-gray3 bg-white py-2.5 pl-9 pr-4 text-sm font-medium shadow-card outline-none transition-shadow focus:shadow-card-hover focus:ring-2 focus:ring-apple-blue/30"
          />
        </div>
        <button
          onClick={handleUseMyLocation}
          title="Usar mi ubicación actual"
          className="flex items-center gap-1.5 rounded-pill bg-apple-blue px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-opacity hover:opacity-90 active:opacity-75"
        >
          <Navigation size={16} />
          <span className="hidden sm:inline">Mi ubicación</span>
        </button>
      </div>

      {geoError && (
        <p className="mt-1.5 text-xs text-apple-red">{geoError}</p>
      )}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-card border border-apple-gray3 bg-white/90 py-1 shadow-card-hover backdrop-blur-xl">
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-apple-bg transition-colors"
                onClick={() => handleSelectSuggestion(s)}
              >
                <span className="font-medium">{s.display_name.split(',')[0]}</span>
                <span className="ml-1 text-apple-gray1 text-xs">
                  {s.display_name.split(',').slice(1, 3).join(',')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && isLoading && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-card border border-apple-gray3 bg-white/90 px-4 py-3 text-sm text-apple-gray1 shadow-card backdrop-blur-xl">
          Buscando...
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/SearchBar.tsx
git commit -m "feat: add SearchBar with Nominatim city suggestions and geolocation button"
```

---

### Task 8: FiltersPanel Component

**Files:**
- Create: `components/FiltersPanel.tsx`

**Interfaces:**
- Consumes: `useFuelTypes` from `hooks/useFuelTypes.ts`; `SearchFilters` from `types/index.ts`
- Produces:
  - `<FiltersPanel filters={SearchFilters} onChange={(f: SearchFilters) => void} />`
  - Fuel type select dropdown + radius slider (5–50 km)

- [ ] **Step 1: Create components/FiltersPanel.tsx**

```typescript
'use client'

import { useFuelTypes } from '@/hooks/useFuelTypes'
import type { SearchFilters } from '@/types'

interface FiltersPanelProps {
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
}

export function FiltersPanel({ filters, onChange }: FiltersPanelProps) {
  const { data: fuelTypes = [], isLoading } = useFuelTypes()

  function setFuelType(value: string) {
    onChange({ ...filters, fuelTypeId: value === 'all' ? null : parseInt(value) })
  }

  function setRadius(value: number) {
    onChange({ ...filters, radius: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Fuel type selector */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-apple-gray1 uppercase tracking-wide">
          Combustible
        </label>
        <select
          value={filters.fuelTypeId?.toString() ?? 'all'}
          onChange={(e) => setFuelType(e.target.value)}
          disabled={isLoading}
          className="rounded-pill border border-apple-gray3 bg-white px-4 py-2 text-sm font-medium shadow-card outline-none focus:ring-2 focus:ring-apple-blue/30 disabled:opacity-50"
        >
          <option value="all">Todos los combustibles</option>
          {fuelTypes.map((ft) => (
            <option key={ft.id} value={ft.id.toString()}>
              {ft.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Radius slider */}
      <div className="flex flex-col gap-1 min-w-[180px]">
        <label className="flex justify-between text-xs font-medium text-apple-gray1 uppercase tracking-wide">
          <span>Radio</span>
          <span className="text-apple-blue font-semibold">{filters.radius} km</span>
        </label>
        <input
          type="range"
          min={5}
          max={50}
          step={5}
          value={filters.radius}
          onChange={(e) => setRadius(parseInt(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-apple-gray3 accent-apple-blue"
        />
        <div className="flex justify-between text-xs text-apple-gray2">
          <span>5 km</span>
          <span>50 km</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/FiltersPanel.tsx
git commit -m "feat: add FiltersPanel with fuel type select and radius slider"
```

---

### Task 9: StationCard + StationList Components

**Files:**
- Create: `components/StationCard.tsx`
- Create: `components/StationList.tsx`

**Interfaces:**
- Consumes: `Station`, `StationPrice`, `PriceColor`, `SortOrder` from `types/index.ts`; `getPriceColor` from `lib/price-color.ts`
- Produces:
  - `<StationCard station={Station} activeFuelTypeId={number|null} priceColor={PriceColor} onClick={() => void} />`
  - `<StationList stations={Station[]} activeFuelTypeId={number|null} onStationClick={(s: Station) => void} />`
  - `getActivePrice(station: Station, fuelTypeId: number | null): number | null` (local helper)

- [ ] **Step 1: Create components/StationCard.tsx**

```typescript
'use client'

import { MapPin, Fuel } from 'lucide-react'
import type { Station, PriceColor } from '@/types'

interface StationCardProps {
  station: Station
  activeFuelTypeId: number | null
  priceColor: PriceColor
  onClick: () => void
}

const colorClasses: Record<PriceColor, string> = {
  green: 'bg-apple-green/10 text-apple-green border-apple-green/20',
  yellow: 'bg-apple-yellow/10 text-apple-yellow border-apple-yellow/20',
  red: 'bg-apple-red/10 text-apple-red border-apple-red/20',
}

export function getActivePrice(
  station: Station,
  fuelTypeId: number | null
): number | null {
  if (!fuelTypeId) {
    // Show lowest available price when no fuel filter active
    const prices = station.precios.map((p) => p.precio).filter((p): p is number => p !== null)
    return prices.length ? Math.min(...prices) : null
  }
  const match = station.precios.find((p) => p.idFuelType === fuelTypeId)
  return match?.precio ?? null
}

export function StationCard({ station, activeFuelTypeId, priceColor, onClick }: StationCardProps) {
  const price = getActivePrice(station, activeFuelTypeId)

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-card bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{station.nombre}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={12} className="text-apple-gray1 shrink-0" />
            <p className="text-xs text-apple-gray1 truncate">{station.direccion}</p>
          </div>
          <p className="text-xs text-apple-gray2 mt-0.5">{station.municipio}</p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {price !== null ? (
            <span
              className={`rounded-full border px-3 py-1 text-sm font-bold tabular-nums ${colorClasses[priceColor]}`}
            >
              {price.toFixed(3)} €/L
            </span>
          ) : (
            <span className="rounded-full border border-apple-gray3 px-3 py-1 text-xs text-apple-gray1">
              Sin precio
            </span>
          )}
          {station.distancia !== undefined && (
            <span className="text-xs text-apple-gray2">{station.distancia.toFixed(1)} km</span>
          )}
        </div>
      </div>
    </button>
  )
}
```

- [ ] **Step 2: Create components/StationList.tsx**

```typescript
'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { StationCard, getActivePrice } from './StationCard'
import { getPriceColor } from '@/lib/price-color'
import type { Station, SortOrder } from '@/types'

interface StationListProps {
  stations: Station[]
  activeFuelTypeId: number | null
  onStationClick: (station: Station) => void
}

export function StationList({ stations, activeFuelTypeId, onStationClick }: StationListProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>('price')

  const { sorted, min, max } = useMemo(() => {
    const withPrices = stations.map((s) => ({
      station: s,
      price: getActivePrice(s, activeFuelTypeId),
    }))

    const prices = withPrices.map((s) => s.price).filter((p): p is number => p !== null)
    const min = prices.length ? Math.min(...prices) : 0
    const max = prices.length ? Math.max(...prices) : 0

    const sorted = [...withPrices].sort((a, b) => {
      if (sortOrder === 'price') {
        if (a.price === null) return 1
        if (b.price === null) return -1
        return a.price - b.price
      }
      // distance
      const da = a.station.distancia ?? Infinity
      const db = b.station.distancia ?? Infinity
      return da - db
    })

    return { sorted, min, max }
  }, [stations, activeFuelTypeId, sortOrder])

  if (stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-apple-gray1">
        <p className="text-base font-medium">No se encontraron gasolineras</p>
        <p className="text-sm mt-1">Prueba a aumentar el radio de búsqueda</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <ArrowUpDown size={14} className="text-apple-gray1" />
        <span className="text-xs text-apple-gray1 font-medium">Ordenar por:</span>
        <div className="flex rounded-pill border border-apple-gray3 overflow-hidden">
          {(['price', 'distance'] as SortOrder[]).map((order) => (
            <button
              key={order}
              onClick={() => setSortOrder(order)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                sortOrder === order
                  ? 'bg-apple-blue text-white'
                  : 'bg-white text-apple-gray1 hover:bg-apple-bg'
              }`}
            >
              {order === 'price' ? 'Precio' : 'Distancia'}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {sorted.map(({ station, price }) => (
        <StationCard
          key={station.id}
          station={station}
          activeFuelTypeId={activeFuelTypeId}
          priceColor={price !== null ? getPriceColor(price, min, max) : 'green'}
          onClick={() => onStationClick(station)}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add components/StationCard.tsx components/StationList.tsx
git commit -m "feat: add StationCard and StationList with price semaphore and sort"
```

---

### Task 10: MapView Component

**Files:**
- Create: `components/MapView.tsx`

**Interfaces:**
- Consumes: `Station`, `GeoLocation`, `PriceColor` from `types/index.ts`; `getPriceColor` from `lib/price-color.ts`; `getActivePrice` from `components/StationCard.tsx`
- Produces:
  - `<MapView stations={Station[]} center={GeoLocation} activeFuelTypeId={number|null} onStationClick={(s: Station) => void} />`
  - Must be dynamically imported with `{ ssr: false }` by the consumer (page.tsx)

> **LEAFLET SSR NOTE:** This component uses `window` and DOM APIs. It must never be rendered on the server.
> In page.tsx, import it as:
> ```typescript
> const MapView = dynamic(() => import('@/components/MapView').then(m => m.MapView), { ssr: false })
> ```

- [ ] **Step 1: Create components/MapView.tsx**

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { getPriceColor } from '@/lib/price-color'
import { getActivePrice } from '@/components/StationCard'
import type { Station, GeoLocation } from '@/types'

// Fix Leaflet default icon paths broken by webpack
import L from 'leaflet'
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const PRICE_COLORS: Record<string, string> = {
  green: '#34C759',
  yellow: '#FF9500',
  red: '#FF3B30',
}

function RecenterMap({ center }: { center: GeoLocation }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom())
  }, [center.lat, center.lng, map])
  return null
}

interface MapViewProps {
  stations: Station[]
  center: GeoLocation
  activeFuelTypeId: number | null
  onStationClick: (station: Station) => void
}

export function MapView({ stations, center, activeFuelTypeId, onStationClick }: MapViewProps) {
  const prices = stations
    .map((s) => getActivePrice(s, activeFuelTypeId))
    .filter((p): p is number => p !== null)
  const min = prices.length ? Math.min(...prices) : 0
  const max = prices.length ? Math.max(...prices) : 0

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      className="h-full w-full rounded-card"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />

      {/* User location marker */}
      <CircleMarker
        center={[center.lat, center.lng]}
        radius={8}
        pathOptions={{ color: '#007AFF', fillColor: '#007AFF', fillOpacity: 0.9, weight: 2 }}
      />

      {stations.map((station) => {
        const price = getActivePrice(station, activeFuelTypeId)
        const color = price !== null ? PRICE_COLORS[getPriceColor(price, min, max)] : '#8E8E93'
        return (
          <CircleMarker
            key={station.id}
            center={[station.latitud, station.longitud]}
            radius={10}
            pathOptions={{
              color: '#FFFFFF',
              fillColor: color,
              fillOpacity: 0.95,
              weight: 2,
            }}
            eventHandlers={{ click: () => onStationClick(station) }}
          >
            <Popup>
              <div className="text-sm font-semibold">{station.nombre}</div>
              {price !== null && (
                <div className="text-base font-bold mt-1" style={{ color }}>
                  {price.toFixed(3)} €/L
                </div>
              )}
              <button
                onClick={() => onStationClick(station)}
                className="mt-2 text-xs text-blue-600 underline"
              >
                Ver detalle
              </button>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/MapView.tsx
git commit -m "feat: add Leaflet MapView with color-coded station markers"
```

---

### Task 11: StationDrawer Component

**Files:**
- Create: `components/StationDrawer.tsx`

**Interfaces:**
- Consumes: `usePriceHistory` from `hooks/usePriceHistory.ts`; `Station`, `FuelType`, `PriceHistoryEntry` from `types/index.ts`; `getActivePrice` from `components/StationCard.tsx`
- Produces:
  - `<StationDrawer station={Station | null} fuelTypes={FuelType[]} activeFuelTypeId={number|null} onClose={() => void} />`
  - Slides in from the right using Framer Motion
  - Shows station details, current price badge, and 30-day Recharts LineChart

- [ ] **Step 1: Create components/StationDrawer.tsx**

```typescript
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, MapPin, Fuel, TrendingUp } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { usePriceHistory } from '@/hooks/usePriceHistory'
import { getActivePrice } from '@/components/StationCard'
import type { Station, FuelType } from '@/types'

interface StationDrawerProps {
  station: Station | null
  fuelTypes: FuelType[]
  activeFuelTypeId: number | null
  onClose: () => void
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

export function StationDrawer({
  station,
  fuelTypes,
  activeFuelTypeId,
  onClose,
}: StationDrawerProps) {
  // Use activeFuelTypeId or fallback to the first fuel type the station has
  const chartFuelTypeId =
    activeFuelTypeId ??
    (station?.precios[0]?.idFuelType ?? null)

  const { data: history = [], isLoading: historyLoading } = usePriceHistory(
    station?.id ?? null,
    chartFuelTypeId
  )

  const currentPrice = station ? getActivePrice(station, activeFuelTypeId) : null
  const fuelTypeName = fuelTypes.find((f) => f.id === chartFuelTypeId)?.nombre

  const chartData = history.map((entry) => ({
    date: formatDate(entry.fecha),
    precio: entry.precio,
  }))

  return (
    <AnimatePresence>
      {station && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 p-6 border-b border-apple-gray3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold leading-tight truncate">{station.nombre}</h2>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={13} className="text-apple-gray1 shrink-0" />
                  <p className="text-sm text-apple-gray1 truncate">{station.direccion}</p>
                </div>
                <p className="text-sm text-apple-gray2 mt-0.5">{station.municipio}, {station.provincia}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-apple-bg p-2 text-apple-gray1 hover:bg-apple-gray3 transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current price */}
            {currentPrice !== null && (
              <div className="px-6 py-4 border-b border-apple-gray3">
                <p className="text-xs text-apple-gray1 font-medium uppercase tracking-wide mb-1">
                  Precio actual
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tabular-nums text-apple-blue">
                    {currentPrice.toFixed(3)}
                  </span>
                  <span className="text-xl text-apple-gray1 font-medium">€/L</span>
                </div>
                {fuelTypeName && (
                  <p className="text-sm text-apple-gray1 mt-1 flex items-center gap-1">
                    <Fuel size={13} />
                    {fuelTypeName}
                  </p>
                )}
              </div>
            )}

            {/* All prices table */}
            <div className="px-6 py-4 border-b border-apple-gray3">
              <p className="text-xs text-apple-gray1 font-medium uppercase tracking-wide mb-3">
                Todos los combustibles
              </p>
              <div className="flex flex-col gap-2">
                {station.precios.map((p) => (
                  <div key={p.idFuelType} className="flex justify-between text-sm">
                    <span className="text-apple-gray1">{p.nombre}</span>
                    <span className="font-semibold tabular-nums">
                      {p.precio !== null ? `${p.precio.toFixed(3)} €/L` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price history chart */}
            <div className="flex-1 px-6 py-4 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-apple-blue" />
                <p className="text-xs text-apple-gray1 font-medium uppercase tracking-wide">
                  Evolución 30 días {fuelTypeName ? `— ${fuelTypeName}` : ''}
                </p>
              </div>

              {historyLoading && (
                <div className="flex items-center justify-center h-40 text-apple-gray1 text-sm">
                  Cargando historial...
                </div>
              )}

              {!historyLoading && chartData.length === 0 && (
                <div className="flex items-center justify-center h-40 text-apple-gray1 text-sm">
                  Sin datos históricos disponibles
                </div>
              )}

              {!historyLoading && chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#C7C7CC" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#8E8E93' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#8E8E93' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v.toFixed(2)}`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(3)} €/L`, fuelTypeName ?? 'Precio']}
                      labelStyle={{ fontSize: 12, color: '#1D1D1F' }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #C7C7CC',
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="precio"
                      stroke="#007AFF"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, fill: '#007AFF' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/StationDrawer.tsx
git commit -m "feat: add StationDrawer with Framer Motion and Recharts price history"
```

---

### Task 12: ViewToggle + Page Assembly

**Files:**
- Create: `components/ViewToggle.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: all components and hooks
- Produces: complete working app at http://localhost:3000

- [ ] **Step 1: Create components/ViewToggle.tsx**

```typescript
'use client'

import { Map, List } from 'lucide-react'
import type { ViewMode } from '@/types'

interface ViewToggleProps {
  view: ViewMode
  onChange: (view: ViewMode) => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex rounded-pill border border-apple-gray3 overflow-hidden bg-white shadow-card">
      {(['map', 'list'] as ViewMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
            view === mode
              ? 'bg-apple-blue text-white'
              : 'text-apple-gray1 hover:bg-apple-bg'
          }`}
        >
          {mode === 'map' ? <Map size={15} /> : <List size={15} />}
          {mode === 'map' ? 'Mapa' : 'Lista'}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create app/page.tsx**

```typescript
'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { SearchBar } from '@/components/SearchBar'
import { FiltersPanel } from '@/components/FiltersPanel'
import { ViewToggle } from '@/components/ViewToggle'
import { StationList } from '@/components/StationList'
import { StationDrawer } from '@/components/StationDrawer'
import { useStations } from '@/hooks/useStations'
import { useFuelTypes } from '@/hooks/useFuelTypes'
import type { SearchFilters, Station, ViewMode, GeoLocation } from '@/types'

// Leaflet cannot run on the server — must be a dynamic import
const MapView = dynamic(
  () => import('@/components/MapView').then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full rounded-card bg-apple-gray3/30 animate-pulse" />
    ),
  }
)

const DEFAULT_FILTERS: SearchFilters = {
  location: null,
  radius: 10,
  fuelTypeId: null,
}

export default function HomePage() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [view, setView] = useState<ViewMode>('map')
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)

  const { data: stations = [], isLoading, error } = useStations(filters)
  const { data: fuelTypes = [] } = useFuelTypes()

  function handleLocation(loc: GeoLocation) {
    setFilters((prev) => ({ ...prev, location: loc }))
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <header className="z-30 bg-white/80 backdrop-blur-xl border-b border-apple-gray3 px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-bold shrink-0">
            <span className="text-apple-blue">⛽</span> Precio Gasolina
          </h1>
          <SearchBar onLocation={handleLocation} />
          <ViewToggle view={view} onChange={setView} />
        </div>
        <FiltersPanel filters={filters} onChange={setFilters} />
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden relative">
        {/* No location state */}
        {!filters.location && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="text-6xl">⛽</div>
            <h2 className="text-2xl font-bold">Encuentra la gasolina más barata</h2>
            <p className="text-apple-gray1 max-w-sm">
              Busca tu ciudad o permite el acceso a tu ubicación para ver los precios cerca de ti.
            </p>
          </div>
        )}

        {/* Loading */}
        {filters.location && isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-card bg-white/90 px-6 py-4 shadow-card-hover backdrop-blur-xl text-sm text-apple-gray1">
              Buscando gasolineras...
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="rounded-card bg-apple-red/10 border border-apple-red/20 px-6 py-4 text-apple-red text-sm">
              Error al cargar datos. Comprueba tu conexión e inténtalo de nuevo.
            </div>
          </div>
        )}

        {/* Map view */}
        {filters.location && !isLoading && !error && view === 'map' && (
          <div className="absolute inset-0 p-4">
            <MapView
              stations={stations}
              center={filters.location}
              activeFuelTypeId={filters.fuelTypeId}
              onStationClick={setSelectedStation}
            />
          </div>
        )}

        {/* List view */}
        {filters.location && !isLoading && !error && view === 'list' && (
          <div className="absolute inset-0 overflow-y-auto p-4">
            <StationList
              stations={stations}
              activeFuelTypeId={filters.fuelTypeId}
              onStationClick={setSelectedStation}
            />
          </div>
        )}
      </main>

      {/* Station detail drawer */}
      <StationDrawer
        station={selectedStation}
        fuelTypes={fuelTypes}
        activeFuelTypeId={filters.fuelTypeId}
        onClose={() => setSelectedStation(null)}
      />
    </div>
  )
}
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```
Expected: All tests pass.

- [ ] **Step 4: Start dev server and test manually**

```bash
npm run dev
```

Manual test checklist:
- [ ] Page loads at http://localhost:3000 with the welcome state
- [ ] Click "Mi ubicación" → browser asks for permission → map appears with stations
- [ ] Type a city in the search box → suggestions dropdown appears → select one → map updates
- [ ] Change fuel type filter → stations update
- [ ] Move radius slider → stations update
- [ ] Switch to list view → cards appear, sorted by price
- [ ] Click a station card or map marker → drawer slides in from the right
- [ ] Drawer shows station name, address, current price, all fuel prices
- [ ] Drawer shows a 30-day price history line chart (or "Sin datos" if API returns empty)
- [ ] Close drawer with X button or clicking the backdrop

- [ ] **Step 5: Build for production**

```bash
npm run build
```
Expected: Build completes with no errors. Check for TypeScript or ESLint errors in output.

- [ ] **Step 6: Final commit**

```bash
git add components/ViewToggle.tsx app/page.tsx
git commit -m "feat: assemble main page — map, list, search, filters, drawer all wired together"
```

---

## Post-Implementation: Deploy to Vercel

1. Push repository to GitHub: `git remote add origin <your-repo-url> && git push -u origin main`
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. In Project Settings → Environment Variables, add: `PRECIOIL_API_KEY` = your key
4. Click Deploy — Vercel auto-detects Next.js, no configuration needed
5. Verify the production URL works end-to-end with real API data

---

## Self-Review Checklist

- [x] **Spec coverage:** All spec requirements covered — geolocation ✓, city search ✓, radius filter ✓, fuel type filter ✓, map view ✓, list view ✓, price color semaphore ✓, price history chart ✓, API proxy ✓, Apple aesthetic tokens ✓, Vercel deploy ✓
- [x] **Placeholder scan:** No TBD/TODO items. All code blocks are complete.
- [x] **Type consistency:** `getActivePrice` defined in Task 9 and imported consistently in Tasks 10, 11, 12. `getPriceColor` defined in Task 3 and imported in Tasks 9, 10. All hook return types match their usage.
- [x] **API auth note:** Added prominent warning in Task 3 to verify auth mechanism before implementing.
- [x] **Leaflet SSR note:** Dynamic import instruction included in Task 10 and implemented in Task 12.
