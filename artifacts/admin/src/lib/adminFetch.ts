/**
 * Authenticated fetch helper for admin UI code that uses raw fetch()
 * instead of the generated API client. Automatically attaches the admin
 * session Bearer token from localStorage.
 */

const TOKEN_KEY = 'stg_admin_token';

export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = new Headers(init.headers);
  if (token && !headers.has('authorization')) {
    headers.set('authorization', `Bearer ${token}`);
  }
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  return fetch(input, { ...init, headers });
}
