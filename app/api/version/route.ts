import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

let BUILD_VERSION: string
try {
  BUILD_VERSION = readFileSync(join(process.cwd(), '.next', 'BUILD_ID'), 'utf-8').trim()
} catch {
  BUILD_VERSION = Date.now().toString()
}

export const dynamic = 'force-dynamic'

export async function GET() {
  return new NextResponse(BUILD_VERSION, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
