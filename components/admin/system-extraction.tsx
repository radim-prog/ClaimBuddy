'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import { toast } from 'sonner'
import {
  Save,
  Loader2,
  Brain,
  Key,
  FlaskConical,
  FileText,
  Check,
  AlertCircle,
  Image,
} from 'lucide-react'

type AIProvider = 'openai' | 'anthropic' | 'google'

type Settings = {
  id?: string
  provider: AIProvider
  model: string
  has_api_key: boolean
  has_ocr_key: boolean
  is_active: boolean
  cron_enabled: boolean
  cron_time: string
  max_concurrent: number
}

const PROVIDER_MODELS: Record<AIProvider, { label: string; models: { value: string; label: string; price: string }[] }> = {
  openai: {
    label: 'OpenAI',
    models: [
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini', price: '$3.60/1000 faktur' },
      { value: 'gpt-4o', label: 'GPT-4o', price: '$25/1000 faktur' },
      { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', price: '$4/1000 faktur' },
    ],
  },
  anthropic: {
    label: 'Anthropic',
    models: [
      { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', price: '$1.20/1000 faktur' },
      { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', price: '$9/1000 faktur' },
    ],
  },
  google: {
    label: 'Google',
    models: [
      { value: 'gemini-2.0-flash-lite', label: 'Gemini Flash Lite', price: '$1.40/1000 faktur' },
      { value: 'gemini-2.0-flash', label: 'Gemini Flash', price: '$3/1000 faktur' },
    ],
  },
}

export function SystemExtraction() {
  const { userId } = useAccountantUser()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [provider, setProvider] = useState<AIProvider>('openai')
  const [model, setModel] = useState('gpt-4o-mini')
  const [apiKey, setApiKey] = useState('')
  const [ocrApiKey, setOcrApiKey] = useState('')
  const [cronEnabled, setCronEnabled] = useState(false)
  const [cronTime, setCronTime] = useState('02:00')
  const [maxConcurrent, setMaxConcurrent] = useState(5)

  // Test state
  const [testFile, setTestFile] = useState<File | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchSettings = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/extraction/settings', {
        headers: { 'x-user-id': userId },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.settings) {
          setSettings(data.settings)
          setProvider(data.settings.provider)
          setModel(data.settings.model)
          setCronEnabled(data.settings.cron_enabled)
          setCronTime(data.settings.cron_time)
          setMaxConcurrent(data.settings.max_concurrent)
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    try {
      const res = await fetch('/api/extraction/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          provider,
          model,
          ...(apiKey ? { api_key: apiKey } : {}),
          ...(ocrApiKey ? { ocr_api_key: ocrApiKey } : {}),
          cron_enabled: cronEnabled,
          cron_time: cronTime,
          max_concurrent: maxConcurrent,
        }),
      })
      if (res.ok) {
        toast.success('Nastavení uloženo')
        setApiKey('')
        setOcrApiKey('')
        fetchSettings()
      } else {
        toast.error('Chyba při ukládání')
      }
    } catch {
      toast.error('Chyba připojení')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!testFile || !userId) return
    setTesting(true)
    setTestResult(null)

    try {
      const formData = new FormData()
      formData.append('file', testFile)
      formData.append('fastMode', 'true')

      const res = await fetch('/api/extraction/extract', {
        method: 'POST',
        headers: { 'x-user-id': userId },
        body: formData,
      })

      const data = await res.json()
      setTestResult(data)

      if (data.success) {
        toast.success(`Test OK: ${data.processingTime}ms`)
      } else {
        toast.error(data.error || 'Test selhal')
      }
    } catch {
      toast.error('Chyba při testu')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* AI Provider */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Provider
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider selection */}
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(PROVIDER_MODELS) as AIProvider[]).map(p => (
              <button
                key={p}
                onClick={() => {
                  setProvider(p)
                  setModel(PROVIDER_MODELS[p].models[0].value)
                }}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  provider === p
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-border hover:border-blue-300'
                }`}
              >
                <p className="font-medium text-sm">{PROVIDER_MODELS[p].label}</p>
              </button>
            ))}
          </div>

          {/* Model selection */}
          <div>
            <Label className="text-xs mb-1">Model</Label>
            <div className="space-y-1.5">
              {PROVIDER_MODELS[provider].models.map(m => (
                <button
                  key={m.value}
                  onClick={() => setModel(m.value)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg border text-sm ${
                    model === m.value ? 'border-blue-500 bg-blue-50/50' : 'border-border hover:bg-muted/30'
                  }`}
                >
                  <span className="font-medium">{m.label}</span>
                  <span className="text-xs text-muted-foreground">{m.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* API Keys */}
          <div className="space-y-3 pt-2 border-t">
            <div>
              <Label className="text-xs flex items-center gap-1.5">
                <Key className="h-3 w-3" />
                API klíč ({PROVIDER_MODELS[provider].label})
                {settings?.has_api_key && <Check className="h-3 w-3 text-green-600" />}
              </Label>
              <Input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={settings?.has_api_key ? 'Klíč nastaven (zadejte pro změnu)' : 'Zadejte API klíč...'}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1.5">
                <Key className="h-3 w-3" />
                OCR API klíč (Z.AI)
                {settings?.has_ocr_key && <Check className="h-3 w-3 text-green-600" />}
              </Label>
              <Input
                type="password"
                value={ocrApiKey}
                onChange={e => setOcrApiKey(e.target.value)}
                placeholder={settings?.has_ocr_key ? 'Klíč nastaven' : 'Zadejte Z.AI API klíč...'}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                ocr.z.ai — GLM-OCR, $0.03/1M tokenů
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Zpracování
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Noční cron</Label>
              <p className="text-xs text-muted-foreground">Automatické vytěžení nových dokladů</p>
            </div>
            <Switch checked={cronEnabled} onCheckedChange={setCronEnabled} />
          </div>

          {cronEnabled && (
            <div>
              <Label className="text-xs">Čas spuštění</Label>
              <Input
                type="time"
                value={cronTime}
                onChange={e => setCronTime(e.target.value)}
                className="w-32 mt-1"
              />
            </div>
          )}

          <div>
            <Label className="text-xs">Max. souběžných extrakcí</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={maxConcurrent}
              onChange={e => setMaxConcurrent(Number(e.target.value))}
              className="w-24 mt-1"
            />
          </div>

          <div className="pt-3 border-t">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Ukládám...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Uložit nastavení</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test extraction */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Test extrakce
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setTestFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              {testFile ? (
                <><FileText className="h-4 w-4 mr-2" /> {testFile.name}</>
              ) : (
                <><Image className="h-4 w-4 mr-2" /> Vybrat soubor</>
              )}
            </Button>
            <Button
              onClick={handleTest}
              disabled={!testFile || testing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {testing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Testuji...</>
              ) : (
                'Spustit test'
              )}
            </Button>
          </div>

          {testResult && (
            <div className="mt-4 p-4 rounded-lg bg-muted/30 border">
              {testResult.success ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">
                      Test OK — {testResult.processingTime}ms
                    </span>
                    {testResult.data?.confidence_score && (
                      <Badge variant="outline" className="text-xs">
                        Jistota: {Math.round(testResult.data.confidence_score)}%
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Číslo:</span> {testResult.data?.document_number || '-'}</div>
                    <div><span className="text-muted-foreground">VS:</span> {testResult.data?.variable_symbol || '-'}</div>
                    <div><span className="text-muted-foreground">Dodavatel:</span> {testResult.data?.supplier?.name || '-'}</div>
                    <div><span className="text-muted-foreground">IČO:</span> {testResult.data?.supplier?.ico || '-'}</div>
                    <div><span className="text-muted-foreground">Celkem:</span> {testResult.data?.total_with_vat?.toLocaleString('cs-CZ')} Kč</div>
                    <div><span className="text-muted-foreground">DPH:</span> {testResult.data?.total_vat?.toLocaleString('cs-CZ')} Kč</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">{testResult.error}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
