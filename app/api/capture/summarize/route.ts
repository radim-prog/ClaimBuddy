export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
  }

  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text je povinný' }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Jsi asistent české účetní kanceláře. Z přepisu hovoru nebo poznámky vytvoř stručný výtah.

Formát odpovědi:
**Shrnutí:** 2-3 věty shrnující hlavní obsah.

**Akční body:**
- Co je třeba udělat (pokud existují)

**Zmíněné osoby/firmy:**
- Jména a firmy zmíněné v textu (pokud existují)

Pokud text neobsahuje akční body nebo osoby, tyto sekce vynech. Buď stručný a přesný.`,
        },
        { role: 'user', content: text.trim() },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const summary = completion.choices[0]?.message?.content || ''

    return NextResponse.json({ summary })
  } catch (error: any) {
    console.error('Summarize error:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při vytváření výtahu' },
      { status: 500 }
    )
  }
}
