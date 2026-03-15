'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Save, X, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Employee,
  Deduction,
  DeductionType,
  HealthInsuranceCode,
  HEALTH_INSURANCE_COMPANIES,
  CONTRACT_TYPE_LABELS,
  WAGE_TYPE_LABELS,
  DEDUCTION_TYPE_LABELS,
} from '@/lib/types/employee'

type EditEmployeeModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null // null = nový zaměstnanec
  companyId: string
  onSave: (employee: Employee) => void
}

const emptyEmployee: Omit<Employee, 'id' | 'company_id' | 'created_at' | 'updated_at'> = {
  first_name: '',
  last_name: '',
  birth_date: '',
  position: '',
  employment_start: new Date().toISOString().split('T')[0],
  employment_end: null,
  contract_type: 'hpp',
  wage_type: 'fixed',
  base_salary: 0,
  hourly_rate: 0,
  health_insurance: '111',
  social_insurance: true,
  tax_declaration: true,
  tax_bonus_children: 0,
  disability_level: 0,
  student: false,
  deductions: [],
  active: true,
}

const emptyDeduction: Omit<Deduction, 'id'> = {
  type: 'exekuce',
  description: '',
  amount: 0,
  is_percentage: false,
  priority: 1,
  creditor: '',
  reference_number: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: null,
  active: true,
}

