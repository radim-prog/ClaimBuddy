import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Účetní OS
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Kompletní řešení pro účetní firmu - samoobslužný portál pro klienty a master dashboard pro účetní
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Pro klienty */}
          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-600">Pro klienty</CardTitle>
              <CardDescription>Samoobslužný portál pro správu účetnictví</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Kontrola podkladů (měsíční checklist)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Nahrávání dokladů (PDF, obrázky) + OCR</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Vystavování faktur (integrace s Pohoda)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Finanční přehledy (DPH, daň z příjmů)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>AI chat asistent s přístupem k historii</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Responsivní design (mobile-first)</span>
              </div>
            </CardContent>
          </Card>

          {/* Pro účetní */}
          <Card className="border-2 hover:border-purple-300 transition-colors">
            <CardHeader>
              <CardTitle className="text-2xl text-purple-600">Pro účetní</CardTitle>
              <CardDescription>Master dashboard a nástroje pro efektivní práci</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">✓</span>
                <span>Master dashboard (přehled všech klientů)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">✓</span>
                <span>Urgovací systém (automatické SMS/Email)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">✓</span>
                <span>Párování plateb (AI matching)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">✓</span>
                <span>Úkolový systém (náhrada Notion/Slack)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">✓</span>
                <span>WhatsApp integrace</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">✓</span>
                <span>Google Drive propojení</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto">
              Přihlásit se
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Registrovat
            </Button>
          </Link>
        </div>

        {/* Tech Stack */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Postaveno na Next.js 14, Supabase, Gemini AI a Pohoda API
          </p>
        </div>
      </div>
    </div>
  )
}
