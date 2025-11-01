'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionProps {
  items: {
    question: string;
    answer: string;
  }[];
  className?: string;
}

export function Accordion({ items, className }: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-200 bg-white overflow-hidden"
        >
          <button
            onClick={() => toggleItem(index)}
            className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900 pr-4">{item.question}</span>
            <ChevronDown
              className={cn(
                'h-5 w-5 flex-shrink-0 text-gray-500 transition-transform duration-200',
                openItems.has(index) ? 'rotate-180' : ''
              )}
            />
          </button>
          <div
            className={cn(
              'overflow-hidden transition-all duration-200',
              openItems.has(index) ? 'max-h-[1000px]' : 'max-h-0'
            )}
          >
            <div className="px-6 pb-4 pt-0 text-gray-600 whitespace-pre-wrap">
              {item.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