export function EditEmployeeModal({
  open,
  onOpenChange,
  employee,
  companyId,
  onSave,
}: EditEmployeeModalProps) {
  const isNew = !employee
  const [formData, setFormData] = useState<Omit<Employee, 'id' | 'company_id' | 'created_at' | 'updated_at'>>(
    employee ? { ...employee } : { ...emptyEmployee }
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (employee) {
      setFormData({ ...employee })
    } else {
      setFormData({ ...emptyEmployee })
    }
  }, [employee])

  const handleSave = async () => {
    // Validace
    if (!formData.first_name.trim()) {
      toast.error('Vyplňte jméno')
      return
    }
    if (!formData.last_name.trim()) {
      toast.error('Vyplňte příjmení')
      return
    }
    if (!formData.birth_date) {
      toast.error('Vyplňte datum narození')
      return
    }
    if (!formData.position.trim()) {
      toast.error('Vyplňte pracovní pozici')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...formData,
        company_id: companyId,
        ...(employee ? { id: employee.id } : {}),
      }

      const res = await fetch('/api/accountant/employees', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Save failed')
      }

      const data = await res.json()
      onSave(data.employee)
      toast.success(isNew ? 'Zaměstnanec přidán' : 'Zaměstnanec upraven')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  const addDeduction = () => {
    setFormData({
      ...formData,
      deductions: [
        ...formData.deductions,
        { ...emptyDeduction, id: `ded-${Date.now()}` },
      ],
    })
  }

  const removeDeduction = (index: number) => {
    const newDeductions = [...formData.deductions]
    newDeductions.splice(index, 1)
    setFormData({ ...formData, deductions: newDeductions })
  }

  const updateDeduction = (index: number, field: keyof Deduction, value: any) => {
    const newDeductions = [...formData.deductions]
    newDeductions[index] = { ...newDeductions[index], [field]: value }
    setFormData({ ...formData, deductions: newDeductions })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Nový zaměstnanec' : `Upravit: ${employee?.first_name} ${employee?.last_name}`}
          </DialogTitle>
          <DialogDescription>
            {isNew ? 'Vyplňte údaje o novém zaměstnanci' : 'Upravte údaje zaměstnance'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Osobní údaje */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Osobní údaje</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Jméno *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Příjmení *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birth_date">Datum narození *</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="personal_id">Rodné číslo</Label>
                <Input
                  id="personal_id"
                  value={formData.personal_id || ''}
                  onChange={(e) => setFormData({ ...formData, personal_id: e.target.value })}
                  placeholder="XXXXXX/XXXX"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Adresa</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Pracovní poměr */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Pracovní poměr</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Pracovní pozice *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="contract_type">Typ smlouvy</Label>
                <Select
                  value={formData.contract_type}
                  onValueChange={(value) => setFormData({ ...formData, contract_type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employment_start">Datum nástupu *</Label>
                <Input
                  id="employment_start"
                  type="date"
                  value={formData.employment_start}
                  onChange={(e) => setFormData({ ...formData, employment_start: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="employment_end">Datum ukončení</Label>
                <Input
                  id="employment_end"
                  type="date"
                  value={formData.employment_end || ''}
                  onChange={(e) => setFormData({ ...formData, employment_end: e.target.value || null })}
                />
              </div>
            </div>
          </div>

          {/* Mzda */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Mzda</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="wage_type">Typ mzdy</Label>
                <Select
                  value={formData.wage_type}
                  onValueChange={(value) => setFormData({ ...formData, wage_type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(WAGE_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                {formData.wage_type === 'fixed' ? (
                  <>
                    <Label htmlFor="base_salary">Měsíční mzda (Kč)</Label>
                    <Input
                      id="base_salary"
                      type="number"
                      value={formData.base_salary}
                      onChange={(e) => setFormData({ ...formData, base_salary: Number(e.target.value) })}
                    />
                  </>
                ) : (
                  <>
                    <Label htmlFor="hourly_rate">Hodinová sazba (Kč)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      value={formData.hourly_rate || 0}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: Number(e.target.value) })}
                    />
                  </>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="bank_account">Bankovní účet pro výplatu</Label>
              <Input
                id="bank_account"
                value={formData.bank_account || ''}
                onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                placeholder="123456789/0100"
              />
            </div>
          </div>

          {/* Pojištění a daně */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Pojištění a daně</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="health_insurance">Zdravotní pojišťovna</Label>
                <Select
                  value={formData.health_insurance}
                  onValueChange={(value) => setFormData({ ...formData, health_insurance: value as HealthInsuranceCode })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(HEALTH_INSURANCE_COMPANIES).map(([code, name]) => (
                      <SelectItem key={code} value={code}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4 pt-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="social_insurance"
                    checked={formData.social_insurance}
                    onCheckedChange={(checked) => setFormData({ ...formData, social_insurance: !!checked })}
                  />
                  <Label htmlFor="social_insurance" className="text-sm">Sociální pojištění</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="tax_declaration"
                  checked={formData.tax_declaration}
                  onCheckedChange={(checked) => setFormData({ ...formData, tax_declaration: !!checked })}
                />
                <Label htmlFor="tax_declaration" className="text-sm">Prohlášení k dani</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="student"
                  checked={formData.student}
                  onCheckedChange={(checked) => setFormData({ ...formData, student: !!checked })}
                />
                <Label htmlFor="student" className="text-sm">Student</Label>
              </div>
              <div>
                <Label htmlFor="tax_bonus_children">Počet dětí (sleva)</Label>
                <Input
                  id="tax_bonus_children"
                  type="number"
                  min={0}
                  value={formData.tax_bonus_children}
                  onChange={(e) => setFormData({ ...formData, tax_bonus_children: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="disability_level">Stupeň invalidity</Label>
              <Select
                value={String(formData.disability_level || 0)}
                onValueChange={(value) => setFormData({ ...formData, disability_level: Number(value) as any })}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Bez invalidity</SelectItem>
                  <SelectItem value="1">1. stupeň</SelectItem>
                  <SelectItem value="2">2. stupeň</SelectItem>
                  <SelectItem value="3">3. stupeň (ZTP/P)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Srážky ze mzdy */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">Srážky ze mzdy</h3>
              <Button size="sm" variant="outline" onClick={addDeduction}>
                <Plus className="h-4 w-4 mr-1" />
                Přidat srážku
              </Button>
            </div>

            {formData.deductions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Žádné srážky</p>
            ) : (
              <div className="space-y-4">
                {formData.deductions.map((ded, index) => (
                  <div key={ded.id} className="border rounded-lg p-4 bg-orange-50">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-orange-800">Srážka #{index + 1}</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 h-8 w-8 p-0"
                        onClick={() => removeDeduction(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Typ srážky</Label>
                        <Select
                          value={ded.type}
                          onValueChange={(value) => updateDeduction(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(DEDUCTION_TYPE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Částka</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={ded.amount}
                            onChange={(e) => updateDeduction(index, 'amount', Number(e.target.value))}
                            className="flex-1"
                          />
                          <Select
                            value={ded.is_percentage ? 'percent' : 'fixed'}
                            onValueChange={(value) => updateDeduction(index, 'is_percentage', value === 'percent')}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Kč</SelectItem>
                              <SelectItem value="percent">%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <Label>Popis</Label>
                        <Input
                          value={ded.description}
                          onChange={(e) => updateDeduction(index, 'description', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Věřitel</Label>
                        <Input
                          value={ded.creditor || ''}
                          onChange={(e) => updateDeduction(index, 'creditor', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div>
                        <Label>Spisová značka</Label>
                        <Input
                          value={ded.reference_number || ''}
                          onChange={(e) => updateDeduction(index, 'reference_number', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Od</Label>
                        <Input
                          type="date"
                          value={ded.start_date}
                          onChange={(e) => updateDeduction(index, 'start_date', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Do (prázdné = trvale)</Label>
                        <Input
                          type="date"
                          value={ded.end_date || ''}
                          onChange={(e) => updateDeduction(index, 'end_date', e.target.value || null)}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <Checkbox
                        id={`ded-active-${index}`}
                        checked={ded.active}
                        onCheckedChange={(checked) => updateDeduction(index, 'active', !!checked)}
                      />
                      <Label htmlFor={`ded-active-${index}`} className="text-sm">Aktivní srážka</Label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Poznámky */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Poznámky</h3>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Interní poznámky k zaměstnanci..."
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            <X className="mr-2 h-4 w-4" />
            Zrušit
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Ukládám...' : isNew ? 'Přidat zaměstnance' : 'Uložit změny'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
