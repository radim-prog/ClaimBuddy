import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserName } from '@/lib/request-utils'

export const dynamic = 'force-dynamic'

type AccountingRule = {
  id: string
  rule_name: string
  document_type: string | null
  supplier_category: string | null
  item_category: string | null
  debit_account: string
  credit_account: string
  vat_account: string | null
  vat_rate: number | null
  min_amount: number | null
  max_amount: number | null
  keyword_match: string[] | null
  priority: number
  legal_reference: string | null
}

type SuggestedEntry = {
  line_number: number
  description: string
  amount: number
  vat_amount: number
  debit_account: string
  debit_name: string
  credit_account: string
  credit_name: string
  vat_account: string | null
  confidence: number
  rule_id: string | null
  rule_name: string | null
  legal_reference: string | null
}

// POST - generate predkontace suggestions for a document
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { document_id } = body

    if (!document_id) {
      return NextResponse.json({ error: 'document_id is required' }, { status: 400 })
    }

    // 1. Load document data
    const { data: doc, error: docErr } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .single()

    if (docErr || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 2. Load all active accounting rules
    const { data: rules, error: rulesErr } = await supabaseAdmin
      .from('accounting_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (rulesErr) throw rulesErr

    // 3. Load chart of accounts for name lookups
    const { data: accounts } = await supabaseAdmin
      .from('chart_of_accounts')
      .select('account_number, account_name')
      .eq('is_active', true)

    const accountMap = new Map<string, string>()
    for (const a of accounts || []) {
      accountMap.set(a.account_number, a.account_name)
    }

    // 4. Determine document type for rule matching
    const docType = mapDocumentType(doc.type)
    const supplierName = (doc.supplier_name || '').toLowerCase()
    const totalWithoutVat = Number(doc.total_without_vat) || 0
    const totalVat = Number(doc.total_vat) || 0
    const totalWithVat = Number(doc.total_with_vat) || 0

    // 5. Check for item-level data from OCR
    const ocrItems = extractOcrItems(doc)
    const suggestions: SuggestedEntry[] = []

    if (ocrItems.length > 1) {
      // ITEM-LEVEL MATCHING: Each OCR item gets its own accounting entry
      let lineNum = 1
      const fallback = getFallbackEntry(docType)

      for (const item of ocrItems) {
        const itemText = [item.description, item.name, item.category, supplierName]
          .filter(Boolean).join(' ').toLowerCase()
        const itemAmount = item.amount_without_vat || item.amount || 0
        const itemVat = item.vat_amount || 0

        const itemRule = findBestRule(rules || [], docType, itemText, itemAmount)

        if (itemRule) {
          suggestions.push({
            line_number: lineNum++,
            description: item.description || item.name || itemRule.rule_name,
            amount: itemAmount,
            vat_amount: itemVat,
            debit_account: itemRule.debit_account,
            debit_name: accountMap.get(itemRule.debit_account) || itemRule.debit_account,
            credit_account: itemRule.credit_account,
            credit_name: accountMap.get(itemRule.credit_account) || itemRule.credit_account,
            vat_account: itemRule.vat_account,
            confidence: calculateConfidence(itemRule, itemText, docType),
            rule_id: itemRule.id,
            rule_name: itemRule.rule_name,
            legal_reference: itemRule.legal_reference,
          })

          if (itemRule.vat_account && itemVat > 0) {
            suggestions.push({
              line_number: lineNum++,
              description: `DPH ${itemRule.vat_rate || 21}% — ${item.description || item.name || ''}`.trim(),
              amount: itemVat,
              vat_amount: 0,
              debit_account: itemRule.vat_account,
              debit_name: accountMap.get(itemRule.vat_account) || itemRule.vat_account,
              credit_account: itemRule.credit_account,
              credit_name: accountMap.get(itemRule.credit_account) || itemRule.credit_account,
              vat_account: null,
              confidence: calculateConfidence(itemRule, itemText, docType),
              rule_id: itemRule.id,
              rule_name: `DPH k: ${itemRule.rule_name}`,
              legal_reference: null,
            })
          }
        } else {
          // Fallback for unrecognized item
          suggestions.push({
            line_number: lineNum++,
            description: item.description || item.name || 'Neidentifikovaná položka',
            amount: itemAmount,
            vat_amount: itemVat,
            debit_account: fallback.debit,
            debit_name: accountMap.get(fallback.debit) || fallback.debit,
            credit_account: fallback.credit,
            credit_name: accountMap.get(fallback.credit) || fallback.credit,
            vat_account: itemVat > 0 ? '343' : null,
            confidence: 0.25,
            rule_id: null,
            rule_name: null,
            legal_reference: null,
          })

          if (itemVat > 0) {
            suggestions.push({
              line_number: lineNum++,
              description: `DPH — ${item.description || item.name || ''}`.trim(),
              amount: itemVat,
              vat_amount: 0,
              debit_account: '343',
              debit_name: accountMap.get('343') || '343',
              credit_account: fallback.credit,
              credit_name: accountMap.get(fallback.credit) || fallback.credit,
              vat_account: null,
              confidence: 0.25,
              rule_id: null,
              rule_name: null,
              legal_reference: null,
            })
          }
        }
      }
    } else {
      // WHOLE-DOCUMENT MATCHING (original logic, 0 or 1 items)
      const searchText = buildSearchText(doc)
      const matchedRule = findBestRule(rules || [], docType, searchText, totalWithoutVat)

      if (matchedRule) {
        const baseAmount = totalWithoutVat > 0 ? totalWithoutVat : totalWithVat
        suggestions.push({
          line_number: 1,
          description: doc.supplier_name
            ? `${matchedRule.rule_name} - ${doc.supplier_name}`
            : matchedRule.rule_name,
          amount: baseAmount,
          vat_amount: totalVat,
          debit_account: matchedRule.debit_account,
          debit_name: accountMap.get(matchedRule.debit_account) || matchedRule.debit_account,
          credit_account: matchedRule.credit_account,
          credit_name: accountMap.get(matchedRule.credit_account) || matchedRule.credit_account,
          vat_account: matchedRule.vat_account,
          confidence: calculateConfidence(matchedRule, searchText, docType),
          rule_id: matchedRule.id,
          rule_name: matchedRule.rule_name,
          legal_reference: matchedRule.legal_reference,
        })

        if (matchedRule.vat_account && totalVat > 0) {
          suggestions.push({
            line_number: 2,
            description: `DPH ${matchedRule.vat_rate || 21}%`,
            amount: totalVat,
            vat_amount: 0,
            debit_account: matchedRule.vat_account,
            debit_name: accountMap.get(matchedRule.vat_account) || matchedRule.vat_account,
            credit_account: matchedRule.credit_account,
            credit_name: accountMap.get(matchedRule.credit_account) || matchedRule.credit_account,
            vat_account: null,
            confidence: calculateConfidence(matchedRule, searchText, docType),
            rule_id: matchedRule.id,
            rule_name: `DPH k: ${matchedRule.rule_name}`,
            legal_reference: null,
          })
        }
      } else {
        const fallback = getFallbackEntry(docType)
        suggestions.push({
          line_number: 1,
          description: doc.supplier_name
            ? `Doklad od ${doc.supplier_name}`
            : 'Neidentifikovaný doklad',
          amount: totalWithoutVat > 0 ? totalWithoutVat : totalWithVat,
          vat_amount: totalVat,
          debit_account: fallback.debit,
          debit_name: accountMap.get(fallback.debit) || fallback.debit,
          credit_account: fallback.credit,
          credit_name: accountMap.get(fallback.credit) || fallback.credit,
          vat_account: totalVat > 0 ? '343' : null,
          confidence: 0.3,
          rule_id: null,
          rule_name: null,
          legal_reference: null,
        })

        if (totalVat > 0) {
          suggestions.push({
            line_number: 2,
            description: 'DPH',
            amount: totalVat,
            vat_amount: 0,
            debit_account: '343',
            debit_name: accountMap.get('343') || '343',
            credit_account: fallback.credit,
            credit_name: accountMap.get(fallback.credit) || fallback.credit,
            vat_account: null,
            confidence: 0.3,
            rule_id: null,
            rule_name: null,
            legal_reference: null,
          })
        }
      }
    }

    // 7. Save suggestions to document_journal_entries
    if (suggestions.length > 0) {
      // Delete existing suggestions for this document
      await supabaseAdmin
        .from('document_journal_entries')
        .delete()
        .eq('document_id', document_id)
        .eq('status', 'suggested')

      const entries = suggestions.map(s => ({
        document_id,
        line_number: s.line_number,
        description: s.description,
        amount: s.amount,
        vat_amount: s.vat_amount,
        debit_account: s.debit_account,
        credit_account: s.credit_account,
        vat_account: s.vat_account,
        confidence: s.confidence,
        rule_id: s.rule_id,
        status: 'suggested',
      }))

      await supabaseAdmin
        .from('document_journal_entries')
        .insert(entries)
    }

    return NextResponse.json({
      document_id,
      supplier_name: doc.supplier_name,
      document_type: doc.type,
      total_without_vat: totalWithoutVat,
      total_vat: totalVat,
      total_with_vat: totalWithVat,
      suggested_entries: suggestions,
      matched_rules: suggestions.filter(s => s.rule_name && !s.rule_name.startsWith('DPH')).map(s => s.rule_name),
      item_level: ocrItems.length > 1,
    })
  } catch (err) {
    console.error('Predkontace error:', err)
    return NextResponse.json({ error: 'Chyba při generování předkontace' }, { status: 500 })
  }
}

