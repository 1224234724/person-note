const TOKEN_KEY = 'blog_token';
const USER_KEY = 'blog_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

export function setAuth(token, username) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, username);
}

export function getUsername() {
  return localStorage.getItem(USER_KEY);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Wrapper around fetch that auto-attaches the JWT and parses JSON.
 * Throws an Error with the backend message on non-2xx responses.
 */
export async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Token expired — force re-login
    if (res.status === 401 && window.location.pathname.startsWith('/admin')) {
      clearAuth();
    }
    throw new Error(data.error || `请求失败 (${res.status})`);
  }
  return data;
}
