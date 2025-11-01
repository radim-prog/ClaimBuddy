'use client';

import { useState } from 'react';
import CookieConsent from 'react-cookie-consent';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

export function CookieConsentBanner() {
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(true);

  const handleAcceptAll = () => {
    setAnalyticsEnabled(true);
    setMarketingEnabled(true);
    // Set cookies or localStorage to track consent
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookie-consent-analytics', 'true');
      localStorage.setItem('cookie-consent-marketing', 'true');
    }
  };

  const handleRejectAll = () => {
    setAnalyticsEnabled(false);
    setMarketingEnabled(false);
    // Only essential cookies
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookie-consent-analytics', 'false');
      localStorage.setItem('cookie-consent-marketing', 'false');
    }
  };

  const handleSavePreferences = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookie-consent-analytics', analyticsEnabled.toString());
      localStorage.setItem('cookie-consent-marketing', marketingEnabled.toString());
    }
    setShowSettings(false);
  };

  return (
    <>
      <CookieConsent
        location="bottom"
        buttonText="Přijmout vše"
        declineButtonText="Odmítnout vše"
        cookieName="claimbuddy-cookie-consent"
        style={{
          background: 'rgba(255, 255, 255, 0.98)',
          color: '#1f2937',
          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
          padding: '20px',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          borderTop: '1px solid #e5e7eb',
        }}
        buttonStyle={{
          background: '#2563eb',
          color: 'white',
          fontSize: '14px',
          padding: '10px 24px',
          borderRadius: '6px',
          fontWeight: '500',
          border: 'none',
          cursor: 'pointer',
        }}
        declineButtonStyle={{
          background: 'transparent',
          color: '#6b7280',
          fontSize: '14px',
          padding: '10px 24px',
          borderRadius: '6px',
          fontWeight: '500',
          border: '1px solid #d1d5db',
          cursor: 'pointer',
        }}
        enableDeclineButton
        onAccept={handleAcceptAll}
        onDecline={handleRejectAll}
        expires={365}
      >
        <div style={{ flex: 1, maxWidth: '800px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            Používáme cookies
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0' }}>
            Tento web používá cookies pro zajištění základních funkcí, analýzu návštěvnosti a personalizaci
            reklam. Nezbytné cookies jsou vždy aktivní.{' '}
            <Link href="/legal/cookie-policy" className="text-primary hover:underline font-medium">
              Více informací
            </Link>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              background: 'transparent',
              color: '#2563eb',
              fontSize: '14px',
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Nastavení
          </button>
        </div>
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
            {/* Essential Cookies */}
            <div className="flex items-start space-x-3">
              <Checkbox checked disabled />
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Nezbytné cookies</h4>
                <p className="text-xs text-muted-foreground">
                  Tyto cookies jsou nutné pro fungování webu (přihlášení, bezpečnost). Nelze vypnout.
                </p>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start space-x-3">
              <Checkbox checked={analyticsEnabled} onCheckedChange={setAnalyticsEnabled} />
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Analytické cookies</h4>
                <p className="text-xs text-muted-foreground">
                  Pomáhají nám porozumět návštěvnosti webu a zlepšovat uživatelský zážitek. (Google
                  Analytics, Hotjar)
                </p>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-start space-x-3">
              <Checkbox checked={marketingEnabled} onCheckedChange={setMarketingEnabled} />
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Marketingové cookies</h4>
                <p className="text-xs text-muted-foreground">
                  Personalizují reklamy na Facebooku a Google podle vašich zájmů. (Facebook Pixel, Google
                  Ads)
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
            <Link href="/legal/cookie-policy" className="text-primary hover:underline">
              Zásadách používání cookies
            </Link>
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
