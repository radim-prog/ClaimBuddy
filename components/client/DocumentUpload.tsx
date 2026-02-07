'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

type UploadedFile = {
  file: File
  preview?: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  progress?: number
}

type DocumentType = 'bank_statement' | 'receipt' | 'expense_invoice' | 'income_invoice' | 'other'

type Props = {
  companyId: string
  period: string // YYYY-MM
  documentType: DocumentType
  onUploadComplete?: () => void
}

export function DocumentUpload({ companyId, period, documentType, onUploadComplete }: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      status: 'pending'
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const removeFile = (index: number) => {
    setFiles(prev => {
      const file = prev[index]
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)

    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i]

      // Update status to uploading
      setFiles(prev => prev.map((f, idx) =>
        idx === i ? { ...f, status: 'uploading' as const, progress: 0 } : f
      ))

      try {
        const formData = new FormData()
        formData.append('file', fileItem.file)
        formData.append('companyId', companyId)
        formData.append('period', period)
        formData.append('type', documentType)

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        // Success
        setFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'success' as const, progress: 100 } : f
        ))

        toast.success(`${fileItem.file.name} nahrán úspěšně`)
      } catch (error) {
        console.error('Upload error:', error)
        setFiles(prev => prev.map((f, idx) =>
          idx === i ? {
            ...f,
            status: 'error' as const,
            error: error instanceof Error ? error.message : 'Unknown error'
          } : f
        ))
        toast.error(`Chyba při nahrávání ${fileItem.file.name}`)
      }
    }

    setUploading(false)

    // Check if all succeeded
    const allSuccess = files.every(f => f.status === 'success')
    if (allSuccess && onUploadComplete) {
      setTimeout(() => {
        onUploadComplete()
      }, 1000)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-lg text-blue-600">Přetáhněte soubory sem...</p>
        ) : (
          <div>
            <p className="text-lg text-gray-700 dark:text-gray-200 mb-2">
              Přetáhněte soubory sem nebo klikněte pro výběr
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Podporované formáty: PDF, JPG, PNG (max 10 MB)
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileItem, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center gap-4">
                {/* Preview or Icon */}
                <div className="flex-shrink-0">
                  {fileItem.preview ? (
                    <img
                      src={fileItem.preview}
                      alt={fileItem.file.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {fileItem.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(fileItem.file.size)}
                  </p>

                  {/* Status */}
                  {fileItem.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${fileItem.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {fileItem.status === 'success' && (
                    <div className="flex items-center gap-1 text-green-600 text-xs mt-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Nahráno</span>
                    </div>
                  )}
                  {fileItem.status === 'error' && (
                    <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{fileItem.error || 'Chyba'}</span>
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                {fileItem.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && files.some(f => f.status === 'pending') && (
        <Button
          onClick={uploadFiles}
          disabled={uploading}
          className="w-full"
          size="lg"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Nahrávám...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Nahrát {files.filter(f => f.status === 'pending').length} souborů
            </>
          )}
        </Button>
      )}
    </div>
  )
}
