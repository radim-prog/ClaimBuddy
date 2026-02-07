/**
 * mPohoda REST API Client
 *
 * Dokumentace: https://www.stormware.cz/pohoda/xml/mpohoda/
 * API Endpoint: https://api.mpohoda.cz/v1
 *
 * Tento klient slouží pro přímé napojení na mPohoda API pro naší účetní firmu.
 * Pro export faktur klientů používejte pohoda-xml.ts
 */

import { Invoice, InvoiceItem } from './mock-data'

// mPohoda API Configuration
interface MPohodaConfig {
  baseUrl: string        // https://api.mpohoda.cz/v1
  apiKey: string         // API klíč z mPohoda
  companyIco: string     // IČO naší firmy
}

// mPohoda API Response types
interface MPohodaInvoiceResponse {
  id: string
  number: string
  status: 'created' | 'error'
  message?: string
}

interface MPohodaContact {
  id: string
  name: string
  ico?: string
  dic?: string
  street?: string
  city?: string
  zip?: string
  email?: string
  phone?: string
}

interface MPohodaBankAccount {
  id: string
  name: string
  number: string
  bank_code: string
  iban?: string
}

// mPohoda Invoice format for API
interface MPohodaInvoiceData {
  invoiceType: 'issuedInvoice'
  number?: string           // Číslo faktury (volitelné - Pohoda vygeneruje)
  symVar: string            // Variabilní symbol
  date: string              // Datum vystavení (YYYY-MM-DD)
  dateTax: string           // Datum zdanitelného plnění
  dateDue: string           // Datum splatnosti
  text: string              // Text/popis faktury
  partnerIdentity: {
    address: {
      company: string
      city?: string
      street?: string
      zip?: string
      ico?: string
      dic?: string
    }
  }
  items: Array<{
    text: string
    quantity: number
    unit: string
    unitPrice: number
    rateVAT: 'high' | 'low' | 'none'  // 21%, 12%, 0%
  }>
}

/**
 * mPohoda REST API Client
 */
export class MPohodaClient {
  private config: MPohodaConfig

  constructor(config?: Partial<MPohodaConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || process.env.MPOHODA_API_URL || 'https://api.mpohoda.cz/v1',
      apiKey: config?.apiKey || process.env.MPOHODA_API_KEY || '',
      companyIco: config?.companyIco || process.env.MPOHODA_COMPANY_ICO || '',
    }
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-Company-ICO': this.config.companyIco,
    }
  }

  /**
   * Make API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `mPohoda API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      )
    }

    return response.json()
  }

  /**
   * Convert our Invoice to mPohoda format
   */
  private convertInvoiceToMPohoda(invoice: Invoice): MPohodaInvoiceData {
    // Convert VAT rate to mPohoda format
    const convertVatRate = (rate: number): 'high' | 'low' | 'none' => {
      if (rate >= 20) return 'high'   // 21%
      if (rate >= 10) return 'low'    // 12%
      return 'none'                    // 0%
    }

    return {
      invoiceType: 'issuedInvoice',
      number: invoice.invoice_number,
      symVar: invoice.variable_symbol,
      date: invoice.issue_date,
      dateTax: invoice.tax_date,
      dateDue: invoice.due_date,
      text: `Účetní služby - ${invoice.company_name}`,
      partnerIdentity: {
        address: {
          company: invoice.company_name,
          // TODO: Načíst adresu z Company entity
        }
      },
      items: invoice.items.map(item => ({
        text: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unit_price,
        rateVAT: convertVatRate(item.vat_rate),
      })),
    }
  }

  /**
   * Vytvořit fakturu v mPohoda
   */
  async createInvoice(invoice: Invoice): Promise<MPohodaInvoiceResponse> {
    const mPohodaData = this.convertInvoiceToMPohoda(invoice)

    // V reálné implementaci by to bylo:
    // return this.request<MPohodaInvoiceResponse>('/invoices', {
    //   method: 'POST',
    //   body: JSON.stringify(mPohodaData),
    // })

    // Mock response pro demonstraci
    console.log('[mPohoda] Creating invoice:', mPohodaData)

    // Simulace API odpovědi
    return {
      id: `pohoda-${Date.now()}`,
      number: invoice.invoice_number,
      status: 'created',
      message: 'Faktura úspěšně vytvořena v mPohoda',
    }
  }

  /**
   * Získat seznam kontaktů/firem z mPohoda
   */
  async getContacts(): Promise<MPohodaContact[]> {
    // V reálné implementaci:
    // return this.request<MPohodaContact[]>('/contacts')

    // Mock response
    return [
      {
        id: 'contact-1',
        name: 'ABC s.r.o.',
        ico: '12345678',
        dic: 'CZ12345678',
      },
      {
        id: 'contact-2',
        name: 'XYZ OSVČ',
        ico: '87654321',
      },
    ]
  }

  /**
   * Získat bankovní účty
   */
  async getBankAccounts(): Promise<MPohodaBankAccount[]> {
    // V reálné implementaci:
    // return this.request<MPohodaBankAccount[]>('/bank-accounts')

    // Mock response
    return [
      {
        id: 'bank-1',
        name: 'Hlavní účet',
        number: '123456789',
        bank_code: '0100',
        iban: 'CZ1234567890123456789012',
      },
    ]
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // V reálné implementaci:
      // await this.request('/ping')
      // return true

      // Mock test - ověří že máme API klíč
      if (!this.config.apiKey) {
        console.warn('[mPohoda] API key not configured')
        return false
      }
      return true
    } catch {
      return false
    }
  }

  /**
   * Export faktury do mPohoda (hlavní metoda)
   */
  async exportInvoice(invoice: Invoice): Promise<{
    success: boolean
    pohodaId?: string
    error?: string
  }> {
    try {
      // Test připojení
      if (!await this.testConnection()) {
        return {
          success: false,
          error: 'Nelze se připojit k mPohoda API. Zkontrolujte API klíč.',
        }
      }

      // Vytvořit fakturu
      const result = await this.createInvoice(invoice)

      if (result.status === 'created') {
        return {
          success: true,
          pohodaId: result.id,
        }
      } else {
        return {
          success: false,
          error: result.message || 'Neznámá chyba při vytváření faktury',
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Neznámá chyba',
      }
    }
  }
}

// Export singleton instance
export const mPohodaClient = new MPohodaClient()

// Export types
export type { MPohodaConfig, MPohodaInvoiceResponse, MPohodaContact, MPohodaBankAccount }
