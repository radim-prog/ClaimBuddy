/**
 * QR Platba / SPAYD Payment QR Code Generator
 * Czech banking standard for instant payments via QR code
 * Spec: https://qr-platba.cz/pro-vyvojare/specifikace-formatu/
 */

import QRCode from 'qrcode';

export interface PaymentQRParams {
  amount: number;
  bankAccount: string;
  variableSymbol: string;
  message?: string;
  currency?: string;
  specificSymbol?: string;
  constantSymbol?: string;
  dueDate?: string;
}

export interface QRPaymentResult {
  spaydString: string;
  dataUrl: string;
  iban: string;
}

export interface PaymentDetails {
  iban: string;
  amount: string;
  currency: string;
  variableSymbol: string;
  specificSymbol: string;
  constantSymbol: string;
  message: string;
}

export interface QRCodeOptions {
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  colorDark?: string;
  colorLight?: string;
}

// Czech bank codes
const CZECH_BANKS: Record<string, string> = {
  '0100': 'Komerční banka',
  '0300': 'ČSOB',
  '0600': 'MONETA Money Bank',
  '0710': 'Česká národní banka',
  '0800': 'Česká spořitelna',
  '2010': 'Fio banka',
  '2020': 'TRINITY BANK',
  '2030': 'AKCENTA',
  '2060': 'Citfin',
  '2070': 'Moravský Peněžní Ústav',
  '2100': 'Hypoteční banka',
  '2200': 'Creditas',
  '2220': 'Artesa',
  '2240': 'Poštová banka',
  '2250': 'Banka CREDITAS',
  '2260': 'ANO spořitelní družstvo',
  '2275': 'Max banka',
  '2600': 'Citibank Europe',
  '2700': 'UniCredit Bank',
  '3030': 'Air Bank',
  '3050': 'BNP Paribas',
  '3060': 'PKO BP',
  '3500': 'ING Bank',
  '4000': 'Expobank',
  '4300': 'Národní rozvojová banka',
  '5500': 'Raiffeisenbank',
  '5800': 'J&T Banka',
  '6000': 'PPF banka',
  '6100': 'Equa bank',
  '6200': 'COMMERZBANK',
  '6210': 'mBank',
  '6300': 'BNP Paribas',
  '6700': 'Všeobecná úverová banka',
  '6800': 'Sberbank',
  '7910': 'Deutsche Bank',
  '7940': 'Waldviertler Sparkasse',
  '7950': 'Raiffeisen stavební spořitelna',
  '7960': 'Českomoravská stavební spořitelna',
  '7970': 'Wüstenrot',
  '7980': 'Wüstenrot hypoteční banka',
  '7990': 'Modrá pyramida',
  '8030': 'Raiffeisenbank im Stiftland',
  '8040': 'Oberbank',
  '8060': 'Stavební spořitelna ČS',
  '8090': 'Česká exportní banka',
  '8150': 'HSBC',
  '8200': 'PRIVAT BANK',
  '8220': 'Payment Execution',
  '8230': 'EEPAYS',
  '8240': 'Družstevní záložna Kredit',
  '8250': 'Bank of China',
  '8260': 'PAYMASTER',
  '8270': 'Fairplay Pay',
  '8280': 'B-Efekt',
  '8290': 'Zen Pay',
  '8292': 'NovaPay',
};

export function toIBAN(account: string): string {
  if (account.match(/^CZ\d{22}$/i)) {
    return account.toUpperCase();
  }

  const legacyMatch = account.match(/^(\d{1,10})\/(\d{4})$/);
  if (legacyMatch) {
    const [, number, bankCode] = legacyMatch;
    return legacyToIBAN(number, bankCode);
  }

  // Try prefix-number/code format (e.g. "19-2000014539/0800")
  const prefixMatch = account.match(/^(\d{1,6})-(\d{1,10})\/(\d{4})$/);
  if (prefixMatch) {
    const [, prefix, number, bankCode] = prefixMatch;
    const paddedPrefix = prefix.padStart(6, '0');
    const paddedNumber = number.padStart(10, '0');
    return legacyToIBAN(paddedPrefix + paddedNumber, bankCode);
  }

  throw new Error(`Invalid bank account format: ${account}. Use IBAN (CZ...) or legacy (123456789/0100)`);
}

