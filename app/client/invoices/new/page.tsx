'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Download,
  Calculator,
  Building2,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { generateInvoiceNumber, type InvoiceItem } from '@/lib/mock-data'

interface InvoiceItemForm {
  id: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: number
}

interface CustomerForm {
  name: string
  ico: string
  dic: string
  street: string
  city: string
  zip: string
  email: string
}

const VAT_RATES = [
  { value: 21, label: '21% (zakladni)' },
  { value: 12, label: '12% (snizena)' },
  { value: 0, label: '0% (bez DPH)' },
]

const UNITS = [
  { value: 'ks', label: 'ks' },
  { value: 'hod', label: 'hod' },
  { value: 'mes', label: 'mes' },
  { value: 'den', label: 'den' },
  { value: 'km', label: 'km' },
  { value: 'm2', label: 'm2' },
]

export default function NewInvoicePage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  // Invoice header
  const [invoiceNumber] = useState(() => generateInvoiceNumber('client_to_customer'))
  const [variableSymbol, setVariableSymbol] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
  })
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0])
  const [taxDate, setTaxDate] = useState(() => new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    return date.toISOString().split('T')[0]
  })
  const [description, setDescription] = useState('')

  // Customer
  const [customer, setCustomer] = useState<CustomerForm>({
    name: '',
    ico: '',
    dic: '',
    street: '',
    city: '',
    zip: '',
    email: '',
  })

  // Items
  const [items, setItems] = useState<InvoiceItemForm[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unit: 'ks',
      unit_price: 0,
      vat_rate: 21,
    }
  ])

  // Calculate totals
  const totals = useMemo(() => {
    let totalWithoutVat = 0
    let totalVat = 0

    items.forEach(item => {
      const itemTotal = item.quantity * item.unit_price
      const itemVat = itemTotal * (item.vat_rate / 100)
      totalWithoutVat += itemTotal
      totalVat += itemVat
    })

    return {
      totalWithoutVat,
      totalVat,
      totalWithVat: totalWithoutVat + totalVat,
    }
  }, [items])

  const updateCustomer = (field: keyof CustomerForm, value: string) => {
    setCustomer(prev => ({ ...prev, [field]: value }))
  }

  const addItem = () => {
    setItems(prev => [...prev, {
      id: String(Date.now()),
      description: '',
      quantity: 1,
      unit: 'ks',
      unit_price: 0,
      vat_rate: 21,
    }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof InvoiceItemForm, value: string | number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const handleSave = async (asDraft: boolean = true) => {
    setIsSaving(true)
    try {
      // In production, this would save to database
      // For now, just simulate save and redirect
      await new Promise(resolve => setTimeout(resolve, 500))

      console.log('Saving invoice:', {
        invoice_number: invoiceNumber,
        variable_symbol: variableSymbol,
        issue_date: issueDate,
        tax_date: taxDate,
        due_date: dueDate,
        description,
        customer,
        items,
        totals,
        status: asDraft ? 'draft' : 'sent',
      })

      router.push('/client/invoices')
    } catch (error) {
      console.error('Failed to save invoice:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadXml = async () => {
    // Create temporary invoice object for XML generation
    const tempInvoice = {
      id: `temp-${Date.now()}`,
      type: 'client_to_customer' as const,
      company_id: 'client-company',
      company_name: 'Moje firma', // Would come from logged in user
      invoice_number: invoiceNumber,
      variable_symbol: variableSymbol,
      issue_date: issueDate,
      tax_date: taxDate,
      due_date: dueDate,
      customer: {
        name: customer.name,
        ico: customer.ico,
        dic: customer.dic,
        address: `${customer.street}, ${customer.zip} ${customer.city}`,
      },
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        total_without_vat: item.quantity * item.unit_price,
        total_with_vat: item.quantity * item.unit_price * (1 + item.vat_rate / 100),
      })),
      total_without_vat: totals.totalWithoutVat,
      total_vat: totals.totalVat,
      total_with_vat: totals.totalWithVat,
      status: 'draft' as const,
      task_ids: [],
      created_at: new Date().toISOString(),
      created_by: 'client',
    }

    try {
      const response = await fetch('/api/invoices/export-xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: [tempInvoice.id], format: 'single' }),
      })

      if (response.ok) {
        const xml = await response.text()
        const blob = new Blob([xml], { type: 'application/xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${invoiceNumber}.xml`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to generate XML:', error)
    }
  }

  const isValid = customer.name && items.every(item => item.description && item.unit_price > 0)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/client/invoices">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nova faktura</h1>
            <p className="text-gray-600 dark:text-gray-300">Cislo: {invoiceNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadXml}
            disabled={!isValid}
          >
            <Download className="mr-2 h-4 w-4" />
            Stahnout XML
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave(true)}
            disabled={isSaving || !isValid}
          >
            <Save className="mr-2 h-4 w-4" />
            Ulozit koncept
          </Button>
          <Button
            onClick={() => handleSave(false)}
            disabled={isSaving || !isValid}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <FileText className="mr-2 h-4 w-4" />
            Vystavit fakturu
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Udaje faktury</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="variableSymbol">Variabilni symbol</Label>
                  <Input
                    id="variableSymbol"
                    value={variableSymbol}
                    onChange={(e) => setVariableSymbol(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="issueDate">Datum vystaveni</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="taxDate">Datum zdanitelneho plneni</Label>
                  <Input
                    id="taxDate"
                    type="date"
                    value={taxDate}
                    onChange={(e) => setTaxDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Datum splatnosti</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Popis / text faktury</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Fakturujeme Vam za..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Odberatel
              </CardTitle>
              <CardDescription>
                Udaje o odberateli (zakaznikovi)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customerName">Nazev firmy / Jmeno *</Label>
                <Input
                  id="customerName"
                  value={customer.name}
                  onChange={(e) => updateCustomer('name', e.target.value)}
                  placeholder="ABC s.r.o."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerIco">ICO</Label>
                  <Input
                    id="customerIco"
                    value={customer.ico}
                    onChange={(e) => updateCustomer('ico', e.target.value)}
                    placeholder="12345678"
                  />
                </div>
                <div>
                  <Label htmlFor="customerDic">DIC</Label>
                  <Input
                    id="customerDic"
                    value={customer.dic}
                    onChange={(e) => updateCustomer('dic', e.target.value)}
                    placeholder="CZ12345678"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customerStreet">Ulice</Label>
                <Input
                  id="customerStreet"
                  value={customer.street}
                  onChange={(e) => updateCustomer('street', e.target.value)}
                  placeholder="Hlavni 123"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerCity">Mesto</Label>
                  <Input
                    id="customerCity"
                    value={customer.city}
                    onChange={(e) => updateCustomer('city', e.target.value)}
                    placeholder="Praha"
                  />
                </div>
                <div>
                  <Label htmlFor="customerZip">PSC</Label>
                  <Input
                    id="customerZip"
                    value={customer.zip}
                    onChange={(e) => updateCustomer('zip', e.target.value)}
                    placeholder="110 00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customer.email}
                  onChange={(e) => updateCustomer('email', e.target.value)}
                  placeholder="info@abc.cz"
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Polozky faktury</span>
                <Button onClick={addItem} size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Pridat polozku
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Polozka {index + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label>Popis *</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Popis sluzby nebo zbozi"
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <Label>Mnozstvi</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label>Jednotka</Label>
                          <Select
                            value={item.unit}
                            onValueChange={(value) => updateItem(item.id, 'unit', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNITS.map(unit => (
                                <SelectItem key={unit.value} value={unit.value}>
                                  {unit.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Cena/j. *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label>DPH</Label>
                          <Select
                            value={String(item.vat_rate)}
                            onValueChange={(value) => updateItem(item.id, 'vat_rate', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {VAT_RATES.map(rate => (
                                <SelectItem key={rate.value} value={String(rate.value)}>
                                  {rate.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-600 dark:text-gray-300">
                        Celkem: {formatCurrency(item.quantity * item.unit_price * (1 + item.vat_rate / 100))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Souhrn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Zaklad dane:</span>
                    <span className="font-medium">{formatCurrency(totals.totalWithoutVat)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">DPH celkem:</span>
                    <span className="font-medium">{formatCurrency(totals.totalVat)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Celkem k uhrade:</span>
                    <span className="font-bold text-green-600">{formatCurrency(totals.totalWithVat)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>Cislo faktury:</span>
                    <span className="font-mono">{invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Variabilni symbol:</span>
                    <span className="font-mono">{variableSymbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Datum splatnosti:</span>
                    <span>{new Date(dueDate).toLocaleDateString('cs-CZ')}</span>
                  </div>
                </div>

                <Separator />

                {!isValid && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    Pro ulozeni faktury vyplnte:
                    <ul className="mt-1 list-disc list-inside">
                      {!customer.name && <li>Nazev odberatele</li>}
                      {items.some(i => !i.description) && <li>Popis polozek</li>}
                      {items.some(i => i.unit_price <= 0) && <li>Ceny polozek</li>}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export Info */}
            <Card className="mt-4 bg-blue-50 border-blue-100">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Export do Pohody</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Po vyplneni muzete fakturu stahnout jako XML soubor
                      pro import do ucetniho systemu Pohoda.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
