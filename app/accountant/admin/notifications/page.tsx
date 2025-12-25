'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Settings2,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Users,
  User,
  Briefcase,
  Calculator,
  ArrowRight,
  CheckSquare,
  FileText,
  Clock,
  UserCheck,
  CreditCard,
  Building2,
  Search,
} from 'lucide-react'
import {
  NotificationEvent,
  NotificationRule,
  NotificationChannel,
  NotificationRecipientType,
  NotificationEventCategory,
  NOTIFICATION_EVENTS,
  MOCK_NOTIFICATION_RULES,
  MOCK_TEAM_MEMBERS,
} from '@/lib/types/admin'

const categoryLabels: Record<NotificationEventCategory, string> = {
  task: 'Úkoly',
  document: 'Dokumenty',
  onboarding: 'Onboarding',
  deadline: 'Termíny',
  user: 'Uživatelé',
  invoicing: 'Fakturace',
  company: 'Klienti',
}

const categoryIcons: Record<NotificationEventCategory, typeof Bell> = {
  task: CheckSquare,
  document: FileText,
  onboarding: UserCheck,
  deadline: Clock,
  user: Users,
  invoicing: CreditCard,
  company: Building2,
}

const categoryColors: Record<NotificationEventCategory, string> = {
  task: 'bg-blue-100 text-blue-700',
  document: 'bg-green-100 text-green-700',
  onboarding: 'bg-purple-100 text-purple-700',
  deadline: 'bg-orange-100 text-orange-700',
  user: 'bg-indigo-100 text-indigo-700',
  invoicing: 'bg-yellow-100 text-yellow-700',
  company: 'bg-pink-100 text-pink-700',
}

const channelIcons: Record<NotificationChannel, typeof Bell> = {
  in_app: Bell,
  email: Mail,
  sms: Smartphone,
}

const channelLabels: Record<NotificationChannel, string> = {
  in_app: 'V aplikaci',
  email: 'Email',
  sms: 'SMS',
}

const recipientTypeLabels: Record<NotificationRecipientType['type'], string> = {
  role: 'Role',
  user: 'Konkrétní uživatel',
  supervisor: 'Nadřízený',
  client_owner: 'Majitel klienta',
  assigned_accountant: 'Přiřazená účetní',
  creator: 'Autor',
}

