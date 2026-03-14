/**
 * OCR Client — ocr.z.ai (GLM-OCR) API wrapper
 *
 * Free API: $0.03/1M tokens, 95%+ accuracy
 * Supports PDF (≤50MB), JPG/PNG (≤10MB)
 * Returns: markdown text + layout details with bounding boxes
 */

export interface OcrBoundingBox {
  index: number
  label: 'text' | 'image' | 'formula' | 'table'
  bbox_2d: [number, number, number, number] // normalized [x1, y1, x2, y2] 0-1
  content: string
  height: number
  width: number
}

export interface OcrPageInfo {
  width: number
  height: number
}

export interface OcrResult {
  text: string                         // Full markdown text
  layout_details: OcrBoundingBox[][]   // Per-page bounding boxes
  pages: OcrPageInfo[]                 // Page dimensions
  num_pages: number
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  request_id?: string
}

interface OcrApiResponse {
  id: string
  created: number
  model: string
  md_results: string
  layout_details: OcrBoundingBox[][]
  layout_visualization?: string[]
  data_info: {
    num_pages: number
    pages: OcrPageInfo[]
  }
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  request_id?: string
}

export class OcrClient {
  private apiKey: string
  private baseUrl = 'https://api.z.ai/api/paas/v4/layout_parsing'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ZAI_API_KEY || ''
    if (!this.apiKey) {
      console.warn('[OcrClient] ZAI_API_KEY not set — OCR will not work')
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey
  }

  /**
   * Process a file buffer (PDF/image) through GLM-OCR
   */
  async processFile(
    buffer: Buffer,
    mimeType: string,
    options?: { startPage?: number; endPage?: number }
  ): Promise<OcrResult> {
    if (!this.apiKey) {
      throw new Error('ZAI_API_KEY not configured')
    }

    const base64Data = buffer.toString('base64')
    const dataUri = `data:${mimeType};base64,${base64Data}`

    const body: Record<string, unknown> = {
      model: 'glm-ocr',
      file: dataUri,
    }

    if (options?.startPage) body.start_page_id = options.startPage
    if (options?.endPage) body.end_page_id = options.endPage

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`OCR API error ${response.status}: ${errorText}`)
    }

    const data: OcrApiResponse = await response.json()

    return {
      text: data.md_results || '',
      layout_details: data.layout_details || [],
      pages: data.data_info?.pages || [],
      num_pages: data.data_info?.num_pages || 1,
      usage: data.usage,
      request_id: data.request_id,
    }
  }

  /**
   * Process a file from a URL
   */
  async processUrl(
    fileUrl: string,
    options?: { startPage?: number; endPage?: number }
  ): Promise<OcrResult> {
    if (!this.apiKey) {
      throw new Error('ZAI_API_KEY not configured')
    }

    const body: Record<string, unknown> = {
      model: 'glm-ocr',
      file: fileUrl,
    }

    if (options?.startPage) body.start_page_id = options.startPage
    if (options?.endPage) body.end_page_id = options.endPage

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`OCR API error ${response.status}: ${errorText}`)
    }

    const data: OcrApiResponse = await response.json()

    return {
      text: data.md_results || '',
      layout_details: data.layout_details || [],
      pages: data.data_info?.pages || [],
      num_pages: data.data_info?.num_pages || 1,
      usage: data.usage,
      request_id: data.request_id,
    }
  }
}
