import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function MarketplaceNotFound() {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <p className="text-7xl font-bold text-purple-600 mb-4">404</p>
      <h1 className="text-2xl font-bold mb-4">Firma nenalezena</h1>
      <p className="text-muted-foreground mb-6">
        Firma, kterou hledáte, neexistuje nebo již není v katalogu.
      </p>
      <Button asChild>
        <Link href="/marketplace">Zpět na katalog</Link>
      </Button>
    </div>
  )
}
