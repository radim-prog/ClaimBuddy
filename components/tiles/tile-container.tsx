'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTileLayout } from '@/lib/hooks/use-tile-layout'
import { TileWrapper } from './tile-wrapper'
import { TileSettingsPanel } from './tile-settings-panel'
import type { TileDefinition } from '@/lib/types/layout'
import type { ReactNode } from 'react'

interface TileContainerProps {
  pageKey: string
  definitions: TileDefinition[]
  renderTile: (tileId: string) => ReactNode
}

export function TileContainer({ pageKey, definitions, renderTile }: TileContainerProps) {
  const { tiles, loading, toggleTile, reorderTiles, resetToDefault } = useTileLayout(pageKey, definitions)
  const [editMode, setEditMode] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorderTiles(active.id as string, over.id as string)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
      </div>
    )
  }

  const visibleTiles = tiles.filter(t => t.visible)
  const tileIds = visibleTiles.map(t => t.id)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <TileSettingsPanel
          tiles={tiles}
          definitions={definitions}
          editMode={editMode}
          onEditModeChange={setEditMode}
          onToggle={toggleTile}
          onReset={resetToDefault}
        />
      </div>

      {editMode ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={tileIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {visibleTiles.map(tile => (
                <TileWrapper key={tile.id} id={tile.id} editMode={editMode}>
                  {renderTile(tile.id)}
                </TileWrapper>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-4">
          {visibleTiles.map(tile => (
            <div key={tile.id}>{renderTile(tile.id)}</div>
          ))}
        </div>
      )}
    </div>
  )
}
