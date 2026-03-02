'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Star, MapPin, Clock } from 'lucide-react'
import type { TravelPlace } from '@/lib/types/travel'

interface PlaceAutocompleteProps {
  value: string
  onChange: (value: string) => void
  places: TravelPlace[]
  placeholder?: string
}

export function PlaceAutocomplete({ value, onChange, places, placeholder }: PlaceAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setSearch(value) }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = places.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.address && p.address.toLowerCase().includes(search.toLowerCase()))
  )

  const favorites = filtered.filter(p => p.is_favorite)
  const frequent = filtered.filter(p => !p.is_favorite && p.visit_count > 2)
  const others = filtered.filter(p => !p.is_favorite && p.visit_count <= 2)

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder || 'Zadejte místo...'}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          {favorites.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Oblibena</div>
              {favorites.map(p => (
                <PlaceOption key={p.id} place={p} icon={<Star className="h-3.5 w-3.5 text-yellow-500" />}
                  onClick={() => { onChange(p.name); setSearch(p.name); setOpen(false) }} />
              ))}
            </div>
          )}
          {frequent.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Casta</div>
              {frequent.map(p => (
                <PlaceOption key={p.id} place={p} icon={<Clock className="h-3.5 w-3.5 text-blue-500" />}
                  onClick={() => { onChange(p.name); setSearch(p.name); setOpen(false) }} />
              ))}
            </div>
          )}
          {others.length > 0 && (
            <div>
              {(favorites.length > 0 || frequent.length > 0) && (
                <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ostatni</div>
              )}
              {others.map(p => (
                <PlaceOption key={p.id} place={p} icon={<MapPin className="h-3.5 w-3.5 text-gray-400" />}
                  onClick={() => { onChange(p.name); setSearch(p.name); setOpen(false) }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PlaceOption({ place, icon, onClick }: { place: TravelPlace; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-sm"
    >
      {icon}
      <div className="min-w-0">
        <div className="truncate font-medium">{place.name}</div>
        {place.address && <div className="text-xs text-muted-foreground truncate">{place.address}</div>}
      </div>
      {place.visit_count > 0 && (
        <span className="ml-auto text-[10px] text-muted-foreground shrink-0">{place.visit_count}x</span>
      )}
    </button>
  )
}
