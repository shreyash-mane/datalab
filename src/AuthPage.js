import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataLabStore } from './store/dataLabStore';

const API_BASE = 'https://dataset-finder-backend-production.up.railway.app';

const COUNTRY_CODES = [
  { code: '+1',   flag: '🇺🇸', name: 'United States' },
  { code: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: '+34',  flag: '🇪🇸', name: 'Spain' },
  { code: '+31',  flag: '🇳🇱', name: 'Netherlands' },
  { code: '+46',  flag: '🇸🇪', name: 'Sweden' },
  { code: '+47',  flag: '🇳🇴', name: 'Norway' },
  { code: '+45',  flag: '🇩🇰', name: 'Denmark' },
  { code: '+41',  flag: '🇨🇭', name: 'Switzerland' },
  { code: '+43',  flag: '🇦🇹', name: 'Austria' },
  { code: '+32',  flag: '🇧🇪', name: 'Belgium' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+48',  flag: '🇵🇱', name: 'Poland' },
  { code: '+7',   flag: '🇷🇺', name: 'Russia' },
  { code: '+86',  flag: '🇨🇳', name: 'China' },
  { code: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: '+82',  flag: '🇰🇷', name: 'South Korea' },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: '+66',  flag: '🇹🇭', name: 'Thailand' },
  { code: '+62',  flag: '🇮🇩', name: 'Indonesia' },
  { code: '+63',  flag: '🇵🇭', name: 'Philippines' },
  { code: '+84',  flag: '🇻🇳', name: 'Vietnam' },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+94',  flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+20',  flag: '🇪🇬', name: 'Egypt' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { code: '+52',  flag: '🇲🇽', name: 'Mexico' },
  { code: '+56',  flag: '🇨🇱', name: 'Chile' },
  { code: '+57',  flag: '🇨🇴', name: 'Colombia' },
  { code: '+64',  flag: '🇳🇿', name: 'New Zealand' },
];

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
  .method-card{transition:all 0.2s;cursor:pointer;}
  .method-card:hover{border-color:#3b82f6!important;background:rgba(59,130,246,0.1)!important;transform:translateY(-2px);}
  .divider-line{flex:1;height:1px;background:rgba(30,58,138,0.4);}
  .otp-digit{transition:border-color 0.2s,box-shadow 0.2s;}
  .otp-digit:focus{border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,0.15)!important;outline:none;}
  select option{background:#0d1b3e;color:#e0e8ff;}
`;

const Spinner = () => (
  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
);

export default function AuthPage() {
  const navigate = useNavigate();
  const { loginDataLab, continueAsGuest } = useDataLabStore();

  // Auth state
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password state
  // step: null | 'method' | 'email-send' | 'phone-send' | 'otp-email' | 'otp-phone' | 'reset-email' | 'reset-phone-email'
  const [forgotStep, setForgotStep] = useState(null);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCountry, setForgotCountry] = useState(COUNTRY_CODES[3]); // India default
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtp, setForgotOtp] = useState(['', '', '', '', '', '']);
  const [forgotNewPw, setForgotNewPw] = useState('');
  const [forgotConfirmPw, setForgotConfirmPw] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  // For phone flow: after OTP verified, ask for account email to reset
  const [forgotAccountEmail, setForgotAccountEmail] = useState('');
  const [showCountryList, setShowCountryList] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError('Please enter email and password.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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

  const handleGuest = () => { continueAsGuest(); navigate('/home'); };
  const handleKey = (e) => { if (e.key === 'Enter') tab === 'login' ? handleLogin() : handleRegister(); };

  // ── Forgot password handlers ──────────────────────────────────────────────
  const resetForgot = () => {
    setForgotStep(null); setForgotEmail(''); setForgotPhone(''); setForgotOtp(['', '', '', '', '', '']);
    setForgotNewPw(''); setForgotConfirmPw(''); setForgotError(''); setForgotSuccess('');
    setForgotAccountEmail(''); setCountrySearch(''); setShowCountryList(false);
  };

  const sendEmailOtp = async () => {
    if (!forgotEmail.trim()) { setForgotError('Please enter your email.'); return; }
    setForgotLoading(true); setForgotError('');
    try {
      const res = await fetch(`${API_BASE}/auth/forgot/send-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setForgotError(data.error || 'Failed to send OTP.'); return; }
      setForgotSuccess('OTP sent! Check your inbox.');
      setForgotStep('otp-email');
    } catch { setForgotError('Network error. Please try again.'); }
    finally { setForgotLoading(false); }
  };

  const sendPhoneOtp = async () => {
    if (!forgotPhone.trim()) { setForgotError('Please enter your phone number.'); return; }
    const fullPhone = forgotCountry.code + forgotPhone.trim().replace(/^0/, '');
    setForgotLoading(true); setForgotError('');
    try {
      const res = await fetch(`${API_BASE}/auth/forgot/send-phone`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok) { setForgotError(data.error || 'Failed to send OTP.'); return; }
      setForgotSuccess('OTP sent via SMS!');
      setForgotStep('otp-phone');
    } catch { setForgotError('Network error. Please try again.'); }
    finally { setForgotLoading(false); }
  };

  const verifyOtpAndReset = async () => {
    const otp = forgotOtp.join('');
    if (otp.length < 6) { setForgotError('Please enter the 6-digit OTP.'); return; }
    if (!forgotNewPw) { setForgotError('Please enter a new password.'); return; }
    if (forgotNewPw.length < 6) { setForgotError('Password must be at least 6 characters.'); return; }
    if (forgotNewPw !== forgotConfirmPw) { setForgotError('Passwords do not match.'); return; }

    setForgotLoading(true); setForgotError('');
    try {
      const res = await fetch(`${API_BASE}/auth/forgot/reset`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: forgotEmail.trim().toLowerCase(), otp, newPassword: forgotNewPw }),
      });
      const data = await res.json();
      if (!res.ok) { setForgotError(data.error || 'Reset failed.'); return; }
      localStorage.setItem('token', data.token);
      loginDataLab({ name: data.user.name, email: data.user.email });
      navigate('/home');
    } catch { setForgotError('Network error. Please try again.'); }
    finally { setForgotLoading(false); }
  };

  const verifyPhoneOtp = async () => {
    const otp = forgotOtp.join('');
    if (otp.length < 6) { setForgotError('Please enter the 6-digit OTP.'); return; }
    const fullPhone = forgotCountry.code + forgotPhone.trim().replace(/^0/, '');
    setForgotLoading(true); setForgotError('');
    try {
      const res = await fetch(`${API_BASE}/auth/forgot/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: fullPhone, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setForgotError(data.error || 'Incorrect OTP.'); return; }
      setForgotSuccess('Phone verified!');
      setForgotStep('reset-phone-email');
    } catch { setForgotError('Network error. Please try again.'); }
    finally { setForgotLoading(false); }
  };

  const resetWithPhone = async () => {
    if (!forgotAccountEmail.trim()) { setForgotError('Please enter your account email.'); return; }
    if (!forgotNewPw) { setForgotError('Please enter a new password.'); return; }
    if (forgotNewPw.length < 6) { setForgotError('Password must be at least 6 characters.'); return; }
    if (forgotNewPw !== forgotConfirmPw) { setForgotError('Passwords do not match.'); return; }
    const fullPhone = forgotCountry.code + forgotPhone.trim().replace(/^0/, '');
    setForgotLoading(true); setForgotError('');
    try {
      const res = await fetch(`${API_BASE}/auth/forgot/reset-phone`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, email: forgotAccountEmail.trim(), newPassword: forgotNewPw }),
      });
      const data = await res.json();
      if (!res.ok) { setForgotError(data.error || 'Reset failed.'); return; }
      localStorage.setItem('token', data.token);
      loginDataLab({ name: data.user.name, email: data.user.email });
      navigate('/home');
    } catch { setForgotError('Network error. Please try again.'); }
    finally { setForgotLoading(false); }
  };

  // OTP digit input handler
  const handleOtpDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...forgotOtp];
    next[i] = val;
    setForgotOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };
  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !forgotOtp[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
  };

  const filteredCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch)
  );

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    background: 'rgba(8,15,40,0.9)', border: '1px solid rgba(30,58,138,0.5)',
    borderRadius: 10, color: '#e0e8ff', fontSize: 14,
    fontFamily: "'Syne',sans-serif",
  };

  const btnPrimary = (label, onClick, disabled) => (
    <button className="btn-primary" onClick={onClick} disabled={disabled || forgotLoading}
      style={{
        width: '100%', padding: '12px', border: 'none', borderRadius: 10,
        background: (disabled || forgotLoading) ? 'rgba(30,58,138,0.4)' : 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
        color: '#fff', fontSize: 14, fontWeight: 700, cursor: (disabled || forgotLoading) ? 'not-allowed' : 'pointer',
        fontFamily: "'Syne',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
      {forgotLoading ? <><Spinner />{label}...</> : label}
    </button>
  );

  // ── Forgot password panel ─────────────────────────────────────────────────
  const renderForgotPanel = () => {
    const back = (step) => () => { setForgotError(''); setForgotSuccess(''); setForgotStep(step); };

    const ForgotHeader = ({ title, subtitle, backStep }) => (
      <div style={{ marginBottom: 20 }}>
        <button onClick={backStep ? back(backStep) : resetForgot}
          style={{ background: 'none', border: 'none', color: '#4a5a7a', cursor: 'pointer', fontSize: 12, padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#e0e8ff', margin: '0 0 4px' }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 12, color: '#4a5a7a', margin: 0 }}>{subtitle}</p>}
      </div>
    );

    const ForgotAlert = () => (
      <>
        {forgotError && <div style={{ margin: '0 0 14px', padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 12, color: '#fca5a5' }}>⚠ {forgotError}</div>}
        {forgotSuccess && <div style={{ margin: '0 0 14px', padding: '10px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontSize: 12, color: '#6ee7b7' }}>✓ {forgotSuccess}</div>}
      </>
    );

    const OtpInputs = () => (
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '16px 0' }}>
        {forgotOtp.map((d, i) => (
          <input key={i} id={`otp-${i}`} className="otp-digit"
            value={d} onChange={e => handleOtpDigit(i, e.target.value)}
            onKeyDown={e => handleOtpKeyDown(i, e)}
            maxLength={1} inputMode="numeric"
            style={{
              width: 44, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 800,
              background: 'rgba(8,15,40,0.9)', border: '1px solid rgba(30,58,138,0.5)',
              borderRadius: 10, color: '#6fa3ef', fontFamily: 'monospace',
            }} />
        ))}
      </div>
    );

    const NewPasswordFields = () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0' }}>
        <input className="auth-input" value={forgotNewPw} onChange={e => setForgotNewPw(e.target.value)}
          placeholder="New password (min 6 chars)" type="password" style={inputStyle} />
        <input className="auth-input" value={forgotConfirmPw} onChange={e => setForgotConfirmPw(e.target.value)}
          placeholder="Confirm new password" type="password" style={inputStyle} />
      </div>
    );

    // Method selection
    if (forgotStep === 'method') return (
      <div>
        <ForgotHeader title="Reset Password" subtitle="Choose how you'd like to receive your OTP" />
        <ForgotAlert />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: '📧', title: 'Email OTP', desc: 'Receive a 6-digit code at your registered email address', step: 'email-send', color: '#6fa3ef', border: 'rgba(59,130,246,0.3)' },
            { icon: '📱', title: 'Phone OTP', desc: 'Receive a 6-digit code via SMS to your phone number', step: 'phone-send', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
          ].map(m => (
            <div key={m.step} className="method-card"
              onClick={() => { setForgotError(''); setForgotSuccess(''); setForgotStep(m.step); }}
              style={{
                padding: '16px 18px', background: 'rgba(14,24,58,0.6)',
                border: `1px solid ${m.border}`, borderRadius: 14,
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
              <span style={{ fontSize: 28 }}>{m.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: m.color, marginBottom: 3 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: '#4a5a7a', lineHeight: 1.4 }}>{m.desc}</div>
              </div>
              <span style={{ marginLeft: 'auto', color: '#2a3a5a', fontSize: 16 }}>→</span>
            </div>
          ))}
        </div>
      </div>
    );

    // Email — enter address
    if (forgotStep === 'email-send') return (
      <div>
        <ForgotHeader title="Email OTP" subtitle="Enter the email address linked to your account" backStep="method" />
        <ForgotAlert />
        <input className="auth-input" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendEmailOtp()}
          placeholder="your@email.com" type="email" style={{ ...inputStyle, marginBottom: 14 }} />
        {btnPrimary('Send OTP →', sendEmailOtp)}
      </div>
    );

    // Phone — country + number
    if (forgotStep === 'phone-send') return (
      <div>
        <ForgotHeader title="Phone OTP" subtitle="Select your country and enter your mobile number" backStep="method" />
        <ForgotAlert />
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <div onClick={() => setShowCountryList(!showCountryList)}
            style={{
              ...inputStyle, display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer', userSelect: 'none', padding: '11px 14px',
            }}>
            <span style={{ fontSize: 18 }}>{forgotCountry.flag}</span>
            <span style={{ color: '#8899bb', fontSize: 13 }}>{forgotCountry.name}</span>
            <span style={{ color: '#6fa3ef', fontWeight: 700, marginLeft: 4 }}>{forgotCountry.code}</span>
            <span style={{ marginLeft: 'auto', color: '#4a5a7a', fontSize: 11 }}>{showCountryList ? '▲' : '▼'}</span>
          </div>
          {showCountryList && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
              background: 'rgba(5,11,26,0.99)', border: '1px solid rgba(30,58,138,0.5)',
              borderRadius: 10, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
            }}>
              <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(30,58,138,0.3)' }}>
                <input value={countrySearch} onChange={e => setCountrySearch(e.target.value)}
                  placeholder="Search country..." autoFocus
                  style={{ ...inputStyle, padding: '7px 10px', fontSize: 13, borderRadius: 7 }} />
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {filteredCountries.map((c, i) => (
                  <div key={i} onClick={() => { setForgotCountry(c); setShowCountryList(false); setCountrySearch(''); }}
                    style={{
                      padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 10,
                      cursor: 'pointer', fontSize: 13, color: '#c8d8f0',
                      background: forgotCountry.name === c.name ? 'rgba(30,58,138,0.3)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,58,138,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = forgotCountry.name === c.name ? 'rgba(30,58,138,0.3)' : 'transparent'}>
                    <span style={{ fontSize: 18 }}>{c.flag}</span>
                    <span style={{ flex: 1 }}>{c.name}</span>
                    <span style={{ color: '#6fa3ef', fontFamily: 'monospace', fontWeight: 700 }}>{c.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ ...inputStyle, width: 80, textAlign: 'center', flexShrink: 0, color: '#6fa3ef', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, borderRadius: 10 }}>
            {forgotCountry.code}
          </div>
          <input className="auth-input" value={forgotPhone} onChange={e => setForgotPhone(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.key === 'Enter' && sendPhoneOtp()}
            placeholder="Phone number" inputMode="tel"
            style={{ ...inputStyle, flex: 1 }} />
        </div>
        {btnPrimary('Send OTP via SMS →', sendPhoneOtp)}
      </div>
    );

    // Email OTP verification + new password
    if (forgotStep === 'otp-email') return (
      <div>
        <ForgotHeader title="Enter OTP" subtitle={`Code sent to ${forgotEmail}`} backStep="email-send" />
        <ForgotAlert />
        <p style={{ fontSize: 12, color: '#4a5a7a', marginBottom: 4 }}>Enter the 6-digit code from your email:</p>
        <OtpInputs />
        <p style={{ fontSize: 12, color: '#4a5a7a', marginBottom: 4, marginTop: 8 }}>Set your new password:</p>
        <NewPasswordFields />
        {btnPrimary('Reset Password →', verifyOtpAndReset)}
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <span onClick={() => { setForgotOtp(['','','','','','']); sendEmailOtp(); }}
            style={{ fontSize: 12, color: '#4a6a9a', cursor: 'pointer', textDecoration: 'underline' }}>
            Resend OTP
          </span>
        </div>
      </div>
    );

    // Phone OTP verification
    if (forgotStep === 'otp-phone') return (
      <div>
        <ForgotHeader title="Enter OTP" subtitle={`SMS sent to ${forgotCountry.code} ${forgotPhone}`} backStep="phone-send" />
        <ForgotAlert />
        <p style={{ fontSize: 12, color: '#4a5a7a', marginBottom: 4 }}>Enter the 6-digit code from your SMS:</p>
        <OtpInputs />
        <div style={{ marginTop: 8 }}>
          {btnPrimary('Verify OTP →', verifyPhoneOtp)}
        </div>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <span onClick={() => { setForgotOtp(['','','','','','']); sendPhoneOtp(); }}
            style={{ fontSize: 12, color: '#4a6a9a', cursor: 'pointer', textDecoration: 'underline' }}>
            Resend OTP
          </span>
        </div>
      </div>
    );

    // Phone flow: after OTP verified, enter account email + new password
    if (forgotStep === 'reset-phone-email') return (
      <div>
        <ForgotHeader title="Reset Password" subtitle="Phone verified. Enter your account email and new password." />
        <ForgotAlert />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '0 0 14px' }}>
          <input className="auth-input" value={forgotAccountEmail} onChange={e => setForgotAccountEmail(e.target.value)}
            placeholder="Account email address" type="email" style={inputStyle} />
          <input className="auth-input" value={forgotNewPw} onChange={e => setForgotNewPw(e.target.value)}
            placeholder="New password (min 6 chars)" type="password" style={inputStyle} />
          <input className="auth-input" value={forgotConfirmPw} onChange={e => setForgotConfirmPw(e.target.value)}
            placeholder="Confirm new password" type="password" style={inputStyle} />
        </div>
        {btnPrimary('Reset Password →', resetWithPhone)}
      </div>
    );

    return null;
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

          {/* LEFT — Login / Register / Forgot */}
          <div style={{ background: 'rgba(8,15,40,0.95)', border: '1px solid rgba(30,58,138,0.4)', borderRadius: 20, padding: 32, backdropFilter: 'blur(12px)' }}>

            {forgotStep ? renderForgotPanel() : (
              <>
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

                {/* Forgot password link */}
                {tab === 'login' && (
                  <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 12 }}>
                    <span onClick={() => { setForgotStep('method'); setForgotError(''); setForgotSuccess(''); }}
                      style={{ fontSize: 12, color: '#4a6a9a', cursor: 'pointer', textDecoration: 'underline' }}>
                      Forgot password?
                    </span>
                  </div>
                )}

                <button className="btn-primary" onClick={tab === 'login' ? handleLogin : handleRegister} disabled={loading}
                  style={{
                    width: '100%', padding: '12px', border: 'none', borderRadius: 10,
                    background: loading ? 'rgba(30,58,138,0.4)' : 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                    color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: "'Syne',sans-serif", marginBottom: 14,
                  }}>
                  {loading
                    ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Spinner />{tab === 'login' ? 'Signing in...' : 'Creating account...'}
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
              </>
            )}
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
