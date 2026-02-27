'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  AlertTriangle,
  Phone,
  Mail,
  Banknote,
  Clock,
  FileText,
  Edit2,
  Trash2,
} from 'lucide-react'
import {
  Employee,
  HEALTH_INSURANCE_COMPANIES,
  CONTRACT_TYPE_LABELS,
  WAGE_TYPE_LABELS,
  DEDUCTION_TYPE_LABELS,
  HealthInsuranceCode,
} from '@/lib/types/employee'
import { EditEmployeeModal } from './edit-employee-modal'
import { formatCurrency, formatDate } from '@/lib/utils'

type EmployeesSectionProps = {
  companyId: string
  employees: Employee[]
  onEmployeesChange?: (employees: Employee[]) => void
  defaultOpen?: boolean
}

export function EmployeesSection({ companyId, employees, onEmployeesChange, defaultOpen = true }: EmployeesSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)

  const toggleExpand = (id: string) => {
    setExpandedEmployee(expandedEmployee === id ? null : id)
  }

  const handleSaveEmployee = (employee: Employee) => {
    if (onEmployeesChange) {
      const existingIndex = employees.findIndex(e => e.id === employee.id)
      if (existingIndex >= 0) {
        // Update existing
        const updated = [...employees]
        updated[existingIndex] = employee
        onEmployeesChange(updated)
      } else {
        // Add new
        onEmployeesChange([...employees, employee])
      }
    }
    setEditingEmployee(null)
    setIsAddingNew(false)
  }

  const handleDeleteEmployee = (employeeId: string) => {
    if (onEmployeesChange && confirm('Opravdu chcete smazat tohoto zaměstnance?')) {
      onEmployeesChange(employees.filter(e => e.id !== employeeId))
    }
  }

  const getContractBadgeColor = (type: string) => {
    switch (type) {
      case 'hpp': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'dpp': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      case 'dpc': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const hasDeductions = (emp: Employee) => (emp.deductions || []).filter(d => d.active).length > 0

  return (
    <Card className="scroll-mt-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 hover:text-purple-600 transition-colors"
          >
            {isOpen ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
            <Users className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Zaměstnanci ({employees.length})</CardTitle>
          </button>
          {isOpen && (
            <Button size="sm" variant="default" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setIsAddingNew(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Přidat zaměstnance
            </Button>
          )}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          {employees.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="mb-2">Žádní zaměstnanci</p>
            <p className="text-sm text-gray-400">
              Klikněte na "Přidat zaměstnance" pro vytvoření prvního záznamu
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className={`border rounded-lg overflow-hidden transition-all ${
                  hasDeductions(emp) ? 'border-orange-200 dark:border-orange-700' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Hlavní řádek */}
                <div
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50 ${
                    hasDeductions(emp) ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                  }`}
                  onClick={() => toggleExpand(emp.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {emp.first_name} {emp.last_name}
                          {hasDeductions(emp) && (
                            <AlertTriangle className="h-4 w-4 inline ml-2 text-orange-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{emp.position}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Badges */}
                      <div className="hidden md:flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getContractBadgeColor(emp.contract_type)}`}>
                          {CONTRACT_TYPE_LABELS[emp.contract_type as keyof typeof CONTRACT_TYPE_LABELS] || emp.contract_type || '—'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {formatCurrency(emp.base_salary)}
                        </span>
                      </div>

                      {/* Expand icon */}
                      {expandedEmployee === emp.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Rozbalený detail */}
                {expandedEmployee === emp.id && (
                  <div className="border-t bg-gray-50 dark:bg-gray-800/50 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Osobní údaje */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700 dark:text-gray-200 border-b pb-1">Osobní údaje</h4>
                        <div className="text-sm space-y-1">
                          {emp.birth_date && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Datum narození:</span>
                              <span>{formatDate(emp.birth_date)}</span>
                            </div>
                          )}
                          {emp.email && (
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{emp.email}</span>
                            </div>
                          )}
                          {emp.phone && (
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <Phone className="h-3 w-3" />
                              <span>{emp.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pracovní poměr */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700 dark:text-gray-200 border-b pb-1">Pracovní poměr</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Typ:</span>
                            <span>{CONTRACT_TYPE_LABELS[emp.contract_type as keyof typeof CONTRACT_TYPE_LABELS] || emp.contract_type || '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Od:</span>
                            <span>{formatDate(emp.employment_start)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Mzda:</span>
                            <span>{formatCurrency(emp.base_salary)}/měs.</span>
                          </div>
                        </div>
                      </div>

                      {/* Pojištění a daně */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700 dark:text-gray-200 border-b pb-1">Pojištění a daně</h4>
                        <div className="text-sm space-y-1">
                          {emp.health_insurance && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">ZP:</span>
                              <span>{HEALTH_INSURANCE_COMPANIES[emp.health_insurance]?.split(' - ')[0] || emp.health_insurance}</span>
                            </div>
                          )}
                          {emp.tax_declaration !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Prohlášení:</span>
                              <span>{emp.tax_declaration ? 'Ano' : 'Ne'}</span>
                            </div>
                          )}
                          {emp.tax_bonus_children != null && emp.tax_bonus_children > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Děti:</span>
                              <span>{emp.tax_bonus_children}</span>
                            </div>
                          )}
                          {emp.student && (
                            <div className="text-blue-600 dark:text-blue-400">Student</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Srážky */}
                    {(emp.deductions || []).length > 0 && (
                      <div className="mt-4 pt-4 border-t dark:border-gray-700">
                        <h4 className="font-medium text-sm text-orange-700 mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          Srážky ze mzdy ({(emp.deductions || []).filter(d => d.active).length})
                        </h4>
                        <div className="space-y-2">
                          {(emp.deductions || []).filter(d => d.active).map(ded => (
                            <div key={ded.id} className="bg-orange-100 dark:bg-orange-900/30 rounded p-3 text-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-orange-800 dark:text-orange-200">
                                    {DEDUCTION_TYPE_LABELS[ded.type]}
                                  </div>
                                  <div className="text-orange-700 dark:text-orange-300">{ded.description}</div>
                                  {ded.creditor && (
                                    <div className="text-orange-600 dark:text-orange-400 text-xs mt-1">
                                      Věřitel: {ded.creditor}
                                    </div>
                                  )}
                                  {ded.reference_number && (
                                    <div className="text-orange-600 dark:text-orange-400 text-xs">
                                      Sp. zn.: {ded.reference_number}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-orange-800 dark:text-orange-200">
                                    {ded.is_percentage
                                      ? `${ded.amount} %`
                                      : formatCurrency(ded.amount)
                                    }
                                  </div>
                                  {ded.end_date && (
                                    <div className="text-xs text-orange-600 dark:text-orange-400">
                                      do {formatDate(ded.end_date)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Poznámky */}
                    {emp.notes && (
                      <div className="mt-4 pt-4 border-t dark:border-gray-700">
                        <h4 className="font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">Poznámky</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{emp.notes}</p>
                      </div>
                    )}

                    {/* Bankovní účet */}
                    {emp.bank_account && (
                      <div className="mt-4 pt-4 border-t dark:border-gray-700">
                        <div className="flex items-center gap-2 text-sm">
                          <Banknote className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-500 dark:text-gray-400">Účet:</span>
                          <span className="font-mono">{emp.bank_account}</span>
                        </div>
                      </div>
                    )}

                    {/* Akce */}
                    <div className="mt-4 pt-4 border-t flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingEmployee(emp)
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Upravit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 dark:bg-red-900/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteEmployee(emp.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Smazat
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </CardContent>
      )}

      {/* Modal pro editaci/přidání */}
      {(editingEmployee || isAddingNew) && (
        <EditEmployeeModal
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setEditingEmployee(null)
              setIsAddingNew(false)
            }
          }}
          employee={editingEmployee}
          companyId={companyId}
          onSave={handleSaveEmployee}
        />
      )}
    </Card>
  )
}
