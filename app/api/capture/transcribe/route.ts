export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import OpenAI from 'openai'

const ALLOWED_MIME_TYPES = [
  'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4',
  'audio/wav', 'audio/x-m4a', 'audio/mp3', 'audio/x-wav',
  'audio/flac', 'audio/aac',
]

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB (Whisper limit)

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Chybí audio soubor' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Soubor je příliš velký (max 25 MB)' }, { status: 400 })
    }

    // Validate MIME type (be lenient — browsers may send slightly different types)
    const mimeOk = ALLOWED_MIME_TYPES.some(t => file.type.startsWith(t.split('/')[0]))
    if (!mimeOk && file.type) {
      return NextResponse.json({ error: `Nepodporovaný formát: ${file.type}` }, { status: 400 })
    }

    // Upload audio to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name?.split('.').pop() || 'webm'
    const timestamp = Date.now()
    const storagePath = `voice-captures/${userId}/${timestamp}.${ext}`

    const { error: storageError } = await supabaseAdmin.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type || 'audio/webm',
        upsert: false,
      })

    if (storageError) {
      console.error('Voice capture upload error:', storageError)
      // Continue with transcription even if storage fails
    }

    // Transcribe with Whisper
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: new File([buffer], file.name || `recording.${ext}`, { type: file.type || 'audio/webm' }),
      language: 'cs',
    })

    return NextResponse.json({
      text: transcription.text,
      storage_path: storageError ? null : storagePath,
    })
  } catch (error: any) {
    console.error('Transcribe error:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při přepisu' },
      { status: 500 }
    )
  }
}
