/**
 * Minimal fetch helper for Notion mode.
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit & { body?: any } = {}
): Promise<T> {
  const { body, ...rest } = options;

  const response = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(rest.headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return response.json();
}
