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
    // Report to server for debugging
    fetch('/api/error-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        url: typeof window !== 'undefined' ? window.location.href : '',
        source: 'error-boundary',
      }),
    }).catch(() => {})
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
      <div className="text-center p-8 max-w-md">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Něco se pokazilo
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Omlouváme se, došlo k neočekávané chybě. Zkuste to prosím znovu.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4">
            Kód chyby: {error.digest}
          </p>
        )}
        <details className="text-left text-xs text-gray-500 mb-4 max-w-full overflow-auto">
          <summary className="cursor-pointer">Detail chyby</summary>
          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-[10px] whitespace-pre-wrap break-all">
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </details>
        <Button
          onClick={() => reset()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Zkusit znovu
        </Button>
      </div>
    </div>
  )
}
