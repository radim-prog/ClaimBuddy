'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { ReactNode } from 'react'

interface TileWrapperProps {
  id: string
  children: ReactNode
  editMode: boolean
}

export function TileWrapper({ id, children, editMode }: TileWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${editMode ? 'ring-1 ring-dashed ring-gray-300 dark:ring-gray-600 rounded-xl' : ''}`}
    >
      {editMode && (
        <button
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-1 bg-white dark:bg-gray-800 border rounded shadow-sm cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>
      )}
      {children}
    </div>
  )
}
