/**
 * Sidebar theme definitions for the accountant layout.
 * Each theme provides CSS classes and color tokens for the sidebar.
 */

export type SidebarThemeId = 'classic' | 'colorful' | 'minimal' | 'dark-pro'

export interface SidebarTheme {
  id: SidebarThemeId
  name: string
  description: string
  preview: {
    bg: string      // Preview card background
    accent: string  // Preview card accent
    text: string    // Preview card text
  }
  // CSS classes applied to the sidebar container
  sidebarClass: string
  // Text/icon color classes
  textDefault: string
  textActive: string
  textMuted: string
  // Active item
  activeBg: string
  activeIndicator: string
  activeIcon: string
  // Hover
  hoverBg: string
  hoverText: string
  // Group labels
  groupLabel: string
  // Border/divider
  border: string
  // Logo accent gradient
  logoGradient: string
  // Badge colors
  badgeAccent: string
  // Icon group colors (only used by colorful theme)
  iconGroups?: {
    daily: string
    management: string
    tools: string
    admin: string
  }
}

export const SIDEBAR_THEMES: Record<SidebarThemeId, SidebarTheme> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Tmavý fialový sidebar',
    preview: { bg: 'bg-violet-900', accent: 'bg-violet-400', text: 'text-white' },
    sidebarClass: 'sidebar-purple',
    textDefault: 'text-white/[0.55]',
    textActive: 'text-white',
    textMuted: 'text-white/[0.40]',
    activeBg: 'bg-white/[0.08]',
    activeIndicator: 'nav-active-indicator',
    activeIcon: 'text-violet-300',
    hoverBg: 'hover:bg-white/[0.05]',
    hoverText: 'hover:text-white/[0.85]',
    groupLabel: 'text-violet-300/[0.60]',
    border: 'border-white/[0.06]',
    logoGradient: 'from-violet-400 to-violet-500',
    badgeAccent: 'bg-violet-400',
  },
  colorful: {
    id: 'colorful',
    name: 'Colorful',
    description: 'Barevné ikony per skupina',
    preview: { bg: 'bg-slate-900', accent: 'bg-emerald-400', text: 'text-white' },
    sidebarClass: 'sidebar-colorful',
    textDefault: 'text-white/[0.55]',
    textActive: 'text-white',
    textMuted: 'text-white/[0.40]',
    activeBg: 'bg-white/[0.08]',
    activeIndicator: 'nav-active-indicator',
    activeIcon: 'text-emerald-300',
    hoverBg: 'hover:bg-white/[0.05]',
    hoverText: 'hover:text-white/[0.85]',
    groupLabel: 'text-emerald-300/60',
    border: 'border-white/[0.06]',
    logoGradient: 'from-emerald-400 to-teal-500',
    badgeAccent: 'bg-emerald-400',
    iconGroups: {
      daily: 'text-emerald-400',
      management: 'text-blue-400',
      tools: 'text-orange-400',
      admin: 'text-red-400',
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Světlý a čistý',
    preview: { bg: 'bg-gray-100', accent: 'bg-gray-900', text: 'text-gray-900' },
    sidebarClass: 'sidebar-minimal',
    textDefault: 'text-gray-500 dark:text-gray-400',
    textActive: 'text-gray-900 dark:text-white',
    textMuted: 'text-gray-400 dark:text-gray-500',
    activeBg: 'bg-gray-100 dark:bg-white/[0.08]',
    activeIndicator: 'nav-active-indicator-minimal',
    activeIcon: 'text-gray-900 dark:text-white',
    hoverBg: 'hover:bg-gray-50 dark:hover:bg-white/[0.05]',
    hoverText: 'hover:text-gray-700 dark:hover:text-white/[0.85]',
    groupLabel: 'text-gray-400 dark:text-gray-500',
    border: 'border-gray-200 dark:border-white/[0.06]',
    logoGradient: 'from-gray-700 to-gray-900 dark:from-violet-400 dark:to-violet-500',
    badgeAccent: 'bg-gray-900 dark:bg-violet-400',
  },
  'dark-pro': {
    id: 'dark-pro',
    name: 'Dark Pro',
    description: 'Černý s neonovými akcenty',
    preview: { bg: 'bg-gray-950', accent: 'bg-cyan-400', text: 'text-cyan-400' },
    sidebarClass: 'sidebar-dark-pro',
    textDefault: 'text-gray-400',
    textActive: 'text-cyan-300',
    textMuted: 'text-gray-600',
    activeBg: 'bg-cyan-500/10',
    activeIndicator: 'nav-active-indicator-neon',
    activeIcon: 'text-cyan-400',
    hoverBg: 'hover:bg-white/[0.03]',
    hoverText: 'hover:text-gray-200',
    groupLabel: 'text-cyan-400/50',
    border: 'border-gray-800',
    logoGradient: 'from-cyan-400 to-lime-400',
    badgeAccent: 'bg-cyan-400',
  },
}

export const SIDEBAR_THEME_LIST = Object.values(SIDEBAR_THEMES)

const STORAGE_KEY = 'sidebar-theme'

export function getSavedThemeId(): SidebarThemeId {
  if (typeof window === 'undefined') return 'classic'
  return (localStorage.getItem(STORAGE_KEY) as SidebarThemeId) || 'classic'
}

export function saveThemeId(id: SidebarThemeId): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, id)
  }
}

export function getTheme(id: SidebarThemeId): SidebarTheme {
  return SIDEBAR_THEMES[id] || SIDEBAR_THEMES.classic
}
