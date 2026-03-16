export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

const MAX_MESSAGES = 10
const MODEL = 'claude-sonnet-4-6'
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `Jsi odborný poradce pro krizové řízení firem v České republice. Odpovídáš POUZE na otázky související s krizovým řízením:
- Insolvence a insolvenční řízení
- Restrukturalizace podniku
- Krizové řízení cash flow
- Právní povinnosti v krizi (§ 98 insolvenčního zákona, povinnost podat insolvenční návrh)
- Propouštění zaměstnanců v krizi (hromadné propouštění dle zákoníku práce)
- Jednání s věřiteli a dlužníky
- Ochrana majetku a odpovědnost jednatelů
- Likvidace společnosti

Pokud se otázka netýká krizového řízení, zdvořile odmítni a přesměruj uživatele na příslušnou sekci aplikace.

Odpovídej v češtině, profesionálním tónem, vykat. Uváděj konkrétní české zákony a paragrafy kde je to relevantní.
Odpovědi strukturuj přehledně s odrážkami nebo číslovanými kroky.

NIKDY neposkytuj závazné právní rady — vždy doporuč konzultaci s advokátem pro konkrétní právní kroky.`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface CompanyContext {
  name?: string
  industry?: string
  employeeCount?: number
  annualRevenue?: number
}

interface ChatRequest {
  messages: ChatMessage[]
  companyContext?: CompanyContext
}

// POST /api/client/crisis-chat
export async function POST(request: NextRequest) {
  // 1. Auth check
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Plan gate — enterprise only
  const plan = request.headers.get('x-user-plan') ?? 'free'
  if (plan !== 'enterprise') {
    return NextResponse.json(
      { error: 'Krizový chatbot je dostupný pouze v tarifu Enterprise' },
      { status: 403 }
    )
  }

  // 3. Parse & validate body
  let body: ChatRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Neplatné tělo požadavku' }, { status: 400 })
  }

  const { messages, companyContext } = body

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'Pole messages musí být neprázdné pole' },
      { status: 400 }
    )
  }

  // Validate message structure and alternation
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (!msg || typeof msg.content !== 'string' || !msg.content.trim()) {
      return NextResponse.json(
        { error: `Zpráva na pozici ${i} má neplatný obsah` },
        { status: 400 }
      )
    }
    if (msg.role !== 'user' && msg.role !== 'assistant') {
      return NextResponse.json(
        { error: `Zpráva na pozici ${i} má neplatnou roli: ${msg.role}` },
        { status: 400 }
      )
    }
    // Check alternation: first must be user, then alternate
    const expectedRole = i % 2 === 0 ? 'user' : 'assistant'
    if (msg.role !== expectedRole) {
      return NextResponse.json(
        { error: `Zprávy musí začínat uživatelem a střídat se (pozice ${i}: očekáváno ${expectedRole}, dostáno ${msg.role})` },
        { status: 400 }
      )
    }
  }

  // Last message must be from user
  if (messages[messages.length - 1].role !== 'user') {
    return NextResponse.json(
      { error: 'Poslední zpráva musí být od uživatele' },
      { status: 400 }
    )
  }

  // 4. Count user messages and enforce limit
  const userMessageCount = messages.filter(m => m.role === 'user').length
  if (userMessageCount > MAX_MESSAGES) {
    return NextResponse.json(
      {
        error: `Dosáhli jste limitu ${MAX_MESSAGES} otázek pro tuto session`,
        messageCount: userMessageCount,
        maxMessages: MAX_MESSAGES,
        remainingMessages: 0,
      },
      { status: 429 }
    )
  }

  // 5. Check API key
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[Crisis Chat] ANTHROPIC_API_KEY is not set')
    return NextResponse.json(
      { error: 'AI chatbot není nakonfigurován' },
      { status: 503 }
    )
  }

  // 6. Build system prompt with optional company context
  let systemPrompt = SYSTEM_PROMPT
  if (companyContext) {
    const parts: string[] = []
    if (companyContext.name) parts.push(companyContext.name)
    if (companyContext.industry) parts.push(companyContext.industry)
    if (companyContext.employeeCount != null) parts.push(`${companyContext.employeeCount} zaměstnanců`)
    if (companyContext.annualRevenue != null) parts.push(`roční obrat ${companyContext.annualRevenue} Kč`)

    if (parts.length > 0) {
      systemPrompt += `\n\nKontext firmy klienta: ${parts.join(', ')}`
    }
  }

  // 7. Call Anthropic API
  try {
    const aiResponse = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('[Crisis Chat] Anthropic API error:', aiResponse.status, errText.slice(0, 300))
      return NextResponse.json(
        { error: `AI API selhala (${aiResponse.status}). Zkuste to prosím znovu.` },
        { status: 502 }
      )
    }

    const aiData = await aiResponse.json() as {
      content: { type: string; text: string }[]
      usage: { input_tokens: number; output_tokens: number }
    }

    const reply = aiData.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')

    const inputTokens = aiData.usage?.input_tokens ?? 0
    const outputTokens = aiData.usage?.output_tokens ?? 0

    console.log(
      `[Crisis Chat] user=${userId} messages=${userMessageCount} tokens=${inputTokens}+${outputTokens}`
    )

    return NextResponse.json({
      reply,
      messageCount: userMessageCount,
      maxMessages: MAX_MESSAGES,
      remainingMessages: MAX_MESSAGES - userMessageCount,
      usage: {
        inputTokens,
        outputTokens,
      },
    })
  } catch (error) {
    console.error('[Crisis Chat] Error:', error)
    const message = error instanceof Error ? error.message : 'Chat selhal'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
