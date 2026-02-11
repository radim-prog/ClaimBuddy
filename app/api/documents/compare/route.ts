import { NextRequest, NextResponse } from 'next/server'
import { KimiAIClient, isKimiAIAvailable } from '@/lib/kimi-ai'

export const dynamic = 'force-dynamic'

const MODELS = [
  { id: 'kimi-k2.5', name: 'Kimi K2.5 (výchozí)' },
  { id: 'moonshot-v1-128k', name: 'Moonshot V1 128K' },
]

export async function POST(request: NextRequest) {
  if (!isKimiAIAvailable()) {
    return NextResponse.json(
      { error: 'MOONSHOT_API_KEY is not configured' },
      { status: 503 }
    )
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = file.type
  const filename = file.name

  // Run both models in parallel
  const results = await Promise.allSettled(
    MODELS.map(async (model) => {
      const client = new KimiAIClient({ model: model.id })
      const start = Date.now()

      try {
        // Step 1: Extract text
        const text = await client.extractTextFromFile(buffer, filename, mimeType)

        // Step 2: Extract structured data
        const invoice = await client.extractInvoiceData(text, filename)

        return {
          model: model.id,
          modelName: model.name,
          success: true,
          processingTime: Date.now() - start,
          data: invoice,
          confidence: invoice.confidence_score || 0,
        }
      } catch (err) {
        return {
          model: model.id,
          modelName: model.name,
          success: false,
          processingTime: Date.now() - start,
          error: (err as Error).message,
          confidence: 0,
        }
      }
    })
  )

  const comparison = results.map((r) =>
    r.status === 'fulfilled' ? r.value : {
      model: 'unknown',
      modelName: 'Unknown',
      success: false,
      processingTime: 0,
      error: (r.reason as Error).message,
      confidence: 0,
    }
  )

  // Calculate agreement score
  const successfulResults = comparison.filter(r => r.success && r.data)
  let agreementScore = 0
  if (successfulResults.length === 2) {
    const a = successfulResults[0].data!
    const b = successfulResults[1].data!

    let matches = 0
    let total = 0

    const fields = ['document_number', 'variable_symbol', 'total_without_vat', 'total_vat', 'total_with_vat'] as const
    for (const field of fields) {
      total++
      const va = (a as Record<string, unknown>)[field]
      const vb = (b as Record<string, unknown>)[field]
      if (va === vb || (typeof va === 'number' && typeof vb === 'number' && Math.abs(va - vb) < 0.01)) {
        matches++
      }
    }

    if (a.supplier?.name && b.supplier?.name) {
      total++
      if (a.supplier.name.toLowerCase() === b.supplier.name.toLowerCase()) matches++
    }
    if (a.supplier?.ico && b.supplier?.ico) {
      total++
      if (a.supplier.ico === b.supplier.ico) matches++
    }

    agreementScore = total > 0 ? Math.round((matches / total) * 100) : 0
  }

  return NextResponse.json({
    filename,
    comparison,
    agreementScore,
    bestModel: comparison.reduce((best, curr) =>
      curr.confidence > best.confidence ? curr : best
    , comparison[0]),
  })
}