function legacyToIBAN(account: string, bankCode: string): string {
  const paddedAccount = account.padStart(10, '0');
  const paddedBank = bankCode.padStart(4, '0');
  const bban = paddedBank + paddedAccount;

  // CZ = C(12) Z(35) → "123500"
  const numeric = bban + '123500';
  const checksum = 98 - mod97(numeric);
  const checksumStr = checksum.toString().padStart(2, '0');

  return `CZ${checksumStr}${bban}`;
}

// String-based modulo 97 for large numbers (avoids BigInt requirement)
function mod97(numStr: string): number {
  let remainder = 0;
  for (let i = 0; i < numStr.length; i++) {
    remainder = (remainder * 10 + parseInt(numStr[i], 10)) % 97;
  }
  return remainder;
}

export function isValidCzechIBAN(iban: string): boolean {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  if (!clean.match(/^CZ\d{22}$/)) return false;

  const rearranged = clean.substring(4) + clean.substring(0, 4);
  const numericStr = rearranged
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      return code >= 65 && code <= 90 ? (code - 55).toString() : char;
    })
    .join('');

  return mod97(numericStr) === 1;
}

export function getBankCodeFromIBAN(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return clean.substring(4, 8);
}

export function getBankName(bankCode: string): string {
  return CZECH_BANKS[bankCode] || `Banka (${bankCode})`;
}

function escapeSpaydValue(value: string): string {
  return value
    .replace(/%/g, '%25')
    .replace(/\*/g, '%2A');
}

export function generateSPAYD(params: PaymentQRParams): string {
  const {
    amount,
    bankAccount,
    variableSymbol,
    message,
    currency = 'CZK',
    specificSymbol,
    constantSymbol,
    dueDate,
  } = params;

  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    throw new Error(`Amount must be a positive number, got: ${amount}`);
  }

  const iban = toIBAN(bankAccount);
  if (!isValidCzechIBAN(iban)) {
    throw new Error(`Generated invalid IBAN: ${iban}`);
  }

  const vs = variableSymbol.replace(/\D/g, '');
  if (vs.length === 0 || vs.length > 10) {
    throw new Error(`Variable symbol must be 1-10 digits: ${variableSymbol}`);
  }

  const parts: string[] = ['SPD', '1.0'];
  parts.push(`ACC:${iban}`);
  parts.push(`AM:${amount.toFixed(2)}`);
  parts.push(`CC:${currency.toUpperCase()}`);
  parts.push(`X-VS:${vs}`);

  if (specificSymbol) {
    const ss = specificSymbol.replace(/\D/g, '').slice(0, 10);
    if (ss) parts.push(`X-SS:${ss}`);
  }

  if (constantSymbol) {
    const cs = constantSymbol.replace(/\D/g, '').slice(0, 4);
    if (cs) parts.push(`X-KS:${cs}`);
  }

  if (dueDate?.match(/^\d{4}-\d{2}-\d{2}$/)) {
    parts.push(`DT:${dueDate.replace(/-/g, '')}`);
  }

  if (message) {
    const escaped = escapeSpaydValue(message.slice(0, 60));
    if (escaped) parts.push(`MSG:${escaped}`);
  }

  return parts.join('*');
}

export async function generatePaymentQR(
  params: PaymentQRParams,
  options: QRCodeOptions = {}
): Promise<QRPaymentResult> {
  const {
    size = 300,
    errorCorrectionLevel = 'M',
    margin = 2,
    colorDark = '#000000',
    colorLight = '#ffffff',
  } = options;

  const spaydString = generateSPAYD(params);
  const iban = toIBAN(params.bankAccount);

  const dataUrl = await QRCode.toDataURL(spaydString, {
    type: 'image/png',
    width: size,
    margin,
    color: { dark: colorDark, light: colorLight },
    errorCorrectionLevel,
  });

  return { spaydString, dataUrl, iban };
}

export function formatIBANForDisplay(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join(' ') || clean;
}

export function formatAmountForDisplay(amount: number): string {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 2,
  }).format(amount);
}
