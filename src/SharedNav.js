import { useNavigate, useLocation } from 'react-router-dom';
import { useDataLabStore } from './store/dataLabStore';

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

export default function SharedNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, setTheme, handoff } = useDataLabStore();

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
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}>
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
