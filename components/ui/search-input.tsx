'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, value, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || '');

    React.useEffect(() => {
      setInternalValue(value || '');
    }, [value]);

    const handleClear = () => {
      setInternalValue('');
      if (onClear) {
        onClear();
      }
    };

    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          type="search"
          className={cn('pl-9 pr-9', className)}
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          {...props}
        />
        {internalValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Vymazat</span>
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';

export { SearchInput };
