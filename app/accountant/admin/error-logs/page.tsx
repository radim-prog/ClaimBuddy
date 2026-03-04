'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorLog {
  id: string
  level: string
  message: string
  stack: string | null
  url: string | null
  source: string | null
  user_id: string | null
  created_at: string
}

export default function ErrorLogsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/accountant/error-logs?limit=100')
      if (res.ok) setLogs(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Error Logy</h1>
          <p className="text-muted-foreground">Chyby zachycené v aplikaci</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Obnovit
        </button>
      </div>

      {logs.length === 0 && !loading && (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="font-medium">Zatím žádné chyby - to je dobře!</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {logs.map((log) => (
          <Card key={log.id} className="shadow-soft-sm">
            <CardHeader className="py-3 px-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  <CardTitle className="text-sm font-medium truncate">
                    {log.message}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={log.level === 'error' ? 'destructive' : 'secondary'} className="rounded-md">
                    {log.level}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString('cs-CZ')}
                  </span>
                </div>
              </div>
            </CardHeader>
            {(log.stack || log.url || log.source) && (
              <CardContent className="pt-0 px-4 pb-3">
                <div className="flex gap-4 text-xs text-muted-foreground mb-2">
                  {log.source && <span>Zdroj: {log.source}</span>}
                  {log.url && <span className="truncate">URL: {log.url}</span>}
                  {log.user_id && <span>User: {log.user_id}</span>}
                </div>
                {log.stack && (
                  <pre className="text-xs bg-muted p-2 rounded-xl overflow-x-auto max-h-32">
                    {log.stack}
                  </pre>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
