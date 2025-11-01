'use client';

import type { CaseTimeline } from '@/types';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  FileText,
  MessageSquare,
  DollarSign,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';

interface CaseTimelineProps {
  timeline: CaseTimeline[];
}

const TIMELINE_ICONS: Record<string, any> = {
  status_change: AlertCircle,
  message: MessageSquare,
  document_upload: FileText,
  payment: DollarSign,
  assignment: UserCheck,
  note: Clock,
};

const TIMELINE_COLORS: Record<string, string> = {
  status_change: 'bg-blue-100 text-blue-600',
  message: 'bg-green-100 text-green-600',
  document_upload: 'bg-purple-100 text-purple-600',
  payment: 'bg-yellow-100 text-yellow-600',
  assignment: 'bg-indigo-100 text-indigo-600',
  note: 'bg-gray-100 text-gray-600',
};

export function CaseTimeline({ timeline }: CaseTimelineProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Historie</h3>
      <div className="relative space-y-4">
        {/* Timeline line */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />

        {timeline.map((item, index) => {
          const Icon = TIMELINE_ICONS[item.type] || Clock;
          const colorClass = TIMELINE_COLORS[item.type] || 'bg-gray-100 text-gray-600';

          return (
            <div key={item.id} className="relative flex gap-4">
              {/* Icon */}
              <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    {item.userName && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.userName}
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-gray-500 whitespace-nowrap">
                    {format(new Date(item.createdAt), 'dd. MM. yyyy HH:mm', {
                      locale: cs,
                    })}
                  </time>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