// GET - get existing journal entries for a document
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const documentId = searchParams.get('document_id')

  if (!documentId) {
    return NextResponse.json({ error: 'document_id is required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('document_journal_entries')
      .select('*')
      .eq('document_id', documentId)
      .order('line_number', { ascending: true })

    if (error) throw error

    // Load account names
    const accountNumbers = new Set<string>()
    for (const entry of data || []) {
      accountNumbers.add(entry.debit_account)
      accountNumbers.add(entry.credit_account)
      if (entry.vat_account) accountNumbers.add(entry.vat_account)
    }

    const { data: accounts } = await supabaseAdmin
      .from('chart_of_accounts')
      .select('account_number, account_name')
      .in('account_number', Array.from(accountNumbers))

    const accountMap = new Map<string, string>()
    for (const a of accounts || []) {
      accountMap.set(a.account_number, a.account_name)
    }

    const entries = (data || []).map(e => ({
      ...e,
      debit_name: accountMap.get(e.debit_account) || e.debit_account,
      credit_name: accountMap.get(e.credit_account) || e.credit_account,
      vat_name: e.vat_account ? (accountMap.get(e.vat_account) || e.vat_account) : null,
    }))

    return NextResponse.json({ entries })
  } catch (err) {
    console.error('Journal entries GET error:', err)
    return NextResponse.json({ error: 'Chyba při načítání předkontace' }, { status: 500 })
  }
}

// PATCH - update journal entry status (approve/reject/modify)
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userName = getUserName(request, '')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { entry_id, status, debit_account, credit_account, vat_account, amount, vat_amount } = body

    if (!entry_id) {
      return NextResponse.json({ error: 'entry_id is required' }, { status: 400 })
    }

    const validStatuses = ['approved', 'modified', 'rejected']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) {
      updateData.status = status
      updateData.approved_by = userName || userId
      updateData.approved_at = new Date().toISOString()
    }
    if (debit_account) updateData.debit_account = debit_account
    if (credit_account) updateData.credit_account = credit_account
    if (vat_account !== undefined) updateData.vat_account = vat_account
    if (amount !== undefined) updateData.amount = amount
    if (vat_amount !== undefined) updateData.vat_amount = vat_amount

    if (debit_account || credit_account || amount !== undefined) {
      updateData.status = 'modified'
      updateData.approved_by = userName || userId
      updateData.approved_at = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('document_journal_entries')
      .update(updateData)
      .eq('id', entry_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ entry: data })
  } catch (err) {
    console.error('Journal entry PATCH error:', err)
    return NextResponse.json({ error: 'Chyba při aktualizaci' }, { status: 500 })
  }
}

