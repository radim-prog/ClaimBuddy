'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './theme-provider'
import { Button } from './ui/button'

interface ThemeToggleProps {
  variant?: 'icon' | 'full'
  className?: string
}

export function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  if (variant === 'full') {
    return (
      <Button
        variant="ghost"
        onClick={toggleTheme}
        className={`w-full justify-start gap-3 ${className}`}
      >
        {theme === 'dark' ? (
          <>
            <Sun className="h-5 w-5" />
            <span>Světlý režim</span>
          </>
        ) : (
          <>
            <Moon className="h-5 w-5" />
            <span>Tmavý režim</span>
          </>
        )}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={className}
      title={theme === 'dark' ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  )
}
