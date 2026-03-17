'use client'

import {
  Folder,
  FileInput,
  FileOutput,
  Receipt,
  Landmark,
  Users,
  Percent,
  FileBarChart,
  BookOpen,
  HeartHandshake,
  Archive,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { DocumentFolder } from '@/lib/types/drive'

type FolderCardProps = {
  folder: DocumentFolder
  description?: string
  onClick: () => void
}

const ICON_MAP: Record<string, LucideIcon> = {
  'file-input': FileInput,
  'file-output': FileOutput,
  receipt: Receipt,
  landmark: Landmark,
  users: Users,
  percent: Percent,
  'file-badge': FileBarChart,
  'book-open': BookOpen,
  handshake: HeartHandshake,
  folder: Folder,
  archive: Archive,
}

function getFolderIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Folder
}

export function FolderCard({ folder, description, onClick }: FolderCardProps) {
  const Icon = getFolderIcon(folder.icon)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-all hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 shrink-0 transition-colors group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50">
          <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {folder.name}
          </p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <Badge
              variant="outline"
              className="text-[10px] bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600"
            >
              {folder.file_count} {folder.file_count === 1 ? 'soubor' : folder.file_count >= 2 && folder.file_count <= 4 ? 'soubory' : 'souboru'}
            </Badge>
            {folder.client_visible && (
              <Badge
                variant="outline"
                className="text-[10px] bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700"
              >
                Viditelne klientem
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
