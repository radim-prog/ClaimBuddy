'use client'

import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Settings2, RotateCcw } from 'lucide-react'
import type { TileConfig, TileDefinition } from '@/lib/types/layout'

interface TileSettingsPanelProps {
  tiles: TileConfig[]
  definitions: TileDefinition[]
  editMode: boolean
  onEditModeChange: (v: boolean) => void
  onToggle: (id: string) => void
  onReset: () => void
}

export function TileSettingsPanel({
  tiles,
  definitions,
  editMode,
  onEditModeChange,
  onToggle,
  onReset,
}: TileSettingsPanelProps) {
  const defMap = new Map(definitions.map(d => [d.id, d]))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={editMode ? 'ring-2 ring-purple-400' : ''}
        >
          <Settings2 className="h-4 w-4 mr-1" />
          Widgety
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Sekce dashboardu</h4>
            <Button variant="ghost" size="sm" onClick={onReset} title="Obnovit výchozí">
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>

          <div className="flex items-center justify-between pb-2 border-b">
            <span className="text-sm text-muted-foreground">Režim úprav</span>
            <Switch
              checked={editMode}
              onCheckedChange={onEditModeChange}
            />
          </div>

          <div className="space-y-2">
            {tiles.map(tile => {
              const def = defMap.get(tile.id)
              if (!def) return null
              return (
                <div key={tile.id} className="flex items-center justify-between">
                  <span className="text-sm">{def.label}</span>
                  <Switch
                    checked={tile.visible}
                    onCheckedChange={() => onToggle(tile.id)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
