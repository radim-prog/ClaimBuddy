'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Mail, Send, Clock, Calendar, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

type MissingDocument = 'bank_statement' | 'expense_documents' | 'income_invoices'

type UrgencyEmailModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  companyName: string
  companyEmail: string
  period: string // format: "2024-12"
  missingDocuments: MissingDocument[]
}

const DOCUMENT_LABELS: Record<MissingDocument, string> = {
  bank_statement: 'bankovní výpis',
  expense_documents: 'nákladové doklady',
  income_invoices: 'příjmové faktury',
}

const MONTH_NAMES = [
  'leden', 'únor', 'březen', 'duben', 'květen', 'červen',
  'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'
]

// Pomocná funkce pro formátování období
function formatPeriod(period: string): string {
  const [year, month] = period.split('-')
  const monthIndex = parseInt(month, 10) - 1
  return `${MONTH_NAMES[monthIndex]} ${year}`
}

// Pomocná funkce pro získání následujícího pracovního dne v 9:00
function getNextBusinessDay(): Date {
  const date = new Date()
  date.setDate(date.getDate() + 1)

  // Pokud je sobota, přeskočit na pondělí
  if (date.getDay() === 6) date.setDate(date.getDate() + 2)
  // Pokud je neděle, přeskočit na pondělí
  if (date.getDay() === 0) date.setDate(date.getDate() + 1)

  date.setHours(9, 0, 0, 0)
  return date
}

