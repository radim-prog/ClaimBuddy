'use client'

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Receipt, 
  FileText, 
  Landmark, 
  FileSignature,
  ArrowLeft
} from 'lucide-react'
import { ExtractionDocumentType } from './types'

interface DocumentTypeSelectorProps {
  value: ExtractionDocumentType
  onChange: (value: ExtractionDocumentType) => void
  disabled?: boolean
  showAll?: boolean
}

const documentTypes: { 
  value: ExtractionDocumentType
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    value: 'receipt',
    label: 'Účtenka',
    description: 'Pokladní účtenka, paragon',
    icon: <Receipt className="w-4 h-4" />
  },
  {
    value: 'invoice',
    label: 'Faktura',
    description: 'Přijatá faktura od dodavatele',
    icon: <FileText className="w-4 h-4" />
  },
  {
    value: 'advance_invoice',
    label: 'Zálohová faktura',
    description: 'Záloha na budoucí dodání',
    icon: <ArrowLeft className="w-4 h-4" />
  },
  {
    value: 'credit_note',
    label: 'Dobropis',
    description: 'Opravný daňový doklad',
    icon: <FileText className="w-4 h-4 text-red-500" />
  },
  {
    value: 'bank_statement',
    label: 'Výpis z účtu',
    description: 'Bankovní výpis, transakce',
    icon: <Landmark className="w-4 h-4" />
  },
  {
    value: 'contract',
    label: 'Smlouva',
    description: 'Obchodní smlouva, dodatek',
    icon: <FileSignature className="w-4 h-4" />
  }
]

export function DocumentTypeSelector({ 
  value, 
  onChange, 
  disabled = false,
  showAll = false 
}: DocumentTypeSelectorProps) {
  const types = showAll 
    ? documentTypes 
    : documentTypes.filter(t => ['receipt', 'invoice'].includes(t.value))

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Vyberte typ dokladu" />
      </SelectTrigger>
      <SelectContent>
        {types.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            <div className="flex items-center gap-2">
              {type.icon}
              <div className="flex flex-col">
                <span>{type.label}</span>
                <span className="text-xs text-gray-500">{type.description}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
