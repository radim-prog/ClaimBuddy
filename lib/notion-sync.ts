/**
 * Notion↔UcetniWebApp bidirectional task sync
 *
 * Syncs tasks between Notion "U-Úkoly" database and app's tasks table.
 * Uses last-write-wins strategy based on timestamp comparison.
 *
 * Requires: NOTION_TOKEN, NOTION_TASKS_DS_ID env vars
 * Note: Notion SDK v5 uses dataSources.query (not databases.query)
 */

import { Client } from '@notionhq/client'
import { supabaseAdmin } from './supabase-admin'
import type { TaskStatus, ScoreMoney, ScoreFire, ScoreTime, ScoreDistance, ScorePersonal } from './types/tasks'

// ============================================================================
// CONFIG
// ============================================================================

const NOTION_TASKS_DS_ID = process.env.NOTION_TASKS_DS_ID || '1f8c49dc953280c2a0f7f120d55aa0ee'

// Notion status → App status mapping
const STATUS_MAP_TO_APP: Record<string, TaskStatus> = {
  'Not Started': 'pending',
  'In Progress': 'in_progress',
  'Waiting': 'waiting_for',
  'Paused': 'waiting_for',
  'Delegated': 'waiting_for',
  'Done': 'completed',
  'Canceled': 'cancelled',
  'Sometime': 'someday_maybe',
}

// App status → Notion status mapping
const STATUS_MAP_TO_NOTION: Partial<Record<TaskStatus, string>> = {
  'draft': 'Not Started',
  'pending': 'Not Started',
  'clarifying': 'In Progress',
  'accepted': 'In Progress',
  'in_progress': 'In Progress',
  'waiting_for': 'Waiting',
  'waiting_client': 'Waiting',
  'awaiting_approval': 'Waiting',
  'completed': 'Done',
  'cancelled': 'Canceled',
  'someday_maybe': 'Sometime',
  'invoiced': 'Done',
}

// Notion "Řešitel" → App user mapping (name → user_id)
// Loaded dynamically from DB, with fallback static map
const NOTION_PEOPLE_STATIC: Record<string, string> = {}

// Notion "Firma" → company_id mapping
// Loaded dynamically from DB, with fallback static map
const NOTION_FIRMA_STATIC: Record<string, string> = {}

// ============================================================================
// NOTION CLIENT
// ============================================================================

function getNotionClient(): Client {
  const token = process.env.NOTION_TOKEN
  if (!token) throw new Error('NOTION_TOKEN not configured')
  return new Client({ auth: token })
}

// ============================================================================
// FIELD MAPPING HELPERS
// ============================================================================

type NotionPage = {
  id: string
  last_edited_time: string
  archived: boolean
  properties: Record<string, any>
}

function getNotionTitle(page: NotionPage): string {
  const titleProp = page.properties['Task Name'] || page.properties['Name']
  if (!titleProp?.title?.[0]) return ''
  return titleProp.title.map((t: any) => t.plain_text).join('')
}

function getNotionStatus(page: NotionPage): string {
  return page.properties['Status']?.status?.name || 'Not Started'
}

function getNotionSelect(page: NotionPage, prop: string): string | null {
  return page.properties[prop]?.select?.name || null
}

function getNotionMultiSelect(page: NotionPage, prop: string): string[] {
  return page.properties[prop]?.multi_select?.map((s: any) => s.name) || []
}

function getNotionDate(page: NotionPage, prop: string): string | null {
  return page.properties[prop]?.date?.start || null
}

function getNotionNumber(page: NotionPage, prop: string): number | null {
  const val = page.properties[prop]?.number
  return val !== null && val !== undefined ? val : null
}

function getNotionRichText(page: NotionPage, prop: string): string | null {
  const rt = page.properties[prop]?.rich_text
  if (!rt?.length) return null
  return rt.map((t: any) => t.plain_text).join('')
}

function getNotionPeople(page: NotionPage, prop: string): string[] {
  return page.properties[prop]?.people?.map((p: any) => p.name || p.id) || []
}

function clampScore<T extends number>(val: number | null, max: number): T | undefined {
  if (val === null || val === undefined) return undefined
  return Math.min(Math.max(Math.round(val), 0), max) as T
}

