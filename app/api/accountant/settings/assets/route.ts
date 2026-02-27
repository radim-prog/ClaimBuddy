import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { invalidateSupplierCache } from '@/lib/supplier-loader'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
const BUCKET_NAME = 'accountant-assets'

async function ensureBucketExists() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET_NAME)
  if (!exists) {
    await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    })
  }
}

// POST - upload logo or signature
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const assetType = formData.get('type') as string | null // 'logo' or 'signature'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!assetType || !['logo', 'signature'].includes(assetType)) {
      return NextResponse.json({ error: 'Type must be "logo" or "signature"' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Allowed: PNG, JPG, SVG' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 2MB' }, { status: 413 })
    }

    await ensureBucketExists()

    // Upload to Supabase Storage
    const ext = file.name.split('.').pop() || 'png'
    const storagePath = `${assetType}.${ext}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Remove old file first (ignore errors)
    await supabaseAdmin.storage.from(BUCKET_NAME).remove([storagePath])

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath)

    const publicUrl = urlData?.publicUrl
    if (!publicUrl) {
      return NextResponse.json({ error: 'Failed to get public URL' }, { status: 500 })
    }

    // Update supplier_info in app_settings
    const { data: settingRow } = await supabaseAdmin
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'supplier_info')
      .single()

    const currentInfo = (settingRow?.setting_value as Record<string, unknown>) || {}
    const urlField = assetType === 'logo' ? 'logo_url' : 'signature_url'
    const updatedInfo = { ...currentInfo, [urlField]: publicUrl }

    await supabaseAdmin
      .from('app_settings')
      .upsert({
        setting_key: 'supplier_info',
        setting_value: updatedInfo,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })

    invalidateSupplierCache()

    return NextResponse.json({ success: true, url: publicUrl, type: assetType })
  } catch (error) {
    console.error('Asset upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - remove logo or signature
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const assetType = searchParams.get('type')

    if (!assetType || !['logo', 'signature'].includes(assetType)) {
      return NextResponse.json({ error: 'Type must be "logo" or "signature"' }, { status: 400 })
    }

    // Remove files with common extensions
    const extensions = ['png', 'jpg', 'jpeg', 'svg']
    const paths = extensions.map(ext => `${assetType}.${ext}`)
    await supabaseAdmin.storage.from(BUCKET_NAME).remove(paths)

    // Remove URL from supplier_info
    const { data: settingRow } = await supabaseAdmin
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'supplier_info')
      .single()

    const currentInfo = (settingRow?.setting_value as Record<string, unknown>) || {}
    const urlField = assetType === 'logo' ? 'logo_url' : 'signature_url'
    const { [urlField]: _removed, ...updatedInfo } = currentInfo

    await supabaseAdmin
      .from('app_settings')
      .upsert({
        setting_key: 'supplier_info',
        setting_value: updatedInfo,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })

    invalidateSupplierCache()

    return NextResponse.json({ success: true, type: assetType })
  } catch (error) {
    console.error('Asset delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
