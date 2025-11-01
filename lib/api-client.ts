import { User } from 'firebase/auth';

/**
 * Authenticated fetch helper
 * Automatically adds Firebase ID token to requests
 */
export async function authenticatedFetch(
  user: User | null,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!user) {
    throw new Error('User not authenticated');
  }

  const token = await user.getIdToken();

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  // Add Content-Type if body is JSON string
  if (options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Helper for JSON API requests
 * Automatically handles token, JSON serialization, and error handling
 */
export async function apiRequest<T = any>(
  user: User | null,
  url: string,
  options: RequestInit & { body?: any } = {}
): Promise<T> {
  const { body, ...fetchOptions } = options;

  const response = await authenticatedFetch(user, url, {
    ...fetchOptions,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Example usage:
 *
 * // Simple POST request
 * const data = await apiRequest(user, '/api/cases', {
 *   method: 'POST',
 *   body: { insuranceType: 'POV', ... }
 * });
 *
 * // File upload with token
 * const formData = new FormData();
 * formData.append('file', file);
 * const response = await authenticatedFetch(user, '/api/upload', {
 *   method: 'POST',
 *   body: formData,
 * });
 */
