import { useNavigate, useLocation } from 'react-router-dom';
import { useDataLabStore } from './store/dataLabStore';
import { useEffect, useRef, useState } from 'react';

function WorkflowStep({ label, icon, active, done, onClick }) {
  const color = active ? '#6fa3ef' : done ? '#4ade80' : 'var(--nav-text)';
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
      padding: '2px 8px', borderRadius: 5,
      background: active ? 'rgba(111,163,239,0.1)' : 'transparent',
      transition: 'background 0.15s',
    }}>
      <span style={{ fontSize: 11 }}>{done ? '✓' : icon}</span>
      <span style={{ fontSize: 10, color, fontWeight: active ? 700 : 500, fontFamily: "'Space Mono',monospace", letterSpacing: 0.5 }}>
        {label}
      </span>
    </div>
  );
}

function UserBadge({ user, searchesLeft, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const quotaColor = searchesLeft > 1 ? '#4ade80' : searchesLeft === 1 ? '#fbbf24' : '#f87171';
  const initials = user.isGuest ? '👤' : (user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U');

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Searches left pill */}
      <div style={{
        padding: '3px 10px', borderRadius: 20,
        background: `${quotaColor}12`, border: `1px solid ${quotaColor}40`,
        fontSize: 10, color: quotaColor, fontFamily: "'Space Mono',monospace",
        letterSpacing: 0.5, whiteSpace: 'nowrap',
      }}>
        {searchesLeft} search{searchesLeft !== 1 ? 'es' : ''} left
      </div>

      {/* Avatar button */}
      <div onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 10px 4px 6px',
        background: 'rgba(30,58,138,0.2)', border: '1px solid rgba(30,58,138,0.4)',
        borderRadius: 20, cursor: 'pointer', userSelect: 'none', transition: 'background 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,58,138,0.4)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(30,58,138,0.2)'}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: user.isGuest ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg,#1d4ed8,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: user.isGuest ? 13 : 10, fontWeight: 800, color: '#fff',
        }}>{initials}</div>
        <span style={{ fontSize: 12, color: '#aabcd8', fontWeight: 600, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.isGuest ? 'Guest' : user.name}
        </span>
        <span style={{ fontSize: 9, color: '#4a5a7a', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 220,
          background: 'rgba(5,11,26,0.98)', border: '1px solid #1e3a8a',
          borderRadius: 14, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          zIndex: 2000,
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #0d1b3e' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e0e8ff' }}>{user.isGuest ? 'Guest User' : user.name}</div>
            {!user.isGuest && <div style={{ fontSize: 11, color: '#4a5a7a', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>}
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 11, color: quotaColor, fontFamily: "'Space Mono',monospace" }}>
                {searchesLeft}/{user.isGuest ? 1 : 3} searches remaining
              </div>
            </div>
            {/* Quota bar */}
            <div style={{ marginTop: 6, height: 3, background: '#0d1b3e', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${(searchesLeft / (user.isGuest ? 1 : 3)) * 100}%`, background: quotaColor, borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </div>
          {user.isGuest && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #0d1b3e', background: 'rgba(16,185,129,0.05)' }}>
              <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600, marginBottom: 3 }}>Login for 3 searches</div>
              <div style={{ fontSize: 10, color: '#4a5a7a' }}>Create a free account to get more searches and save datasets.</div>
            </div>
          )}
          <div onClick={() => { onLogout(); setOpen(false); }}
            style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#f87171', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span>🚪</span><span>{user.isGuest ? 'Back to Login' : 'Logout'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SharedNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, setTheme, handoff, datalabUser, searchesLeft, logoutDataLab } = useDataLabStore();

  const handleLogout = () => {
    logoutDataLab();
    navigate('/');
  };

  const isFinder    = pathname.startsWith('/finder');
  const isDebugger  = pathname.startsWith('/debugger');
  const isVisualizer = pathname.startsWith('/visualizer');
  const isAnalyzer  = pathname.startsWith('/analyzer');
  const isInsights  = pathname.startsWith('/insights');

  const workflowStep = handoff?.origin === 'debugger' ? 2 : handoff?.origin === 'finder' ? 1 : 0;

  const navBtn = (active, color, label, path) => (
    <button
      key={path}
      onClick={() => navigate(path)}
      style={{
        padding: '5px 14px', borderRadius: 8,
        border: active ? `1px solid ${color}50` : '1px solid transparent',
        background: active ? `${color}18` : 'transparent',
        color: active ? color : 'var(--nav-text)',
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
        fontFamily: "'Syne',sans-serif", transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* ── Main nav bar ── */}
      <div style={{
        background: 'var(--nav-bg)',
        borderBottom: '1px solid var(--nav-border)',
        padding: '0 20px', height: 52,
        display: 'flex', alignItems: 'center', gap: 20,
        position: 'sticky', top: 0, zIndex: 1000,
        backdropFilter: 'blur(12px)',
        fontFamily: "'Syne',sans-serif",
        transition: 'background 0.25s, border-color 0.25s',
      }}>
        {/* Logo */}
        <div onClick={() => navigate('/home')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#1d4ed8,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🧪</div>
          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--nav-text-active)', letterSpacing: '-0.01em' }}>DataLab</span>
        </div>
        <div style={{ width: 1, height: 20, background: 'var(--nav-border)' }} />

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 4 }}>
          {navBtn(isFinder,     '#6fa3ef', '🔍 Finder',      '/finder')}
          {navBtn(isDebugger,   '#a78bfa', '🧹 Debugger',    '/debugger')}
          {navBtn(isVisualizer, '#6ee7b7', '📊 Visualizer',  '/visualizer')}
          {navBtn(isAnalyzer,   '#fbbf24', '📐 Analyzer',    '/analyzer')}
          {navBtn(isInsights,   '#a855f7', '🤖 AI Insights', '/insights')}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* User badge with quota */}
          {datalabUser && (
            <UserBadge user={datalabUser} searchesLeft={searchesLeft} onLogout={handleLogout} />
          )}
          {/* Active workflow badge */}
          {handoff && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 11px',
              background: 'var(--badge-bg)', border: '1px solid var(--badge-border)',
              borderRadius: 20, transition: 'all 0.2s',
            }}>
              <span style={{ fontSize: 9, color: 'var(--badge-text)', fontFamily: "'Space Mono',monospace", letterSpacing: 1 }}>
                {handoff.origin === 'finder' ? '🔍 → 🧹' : '🧹 → 📊'}&nbsp;&nbsp;
                {handoff.datasetName ? handoff.datasetName.slice(0, 22) : 'dataset'}
              </span>
            </div>
          )}

          {/* Dark / Light toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{
              width: 34, height: 34, borderRadius: 8,
              border: '1px solid var(--nav-border)', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, transition: 'all 0.2s',
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* ── Workflow progress strip (shown only when a handoff is active) ── */}
      {handoff && (
        <div style={{
          background: 'var(--workflow-bg)',
          borderBottom: '1px solid var(--workflow-border)',
          padding: '5px 20px',
          display: 'flex', alignItems: 'center', gap: 4,
          transition: 'background 0.25s, border-color 0.25s',
          position: 'sticky', top: 52, zIndex: 999,
        }}>
          <span style={{ fontSize: 9, color: 'var(--nav-text)', fontFamily: "'Space Mono',monospace", letterSpacing: 1, marginRight: 8 }}>WORKFLOW</span>
          <WorkflowStep label="FINDER"    icon="🔍" active={isFinder}    done={workflowStep >= 1} onClick={() => navigate('/finder')} />
          <span style={{ color: workflowStep >= 1 ? '#4ade80' : 'var(--nav-border)', fontSize: 12, margin: '0 2px' }}>→</span>
          <WorkflowStep label="DEBUGGER"  icon="🧹" active={isDebugger}  done={workflowStep >= 2} onClick={() => navigate('/debugger')} />
          <span style={{ color: workflowStep >= 2 ? '#4ade80' : 'var(--nav-border)', fontSize: 12, margin: '0 2px' }}>→</span>
          <WorkflowStep label="VISUALIZE" icon="📊" active={isVisualizer} done={false}            onClick={() => navigate('/visualizer')} />
          <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--nav-text)', fontFamily: "'Space Mono',monospace" }}>
            {handoff.datasetName && (
              <span style={{ color: 'var(--handoff-accent)' }}>{handoff.datasetName.slice(0, 30)}</span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
