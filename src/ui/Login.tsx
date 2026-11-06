import { useState, type FormEvent } from 'react';
import { AlertTriangle, ArrowRight, Leaf, LockKeyhole, Mail } from 'lucide-react';
import { signIn, type AuthSession } from '../auth';

export default function Login({ onAuthenticated }: { onAuthenticated: (session: AuthSession) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try { onAuthenticated(await signIn(email.trim(), password)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not sign in. Check your email and password.'); }
    finally { setBusy(false); }
  };

  return <main className="auth-page">
    <section className="auth-card">
      <div className="auth-brand"><span><Leaf size={21} /></span><div><b>WildWatch</b><small>FIELD OPERATIONS</small></div></div>
      <div className="auth-eyebrow">TEAM WORKSPACE</div>
      <h1>Welcome back</h1>
      <p className="auth-intro">Sign in to access your wildlife crossing dashboard.</p>
      {error && <div className="auth-error" role="alert"><AlertTriangle size={16} />{error}</div>}
      <form onSubmit={(event) => void submit(event)}>
        <label>Email address<span className="auth-input"><Mail size={16} /><input type="email" autoComplete="username" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></span></label>
        <label>Password<span className="auth-input"><LockKeyhole size={16} /><input type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(event) => setPassword(event.target.value)} required /></span></label>
        <button className="auth-submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}<ArrowRight size={16} /></button>
      </form>
      <p className="auth-help">Need an account? Ask a project administrator to add you in Supabase Authentication.</p>
      <div className="auth-security"><LockKeyhole size={13} />Secured by your project’s Supabase authentication</div>
    </section>
    <span className="auth-demo-note">DEMO MODE DOES NOT REQUIRE AN ACCOUNT</span>
  </main>;
}
