export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: { id: string; email?: string };
};

const projectUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const storageKey = 'wildwatch.auth.session.v1';

export function readAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (!session.access_token || !session.refresh_token || !session.user?.id) return null;
    return session;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return readAuthSession()?.access_token ?? null;
}

function saveSession(session: Omit<AuthSession, 'expires_at'> & { expires_at?: number; expires_in?: number }): AuthSession {
  const normalized: AuthSession = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600),
    user: session.user,
  };
  localStorage.setItem(storageKey, JSON.stringify(normalized));
  return normalized;
}

async function authRequest(path: string, body: unknown, accessToken?: string): Promise<Record<string, any>> {
  if (!projectUrl || !anonKey) throw new Error('Supabase login is not configured for this app.');
  const response = await fetch(`${projectUrl}/auth/v1/${path}`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.msg || payload.message || payload.error_description || payload.error || 'Supabase authentication failed.');
  return payload;
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const payload = await authRequest('token?grant_type=password', { email, password });
  return saveSession(payload as Omit<AuthSession, 'expires_at'> & { expires_in?: number });
}

export async function restoreAuthSession(): Promise<AuthSession | null> {
  const current = readAuthSession();
  if (!current) return null;
  if (current.expires_at > Math.floor(Date.now() / 1000) + 90) return current;
  try {
    const payload = await authRequest('token?grant_type=refresh_token', { refresh_token: current.refresh_token });
    return saveSession(payload as Omit<AuthSession, 'expires_at'> & { expires_in?: number });
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
}

export async function signOut(): Promise<void> {
  const session = readAuthSession();
  try {
    if (session) await authRequest('logout', {}, session.access_token);
  } finally {
    localStorage.removeItem(storageKey);
  }
}
