'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  generatePaymentQR,
  formatIBANForDisplay,
  formatAmountForDisplay,
  getBankName,
  getBankCodeFromIBAN,
  toIBAN,
  type PaymentQRParams,
} from '@/lib/qr-payment';
import { Download, QrCode, AlertCircle, Loader2 } from 'lucide-react';

interface PaymentQRProps {
  amount: number;
  bankAccount: string;
  variableSymbol: string;
  invoiceNumber?: string;
  currency?: string;
  specificSymbol?: string;
  constantSymbol?: string;
  dueDate?: string;
  className?: string;
  size?: number;
  showDownload?: boolean;
  title?: string;
}

interface QRState {
  dataUrl: string | null;
  spaydString: string;
  iban: string;
  isLoading: boolean;
  error: string | null;
}

export function PaymentQR({
  amount,
  bankAccount,
  variableSymbol,
  invoiceNumber,
  currency = 'CZK',
  specificSymbol,
  constantSymbol,
  dueDate,
  className = '',
  size = 200,
  showDownload = true,
  title = 'Platba QR kodem',
}: PaymentQRProps) {
  const [state, setState] = useState<QRState>({
    dataUrl: null,
    spaydString: '',
    iban: '',
    isLoading: true,
    error: null,
  });

  const generateQR = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const params: PaymentQRParams = {
        amount,
        bankAccount,
        variableSymbol,
        currency,
        specificSymbol,
        constantSymbol,
        dueDate,
        message: invoiceNumber ? `Faktura ${invoiceNumber}` : undefined,
      };

      const result = await generatePaymentQR(params, { size });

      setState({
        dataUrl: result.dataUrl,
        spaydString: result.spaydString,
        iban: result.iban,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
    }
  }, [amount, bankAccount, variableSymbol, currency, specificSymbol, constantSymbol, dueDate, invoiceNumber, size]);

  useEffect(() => {
    generateQR();
  }, [generateQR]);

  const handleDownload = useCallback(() => {
    if (!state.dataUrl) return;
    const link = document.createElement('a');
    link.href = state.dataUrl;
    link.download = `qr-platba-${variableSymbol}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [state.dataUrl, variableSymbol]);

  if (state.error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-red-700 font-medium">Chyba pri generovani QR kodu</p>
              <p className="text-red-600 text-sm mt-1">{state.error}</p>
              <Button variant="outline" size="sm" onClick={generateQR} className="mt-3">
                Zkusit znovu
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.isLoading || !state.dataUrl) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center">
            <div
              className="bg-gray-100 rounded-lg animate-pulse flex items-center justify-center"
              style={{ width: size, height: size }}
            >
              <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
            </div>
            <p className="text-gray-400 text-sm mt-4">Generovani QR kodu...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const bankCode = getBankCodeFromIBAN(state.iban);
  const bankName = getBankName(bankCode);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col items-center">
          <div className="relative group">
            <img
              src={state.dataUrl}
              alt="QR kod pro platbu"
              width={size}
              height={size}
              className="rounded-lg border border-gray-100"
              style={{ imageRendering: 'pixelated' }}
            />
            {showDownload && (
              <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="secondary" size="sm" onClick={handleDownload} className="gap-2">
                  <Download className="w-4 h-4" />
                  Stahnout
                </Button>
              </div>
            )}
          </div>

          <p className="text-sm font-medium text-gray-700 mt-4 text-center">
            Naskenujte QR kod v bankovni aplikaci
          </p>

          <div className="mt-5 w-full space-y-2 text-sm">
            <div className="flex justify-between items-baseline py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Castka:</span>
              <span className="font-bold text-lg text-gray-900">
                {formatAmountForDisplay(amount)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Banka:</span>
              <span className="text-gray-900 text-right">{bankName}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Ucet:</span>
              <span className="font-mono text-gray-900 text-xs sm:text-sm">
                {formatIBANForDisplay(state.iban)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <span className="text-gray-500">VS:</span>
              <span className="font-mono font-semibold text-gray-900">
                {variableSymbol}
              </span>
            </div>

            {invoiceNumber && (
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Faktura:</span>
                <span className="text-gray-900">{invoiceNumber}</span>
              </div>
            )}

            {dueDate && (
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Splatnost:</span>
                <span className="text-gray-900">
                  {new Date(dueDate).toLocaleDateString('cs-CZ')}
                </span>
              </div>
            )}
          </div>

          {showDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="mt-5 gap-2 w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              Stahnout QR kod
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PaymentQR;
