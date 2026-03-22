import { NextRequest } from 'next/server'

export function getUserName(req: NextRequest, fallback = 'Účetní'): string {
  return decodeURIComponent(req.headers.get('x-user-name') || '') || fallback
}
