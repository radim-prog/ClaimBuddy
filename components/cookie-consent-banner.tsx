'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import CookieConsent from 'react-cookie-consent'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

export function CookieConsentBanner() {
  const pathname = usePathname()
  const isClaims = pathname.startsWith('/claims') || (typeof window !== 'undefined' && window.location.hostname === 'claims.zajcon.cz')
  const accentColor = isClaims ? '#2563eb' : '#7c3aed'
  const [showSettings, setShowSettings] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true)
  const [marketingEnabled, setMarketingEnabled] = useState(false)

  const handleAcceptAll = () => {
    setAnalyticsEnabled(true)
    setMarketingEnabled(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookie-consent-analytics', 'true')
      localStorage.setItem('cookie-consent-marketing', 'true')
    }
  }

  const handleRejectAll = () => {
    setAnalyticsEnabled(false)
    setMarketingEnabled(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookie-consent-analytics', 'false')
      localStorage.setItem('cookie-consent-marketing', 'false')
    }
  }

  const handleSavePreferences = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookie-consent-analytics', analyticsEnabled.toString())
      localStorage.setItem('cookie-consent-marketing', marketingEnabled.toString())
    }
    setShowSettings(false)
  }

  return (
    <>
      <CookieConsent
        location="bottom"
        buttonText="OK"
        declineButtonText="Odmítnout"
        cookieName="ucetni-os-cookie-consent"
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(8px)',
          color: '#1f2937',
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)',
          padding: '10px 20px',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          borderTop: '1px solid #e5e7eb',
          fontSize: '13px',
        }}
        buttonStyle={{
          background: accentColor,
          color: 'white',
          fontSize: '13px',
          padding: '6px 18px',
          borderRadius: '6px',
          fontWeight: '500',
          border: 'none',
          cursor: 'pointer',
          margin: '0 4px',
        }}
        declineButtonStyle={{
          background: 'transparent',
          color: '#6b7280',
          fontSize: '13px',
          padding: '6px 14px',
          borderRadius: '6px',
          fontWeight: '500',
          border: '1px solid #d1d5db',
          cursor: 'pointer',
          margin: '0 4px',
        }}
        enableDeclineButton
        onAccept={handleAcceptAll}
        onDecline={handleRejectAll}
        expires={365}
      >
        <span>
          Používáme cookies pro fungování webu.{' '}
          <Link href="/legal/cookies" className="text-primary hover:underline font-medium">
            Více info
          </Link>
          {' · '}
          <button
            onClick={() => setShowSettings(true)}
            style={{
              background: 'transparent',
              color: accentColor,
              fontSize: '13px',
              padding: '0',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontWeight: '500',
            }}
          >
            Nastavení
          </button>
        </span>
      </CookieConsent>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nastavení cookies</DialogTitle>
            <DialogDescription>
              Vyberte, které kategorie cookies chcete povolit. Nezbytné cookies jsou vždy aktivní.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-start space-x-3">
              <Checkbox checked disabled />
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Nezbytné cookies</h4>
                <p className="text-xs text-muted-foreground">
                  Tyto cookies jsou nutné pro fungování webu (přihlášení, bezpečnost). Nelze vypnout.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox checked={analyticsEnabled} onCheckedChange={(checked) => setAnalyticsEnabled(checked === true)} />
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Analytické cookies</h4>
                <p className="text-xs text-muted-foreground">
                  Pomáhají nám porozumět návštěvnosti webu a zlepšovat uživatelský zážitek.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox checked={marketingEnabled} onCheckedChange={(checked) => setMarketingEnabled(checked === true)} />
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Marketingové cookies</h4>
                <p className="text-xs text-muted-foreground">
                  Personalizují reklamy podle vašich zájmů.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Zrušit
            </Button>
            <Button onClick={handleSavePreferences}>Uložit nastavení</Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Více informací v{' '}
            <Link href="/legal/cookies" className="text-primary hover:underline">
              Zásadách používání cookies
            </Link>
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}