// ============================================================================
// DYNAMIC LOOKUPS (users, companies)
// ============================================================================

type UserMap = Map<string, string> // name → user_id
type CompanyMap = Map<string, string> // name → company_id

async function loadUserMap(): Promise<UserMap> {
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, name')
  const map = new Map<string, string>()
  for (const u of users || []) {
    if (u.name) map.set(u.name.toLowerCase(), u.id)
  }
  // Add static overrides
  for (const [name, id] of Object.entries(NOTION_PEOPLE_STATIC)) {
    map.set(name.toLowerCase(), id)
  }
  return map
}

async function loadCompanyMap(): Promise<CompanyMap> {
  const { data: companies } = await supabaseAdmin
    .from('companies')
    .select('id, name')
  const map = new Map<string, string>()
  for (const c of companies || []) {
    if (c.name) map.set(c.name.toLowerCase(), c.id)
  }
  // Add known aliases
  const aliases: Record<string, string[]> = {
    'Domečky': ['domečky', 'domecky'],
    'Účto': ['účto', 'ucto'],
    'Inkaska': ['inkaska'],
    'Karmakler': ['karmakler'],
  }
  for (const [, aliasList] of Object.entries(aliases)) {
    for (const alias of aliasList) {
      // Try to find existing company matching any alias
      for (const [compName, compId] of map.entries()) {
        if (compName.includes(alias)) {
          for (const a of aliasList) map.set(a, compId)
          break
        }
      }
    }
  }
  for (const [name, id] of Object.entries(NOTION_FIRMA_STATIC)) {
    map.set(name.toLowerCase(), id)
  }
  return map
}

async function resolveOrCreateUser(name: string, userMap: UserMap): Promise<string | null> {
  if (!name) return null
  const existing = userMap.get(name.toLowerCase())
  if (existing) return existing

  // Create new user as accountant
  const loginName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
  const { data: newUser, error } = await supabaseAdmin
    .from('users')
    .insert({
      name,
      login_name: loginName,
      role: 'accountant',
      email: `${loginName}@internal.zajcon.cz`,
      password_hash: 'notion-sync-placeholder', // No login, just for assignment
    })
    .select('id')
    .single()

  if (error || !newUser) {
    console.error(`Failed to create user "${name}":`, error?.message)
    return null
  }

  userMap.set(name.toLowerCase(), newUser.id)
  return newUser.id
}

function resolveCompany(firmaName: string | null, companyMap: CompanyMap): string | null {
  if (!firmaName) return null
  return companyMap.get(firmaName.toLowerCase()) || null
}

// ============================================================================
// NOTION → APP SYNC
// ============================================================================

interface SyncResult {
  created: number
  updated: number
  skipped: number
  errors: string[]
  details: string[]
}

async function fetchNotionPages(notion: Client): Promise<NotionPage[]> {
  const pages: NotionPage[] = []
  let cursor: string | undefined

  do {
    const response = await notion.dataSources.query({
      data_source_id: NOTION_TASKS_DS_ID,
      start_cursor: cursor,
      page_size: 100,
    })

    pages.push(...response.results as NotionPage[])
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined
  } while (cursor)

  return pages
}

