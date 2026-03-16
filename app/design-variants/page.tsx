import Link from 'next/link'

export const metadata = {
  title: 'Design varianty — Účetní OS',
}

const VARIANTS = [
  {
    id: 1,
    name: 'Profesionální / Bankovní',
    desc: 'Světlé, serif fonty, tmavě modrá + zlatý accent. Důvěryhodnost a stabilita.',
    colors: ['#1e3a5f', '#c9a44c', '#faf8f4'],
    inspiration: 'Banky, pojišťovny',
    href: '/design-variants/variant-1',
  },
  {
    id: 2,
    name: 'Minimalistický / Stripe',
    desc: 'Čistý, hodně whitespace, jeden accent color. Moderní a elegantní.',
    colors: ['#6d28d9', '#000000', '#ffffff'],
    inspiration: 'stripe.com, linear.app',
    href: '/design-variants/variant-2',
  },
  {
    id: 3,
    name: 'Přívětivý / Notion',
    desc: 'Hravý, pastelové barvy, rounded corners. Přístupný a warm.',
    colors: ['#e6e0f3', '#d1fae5', '#fde8d0'],
    inspiration: 'notion.so, figma.com',
    href: '/design-variants/variant-3',
  },
  {
    id: 4,
    name: 'Prémiový / Apple',
    desc: 'Tmavý, dramatický, velké headlines, glow efekty. Exkluzivní.',
    colors: ['#000000', '#7c3aed', '#ffffff'],
    inspiration: 'apple.com, vercel.com',
    href: '/design-variants/variant-4',
  },
]

export default function DesignVariantsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Design varianty
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            4 vizuální směry pro landing page Účetní OS. Vyber si který ti sedí.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {VARIANTS.map((v) => (
            <Link
              key={v.id}
              href={v.href}
              className="group block rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-black text-purple-400">{v.id}</span>
                <h2 className="text-xl font-bold">{v.name}</h2>
              </div>

              <p className="text-sm text-gray-400 mb-4">{v.desc}</p>

              <div className="flex items-center gap-2 mb-4">
                {v.colors.map((c) => (
                  <div
                    key={c}
                    className="w-8 h-8 rounded-full border border-white/20"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <p className="text-xs text-gray-500">
                Inspirace: {v.inspiration}
              </p>

              <div className="mt-4 text-sm text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Zobrazit →
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link href="/" className="text-sm text-gray-500 hover:text-white transition-colors">
            ← Zpět na aktuální web
          </Link>
        </div>
      </div>
    </div>
  )
}
