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
