import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generatePaymentQR } from '@/lib/qr-payment';
import type { QRCodeOptions } from '@/lib/qr-payment';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: invoiceId } = await params;

    const { searchParams } = new URL(request.url);
    const size = Math.min(Math.max(parseInt(searchParams.get('size') || '300', 10), 100), 800);

    // Fetch invoice from Supabase
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('id, invoice_number, total_with_vat, variable_symbol, specific_symbol, constant_symbol, due_date, company_id')
      .eq('id', invoiceId)
      .is('deleted_at', null)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Use hardcoded supplier bank account (same as PDF generation)
    // Company-specific bank accounts can be added later
    const { SUPPLIER } = await import('@/lib/invoice-config');
    const bankAccount = SUPPLIER.iban || SUPPLIER.bankAccount;

    const qrOptions: QRCodeOptions = {
      size,
      errorCorrectionLevel: 'M',
      margin: 2,
    };

    const amount = Number(invoice.total_with_vat) || 0;
    if (amount <= 0) {
      return NextResponse.json({ error: 'Invoice has no amount' }, { status: 400 });
    }

    const result = await generatePaymentQR(
      {
        amount,
        bankAccount,
        variableSymbol: invoice.variable_symbol || invoice.invoice_number?.replace(/\D/g, '') || invoiceId,
        specificSymbol: invoice.specific_symbol,
        constantSymbol: invoice.constant_symbol,
        currency: 'CZK',
        message: `Faktura ${invoice.invoice_number}`,
        dueDate: invoice.due_date,
      },
      qrOptions
    );

    return NextResponse.json({
      dataUrl: result.dataUrl,
      spaydString: result.spaydString,
      iban: result.iban,
      invoice: {
        id: invoice.id,
        number: invoice.invoice_number,
        amount,
        variableSymbol: invoice.variable_symbol,
      },
    });

  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
