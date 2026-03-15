const STATS = [
  { value: '30+', label: 'článků ve znalostní bázi' },
  { value: '< 5s', label: 'AI vytěžení dokladu' },
  { value: '99,9%', label: 'dostupnost služby' },
  { value: '0 Kč', label: 'na vyzkoušení' },
]

export function Stats() {
  return (
    <section className="py-16 border-y border-border/40">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold font-display text-purple-600 dark:text-purple-400">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