// --- Helper functions ---

type OcrItem = {
  description?: string
  name?: string
  category?: string
  amount?: number
  amount_without_vat?: number
  vat_amount?: number
  vat_rate?: number
  unit_price?: number
  quantity?: number
  total_price?: number
}

function extractOcrItems(doc: Record<string, unknown>): OcrItem[] {
  if (!doc.ocr_data || typeof doc.ocr_data !== 'object') return []
  const ocr = doc.ocr_data as Record<string, unknown>
  if (!ocr.items || !Array.isArray(ocr.items)) return []

  return ocr.items
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map(item => ({
      description: item.description ? String(item.description) : undefined,
      name: item.name ? String(item.name) : undefined,
      category: item.category ? String(item.category) : undefined,
      amount: Number(item.total_price) || Number(item.unit_price) || Number(item.amount) || 0,
      amount_without_vat: Number(item.amount_without_vat) || Number(item.base_amount) || 0,
      vat_amount: Number(item.vat_amount) || Number(item.vat) || 0,
      vat_rate: Number(item.vat_rate) || undefined,
      unit_price: Number(item.unit_price) || undefined,
      quantity: Number(item.quantity) || undefined,
      total_price: Number(item.total_price) || undefined,
    }))
    .filter(item => (item.description || item.name) && item.amount > 0)
}

