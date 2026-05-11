import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataLabStore } from './store/dataLabStore';

const API_BASE = 'https://dataset-finder-backend-production.up.railway.app';

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#030712;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .auth-input{transition:border-color 0.2s,box-shadow 0.2s;}
  .auth-input:focus{border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,0.15)!important;outline:none;}
  .btn-primary{transition:all 0.2s;}
  .btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px rgba(59,130,246,0.35);}
  .btn-ghost{transition:all 0.2s;}
  .btn-ghost:hover{background:rgba(30,58,138,0.35)!important;}
  .btn-guest{transition:all 0.2s;}
  .btn-guest:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px rgba(16,185,129,0.3);}
  .divider-line{flex:1;height:1px;background:rgba(30,58,138,0.4);}
`;

export default function AuthPage() {
  const navigate = useNavigate();
  const { loginDataLab, continueAsGuest } = useDataLabStore();

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError('Please enter email and password.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed. Check your credentials.'); return; }
      localStorage.setItem('token', data.token);
      loginDataLab({ name: data.user.name, email: data.user.email });
      navigate('/home');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) { setError('All fields are required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed.'); return; }
      localStorage.setItem('token', data.token);
      loginDataLab({ name: data.user.name, email: data.user.email });
      navigate('/home');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleGuest = () => {
    continueAsGuest();
    navigate('/home');
  };

  const handleKey = (e) => { if (e.key === 'Enter') tab === 'login' ? handleLogin() : handleRegister(); };

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    background: 'rgba(8,15,40,0.9)', border: '1px solid rgba(30,58,138,0.5)',
    borderRadius: 10, color: '#e0e8ff', fontSize: 14,
    fontFamily: "'Syne',sans-serif",
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#030712',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: "'Syne',sans-serif", position: 'relative', overflow: 'hidden',
    }}>
      <style>{CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(30,58,138,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(30,58,138,0.06) 1px,transparent 1px)', backgroundSize: '50px 50px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(59,130,246,0.06)', filter: 'blur(80px)', animation: 'pulse 5s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(139,92,246,0.05)', filter: 'blur(100px)', animation: 'pulse 6s ease-in-out infinite 1s', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 900, animation: 'fadeUp 0.5s ease forwards' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#1d4ed8,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🧪</div>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
              <span style={{ color: '#e0e8ff' }}>Data</span>
              <span style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lab</span>
            </span>
          </div>
          <p style={{ color: '#4a5a7a', fontSize: 13, fontFamily: "'Space Mono',monospace", letterSpacing: 1 }}>DATA RESEARCH SUITE</p>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

          {/* LEFT — Login / Register */}
          <div style={{ background: 'rgba(8,15,40,0.95)', border: '1px solid rgba(30,58,138,0.4)', borderRadius: 20, padding: 32, backdropFilter: 'blur(12px)' }}>

            {/* Tabs */}
            <div style={{ display: 'flex', background: 'rgba(4,9,22,0.8)', borderRadius: 10, padding: 3, marginBottom: 24 }}>
              {['login', 'register'].map(t => (
                <button key={t} onClick={() => { setTab(t); setError(''); }} style={{
                  flex: 1, padding: '8px', border: 'none', borderRadius: 8,
                  background: tab === t ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'transparent',
                  color: tab === t ? '#fff' : '#4a5a7a', fontWeight: 700, fontSize: 13,
                  fontFamily: "'Syne',sans-serif", cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  {t === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 6 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#e0e8ff', margin: '0 0 4px' }}>
                {tab === 'login' ? 'Welcome back' : 'Join DataLab'}
              </h2>
              <p style={{ fontSize: 12, color: '#4a5a7a', margin: 0 }}>
                {tab === 'login' ? '3 searches per session after login' : 'Create your account for 3 searches per session'}
              </p>
            </div>

            {error && (
              <div style={{ margin: '14px 0', padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 12, color: '#fca5a5' }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0' }}>
              {tab === 'register' && (
                <input className="auth-input" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKey}
                  placeholder="Full name" style={inputStyle} />
              )}
              <input className="auth-input" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey}
                placeholder="Email address" type="email" style={inputStyle} />
              <input className="auth-input" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey}
                placeholder={tab === 'register' ? 'Password (min 6 characters)' : 'Password'} type="password" style={inputStyle} />
            </div>

            <button className="btn-primary" onClick={tab === 'login' ? handleLogin : handleRegister} disabled={loading}
              style={{
                width: '100%', padding: '12px', border: 'none', borderRadius: 10,
                background: loading ? 'rgba(30,58,138,0.4)' : 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Syne',sans-serif", marginBottom: 14,
              }}>
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                    {tab === 'login' ? 'Signing in...' : 'Creating account...'}
                  </span>
                : tab === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>

            {/* Social login */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div className="divider-line" />
              <span style={{ fontSize: 11, color: '#2a3a5a', whiteSpace: 'nowrap', fontFamily: "'Space Mono',monospace" }}>OR</span>
              <div className="divider-line" />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[['🔵 Google', `${API_BASE}/auth/google`], ['⚫ GitHub', `${API_BASE}/auth/github`]].map(([label, href]) => (
                <a key={label} href={href} className="btn-ghost"
                  style={{
                    flex: 1, padding: '9px', background: 'rgba(14,24,58,0.6)',
                    border: '1px solid rgba(30,58,138,0.4)', borderRadius: 9,
                    color: '#8899bb', fontSize: 12, fontWeight: 600, textAlign: 'center',
                    textDecoration: 'none', fontFamily: "'Syne',sans-serif",
                  }}>
                  {label}
                </a>
              ))}
            </div>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#4a5a7a', margin: 0 }}>
              {tab === 'login'
                ? <>No account? <span onClick={() => { setTab('register'); setError(''); }} style={{ color: '#6fa3ef', cursor: 'pointer', textDecoration: 'underline' }}>Create one free</span></>
                : <>Have an account? <span onClick={() => { setTab('login'); setError(''); }} style={{ color: '#6fa3ef', cursor: 'pointer', textDecoration: 'underline' }}>Sign in</span></>}
            </p>
          </div>

          {/* RIGHT — Guest + Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Guest card */}
            <div style={{ background: 'rgba(5,20,15,0.95)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: 28, backdropFilter: 'blur(12px)', textAlign: 'center' }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>🚀</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#e0e8ff', margin: '0 0 6px' }}>Try Without an Account</h3>
              <p style={{ fontSize: 13, color: '#6b7a9a', lineHeight: 1.6, margin: '0 0 16px' }}>
                Jump straight in as a guest. Access all tools — you get <strong style={{ color: '#34d399' }}>1 AI search</strong> to try the Dataset Finder.
              </p>

              {/* Quota comparison */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Guest', searches: 1, color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)' },
                  { label: 'Logged In', searches: 3, color: '#6fa3ef', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.3)' },
                ].map(({ label, searches, color, bg, border }) => (
                  <div key={label} style={{ flex: 1, padding: '12px 10px', background: bg, border: `1px solid ${border}`, borderRadius: 12 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1 }}>{searches}</div>
                    <div style={{ fontSize: 10, color, fontFamily: "'Space Mono',monospace", letterSpacing: 1, marginTop: 3 }}>SEARCH{searches > 1 ? 'ES' : ''}</div>
                    <div style={{ fontSize: 11, color: '#6b7a9a', marginTop: 4, fontWeight: 600 }}>{label}</div>
                  </div>
                ))}
              </div>

              <button className="btn-guest" onClick={handleGuest}
                style={{
                  width: '100%', padding: '12px', border: '1px solid rgba(16,185,129,0.4)',
                  borderRadius: 10, background: 'rgba(16,185,129,0.12)',
                  color: '#34d399', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Syne',sans-serif",
                }}>
                Continue as Guest →
              </button>
              <p style={{ fontSize: 11, color: '#2a4a3a', marginTop: 10 }}>No account needed · 1 AI search included</p>
            </div>

            {/* Feature list */}
            <div style={{ background: 'rgba(8,15,40,0.9)', border: '1px solid rgba(30,58,138,0.25)', borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: 10, color: '#4a5a7a', fontFamily: "'Space Mono',monospace", letterSpacing: 1.5, margin: '0 0 12px' }}>WHAT'S INSIDE DATALAB</p>
              {[
                ['🔍', 'Dataset Finder', 'AI-ranked datasets with 7 reliability factors'],
                ['🧹', 'Debugger & Cleaner', 'ML-powered pipeline & auto data cleaning'],
                ['📊', 'Data Visualizer', 'Interactive charts & dashboards from CSV'],
                ['📐', 'Stat Analyzer', 'Distributions, correlations & outlier detection'],
                ['🤖', 'AI Insights', 'Auto-detected patterns & relationship cards'],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(14,24,58,0.5)' }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#c8d8f0' }}>{title}</div>
                    <div style={{ fontSize: 11, color: '#4a5a7a', lineHeight: 1.4, marginTop: 1 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#1e2a3a', fontSize: 11, marginTop: 24, fontFamily: "'Space Mono',monospace" }}>
          DataLab · AI-Powered Data Research Suite
        </p>
      </div>
    </div>
  );
}
