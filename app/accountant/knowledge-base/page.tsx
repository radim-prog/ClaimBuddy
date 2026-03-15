'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Scale,
  FileText,
  ScrollText,
  List,
  Percent,
  Calculator,
  Banknote,
  ClipboardCheck,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  ChevronRight,
  BookOpen,
  Search,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useCachedFetch } from '@/lib/hooks/use-cached-fetch'

interface Article {
  id: string
  category: string
  title: string
  content: string
  source_url: string | null
  sort_order: number
  updated_at: string
}

type Category = {
  id: string
  label: string
  icon: typeof Scale
  description: string
}

const CATEGORIES: Category[] = [
  { id: 'laws', label: 'Účetní zákony', icon: Scale, description: 'Zákon o účetnictví, DPH, daně z příjmů' },
  { id: 'standards', label: 'Účetní standardy', icon: FileText, description: 'České účetní standardy (ČÚS 001-024)' },
  { id: 'decrees', label: 'Vyhlášky', icon: ScrollText, description: 'Prováděcí vyhlášky k účetním zákonům' },
  { id: 'chart_of_accounts', label: 'Účtová osnova', icon: List, description: 'Účtové třídy a syntetické účty' },
  { id: 'vat', label: 'DPH pravidla', icon: Percent, description: 'Sazby, registrace, přiznání, KH' },
  { id: 'income_tax', label: 'Daň z příjmů', icon: Calculator, description: 'DPFO, DPPO, odpočty, slevy' },
  { id: 'payroll', label: 'Mzdové účetnictví', icon: Banknote, description: 'Pojistné, zálohy, roční zúčtování' },
  { id: 'procedures', label: 'Postupy a best practices', icon: ClipboardCheck, description: 'Uzávěrky, inventarizace, archivace' },
]

