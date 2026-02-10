import { useCallback } from 'react'

type ToastVariant = 'default' | 'destructive'

type ToastProps = {
  title: string
  description?: string
  variant?: ToastVariant
}

export function useToast() {
  const toast = useCallback(({ title, description, variant }: ToastProps) => {
    // Simple console-based toast for now
    if (variant === 'destructive') {
      console.error(`[Toast] ${title}: ${description}`)
    } else {
      console.log(`[Toast] ${title}: ${description}`)
    }
  }, [])

  return { toast }
}
