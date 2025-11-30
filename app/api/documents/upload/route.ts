import { NextResponse } from 'next/server'

// DEMO MODE - Simulates file upload (no real file storage)
export async function POST(request: Request) {
  try {
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const companyId = formData.get('companyId') as string
    const period = formData.get('period') as string
    const type = formData.get('type') as string

    if (!file || !companyId || !period || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // In demo mode, simulate successful upload
    const mockDocumentId = `doc-demo-${Date.now()}`
    console.log(`[DEMO] File uploaded:`, {
      id: mockDocumentId,
      file: file.name,
      size: file.size,
      type: file.type,
      companyId,
      period,
      docType: type,
    })

    return NextResponse.json({
      success: true,
      document: {
        id: mockDocumentId,
        file_name: file.name,
        file_url: `https://example.com/demo/${mockDocumentId}`,
        uploaded_at: new Date().toISOString(),
      },
      message: 'Soubor nahrán (demo režim - data se neukládají)'
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
