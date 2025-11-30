'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  const router = useRouter()

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
          <p className="text-sm text-gray-500 mt-4">
            👆 Klikni na kartu níže pro demo přístup
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Pro klienty */}
          <Card
            className="border-2 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer relative group"
            onClick={() => router.push('/client/dashboard')}
          >
            <Badge className="absolute top-4 right-4 bg-blue-600">DEMO PŘÍSTUP</Badge>
            <CardHeader>
              <CardTitle className="text-2xl text-blue-600 group-hover:text-blue-700">Pro klienty</CardTitle>
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
          <Card
            className="border-2 hover:border-purple-500 hover:shadow-xl transition-all cursor-pointer relative group"
            onClick={() => router.push('/accountant/dashboard')}
          >
            <Badge className="absolute top-4 right-4 bg-purple-600">DEMO PŘÍSTUP</Badge>
            <CardHeader>
              <CardTitle className="text-2xl text-purple-600 group-hover:text-purple-700">Pro účetní</CardTitle>
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
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500">
            Nebo pokud chcete skutečný účet (Supabase):
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/login">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Přihlásit se
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-blue-600 text-blue-700 hover:bg-blue-50 font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Registrovat
              </Button>
            </Link>
          </div>
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
