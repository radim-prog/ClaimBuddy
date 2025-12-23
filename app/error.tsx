'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Něco se pokazilo
        </h2>
        <p className="text-gray-600 mb-6">
          Omlouváme se, došlo k neočekávané chybě. Zkuste to prosím znovu.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4">
            Kód chyby: {error.digest}
          </p>
        )}
        <Button
          onClick={() => reset()}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Zkusit znovu
        </Button>
      </div>
    </div>
  )
}
