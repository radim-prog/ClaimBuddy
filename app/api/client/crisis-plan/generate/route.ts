import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { industryLabel } from '@/lib/types/crisis'
import type { CrisisRiskData, CrisisPlan } from '@/lib/types/crisis'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `Jsi expert na krizové řízení a business continuity pro české malé a střední firmy.
Používáš zjednodušenou FMEA metodiku (Severity × Occurrence × Detection = RPN).

Na základě profilu firmy vygeneruj 5-8 klíčových rizik seřazených od nejvyššího RPN.
Každé riziko musí obsahovat:
- name: stručný název rizika (max 50 znaků)
- category: kategorie (operational/financial/personnel/cyber/legal/reputational/supply_chain/natural)
- description: popis co se může stát (1-2 věty)
- severity: závažnost dopadu (1-10, kde 10 = existenční ohrožení firmy)
- occurrence: pravděpodobnost výskytu (1-10, kde 10 = téměř jisté)
- detection: obtížnost detekce (1-10, kde 10 = velmi obtížně odhalitelné, 1 = snadno odhalitelné)
- action_immediate: co udělat okamžitě při výskytu (1 věta)
- action_preventive: jak riziku předejít (1 věta)
- early_warning: varovné signály (1 věta)
- level_yellow: kdy aktivovat žlutý alert (1 věta)
- level_red: kdy aktivovat červený alert (1 věta)

DŮLEŽITÉ:
- Přizpůsob rizika oboru podnikání a velikosti firmy
- Používej realistické hodnoty severity/occurrence/detection
- Odpovídej POUZE validním JSON polem, bez dalšího textu
- Všechny texty v češtině`

const MODEL = 'claude-sonnet-4-6'
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

// POST /api/client/crisis-plan/generate
// Generates AI risks for an existing draft plan
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Plan-gate: requires professional or enterprise tier
  const userPlan = request.headers.get('x-user-plan') ?? 'free'
  if (userPlan === 'free' || userPlan === 'starter') {
    return NextResponse.json(
      { error: 'Tato funkce je dostupná od tarifu Professional' },
      { status: 403 }
    )
  }

  const userRole = request.headers.get('x-user-role')

  let body: { plan_id: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Neplatné tělo požadavku' }, { status: 400 })
  }

  const { plan_id } = body
  if (!plan_id) {
    return NextResponse.json({ error: 'Chybí povinné pole: plan_id' }, { status: 400 })
  }

  // Load the plan
  const { data: plan, error: planError } = await supabase
    .from('crisis_plans')
    .select('*')
    .eq('id', plan_id)
    .single()

  if (planError || !plan) {
    return NextResponse.json({ error: 'Krizový plán nenalezen' }, { status: 404 })
  }

  // Ownership / access check
  const isStaff = isStaffRole(userRole)
  if (!isStaff) {
    const { data: ownedCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('id', plan.company_id)
      .eq('owner_id', userId)
      .is('deleted_at', null)
      .single()
    if (!ownedCompany) {
      return NextResponse.json({ error: 'Přístup odmítnut' }, { status: 403 })
    }
  }

  // Load company name for better prompt context
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', plan.company_id)
    .single()

  const companyName = company?.name ?? 'Firma'
  const userPrompt = buildPrompt(plan as CrisisPlan, companyName)

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[Crisis Generate] ANTHROPIC_API_KEY is not set')
    return NextResponse.json({ error: 'AI generování není nakonfigurováno' }, { status: 503 })
  }

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
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('[Crisis Generate] Anthropic API error:', aiResponse.status, errText.slice(0, 300))
      return NextResponse.json(
        { error: `AI API selhala (${aiResponse.status}). Zkuste to prosím znovu.` },
        { status: 502 }
      )
    }

    const aiData = await aiResponse.json() as {
      content: { type: string; text: string }[]
      usage: { input_tokens: number; output_tokens: number }
    }

    const raw = aiData.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')

    let risks: CrisisRiskData[]
    try {
      // Strip potential markdown code fences
      const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      risks = JSON.parse(jsonText) as CrisisRiskData[]
      if (!Array.isArray(risks)) throw new Error('Not an array')
    } catch {
      console.error('[Crisis Generate] Failed to parse AI response:', raw.slice(0, 500))
      return NextResponse.json(
        { error: 'AI vrátila neplatnou odpověď. Zkuste to prosím znovu.' },
        { status: 502 }
      )
    }

    // Compute RPN and prepare rows
    const riskRows = risks.map((r, idx) => ({
      plan_id,
      name: r.name,
      category: r.category,
      description: r.description ?? null,
      severity: r.severity,
      occurrence: r.occurrence,
      detection: r.detection,
      rpn: r.severity * r.occurrence * r.detection,
      action_immediate: r.action_immediate ?? null,
      action_preventive: r.action_preventive ?? null,
      early_warning: r.early_warning ?? null,
      level_yellow: r.level_yellow ?? null,
      level_red: r.level_red ?? null,
      sort_order: idx,
    }))

    // Replace old risks
    const { error: deleteError } = await supabase
      .from('crisis_plan_risks')
      .delete()
      .eq('plan_id', plan_id)

    if (deleteError) throw deleteError

    const { data: savedRisks, error: insertError } = await supabase
      .from('crisis_plan_risks')
      .insert(riskRows)
      .select()

    if (insertError) throw insertError

    const now = new Date().toISOString()
    const { data: updatedPlan, error: updateError } = await supabase
      .from('crisis_plans')
      .update({
        plan_data: risks,
        plan_generated_at: now,
        plan_model: MODEL,
        status: 'generated',
        updated_at: now,
      })
      .eq('id', plan_id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      plan: updatedPlan,
      risks: savedRisks,
      tokensUsed: {
        input: aiData.usage?.input_tokens ?? 0,
        output: aiData.usage?.output_tokens ?? 0,
      },
    })
  } catch (error) {
    console.error('[Crisis Generate] Error:', error)
    const message = error instanceof Error ? error.message : 'Generování selhalo'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function buildPrompt(plan: CrisisPlan, companyName: string): string {
  const lines: string[] = [
    `Profil firmy:`,
    `- Název: ${companyName}`,
    `- Obor podnikání: ${industryLabel(plan.industry)} (${plan.industry})`,
    `- Počet zaměstnanců: ${plan.employee_count_range}`,
  ]
  if (plan.annual_revenue_range) {
    lines.push(`- Roční obrat: ${plan.annual_revenue_range}`)
  }
  if (plan.key_dependencies) {
    lines.push(`- Klíčové závislosti / dodavatelé: ${plan.key_dependencies}`)
  }
  if (plan.biggest_fear) {
    lines.push(`- Největší obava / specifické riziko: ${plan.biggest_fear}`)
  }
  lines.push(`\nVygeneruj 5-8 nejdůležitějších rizik pro tuto firmu jako JSON pole.`)
  return lines.join('\n')
}
