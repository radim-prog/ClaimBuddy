import { IS_CLAIMS_ONLY_PRODUCT, PRODUCT_BRAND } from '@/lib/product-config'

export function Logo({ size = 'md', showText = true, variant = 'purple' }: {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  variant?: 'purple' | 'blue'
}) {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-sm', fontSize: 10 },
    md: { icon: 'w-8 h-8', text: 'text-base', fontSize: 13 },
    lg: { icon: 'w-12 h-12', text: 'text-xl', fontSize: 18 },
  }
  const s = sizes[size]

  const gradientId = `logo-grad-${variant}`
  const colors = variant === 'blue'
    ? { from: '#60a5fa', to: '#2563eb' }
    : { from: '#a78bfa', to: '#7c3aed' }

  // Brand v claims-only buildu „Pojistná Pomoc", jinak „Účetní OS".
  // Iniciály v logu odpovídají (PP vs UO).
  const brand = IS_CLAIMS_ONLY_PRODUCT ? PRODUCT_BRAND : 'Účetní OS'
  const initials = IS_CLAIMS_ONLY_PRODUCT ? 'PP' : 'UO'

  return (
    <div className="flex items-center gap-2 text-white">
      <svg viewBox="0 0 32 32" className={s.icon}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
        <text x="16" y="22" textAnchor="middle" fontFamily="system-ui,sans-serif" fontWeight="800" fontSize={s.fontSize} fill="white">{initials}</text>
      </svg>
      {showText && (
        <span className={`font-extrabold tracking-tight ${s.text}`}>
          {brand}
        </span>
      )}
    </div>
  )
}
