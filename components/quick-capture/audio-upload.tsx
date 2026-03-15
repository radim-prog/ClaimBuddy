'use client'

import { useState, useRef } from 'react'
import { Upload, FileAudio, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface AudioUploadProps {
  onFileSelected: (file: File) => void
  disabled?: boolean
}

export function AudioUpload({ onFileSelected, disabled }: AudioUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setError(null)

    if (file.size > MAX_FILE_SIZE) {
      setError('Soubor je příliš velký (max 25 MB)')
      return
    }

    if (!file.type.startsWith('audio/')) {
      setError('Vyberte audio soubor')
      return
    }

    setSelectedFile(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so same file can be selected again
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-3">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Button variant="ghost" size="sm" onClick={() => { setError(null); setSelectedFile(null) }} className="mt-1 text-xs">
          Zkusit znovu
        </Button>
      </div>
    )
  }

  if (selectedFile) {
    return (
      <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
        <div className="flex items-center gap-2">
          <FileAudio className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm truncate flex-1">{selectedFile.name}</span>
          <span className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</span>
          <button
            onClick={() => setSelectedFile(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <Button
          size="sm"
          onClick={() => onFileSelected(selectedFile)}
          disabled={disabled}
          className="gap-1.5"
        >
          {disabled ? 'Přepisuji...' : 'Přepsat'}
        </Button>
      </div>
    )
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={handleInputChange}
        className="hidden"
      />
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 rounded-xl border border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/40 p-3 cursor-pointer transition-colors"
      >
        <Upload className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Nahrát audio soubor (MP3, WAV, M4A...)
        </span>
      </div>
    </>
  )
}
