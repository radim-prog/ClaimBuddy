// Signi.com API client
// Docs: https://helpdesk.signi.com/en/support/solutions/articles/201000062743
// API Base: https://api.signi.com/api/v1
//
// Per-company API key: each company has its own signi_api_key in the Companies DB.
// Functions accept apiKey parameter for multi-tenant support.

import type {
  SigniContractResponse,
  SigniSignerInput,
} from './types/signing';

const SIGNI_API_URL = process.env.SIGNI_API_URL || 'https://api.signi.com/api/v1';

// Fallback global key (used if no per-company key)
const SIGNI_API_KEY_GLOBAL = process.env.SIGNI_API_KEY || '';

function resolveKey(apiKey?: string): string {
  return apiKey || SIGNI_API_KEY_GLOBAL;
}

async function signiFetch(
  endpoint: string,
  apiKey?: string,
  options: RequestInit = {}
): Promise<Response> {
  const key = resolveKey(apiKey);
  if (!key) {
    throw new Error('SIGNI_API_KEY is not configured for this company.');
  }

  const url = `${SIGNI_API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'x-api-key': key,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Signi API error ${response.status}: ${errorText}`);
  }

  return response;
}

/**
 * Check if Signi API is configured and reachable
 */
export async function checkSigniConnection(apiKey?: string): Promise<{ connected: boolean; error?: string }> {
  const key = resolveKey(apiKey);
  if (!key) {
    return { connected: false, error: 'SIGNI_API_KEY not configured' };
  }
  try {
    const res = await signiFetch('/me', key);
    const data = await res.json();
    return { connected: true, ...data };
  } catch (err) {
    return { connected: false, error: String(err) };
  }
}

/**
 * Create a new contract/envelope in Signi from a document file
 */
export async function createContract(
  file: Buffer,
  fileName: string,
  title: string,
  signers: SigniSignerInput[],
  options: {
    callbackSigned?: string;
    callbackRejected?: string;
    callbackExpired?: string;
    note?: string;
    locale?: 'cs' | 'en' | 'de' | 'sk';
    apiKey?: string;
  } = {}
): Promise<SigniContractResponse> {
  const key = resolveKey(options.apiKey);
  if (!key) {
    throw new Error('SIGNI_API_KEY is not configured');
  }

  const formData = new FormData();
  formData.append('file', new Blob([new Uint8Array(file)]), fileName);
  formData.append('title', title);

  signers.forEach((signer, i) => {
    formData.append(`signers[${i}][name]`, signer.name);
    formData.append(`signers[${i}][email]`, signer.email);
    if (signer.phone) formData.append(`signers[${i}][phone]`, signer.phone);
    formData.append(`signers[${i}][contract_role]`, signer.contract_role);
    if (signer.order !== undefined) formData.append(`signers[${i}][order]`, String(signer.order));
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zajcon.cz';
  const webhookUrl = `${baseUrl}/api/signing/webhook`;
  formData.append('callback_signed', options.callbackSigned || webhookUrl);
  formData.append('callback_rejected', options.callbackRejected || webhookUrl);
  formData.append('callback_expired', options.callbackExpired || webhookUrl);

  if (options.note) formData.append('note', options.note);
  formData.append('locale', options.locale || 'cs');

  const url = `${SIGNI_API_URL}/contract/?type=doc`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'x-api-key': key },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Signi create contract error ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * Get contract status and details from Signi
 */
export async function getContract(contractId: string, apiKey?: string): Promise<SigniContractResponse> {
  const res = await signiFetch(`/contract/${contractId}`, apiKey);
  return res.json();
}

/**
 * Download the signed document PDF
 */
export async function downloadSignedDocument(contractId: string, apiKey?: string): Promise<Buffer> {
  const res = await signiFetch(`/contract/${contractId}`, apiKey);
  const data = await res.json();

  if (!data.file_url) {
    throw new Error('No signed document available yet');
  }

  const fileRes = await fetch(data.file_url);
  if (!fileRes.ok) {
    throw new Error(`Failed to download signed document: ${fileRes.status}`);
  }

  const arrayBuffer = await fileRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Cancel/invalidate a contract in Signi
 */
export async function cancelContract(contractId: string, apiKey?: string): Promise<void> {
  await signiFetch(`/contract/${contractId}`, apiKey, { method: 'DELETE' });
}

/**
 * Download a PDF from a URL and return as Buffer
 * Useful for fetching signed documents from Signi callback URLs
 */
export async function downloadAndStorePdf(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download PDF from ${url}: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
