export function Logo({ size = 'md', showText = true }: { size?: 'sm' | 'md' | 'lg'; showText?: boolean }) {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-sm', fontSize: 10 },
    md: { icon: 'w-8 h-8', text: 'text-base', fontSize: 13 },
    lg: { icon: 'w-12 h-12', text: 'text-xl', fontSize: 18 },
  }
  const s = sizes[size]

  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" className={s.icon}>
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
        <text x="16" y="22" textAnchor="middle" fontFamily="system-ui,sans-serif" fontWeight="800" fontSize={s.fontSize} fill="white">UO</text>
      </svg>
      {showText && (
        <span className={`font-extrabold tracking-tight ${s.text}`}>
          Účetní OS
        </span>
      )}
    </div>
  )
}
