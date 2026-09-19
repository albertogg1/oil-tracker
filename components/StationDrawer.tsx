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
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'
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
  const fuelTypeName = fuelTypes.find((f) => f.idFuelType === chartFuelTypeId)?.nombre

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
            className="fixed inset-0 z-[800] bg-black/20 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-[1000] h-full w-full sm:max-w-md bg-white shadow-2xl flex flex-col"
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
                      tickFormatter={(v: number) => `${v.toFixed(2)}`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      formatter={(value: ValueType | undefined) => [
                        `${Number(Array.isArray(value) ? value[0] : value ?? 0).toFixed(3)} €/L`,
                        fuelTypeName ?? 'Precio',
                      ]}
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
