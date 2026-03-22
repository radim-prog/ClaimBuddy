'use client'

import { useState, useCallback, type DragEvent } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropZoneProps {
  onFile: (file: File) => void
  accept?: string
  className?: string
  children?: React.ReactNode
}

export function DropZone({ onFile, accept = 'image/*,.pdf', className, children }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) return

    onFile(file)
  }, [onFile])

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative rounded-xl border-2 border-dashed transition-colors',
        dragOver
          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700',
        className,
      )}
    >
      {children || (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Upload className={cn('w-8 h-8 mb-2', dragOver ? 'text-blue-500' : 'text-muted-foreground/50')} />
          <p className="text-sm font-medium text-muted-foreground">
            Přetáhněte doklad sem
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            PDF, JPG nebo PNG
          </p>
        </div>
      )}

      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 rounded-xl bg-blue-500/10 flex items-center justify-center pointer-events-none">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
            Pustit pro nahrání
          </div>
        </div>
      )}
    </div>
  )
}
