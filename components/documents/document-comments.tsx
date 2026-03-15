'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, Lock, Pencil, Trash2, Loader2 } from 'lucide-react'

interface Comment {
  id: string
  document_id: string
  content: string
  is_internal: boolean
  author_id: string
  author_name: string
  author_role: 'accountant' | 'client'
  created_at: string
  updated_at: string | null
}

interface DocumentCommentsProps {
  documentId: string
  userRole: 'accountant' | 'client'
  companyId?: string
  userId?: string
}

export function DocumentComments({ documentId, userRole, companyId, userId }: DocumentCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [internalComment, setInternalComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittingInternal, setSubmittingInternal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const apiBase = userRole === 'accountant' && companyId
    ? `/api/accountant/companies/${companyId}/documents/${documentId}/comments`
    : `/api/client/documents/${documentId}/comments`

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(apiBase)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [apiBase])

  useEffect(() => { fetchComments() }, [fetchComments])

  const submitComment = async (content: string, isInternal: boolean) => {
    if (!content.trim()) return
    const setLoading = isInternal ? setSubmittingInternal : setSubmitting
    setLoading(true)
    try {
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), is_internal: userRole === 'accountant' ? isInternal : false }),
      })
      if (res.ok) {
        if (isInternal) setInternalComment('')
        else setNewComment('')
        await fetchComments()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return
    try {
      const res = await fetch(apiBase, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, content: editContent.trim() }),
      })
      if (res.ok) {
        setEditingId(null)
        setEditContent('')
        await fetchComments()
      }
    } catch {
      // silently fail
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`${apiBase}?comment_id=${commentId}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchComments()
      }
    } catch {
      // silently fail
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
        <MessageSquare className="h-3 w-3" />
        Komentáře ({comments.length})
      </h4>

      {loading && (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && comments.length === 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 py-2">Zatím žádné komentáře</p>
      )}

      {comments.map(comment => (
        <div
          key={comment.id}
          className={`group rounded-md px-3 py-2 text-sm ${
            comment.is_internal
              ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30'
              : 'bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-white text-xs">{comment.author_name}</span>
            <Badge className={`text-[10px] px-1.5 py-0 ${
              comment.author_role === 'accountant'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
            }`}>
              {comment.author_role === 'accountant' ? 'Účetní' : 'Klient'}
            </Badge>
            {comment.is_internal && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                <Lock className="h-2.5 w-2.5" /> Interní
              </span>
            )}
            <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">
              {new Date(comment.created_at).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {editingId === comment.id ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleUpdate(comment.id)}
              />
              <Button size="sm" className="h-7" onClick={() => handleUpdate(comment.id)}>Uložit</Button>
              <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingId(null)}>Zrušit</Button>
            </div>
          ) : (
            <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
          )}

          {userId === comment.author_id && editingId !== comment.id && userRole === 'accountant' && (
            <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100">
              <button
                className="text-gray-400 hover:text-blue-500 p-0.5"
                onClick={() => { setEditingId(comment.id); setEditContent(comment.content) }}
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                className="text-gray-400 hover:text-red-500 p-0.5"
                onClick={() => handleDelete(comment.id)}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* New comment input — side by side for accountant */}
      {userRole === 'accountant' ? (
        <div className="grid grid-cols-2 gap-2">
          {/* Left: client-visible comment */}
          <div>
            <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 block">Pro klienta</label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Poznámka pro klienta..."
              className="w-full px-3 py-2 text-sm border rounded-md resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              rows={2}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment(newComment, false) }}
            />
            <Button
              size="sm"
              onClick={() => submitComment(newComment, false)}
              disabled={!newComment.trim() || submitting}
              className="mt-1 w-full"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
              Odeslat
            </Button>
          </div>

          {/* Right: internal comment */}
          <div>
            <label className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Interní
            </label>
            <textarea
              value={internalComment}
              onChange={(e) => setInternalComment(e.target.value)}
              placeholder="Interní poznámka..."
              className="w-full px-3 py-2 text-sm border border-amber-200 dark:border-amber-800/50 rounded-md resize-none bg-amber-50/50 dark:bg-amber-900/10 dark:text-white dark:placeholder-gray-400"
              rows={2}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment(internalComment, true) }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => submitComment(internalComment, true)}
              disabled={!internalComment.trim() || submittingInternal}
              className="mt-1 w-full border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              {submittingInternal ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Lock className="h-3.5 w-3.5 mr-1" />}
              Interní
            </Button>
          </div>
        </div>
      ) : (
        /* Client role: single textarea */
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Napište komentář..."
              className="w-full px-3 py-2 text-sm border rounded-md resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              rows={2}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment(newComment, false) }}
            />
          </div>
          <Button
            size="sm"
            onClick={() => submitComment(newComment, false)}
            disabled={!newComment.trim() || submitting}
            className="mt-0.5"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  )
}
