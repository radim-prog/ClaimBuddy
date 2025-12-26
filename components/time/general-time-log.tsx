'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Clock,
  Phone,
  Mail,
  Users,
  FileText,
  Building2,
  Briefcase,
  Plus,
  Timer,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockCompanies, addTimeLog, ActivityType, MOCK_CONFIG } from '@/lib/mock-data'
import { toast } from 'sonner'

// Activity type configuration
interface ActivityTypeConfig {
  id: ActivityType
  label: string
  icon: typeof Clock
  color: string
  bgColor: string
}

const ACTIVITY_TYPES: ActivityTypeConfig[] = [
  {
    id: 'general',
    label: 'Obecná práce',
    icon: Briefcase,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  {
    id: 'call',
    label: 'Telefonát',
    icon: Phone,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
  },
  {
    id: 'email',
    label: 'Email',
    icon: Mail,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
  },
  {
    id: 'meeting',
    label: 'Schůzka',
    icon: Users,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
  },
  {
    id: 'admin',
    label: 'Administrativa',
    icon: FileText,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
  },
]

export interface TimeLogData {
  client_id?: string
  client_name?: string
  activity_type: ActivityType
  minutes: number
  description: string
  is_billable: boolean
}

interface GeneralTimeLogProps {
  onTimeLogged?: (data: TimeLogData) => void
  trigger?: React.ReactNode
}

export function GeneralTimeLog({
  onTimeLogged,
  trigger,
}: GeneralTimeLogProps) {
  const [open, setOpen] = useState(false)
  const [activityType, setActivityType] = useState<ActivityType>('general')
  const [clientId, setClientId] = useState<string>('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [description, setDescription] = useState('')
  const [isBillable, setIsBillable] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const resetForm = () => {
    setActivityType('general')
    setClientId('')
    setHours('')
    setMinutes('')
    setDescription('')
    setIsBillable(true)
    setDate(new Date().toISOString().split('T')[0])
  }

  const handleSubmit = () => {
    const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0)

    if (totalMinutes <= 0) {
      toast.error('Zadejte čas větší než 0')
      return
    }

    if (!description.trim()) {
      toast.error('Zadejte popis aktivity')
      return
    }

    const client = clientId && clientId !== 'none'
      ? mockCompanies.find(c => c.id === clientId)
      : undefined

    // Add to mock data
    const newLog = addTimeLog({
      user_id: MOCK_CONFIG.CURRENT_USER_ID,
      user_name: MOCK_CONFIG.CURRENT_USER_NAME,
      client_id: client?.id,
      client_name: client?.name,
      activity_type: activityType,
      date,
      minutes: totalMinutes,
      description,
      is_billable: isBillable,
    })

    const data: TimeLogData = {
      client_id: client?.id,
      client_name: client?.name,
      activity_type: activityType,
      minutes: totalMinutes,
      description,
      is_billable: isBillable,
    }

    onTimeLogged?.(data)
    toast.success('Čas zaznamenán')
    resetForm()
    setOpen(false)
  }

  const selectedActivity = ACTIVITY_TYPES.find(a => a.id === activityType)!
  const SelectedIcon = selectedActivity.icon
  const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Clock className="h-4 w-4" />
            Zaznamenat čas
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-blue-600" />
            Záznam času
          </DialogTitle>
          <DialogDescription>
            Zaznamenejte čas strávený mimo úkoly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Activity type selector */}
          <div className="space-y-2">
            <Label>Typ aktivity</Label>
            <div className="grid grid-cols-5 gap-2">
              {ACTIVITY_TYPES.map((type) => {
                const Icon = type.icon
                const isSelected = activityType === type.id
                return (
                  <button
                    key={type.id}
                    onClick={() => setActivityType(type.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
                      isSelected
                        ? `${type.bgColor} border-current ${type.color}`
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isSelected ? type.color : "text-gray-500")} />
                    <span className={cn(
                      "text-xs font-medium",
                      isSelected ? type.color : "text-gray-600"
                    )}>
                      {type.label.split(' ')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Client selector */}
          <div className="space-y-2">
            <Label htmlFor="client">Klient</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="client">
                <SelectValue placeholder="Vyberte klienta..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bez klienta</SelectItem>
                {mockCompanies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Datum</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Time input */}
          <div className="space-y-2">
            <Label>Strávený čas</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0"
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">hodin</span>
              <Input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="0"
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">minut</span>
              {totalMinutes > 0 && (
                <Badge variant="secondary" className="ml-2">
                  = {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Popis aktivity *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Co jste dělali..."
              rows={3}
            />
          </div>

          {/* Billable checkbox */}
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Checkbox
              id="billable"
              checked={isBillable}
              onCheckedChange={(checked) => setIsBillable(!!checked)}
            />
            <div className="flex-1">
              <Label htmlFor="billable" className="cursor-pointer font-medium">
                Fakturovatelné
              </Label>
              <p className="text-xs text-muted-foreground">
                Tento čas bude zahrnut do fakturace klientovi
              </p>
            </div>
            {isBillable && (
              <Badge className="bg-green-100 text-green-700">💰 Fakturovatelné</Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Zrušit
          </Button>
          <Button
            onClick={handleSubmit}
            className={cn(
              selectedActivity.bgColor.replace('bg-', 'bg-').replace('-50', '-600'),
              "hover:opacity-90"
            )}
            style={{
              backgroundColor: activityType === 'call' ? '#16a34a' :
                              activityType === 'email' ? '#9333ea' :
                              activityType === 'meeting' ? '#ea580c' :
                              activityType === 'admin' ? '#6b7280' : '#2563eb'
            }}
          >
            <SelectedIcon className="h-4 w-4 mr-2" />
            Zaznamenat čas
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
