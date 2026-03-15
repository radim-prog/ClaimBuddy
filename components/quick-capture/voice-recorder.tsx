'use client'

import { Mic, Square, Trash2, FileAudio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useVoiceRecorder } from './use-voice-recorder'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void
  disabled?: boolean
}

export function VoiceRecorder({ onRecordingComplete, disabled }: VoiceRecorderProps) {
  const {
    isRecording,
    duration,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  } = useVoiceRecorder()

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-3">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Button variant="ghost" size="sm" onClick={resetRecording} className="mt-2 text-xs">
          Zkusit znovu
        </Button>
      </div>
    )
  }

  // Recording in progress
  if (isRecording) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10 p-3">
        <div className="relative flex items-center justify-center w-8 h-8">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">Nahrávání...</p>
          <p className="text-xs text-red-500 dark:text-red-400 font-mono">{formatDuration(duration)}</p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={stopRecording}
          className="gap-1.5"
        >
          <Square className="h-3.5 w-3.5" />
          Zastavit
        </Button>
      </div>
    )
  }

  // Recording done — show playback + actions
  if (audioBlob) {
    const audioUrl = URL.createObjectURL(audioBlob)
    return (
      <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
        <div className="flex items-center gap-2">
          <FileAudio className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Nahrávka ({formatDuration(duration)})
          </span>
        </div>
        <audio controls src={audioUrl} className="w-full h-8" />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onRecordingComplete(audioBlob)}
            disabled={disabled}
            className="gap-1.5"
          >
            {disabled ? 'Přepisuji...' : 'Přepsat'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              URL.revokeObjectURL(audioUrl)
              resetRecording()
            }}
            className="gap-1.5 text-muted-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Smazat
          </Button>
        </div>
      </div>
    )
  }

  // Idle — show record button
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={startRecording}
      disabled={disabled}
      className="gap-1.5"
    >
      <Mic className="h-4 w-4" />
      Nahrát hlas
    </Button>
  )
}