export default function KnowledgeBasePage() {
  const { data, loading, refresh } = useCachedFetch<{ articles: Article[] }>(
    'knowledge-base',
    async () => {
      const res = await fetch('/api/accountant/admin/knowledge-base')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  )
  const articles = data?.articles || []

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [isAddingNew, setIsAddingNew] = useState<string | null>(null) // category id
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formSourceUrl, setFormSourceUrl] = useState('')

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const startEdit = (article: Article) => {
    setEditingArticle(article)
    setFormTitle(article.title)
    setFormContent(article.content)
    setFormSourceUrl(article.source_url || '')
    setIsAddingNew(null)
  }

  const startAdd = (categoryId: string) => {
    setIsAddingNew(categoryId)
    setFormTitle('')
    setFormContent('')
    setFormSourceUrl('')
    setEditingArticle(null)
    // Expand the category
    setExpandedCategories(prev => new Set([...prev, categoryId]))
  }

  const cancelEdit = () => {
    setEditingArticle(null)
    setIsAddingNew(null)
    setFormTitle('')
    setFormContent('')
    setFormSourceUrl('')
  }

  const saveArticle = async () => {
    setSaving(true)
    try {
      if (editingArticle) {
        await fetch('/api/accountant/admin/knowledge-base', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingArticle.id,
            title: formTitle,
            content: formContent,
            source_url: formSourceUrl || null,
          }),
        })
      } else if (isAddingNew) {
        const categoryArticles = articles.filter(a => a.category === isAddingNew)
        const maxSort = categoryArticles.length > 0
          ? Math.max(...categoryArticles.map(a => a.sort_order))
          : 0

        await fetch('/api/accountant/admin/knowledge-base', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: isAddingNew,
            title: formTitle,
            content: formContent,
            source_url: formSourceUrl || null,
            sort_order: maxSort + 1,
          }),
        })
      }
      cancelEdit()
      refresh()
    } catch (e) {
      console.error('Save error:', e)
    } finally {
      setSaving(false)
    }
  }

  const deleteArticle = async (id: string) => {
    if (!confirm('Opravdu smazat tento článek?')) return
    try {
      await fetch(`/api/accountant/admin/knowledge-base?id=${id}`, { method: 'DELETE' })
      refresh()
    } catch (e) {
      console.error('Delete error:', e)
    }
  }

  const filteredArticles = searchQuery
    ? articles.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles

  const getArticlesForCategory = (categoryId: string) =>
    filteredArticles.filter(a => a.category === categoryId)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Znalostní báze účetnictví</h2>
        </div>
        <div className="text-xs text-muted-foreground">
          {articles.length} článků
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Hledat v znalostní bázi..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Categories */}
      {!loading && (
        <div className="space-y-2">
          {CATEGORIES.map(cat => {
            const catArticles = getArticlesForCategory(cat.id)
            const isExpanded = expandedCategories.has(cat.id)
            const Icon = cat.icon

            return (
              <div key={cat.id} className="border border-border/50 rounded-xl overflow-hidden">
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <ChevronRight
                    className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                  <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 dark:text-white">{cat.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{cat.description}</span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {catArticles.length}
                  </span>
                </button>

                {/* Category content */}
                {isExpanded && (
                  <div className="p-4 border-t border-border/50 space-y-3">
                    {catArticles.length === 0 && !isAddingNew && (
                      <p className="text-sm text-muted-foreground italic">Zatím žádné články v této kategorii.</p>
                    )}

                    {catArticles.map(article => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        isEditing={editingArticle?.id === article.id}
                        formTitle={formTitle}
                        formContent={formContent}
                        formSourceUrl={formSourceUrl}
                        saving={saving}
                        onEdit={() => startEdit(article)}
                        onDelete={() => deleteArticle(article.id)}
                        onSave={saveArticle}
                        onCancel={cancelEdit}
                        onFormTitleChange={setFormTitle}
                        onFormContentChange={setFormContent}
                        onFormSourceUrlChange={setFormSourceUrl}
                      />
                    ))}

                    {/* Add new form */}
                    {isAddingNew === cat.id && (
                      <Card className="border-purple-200 dark:border-purple-800">
                        <CardContent className="pt-4 space-y-3">
                          <input
                            type="text"
                            placeholder="Název článku"
                            value={formTitle}
                            onChange={e => setFormTitle(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                          />
                          <textarea
                            placeholder="Obsah (markdown)..."
                            value={formContent}
                            onChange={e => setFormContent(e.target.value)}
                            rows={10}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
                          />
                          <input
                            type="url"
                            placeholder="Zdroj URL (volitelné)"
                            value={formSourceUrl}
                            onChange={e => setFormSourceUrl(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={saveArticle}
                              disabled={saving || !formTitle}
                              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                              Uložit
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                            >
                              Zrušit
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Add button */}
                    {isAddingNew !== cat.id && (
                      <button
                        onClick={() => startAdd(cat.id)}
                        className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Přidat článek
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ArticleCard({
  article,
  isEditing,
  formTitle,
  formContent,
  formSourceUrl,
  saving,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  onFormTitleChange,
  onFormContentChange,
  onFormSourceUrlChange,
}: {
  article: Article
  isEditing: boolean
  formTitle: string
  formContent: string
  formSourceUrl: string
  saving: boolean
  onEdit: () => void
  onDelete: () => void
  onSave: () => void
  onCancel: () => void
  onFormTitleChange: (v: string) => void
  onFormContentChange: (v: string) => void
  onFormSourceUrlChange: (v: string) => void
}) {
  const [showContent, setShowContent] = useState(false)

  if (isEditing) {
    return (
      <Card className="border-purple-200 dark:border-purple-800">
        <CardContent className="pt-4 space-y-3">
          <input
            type="text"
            value={formTitle}
            onChange={e => onFormTitleChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
          <textarea
            value={formContent}
            onChange={e => onFormContentChange(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
          />
          <input
            type="url"
            value={formSourceUrl}
            onChange={e => onFormSourceUrlChange(e.target.value)}
            placeholder="Zdroj URL"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
          <div className="flex gap-2">
            <button
              onClick={onSave}
              disabled={saving || !formTitle}
              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
            >
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
              Uložit
            </button>
            <button onClick={onCancel} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
              Zrušit
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="pt-3 pb-3">
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={() => setShowContent(!showContent)}
            className="flex-1 text-left"
          >
            <div className="flex items-center gap-2">
              <ChevronRight
                className={`h-3 w-3 text-gray-400 transition-transform flex-shrink-0 ${showContent ? 'rotate-90' : ''}`}
              />
              <span className="text-sm font-medium">{article.title}</span>
            </div>
          </button>
          <div className="flex items-center gap-1 flex-shrink-0">
            {article.source_url && (
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-muted-foreground hover:text-blue-600 transition-colors"
                title="Otevřít zdroj"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              onClick={onEdit}
              className="p-1 text-muted-foreground hover:text-purple-600 transition-colors"
              title="Upravit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
              title="Smazat"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {showContent && article.content && (
          <div className="mt-3 pl-5 text-sm text-muted-foreground whitespace-pre-wrap border-t pt-3">
            {article.content}
          </div>
        )}
        {showContent && article.source_url && (
          <div className="mt-2 pl-5">
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              {article.source_url}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
