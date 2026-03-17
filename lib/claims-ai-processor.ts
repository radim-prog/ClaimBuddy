/**
 * Claims AI Processor
 *
 * Pipeline:
 *   1. Fetch all case documents (photos, PDFs, videos)
 *   2. OCR/vision: Anthropic Claude for images/PDFs, Google Gemini for videos
 *   3. Aggregate descriptions into final report via Claude Opus
 *   4. Save ai_report + ai_processed_at to insurance_cases
 */

import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from './supabase-admin'
import {
  CLAIMS_REPORT_SYSTEM_PROMPT,
  CLAIMS_VISION_PROMPT,
  CLAIMS_VIDEO_PROMPT,
} from './prompts/claims-report-prompt'
import type { InsuranceCaseDocument } from './types/insurance'

interface DocumentAnalysis {
  document_id: string
  name: string
  type: 'image' | 'video' | 'pdf' | 'other'
  description: string
}

function classifyMimeType(mime: string | null): 'image' | 'video' | 'pdf' | 'other' {
  if (!mime) return 'other'
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime === 'application/pdf') return 'pdf'
  return 'other'
}

function toAnthropicMediaType(mime: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  if (mime === 'image/png') return 'image/png'
  if (mime === 'image/gif') return 'image/gif'
  if (mime === 'image/webp') return 'image/webp'
  return 'image/jpeg'
}

/**
 * Analyze an image using Anthropic Claude vision
 */
async function analyzeImage(
  anthropic: Anthropic,
  fileUrl: string,
  mime: string,
): Promise<string> {
  // Fetch image as base64
  const response = await fetch(fileUrl)
  if (!response.ok) return `[Nepodařilo se stáhnout obrázek: ${fileUrl}]`

  const buffer = await response.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  const result = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: toAnthropicMediaType(mime),
              data: base64,
            },
          },
          {
            type: 'text',
            text: CLAIMS_VISION_PROMPT,
          },
        ],
      },
    ],
  })

  const textBlock = result.content.find(b => b.type === 'text')
  return textBlock ? textBlock.text : '[Bez popisu]'
}

/**
 * Analyze a PDF using Anthropic Claude (convert pages to images or use text)
 */
async function analyzePdf(
  anthropic: Anthropic,
  fileUrl: string,
): Promise<string> {
  // For PDFs, we download and send as document
  const response = await fetch(fileUrl)
  if (!response.ok) return `[Nepodařilo se stáhnout PDF: ${fileUrl}]`

  const buffer = await response.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  const result = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
          },
          {
            type: 'text',
            text: CLAIMS_VISION_PROMPT,
          },
        ],
      },
    ],
  })

  const textBlock = result.content.find(b => b.type === 'text')
  return textBlock ? textBlock.text : '[Bez popisu]'
}

/**
 * Analyze a video using Google Gemini API (supports video natively)
 */
async function analyzeVideo(
  fileUrl: string,
  googleApiKey: string,
): Promise<string> {
  // Fetch video
  const response = await fetch(fileUrl)
  if (!response.ok) return `[Nepodařilo se stáhnout video: ${fileUrl}]`

  const buffer = await response.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const mimeType = response.headers.get('content-type') || 'video/mp4'

  // Use Gemini 2.0 Flash for video analysis (cost-effective, supports video)
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`

  const geminiRes = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64,
              },
            },
            {
              text: CLAIMS_VIDEO_PROMPT,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.3,
      },
    }),
  })

  if (!geminiRes.ok) {
    const errText = await geminiRes.text()
    console.error('Gemini video analysis failed:', errText)
    return '[Nepodařilo se analyzovat video]'
  }

  const geminiData = await geminiRes.json()
  return geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '[Bez popisu videa]'
}

/**
 * Generate final comprehensive report from all document analyses
 */
async function generateReport(
  anthropic: Anthropic,
  caseInfo: {
    case_number: string
    insurance_type: string
    event_date: string | null
    event_description: string | null
    event_location: string | null
  },
  analyses: DocumentAnalysis[],
): Promise<string> {
  const documentSummary = analyses
    .map((a, i) => `### Dokument ${i + 1}: ${a.name} (${a.type})\n${a.description}`)
    .join('\n\n')

  const userPrompt = `Pojistná událost č. ${caseInfo.case_number}
Typ pojištění: ${caseInfo.insurance_type}
Datum události: ${caseInfo.event_date || 'neuvedeno'}
Místo: ${caseInfo.event_location || 'neuvedeno'}
Popis události: ${caseInfo.event_description || 'neuvedeno'}

## Analyzované dokumenty (${analyses.length})

${documentSummary}

---

Na základě výše uvedených informací a analýz dokumentů vypracuj kompletní zprávu podle zadané struktury.`

  const result = await anthropic.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 4096,
    system: CLAIMS_REPORT_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  const textBlock = result.content.find(b => b.type === 'text')
  return textBlock ? textBlock.text : 'Nepodařilo se vygenerovat zprávu.'
}

/**
 * Main entry point: process a claim with AI
 *
 * @param caseId - insurance_cases.id
 * @returns The generated report text
 */
export async function processClaimWithAI(caseId: string): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const googleKey = process.env.GOOGLE_CLOUD_API_KEY

  if (!anthropicKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey })

  // 1. Fetch case data
  const { data: caseData, error: caseErr } = await supabaseAdmin
    .from('insurance_cases')
    .select('id, case_number, insurance_type, event_date, event_description, event_location')
    .eq('id', caseId)
    .single()

  if (caseErr || !caseData) {
    throw new Error(`Case not found: ${caseId}`)
  }

  // 2. Fetch all documents
  const { data: docs, error: docsErr } = await supabaseAdmin
    .from('insurance_case_documents')
    .select('id, name, file_path, mime_type, document_type')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true })

  if (docsErr) {
    throw new Error(`Failed to fetch documents: ${docsErr.message}`)
  }

  const documents = (docs || []) as InsuranceCaseDocument[]

  if (documents.length === 0) {
    throw new Error('No documents attached to this case. Cannot generate AI report.')
  }

  // 3. Analyze each document
  const analyses: DocumentAnalysis[] = []

  for (const doc of documents) {
    const docType = classifyMimeType(doc.mime_type)
    let description = ''

    try {
      switch (docType) {
        case 'image':
          description = await analyzeImage(anthropic, doc.file_path, doc.mime_type || 'image/jpeg')
          break
        case 'pdf':
          description = await analyzePdf(anthropic, doc.file_path)
          break
        case 'video':
          if (googleKey) {
            description = await analyzeVideo(doc.file_path, googleKey)
          } else {
            description = '[Video analýza nedostupná — chybí GOOGLE_CLOUD_API_KEY]'
          }
          break
        default:
          description = `[Nepodporovaný formát: ${doc.mime_type}]`
      }
    } catch (err) {
      console.error(`Error analyzing document ${doc.id}:`, err)
      description = `[Chyba při analýze: ${err instanceof Error ? err.message : 'neznámá chyba'}]`
    }

    analyses.push({
      document_id: doc.id,
      name: doc.name,
      type: docType,
      description,
    })
  }

  // 4. Generate comprehensive report
  const report = await generateReport(anthropic, caseData, analyses)

  // 5. Save to DB
  const now = new Date().toISOString()
  const { error: updateErr } = await supabaseAdmin
    .from('insurance_cases')
    .update({
      ai_report: report,
      ai_processed_at: now,
      updated_at: now,
    })
    .eq('id', caseId)

  if (updateErr) {
    console.error('Failed to save AI report:', updateErr)
    // Return the report even if save fails — caller can retry
  }

  return report
}