// Formátování data pro datetime-local input
function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function UrgencyEmailModal({
  open,
  onOpenChange,
  companyId,
  companyName,
  companyEmail,
  period,
  missingDocuments,
}: UrgencyEmailModalProps) {
  const formattedPeriod = formatPeriod(period)
  const missingDocsText = missingDocuments.map(d => DOCUMENT_LABELS[d]).join(', ')

  // Výchozí hodnoty
  const defaultSubject = `Chybějící doklady za ${formattedPeriod}`
  const defaultBody = `Dobrý den,

dovoluji si Vás upozornit, že pro účetní období ${formattedPeriod} nám stále chybí následující doklady:

${missingDocuments.map(d => `• ${DOCUMENT_LABELS[d]}`).join('\n')}

Prosím o jejich dodání co nejdříve, abychom mohli včas zpracovat účetnictví.

V případě dotazů mě neváhejte kontaktovat.

S pozdravem,
Vaše účetní`

  const [recipient, setRecipient] = useState(companyEmail)
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState(defaultBody)
  const [sendOption, setSendOption] = useState<'now' | 'scheduled'>('now')
  const [scheduledTime, setScheduledTime] = useState(formatDateTimeLocal(getNextBusinessDay()))
  const [quickSchedule, setQuickSchedule] = useState<string>('custom')

  // Reset při otevření
  useEffect(() => {
    if (open) {
      setRecipient(companyEmail)
      setSubject(defaultSubject)
      setBody(defaultBody)
      setSendOption('now')
      setScheduledTime(formatDateTimeLocal(getNextBusinessDay()))
      setQuickSchedule('custom')
    }
  }, [open, companyEmail, defaultSubject, defaultBody])

  // Rychlé volby plánování
  const handleQuickSchedule = (value: string) => {
    setQuickSchedule(value)
    const now = new Date()

    switch (value) {
      case 'tomorrow_9':
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(9, 0, 0, 0)
        setScheduledTime(formatDateTimeLocal(tomorrow))
        break
      case 'tomorrow_14':
        const tomorrowAfternoon = new Date(now)
        tomorrowAfternoon.setDate(tomorrowAfternoon.getDate() + 1)
        tomorrowAfternoon.setHours(14, 0, 0, 0)
        setScheduledTime(formatDateTimeLocal(tomorrowAfternoon))
        break
      case 'in_3_days':
        const in3Days = new Date(now)
        in3Days.setDate(in3Days.getDate() + 3)
        in3Days.setHours(9, 0, 0, 0)
        setScheduledTime(formatDateTimeLocal(in3Days))
        break
      case 'next_week':
        const nextWeek = new Date(now)
        nextWeek.setDate(nextWeek.getDate() + 7)
        nextWeek.setHours(9, 0, 0, 0)
        setScheduledTime(formatDateTimeLocal(nextWeek))
        break
    }
  }

  const handleSend = () => {
    /*
     * ============================================
     * TODO: NAPOJENÍ NA EMAIL API
     * ============================================
     *
     * Zde se napojí email služba (doporučené možnosti):
     *
     * 1. RESEND (https://resend.com)
     *    - Moderní, jednoduchý API
     *    - npm install resend
     *    - Příklad:
     *      const resend = new Resend(process.env.RESEND_API_KEY)
     *      await resend.emails.send({
     *        from: 'ucetni@firma.cz',
     *        to: recipient,
     *        subject: subject,
     *        text: body,
     *        scheduledAt: sendOption === 'scheduled' ? new Date(scheduledTime) : undefined
     *      })
     *
     * 2. SENDGRID (https://sendgrid.com)
     *    - Robustní, enterprise ready
     *    - npm install @sendgrid/mail
     *    - Podpora plánovaného odeslání přes send_at parameter
     *
     * 3. MAILGUN (https://mailgun.com)
     *    - npm install mailgun.js
     *    - Podpora plánovaného odeslání přes o:deliverytime
     *
     * 4. NODEMAILER + SMTP
     *    - Pro vlastní SMTP server
     *    - Plánování řešit přes databázi + cron job
     *
     * API ENDPOINT:
     * POST /api/accountant/send-urgency-email
     * Body: {
     *   to: string,
     *   subject: string,
     *   body: string,
     *   scheduledAt?: string (ISO datetime),
     *   companyId: string,
     *   period: string
     * }
     *
     * Response: {
     *   success: boolean,
     *   messageId?: string,
     *   scheduledAt?: string
     * }
     *
     * DATABÁZE - uložit historii urgencí:
     * Table: urgency_emails
     * - id
     * - company_id
     * - period
     * - recipient
     * - subject
     * - body
     * - status: 'scheduled' | 'sent' | 'delivered' | 'failed'
     * - scheduled_at
     * - sent_at
     * - created_at
     * ============================================
     */

    // Record reminder via API
    fetch('/api/accountant/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: companyId,
        company_name: companyName,
        period,
        type: 'missing_docs',
        channel: 'email',
        sent_by: 'Účetní',
        notes: `Chybí: ${missingDocsText}`,
      }),
    }).catch(() => {})

    // DEMO: Simulace odeslání
    if (sendOption === 'now') {
      toast.success(`Email odeslán na ${recipient}`)
    } else {
      const scheduledDate = new Date(scheduledTime)
      toast.success(
        `Email naplánován na ${scheduledDate.toLocaleDateString('cs-CZ')} v ${scheduledDate.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`
      )
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-orange-500" />
            Urgovat klienta - {companyName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Upozornění na chybějící dokumenty */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-orange-800">Chybějící doklady za {formattedPeriod}:</div>
                <div className="text-orange-700 mt-1">{missingDocsText}</div>
              </div>
            </div>
          </div>

          {/* Příjemce */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Příjemce</Label>
            <Input
              id="recipient"
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="email@firma.cz"
            />
          </div>

          {/* Předmět */}
          <div className="space-y-2">
            <Label htmlFor="subject">Předmět</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Předmět emailu"
            />
          </div>

          {/* Text emailu */}
          <div className="space-y-2">
            <Label htmlFor="body">Text emailu</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          {/* Možnosti odeslání */}
          <div className="space-y-3 pt-2 border-t dark:border-gray-700">
            <Label>Kdy odeslat</Label>
            <RadioGroup value={sendOption} onValueChange={(v) => setSendOption(v as 'now' | 'scheduled')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="now" id="now" />
                <Label htmlFor="now" className="flex items-center gap-2 font-normal cursor-pointer">
                  <Send className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  Odeslat ihned
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="scheduled" id="scheduled" />
                <Label htmlFor="scheduled" className="flex items-center gap-2 font-normal cursor-pointer">
                  <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  Naplánovat odeslání
                </Label>
              </div>
            </RadioGroup>

            {/* Plánování */}
            {sendOption === 'scheduled' && (
              <div className="ml-6 space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                {/* Rychlé volby */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 dark:text-gray-400">Rychlá volba</Label>
                  <Select value={quickSchedule} onValueChange={handleQuickSchedule}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tomorrow_9">Zítra v 9:00</SelectItem>
                      <SelectItem value="tomorrow_14">Zítra ve 14:00</SelectItem>
                      <SelectItem value="in_3_days">Za 3 dny v 9:00</SelectItem>
                      <SelectItem value="next_week">Za týden v 9:00</SelectItem>
                      <SelectItem value="custom">Vlastní čas...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Přesný čas */}
                <div className="space-y-2">
                  <Label htmlFor="scheduledTime" className="text-sm text-gray-600 dark:text-gray-400">
                    Datum a čas odeslání
                  </Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <Input
                      id="scheduledTime"
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => {
                        setScheduledTime(e.target.value)
                        setQuickSchedule('custom')
                      }}
                      min={formatDateTimeLocal(new Date())}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button
            onClick={handleSend}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {sendOption === 'now' ? (
              <>
                <Send className="h-4 w-4 mr-2" />
                Odeslat email
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Naplánovat odeslání
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
