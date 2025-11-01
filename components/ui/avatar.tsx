'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
}

export function Avatar({ src, alt, fallback, className, ...props }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  if (src && !imgError) {
    return (
      <div
        className={cn(
          'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
          className
        )}
        {...props}
      >
        <img
          src={src}
          alt={alt || 'Avatar'}
          onError={() => setImgError(true)}
          className="aspect-square h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600',
        className
      )}
      {...props}
    >
      <span className="text-sm font-medium">
        {fallback || alt?.charAt(0).toUpperCase() || '?'}
      </span>
    </div>
  );
}
