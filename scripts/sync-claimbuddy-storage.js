/**
 * Sync ClaimBuddy document files from the shared accounting storage bucket into
 * the dedicated claims storage bucket.
 *
 * Usage:
 *   node scripts/sync-claimbuddy-storage.js
 *   node scripts/sync-claimbuddy-storage.js --dry-run
 *
 * Required source env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Required target env:
 *   NEXT_PUBLIC_CLAIMS_SUPABASE_URL
 *   CLAIMS_SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js')

const DRY_RUN = process.argv.includes('--dry-run')
const PAGE_SIZE = 1000
const BUCKET = 'documents'

const SOURCE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SOURCE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TARGET_URL = process.env.NEXT_PUBLIC_CLAIMS_SUPABASE_URL
const TARGET_SERVICE_KEY = process.env.CLAIMS_SUPABASE_SERVICE_ROLE_KEY

if (!SOURCE_URL || !SOURCE_SERVICE_KEY) {
  throw new Error('Missing source envs: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
}

if (!TARGET_URL || !TARGET_SERVICE_KEY) {
  throw new Error('Missing target envs: NEXT_PUBLIC_CLAIMS_SUPABASE_URL and CLAIMS_SUPABASE_SERVICE_ROLE_KEY are required')
}

const source = createClient(SOURCE_URL, SOURCE_SERVICE_KEY)
const target = createClient(TARGET_URL, TARGET_SERVICE_KEY)

async function fetchAll(table, select) {
  const rows = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await source
      .from(table)
      .select(select)
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`)

    if (!data || data.length === 0) break
    rows.push(...data)

    if (data.length < PAGE_SIZE) break
  }

  return rows
}

function uniqPaths(entries) {
  const byPath = new Map()

  for (const entry of entries) {
    const path = entry.path?.trim()
    if (!path || byPath.has(path)) continue
    byPath.set(path, entry)
  }

  return Array.from(byPath.values())
}

async function downloadFromSource(path) {
  const downloaded = await source.storage.from(BUCKET).download(path)
  if (!downloaded.error && downloaded.data) {
    return { buffer: Buffer.from(await downloaded.data.arrayBuffer()) }
  }

  const signed = await source.storage.from(BUCKET).createSignedUrl(path, 60)
  if (signed.error || !signed.data?.signedUrl) {
    return {
      error:
        signed.error?.message ||
        downloaded.error?.message ||
        'Object not found',
    }
  }

  const response = await fetch(signed.data.signedUrl)
  if (!response.ok) {
    return { error: `HTTP ${response.status} while downloading source object` }
  }

  return { buffer: Buffer.from(await response.arrayBuffer()) }
}

async function main() {
  console.log('=== ClaimBuddy Storage Sync ===')
  console.log(`Mode: ${DRY_RUN ? 'dry-run' : 'write'}`)

  const caseDocuments = await fetchAll('insurance_case_documents', 'file_path, mime_type, name')
  const signedDocuments = await fetchAll('signing_jobs', 'signed_document_path, document_name')

  const files = uniqPaths([
    ...caseDocuments.map((row) => ({
      path: row.file_path,
      mimeType: row.mime_type || 'application/octet-stream',
      label: row.name || row.file_path,
      source: 'insurance_case_documents',
    })),
    ...signedDocuments
      .filter((row) => row.signed_document_path)
      .map((row) => ({
        path: row.signed_document_path,
        mimeType: 'application/pdf',
        label: row.document_name || row.signed_document_path,
        source: 'signing_jobs',
      })),
  ])

  console.log(`Files queued: ${files.length}`)

  let copied = 0
  let failed = 0

  for (const file of files) {
    console.log(`- ${file.path}${DRY_RUN ? ' [dry-run]' : ''}`)
    if (DRY_RUN) continue

    const downloaded = await downloadFromSource(file.path)
    if (!downloaded.buffer) {
      failed += 1
      console.error(`  download failed: ${downloaded.error || 'unknown error'}`)
      continue
    }

    const { error: uploadError } = await target.storage
      .from(BUCKET)
      .upload(file.path, downloaded.buffer, {
        contentType: file.mimeType,
        upsert: true,
      })

    if (uploadError) {
      failed += 1
      console.error(`  upload failed: ${uploadError.message}`)
      continue
    }

    copied += 1
  }

  console.log('')
  console.log('Summary:')
  console.log(`queued=${files.length}`)
  console.log(`copied=${DRY_RUN ? 0 : copied}`)
  console.log(`failed=${failed}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
