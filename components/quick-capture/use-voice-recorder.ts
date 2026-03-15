'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface UseVoiceRecorder {
  isRecording: boolean
  duration: number
  audioBlob: Blob | null
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  resetRecording: () => void
}

const MAX_DURATION_SECONDS = 600 // 10 minutes

export function useVoiceRecorder(): UseVoiceRecorder {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setAudioBlob(null)
      setDuration(0)
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Choose best supported format
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        setIsRecording(false)
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }

      recorder.onerror = () => {
        setError('Chyba při nahrávání')
        setIsRecording(false)
        cleanup()
      }

      recorder.start(1000) // Collect data every second
      setIsRecording(true)
      startTimeRef.current = Date.now()

      // Duration timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setDuration(elapsed)

        // Auto-stop at max duration
        if (elapsed >= MAX_DURATION_SECONDS) {
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop()
          }
        }
      }, 1000)
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Přístup k mikrofonu byl zamítnut. Povolte mikrofon v nastavení prohlížeče.')
      } else if (err.name === 'NotFoundError') {
        setError('Mikrofon nebyl nalezen.')
      } else {
        setError('Nepodařilo se spustit nahrávání.')
      }
      cleanup()
    }
  }, [cleanup])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const resetRecording = useCallback(() => {
    setAudioBlob(null)
    setDuration(0)
    setError(null)
    setIsRecording(false)
    cleanup()
  }, [cleanup])

  return {
    isRecording,
    duration,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  }
}