function notionPageToTaskData(
  page: NotionPage,
  userMap: UserMap,
  companyMap: CompanyMap,
  defaultUserId: string
) {
  const title = getNotionTitle(page)
  const notionStatus = getNotionStatus(page)
  const status = STATUS_MAP_TO_APP[notionStatus] || 'pending'

  // Řešitel
  const resolverName = getNotionSelect(page, 'Řešitel')
  const assignedTo = resolverName
    ? userMap.get(resolverName.toLowerCase()) || null
    : null

  // Delegated To
  const delegatedTo = getNotionRichText(page, 'Delegated To')

  // Firma → company
  const firmaName = getNotionSelect(page, 'Firma')
  const companyId = resolveCompany(firmaName, companyMap)

  // R-Tasks scores
  const scoreMoney = clampScore<ScoreMoney>(getNotionNumber(page, 'Money Value'), 3)
  const scoreFire = clampScore<ScoreFire>(getNotionNumber(page, 'Fire Fire'), 3)
  const scoreTime = clampScore<ScoreTime>(getNotionNumber(page, 'Time Value'), 3)
  const scoreDistance = clampScore<ScoreDistance>(getNotionNumber(page, 'Distance Value'), 2)
  const scorePersonal = clampScore<ScorePersonal>(getNotionNumber(page, 'Personal Rating'), 1)

  const totalScore = (scoreMoney || 0) + (scoreFire || 0) + (scoreTime || 0) + (scoreDistance || 0) + (scorePersonal || 0)

  // Deadline
  const deadline = getNotionDate(page, 'Deadline')

  // Metadata from Notion
  const lastAction = getNotionRichText(page, 'Last Action')
  const spentTime = getNotionNumber(page, 'Utracený čas')

  return {
    title,
    status,
    assigned_to: assignedTo,
    assigned_to_name: resolverName || undefined,
    delegated_to: delegatedTo || undefined,
    company_id: companyId,
    company_name: firmaName || '',
    score_money: scoreMoney,
    score_fire: scoreFire,
    score_time: scoreTime,
    score_distance: scoreDistance,
    score_personal: scorePersonal,
    total_score: totalScore,
    due_date: deadline || undefined,
    is_billable: false,
    is_waiting_for: status === 'waiting_for',
    created_by: defaultUserId,
    created_by_name: 'Notion Sync',
    task_data: {
      notion_last_action: lastAction,
      notion_spent_time: spentTime,
      notion_firma: firmaName,
      notion_page_id: page.id,
    },
  }
}