function mapDocumentType(type: string): string {
  const typeMap: Record<string, string> = {
    'invoice_received': 'expense_invoice',
    'invoice_issued': 'income_invoice',
    'expense': 'expense_invoice',
    'income': 'income_invoice',
    'receipt': 'receipt',
    'contract': 'contract',
    'payslip': 'payroll',
    'other': 'other',
  }
  return typeMap[type] || type
}

function buildSearchText(doc: Record<string, unknown>): string {
  const parts: string[] = []
  if (doc.supplier_name) parts.push(String(doc.supplier_name))
  if (doc.file_name) parts.push(String(doc.file_name))

  // Include OCR data if available
  if (doc.ocr_data && typeof doc.ocr_data === 'object') {
    const ocr = doc.ocr_data as Record<string, unknown>
    if (ocr.items && Array.isArray(ocr.items)) {
      for (const item of ocr.items) {
        if (typeof item === 'object' && item !== null) {
          const i = item as Record<string, unknown>
          if (i.description) parts.push(String(i.description))
          if (i.name) parts.push(String(i.name))
        }
      }
    }
    if (ocr.description) parts.push(String(ocr.description))
    if (ocr.supplier_name) parts.push(String(ocr.supplier_name))
  }

  return parts.join(' ').toLowerCase()
}

function findBestRule(
  rules: AccountingRule[],
  docType: string,
  searchText: string,
  amount: number,
): AccountingRule | null {
  let bestRule: AccountingRule | null = null
  let bestScore = 0

  for (const rule of rules) {
    let score = 0

    // Document type match
    if (rule.document_type && rule.document_type === docType) {
      score += 10
    } else if (rule.document_type && rule.document_type !== docType) {
      continue // Skip rules for different document types
    }

    // Keyword match
    if (rule.keyword_match && rule.keyword_match.length > 0) {
      let keywordHits = 0
      for (const keyword of rule.keyword_match) {
        if (searchText.includes(keyword.toLowerCase())) {
          keywordHits++
        }
      }
      if (keywordHits > 0) {
        score += keywordHits * 5
      }
    }

    // Amount range match
    if (rule.min_amount && amount < Number(rule.min_amount)) continue
    if (rule.max_amount && amount > Number(rule.max_amount)) continue

    // Priority bonus
    score += rule.priority

    if (score > bestScore) {
      bestScore = score
      bestRule = rule
    }
  }

  return bestRule
}

function calculateConfidence(
  rule: AccountingRule,
  searchText: string,
  docType: string,
): number {
  let confidence = 0.5

  // Document type match adds confidence
  if (rule.document_type === docType) confidence += 0.15

  // Keyword match adds confidence
  if (rule.keyword_match && rule.keyword_match.length > 0) {
    let hits = 0
    for (const keyword of rule.keyword_match) {
      if (searchText.includes(keyword.toLowerCase())) hits++
    }
    const hitRatio = hits / rule.keyword_match.length
    confidence += hitRatio * 0.25
  }

  // High priority rules are more specific
  if (rule.priority >= 10) confidence += 0.05
  if (rule.priority >= 15) confidence += 0.05

  return Math.min(confidence, 0.99)
}

function getFallbackEntry(docType: string): { debit: string; credit: string } {
  switch (docType) {
    case 'expense_invoice':
      return { debit: '518', credit: '321' } // Ostatní služby / Dodavatelé
    case 'income_invoice':
      return { debit: '311', credit: '602' } // Odběratelé / Tržby z prodeje služeb
    case 'receipt':
      return { debit: '501', credit: '211' } // Spotřeba materiálu / Pokladna
    default:
      return { debit: '518', credit: '321' }
  }
}
