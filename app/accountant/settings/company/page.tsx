'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Building2, Mail, Phone, MapPin, FileText, Upload } from 'lucide-react'

export default function CompanySettingsPage() {
  return (
    <div className="grid gap-6">
      {/* Základní informace */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Základní informace o firmě
          </CardTitle>
          <CardDescription>
            Tyto údaje se zobrazují klientům a v dokumentech
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Název firmy *</Label>
              <Input id="company-name" placeholder="Účetní Svobodová s.r.o." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-ico">IČO *</Label>
              <Input id="company-ico" placeholder="12345678" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-dic">DIČ</Label>
              <Input id="company-dic" placeholder="CZ12345678" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-reg">Registrace</Label>
              <Input id="company-reg" placeholder="C 12345 vedená u KS v Praze" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kontaktní údaje */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Kontaktní údaje
          </CardTitle>
          <CardDescription>
            Jak vás mohou klienti kontaktovat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input id="company-email" type="email" placeholder="info@ucetni-svobodova.cz" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefon *
              </Label>
              <Input id="company-phone" type="tel" placeholder="+420 123 456 789" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Adresa sídla *
            </Label>
            <Textarea
              id="company-address"
              placeholder="Ulice 123&#10;110 00 Praha 1"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-website">Webové stránky</Label>
            <Input id="company-website" type="url" placeholder="https://www.ucetni-svobodova.cz" />
          </div>
        </CardContent>
      </Card>

      {/* Bankovní účet */}
      <Card>
        <CardHeader>
          <CardTitle>Bankovní spojení</CardTitle>
          <CardDescription>
            Pro platby od klientů
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank-account">Číslo účtu *</Label>
              <Input id="bank-account" placeholder="123456789/0100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank-iban">IBAN (pro mezinárodní platby)</Label>
              <Input id="bank-iban" placeholder="CZ65 0100 0000 0012 3456 7890" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank-swift">SWIFT/BIC</Label>
            <Input id="bank-swift" placeholder="KOMBCZPP" />
          </div>
        </CardContent>
      </Card>

      {/* Logo a  razítko */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Logo a vizuální identita
          </CardTitle>
          <CardDescription>
            Logo se zobrazuje na fakturách a dokumentech
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-logo">Logo firmy</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input id="company-logo" type="file" accept="image/*" />
                <p className="text-xs text-muted-foreground mt-1">
                  Doporučený formát: PNG, max. 2 MB
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Nahrát
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signature">Podpis (pro faktury)</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input id="signature" type="file" accept="image/*" />
                <p className="text-xs text-muted-foreground mt-1">
                  Naskenovaný podpis pro automatické vložení do faktur
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Nahrát
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Poznámky */}
      <Card>
        <CardHeader>
          <CardTitle>Doplňující informace</CardTitle>
          <CardDescription>
            Další informace které se mohou objevit v patičce faktur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="footer-text">Text v patičce faktury</Label>
            <Textarea
              id="footer-text"
              placeholder="Faktura je splatná do 14 dnů od data vystavení.&#10;Účetní služby nejsou předmětem DPH dle § 51 ZDPH."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Uložit změny */}
      <div className="flex justify-end">
        <Button>Uložit změny</Button>
      </div>
    </div>
  )
}