export async function syncFromNotion(): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [], details: [] }

  const notion = getNotionClient()
  const userMap = await loadUserMap()
  const companyMap = await loadCompanyMap()

  // Get default user (Radim = admin)
  const { data: defaultUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single()
  const defaultUserId = defaultUser?.id || 'system'

  // Fetch all Notion pages
  const pages = await fetchNotionPages(notion)
  result.details.push(`Fetched ${pages.length} pages from Notion`)

  // Load existing mappings
  const { data: mappings } = await supabaseAdmin
    .from('notion_sync_mapping')
    .select('*')
  const mappingByNotionId = new Map(
    (mappings || []).map(m => [m.notion_page_id, m])
  )

  for (const page of pages) {
    try {
      const title = getNotionTitle(page)
      if (!title) {
        result.skipped++
        continue
      }

      // Resolve users who don't exist yet
      const resolverName = getNotionSelect(page, 'Řešitel')
      if (resolverName) {
        await resolveOrCreateUser(resolverName, userMap)
      }

      const taskData = notionPageToTaskData(page, userMap, companyMap, defaultUserId)
      const existingMapping = mappingByNotionId.get(page.id)
      const notionUpdated = new Date(page.last_edited_time)

      if (existingMapping?.task_id) {
        // Existing task — check if Notion is newer
        const lastNotionUpdated = existingMapping.last_notion_updated
          ? new Date(existingMapping.last_notion_updated)
          : new Date(0)

        if (notionUpdated <= lastNotionUpdated) {
          result.skipped++
          continue
        }

        // Handle archived → soft delete
        if (page.archived) {
          await supabaseAdmin
            .from('tasks')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', existingMapping.task_id)
          await supabaseAdmin
            .from('notion_sync_mapping')
            .update({
              last_synced_at: new Date().toISOString(),
              last_notion_updated: notionUpdated.toISOString(),
              sync_status: 'synced',
            })
            .eq('id', existingMapping.id)
          result.updated++
          result.details.push(`Archived: "${title}"`)
          continue
        }

        // Update existing task
        const { error } = await supabaseAdmin
          .from('tasks')
          .update({
            ...taskData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingMapping.task_id)

        if (error) {
          result.errors.push(`Update "${title}": ${error.message}`)
          continue
        }

        // Update mapping
        await supabaseAdmin
          .from('notion_sync_mapping')
          .update({
            last_synced_at: new Date().toISOString(),
            last_notion_updated: notionUpdated.toISOString(),
            sync_status: 'synced',
          })
          .eq('id', existingMapping.id)

        result.updated++
      } else {
        // Skip archived pages that were never synced
        if (page.archived) {
          result.skipped++
          continue
        }

        // New task — create
        const { data: newTask, error } = await supabaseAdmin
          .from('tasks')
          .insert({
            ...taskData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (error || !newTask) {
          result.errors.push(`Create "${title}": ${error?.message}`)
          continue
        }

        // Create mapping
        await supabaseAdmin
          .from('notion_sync_mapping')
          .upsert({
            notion_page_id: page.id,
            task_id: newTask.id,
            last_synced_at: new Date().toISOString(),
            last_notion_updated: notionUpdated.toISOString(),
            sync_status: 'synced',
          }, { onConflict: 'notion_page_id' })

        result.created++
        result.details.push(`Created: "${title}"`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      result.errors.push(`Page ${page.id}: ${msg}`)
    }
  }

  return result
}

// ============================================================================
// APP → NOTION SYNC
// ============================================================================

export async function syncToNotion(): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [], details: [] }

  const notion = getNotionClient()

  // Find tasks updated since last sync
  const { data: mappings } = await supabaseAdmin
    .from('notion_sync_mapping')
    .select('*, tasks:task_id(*)')

  if (!mappings?.length) {
    result.details.push('No synced tasks to push back')
    return result
  }

  for (const mapping of mappings) {
    try {
      const task = (mapping as any).tasks
      if (!task) {
        result.skipped++
        continue
      }

      const taskUpdated = new Date(task.updated_at)
      const lastAppUpdated = mapping.last_app_updated
        ? new Date(mapping.last_app_updated)
        : new Date(0)

      // Skip if app hasn't been updated since last sync
      if (taskUpdated <= lastAppUpdated) {
        result.skipped++
        continue
      }

      // Also skip if notion was more recently updated (Notion wins in tie)
      const lastNotionUpdated = mapping.last_notion_updated
        ? new Date(mapping.last_notion_updated)
        : new Date(0)
      if (lastNotionUpdated >= taskUpdated) {
        result.skipped++
        continue
      }

      // Build Notion properties update
      const notionStatus = STATUS_MAP_TO_NOTION[task.status as TaskStatus] || 'Not Started'

      const properties: Record<string, any> = {
        'Task Name': {
          title: [{ text: { content: task.title } }],
        },
        'Status': {
          status: { name: notionStatus },
        },
      }

      // Update scores if present
      if (task.score_money !== null && task.score_money !== undefined) {
        properties['Money Value'] = { number: task.score_money }
      }
      if (task.score_fire !== null && task.score_fire !== undefined) {
        properties['Fire Fire'] = { number: task.score_fire }
      }
      if (task.score_time !== null && task.score_time !== undefined) {
        properties['Time Value'] = { number: task.score_time }
      }
      if (task.score_distance !== null && task.score_distance !== undefined) {
        properties['Distance Value'] = { number: task.score_distance }
      }
      if (task.score_personal !== null && task.score_personal !== undefined) {
        properties['Personal Rating'] = { number: task.score_personal }
      }

      // Update deadline
      if (task.due_date) {
        properties['Deadline'] = { date: { start: task.due_date } }
      }

      await notion.pages.update({
        page_id: mapping.notion_page_id,
        properties,
      })

      // Update mapping
      await supabaseAdmin
        .from('notion_sync_mapping')
        .update({
          last_synced_at: new Date().toISOString(),
          last_app_updated: taskUpdated.toISOString(),
          sync_status: 'synced',
        })
        .eq('id', mapping.id)

      result.updated++
      result.details.push(`Pushed: "${task.title}"`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      result.errors.push(`Mapping ${mapping.id}: ${msg}`)

      // Mark as error
      await supabaseAdmin
        .from('notion_sync_mapping')
        .update({ sync_status: 'error', sync_error: msg })
        .eq('id', mapping.id)
    }
  }

  return result
}

// ============================================================================
// FULL BIDIRECTIONAL SYNC
// ============================================================================

export async function runFullSync(): Promise<{
  fromNotion: SyncResult
  toNotion: SyncResult
  duration_ms: number
}> {
  const start = Date.now()

  // Step 1: Pull from Notion
  const fromNotion = await syncFromNotion()

  // Step 2: Push to Notion
  const toNotion = await syncToNotion()

  return {
    fromNotion,
    toNotion,
    duration_ms: Date.now() - start,
  }
}