export default function NotificationsPage() {
  const [events, setEvents] = useState<NotificationEvent[]>(NOTIFICATION_EVENTS)
  const [rules, setRules] = useState<NotificationRule[]>(MOCK_NOTIFICATION_RULES)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<NotificationEventCategory | 'all'>('all')
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null)

  // New rule form state
  const [newRule, setNewRule] = useState({
    event_code: '',
    recipients: [] as NotificationRecipientType[],
    channels: [] as NotificationChannel[],
  })

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory =
        selectedCategory === 'all' || event.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [events, searchTerm, selectedCategory])

  // Group events by category
  const eventsByCategory = useMemo(() => {
    const grouped: Record<NotificationEventCategory, NotificationEvent[]> = {
      task: [],
      document: [],
      onboarding: [],
      deadline: [],
      user: [],
      invoicing: [],
      company: [],
    }
    filteredEvents.forEach((event) => {
      grouped[event.category].push(event)
    })
    return grouped
  }, [filteredEvents])

  const toggleEventActive = (eventId: string) => {
    setEvents(
      events.map((e) =>
        e.id === eventId ? { ...e, is_active: !e.is_active } : e
      )
    )
  }

  const getEventByCode = (code: string) => events.find((e) => e.code === code)

  const handleAddRule = () => {
    const event = getEventByCode(newRule.event_code)
    if (!event) return

    const rule: NotificationRule = {
      id: (Math.max(...rules.map((r) => parseInt(r.id)), 0) + 1).toString(),
      event_id: event.id,
      event_code: newRule.event_code,
      recipients: newRule.recipients,
      channels: newRule.channels,
      is_active: true,
      created_at: new Date().toISOString(),
      created_by: '1',
    }
    setRules([...rules, rule])
    setNewRule({ event_code: '', recipients: [], channels: [] })
    setIsAddRuleOpen(false)
  }

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id))
  }

  const toggleRuleActive = (id: string) => {
    setRules(
      rules.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r))
    )
  }

  const toggleRecipient = (type: NotificationRecipientType['type']) => {
    const exists = newRule.recipients.some((r) => r.type === type)
    if (exists) {
      setNewRule({
        ...newRule,
        recipients: newRule.recipients.filter((r) => r.type !== type),
      })
    } else {
      setNewRule({
        ...newRule,
        recipients: [...newRule.recipients, { type }],
      })
    }
  }

  const toggleChannel = (channel: NotificationChannel) => {
    const exists = newRule.channels.includes(channel)
    if (exists) {
      setNewRule({
        ...newRule,
        channels: newRule.channels.filter((c) => c !== channel),
      })
    } else {
      setNewRule({
        ...newRule,
        channels: [...newRule.channels, channel],
      })
    }
  }

  const formatRecipients = (recipients: NotificationRecipientType[]) => {
    return recipients
      .map((r) => recipientTypeLabels[r.type])
      .join(', ')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Nastavení notifikací
        </h1>
        <p className="text-gray-500 mt-1">
          Konfigurace událostí a pravidel pro zasílání notifikací
        </p>
      </div>

      <Tabs defaultValue="events" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Události
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Pravidla
          </TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Hledat události..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={selectedCategory}
                  onValueChange={(v) =>
                    setSelectedCategory(v as NotificationEventCategory | 'all')
                  }
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Kategorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všechny kategorie</SelectItem>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Events by Category */}
          <div className="space-y-4">
            {Object.entries(eventsByCategory).map(([category, categoryEvents]) => {
              if (categoryEvents.length === 0) return null
              const CategoryIcon = categoryIcons[category as NotificationEventCategory]
              return (
                <Card key={category}>
                  <CardHeader className="py-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div
                        className={`p-2 rounded-lg ${
                          categoryColors[category as NotificationEventCategory]
                        }`}
                      >
                        <CategoryIcon className="h-4 w-4" />
                      </div>
                      {categoryLabels[category as NotificationEventCategory]}
                      <Badge variant="secondary" className="ml-auto">
                        {categoryEvents.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="divide-y">
                      {categoryEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between py-3"
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{event.name}</span>
                              {event.is_system && (
                                <Badge variant="outline" className="text-xs">
                                  Systémová
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {event.description}
                            </p>
                          </div>
                          <Switch
                            checked={event.is_active}
                            onCheckedChange={() => toggleEventActive(event.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {events.length}
                </p>
                <p className="text-sm text-gray-500">Celkem událostí</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {events.filter((e) => e.is_active).length}
                </p>
                <p className="text-sm text-gray-500">Aktivních</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-3xl font-bold text-gray-400">
                  {events.filter((e) => !e.is_active).length}
                </p>
                <p className="text-sm text-gray-500">Vypnutých</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{rules.length}</p>
                <p className="text-sm text-gray-500">Pravidel</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          {/* Add Rule Button */}
          <div className="flex justify-end">
            <Button onClick={() => setIsAddRuleOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Přidat pravidlo
            </Button>
          </div>

          {/* Rules List */}
          <div className="space-y-4">
            {rules.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Zatím nejsou nastavena žádná pravidla
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsAddRuleOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Přidat první pravidlo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              rules.map((rule) => {
                const event = getEventByCode(rule.event_code)
                const CategoryIcon = event
                  ? categoryIcons[event.category]
                  : Bell
                return (
                  <Card
                    key={rule.id}
                    className={!rule.is_active ? 'opacity-60' : ''}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-2 rounded-lg ${
                            event
                              ? categoryColors[event.category]
                              : 'bg-gray-100'
                          }`}
                        >
                          <CategoryIcon className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">
                              {event?.name || rule.event_code}
                            </span>
                            {!rule.is_active && (
                              <Badge variant="secondary">Vypnuto</Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {formatRecipients(rule.recipients)}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {rule.channels.map((channel) => {
                              const ChannelIcon = channelIcons[channel]
                              return (
                                <Badge
                                  key={channel}
                                  variant="outline"
                                  className="flex items-center gap-1"
                                >
                                  <ChannelIcon className="h-3 w-3" />
                                  {channelLabels[channel]}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => toggleRuleActive(rule.id)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Channel Legend */}
          <Card className="bg-gray-50">
            <CardContent className="py-4">
              <h4 className="font-medium mb-3">Dostupné kanály</h4>
              <div className="flex flex-wrap gap-4">
                {Object.entries(channelLabels).map(([channel, label]) => {
                  const ChannelIcon = channelIcons[channel as NotificationChannel]
                  return (
                    <div
                      key={channel}
                      className="flex items-center gap-2 text-sm"
                    >
                      <ChannelIcon className="h-4 w-4 text-gray-500" />
                      <span>{label}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Rule Dialog */}
      <Dialog open={isAddRuleOpen} onOpenChange={setIsAddRuleOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Přidat pravidlo notifikace</DialogTitle>
            <DialogDescription>
              Definujte, kdo obdrží notifikaci a jakým kanálem
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Event Selection */}
            <div className="space-y-2">
              <Label>Událost</Label>
              <Select
                value={newRule.event_code}
                onValueChange={(v) =>
                  setNewRule({ ...newRule, event_code: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte událost" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eventsByCategory).map(
                    ([category, categoryEvents]) =>
                      categoryEvents.length > 0 && (
                        <div key={category}>
                          <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                            {categoryLabels[category as NotificationEventCategory]}
                          </div>
                          {categoryEvents
                            .filter((e) => e.is_active)
                            .map((event) => (
                              <SelectItem key={event.code} value={event.code}>
                                {event.name}
                              </SelectItem>
                            ))}
                        </div>
                      )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Recipients */}
            <div className="space-y-2">
              <Label>Příjemci</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(recipientTypeLabels).map(([type, label]) => (
                  <label
                    key={type}
                    className={`
                      flex items-center gap-2 p-3 rounded-lg border cursor-pointer
                      ${
                        newRule.recipients.some((r) => r.type === type)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <Checkbox
                      checked={newRule.recipients.some((r) => r.type === type)}
                      onCheckedChange={() =>
                        toggleRecipient(type as NotificationRecipientType['type'])
                      }
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Channels */}
            <div className="space-y-2">
              <Label>Kanály</Label>
              <div className="flex gap-2">
                {Object.entries(channelLabels).map(([channel, label]) => {
                  const ChannelIcon = channelIcons[channel as NotificationChannel]
                  const isSelected = newRule.channels.includes(
                    channel as NotificationChannel
                  )
                  return (
                    <button
                      key={channel}
                      type="button"
                      onClick={() =>
                        toggleChannel(channel as NotificationChannel)
                      }
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                        ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <ChannelIcon className="h-4 w-4" />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRuleOpen(false)}>
              Zrušit
            </Button>
            <Button
              onClick={handleAddRule}
              disabled={
                !newRule.event_code ||
                newRule.recipients.length === 0 ||
                newRule.channels.length === 0
              }
            >
              <Check className="h-4 w-4 mr-2" />
              Přidat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
