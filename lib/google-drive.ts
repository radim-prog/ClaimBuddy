/**
 * Google Drive integrace pro UctoWebApp
 * 
 * Poskytuje přístup k souborům na Google Drive klientů.
 * Vyžaduje env vars:
 * - GOOGLE_DRIVE_CREDENTIALS: cesta k credentials JSON (OAuth2)
 * - GOOGLE_DRIVE_TOKEN: cesta k token JSON (uložený refresh token)
 */

import { google, drive_v3 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import * as fs from 'fs'
import * as path from 'path'

// Types
export type DriveFolder = {
  id: string
  name: string
  parentId?: string
  createdTime?: string
}

export type DriveFile = {
  id: string
  name: string
  mimeType: string
  size?: number
  createdTime?: string
  modifiedTime?: string
  webViewLink?: string
  thumbnailLink?: string
}

// Google Drive MIME types pro dokumenty
export const DOCUMENT_MIME_TYPES = {
  PDF: 'application/pdf',
  IMAGE_PNG: 'image/png',
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_JPG: 'image/jpg',
  IMAGE_WEBP: 'image/webp',
  GOOGLE_DOC: 'application/vnd.google-apps.document',
  GOOGLE_SHEET: 'application/vnd.google-apps.spreadsheet',
}

// Cache pro auth klienta (singleton pattern jako v upload-store-db)
let authClient: OAuth2Client | null = null

/**
 * Inicializuje OAuth2 klienta z env vars
 */
function getAuthClient(): OAuth2Client {
  if (authClient) return authClient

  const credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS
  const tokenPath = process.env.GOOGLE_DRIVE_TOKEN

  if (!credentialsPath) {
    throw new Error('GOOGLE_DRIVE_CREDENTIALS env var not set (path to credentials.json)')
  }

  if (!tokenPath) {
    throw new Error('GOOGLE_DRIVE_TOKEN env var not set (path to token.json)')
  }

  // Načti credentials
  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Google Drive credentials file not found: ${credentialsPath}`)
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'))
  const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web || credentials

  if (!client_id || !client_secret) {
    throw new Error('Invalid credentials file: missing client_id or client_secret')
  }

  authClient = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris?.[0] || 'http://localhost'
  )

  // Načti token pokud existuje
  if (fs.existsSync(tokenPath)) {
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'))
    authClient.setCredentials(token)
  } else {
    throw new Error(`Google Drive token file not found: ${tokenPath}. Run auth flow first.`)
  }

  return authClient
}

/**
 * Získá Drive API clienta
 */
function getDriveClient(): drive_v3.Drive {
  const auth = getAuthClient()
  return google.drive({ version: 'v3', auth })
}

/**
 * Vypíše složky v dané rodičovské složce
 * @param parentId - ID rodičovské složky (optional, default 'root')
 * @returns Pole složek
 */
export async function listFolders(parentId?: string): Promise<DriveFolder[]> {
  try {
    const drive = getDriveClient()
    const parent = parentId || 'root'

    const response = await drive.files.list({
      q: `'${parent}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, parents, createdTime)',
      orderBy: 'name',
      pageSize: 100,
    })

    const files = response.data.files || []
    return files.map(file => ({
      id: file.id!,
      name: file.name!,
      parentId: file.parents?.[0],
      createdTime: file.createdTime ?? undefined,
    }))
  } catch (error) {
    console.error('Failed to list folders:', error)
    throw new Error(`Failed to list folders: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Vypíše soubory v dané složce
 * @param folderId - ID složky
 * @param mimeTypes - Filtr MIME typů (optional)
 * @returns Pole souborů
 */
export async function listFiles(
  folderId: string,
  mimeTypes?: string[]
): Promise<DriveFile[]> {
  try {
    const drive = getDriveClient()

    // Build query
    let query = `'${folderId}' in parents and trashed = false`

    // Exclude folders
    query += ` and mimeType != 'application/vnd.google-apps.folder'`

    // Filter by mime types if specified
    if (mimeTypes && mimeTypes.length > 0) {
      const mimeFilter = mimeTypes.map(m => `mimeType = '${m}'`).join(' or ')
      query += ` and (${mimeFilter})`
    }

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, thumbnailLink)',
      orderBy: 'name',
      pageSize: 100,
    })

    const files = response.data.files || []
    return files.map(file => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      size: file.size ? parseInt(file.size) : undefined,
      createdTime: file.createdTime ?? undefined,
      modifiedTime: file.modifiedTime ?? undefined,
      webViewLink: file.webViewLink ?? undefined,
      thumbnailLink: file.thumbnailLink ?? undefined,
    }))
  } catch (error) {
    console.error('Failed to list files:', error)
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Stáhne soubor z Google Drive jako Buffer
 * @param fileId - ID souboru
 * @returns Buffer s obsahem souboru
 */
export async function downloadFile(fileId: string): Promise<Buffer> {
  try {
    const drive = getDriveClient()

    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    )

    // response.data je ArrayBuffer, konvertuj na Node Buffer
    return Buffer.from(response.data as ArrayBuffer)
  } catch (error) {
    console.error('Failed to download file:', error)
    throw new Error(`Failed to download file ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Exportuje Google Docs/Sheets jako PDF
 * (Pro Google nativní formáty je potřeba použít export, ne download)
 * @param fileId - ID souboru
 * @returns Buffer s PDF
 */
export async function exportAsPdf(fileId: string): Promise<Buffer> {
  try {
    const drive = getDriveClient()

    const response = await drive.files.export(
      { fileId, mimeType: 'application/pdf' },
      { responseType: 'arraybuffer' }
    )

    return Buffer.from(response.data as ArrayBuffer)
  } catch (error) {
    console.error('Failed to export file as PDF:', error)
    throw new Error(`Failed to export file ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Vrátí URL pro náhled souboru v iframe (Google Drive preview)
 * @param fileId - ID souboru
 * @returns URL string pro iframe
 */
export function getPreviewUrl(fileId: string): string {
  // Google Drive embedded viewer pro PDF a obrázky
  return `https://drive.google.com/file/d/${fileId}/preview`
}

/**
 * Vrátí přímý download link (vyžaduje platný auth token)
 * @param fileId - ID souboru
 * @returns URL pro stáhnutí
 */
export function getDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?id=${fileId}&export=download`
}

/**
 * Vrátí thumbnail URL pro soubor
 * @param fileId - ID souboru
 * @param size - Velikost thumbnailu (optional, default 'small')
 * @returns URL thumbnailu nebo null
 */
export async function getThumbnailUrl(
  fileId: string,
  size: 'small' | 'medium' | 'large' = 'small'
): Promise<string | null> {
  try {
    const drive = getDriveClient()

    const response = await drive.files.get({
      fileId,
      fields: 'thumbnailLink',
    })

    return response.data.thumbnailLink || null
  } catch (error) {
    console.warn('Failed to get thumbnail:', error)
    return null
  }
}

/**
 * Vyhledá soubory podle názvu (fulltext search)
 * @param query - Vyhledávací dotaz
 * @param folderId - Omezení na konkrétní složku (optional)
 * @returns Pole nalezených souborů
 */
export async function searchFiles(
  query: string,
  folderId?: string
): Promise<DriveFile[]> {
  try {
    const drive = getDriveClient()

    let searchQuery = `fullText contains '${query.replace(/\'/g, "\'")}' and trashed = false`
    if (folderId) {
      searchQuery += ` and '${folderId}' in parents`
    }

    const response = await drive.files.list({
      q: searchQuery,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
      orderBy: 'modifiedTime desc',
      pageSize: 50,
    })

    const files = response.data.files || []
    return files.map(file => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      size: file.size ? parseInt(file.size) : undefined,
      createdTime: file.createdTime ?? undefined,
      modifiedTime: file.modifiedTime ?? undefined,
      webViewLink: file.webViewLink ?? undefined,
    }))
  } catch (error) {
    console.error('Failed to search files:', error)
    throw new Error(`Failed to search files: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Pomocná funkce pro kontrolu konfigurace
 * @returns true pokud je konfigurace validní
 */
export function checkConfiguration(): { valid: boolean; message: string } {
  const credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS
  const tokenPath = process.env.GOOGLE_DRIVE_TOKEN

  if (!credentialsPath) {
    return { valid: false, message: 'GOOGLE_DRIVE_CREDENTIALS not set' }
  }

  if (!fs.existsSync(credentialsPath)) {
    return { valid: false, message: `Credentials file not found: ${credentialsPath}` }
  }

  if (!tokenPath) {
    return { valid: false, message: 'GOOGLE_DRIVE_TOKEN not set' }
  }

  if (!fs.existsSync(tokenPath)) {
    return { valid: false, message: `Token file not found: ${tokenPath}` }
  }

  return { valid: true, message: 'Configuration valid' }
}
