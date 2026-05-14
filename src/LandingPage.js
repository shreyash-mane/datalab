import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Module definitions ────────────────────────────────────────────────────────
const MODULES = [
  {
    id: 'finder', route: '/finder',
    icon: '🔍', title: 'Dataset Finder',
    step: '01',
    badges: [{ label: 'AI-POWERED', color: '#6fa3ef', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' }],
    desc: 'Search, rank and discover the perfect dataset for your research. AI-scored across 7 reliability factors: citations, credibility, documentation and more.',
    features: ['🤖 AI Ranking', '📚 7 Factors', '💾 Save & Export', '📄 PDF Report'],
    cta: 'Find a Dataset →',
    accent: '#3b82f6', accentRgb: '59,130,246',
    grad: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
    cardBg: 'rgba(6,12,38,0.96)',
    cardBorder: 'rgba(30,58,138,0.5)',
    topGlow: 'rgba(59,130,246,0.1)',
    chipBg: 'rgba(30,58,138,0.18)', chipBorder: 'rgba(30,58,138,0.4)', chipColor: '#8899cc',
    animDelay: '0s',
  },
  {
    id: 'debugger', route: '/debugger',
    icon: '🧹', title: 'Debugger & Cleaner',
    step: '02',
    badges: [
      { label: 'PIPELINE', color: '#a78bfa', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)' },
      { label: 'ML CLEANING', color: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)' },
    ],
    desc: 'Upload a CSV and let ML auto-detect issues per column — or build a custom transformation pipeline with full anomaly detection and AI root cause analysis.',
    features: ['✨ Auto-Clean ML', '📊 Step Snapshots', '⚠️ Anomalies', '🔍 Root Cause AI'],
    cta: 'Debug & Clean →',
    accent: '#8b5cf6', accentRgb: '139,92,246',
    grad: 'linear-gradient(135deg,#6d28d9,#8b5cf6)',
    cardBg: 'rgba(8,6,28,0.96)',
    cardBorder: 'rgba(109,40,217,0.4)',
    topGlow: 'rgba(139,92,246,0.1)',
    chipBg: 'rgba(109,40,217,0.15)', chipBorder: 'rgba(109,40,217,0.3)', chipColor: '#a78bfa',
    animDelay: '0.4s',
  },
  {
    id: 'visualizer', route: '/visualizer',
    icon: '📊', title: 'Data Visualizer',
    step: '03',
    badges: [{ label: 'CHARTS', color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' }],
    desc: 'Build interactive dashboards from your CSV. Bar, Line, Area, Scatter, Pie charts plus Pivot Matrix, KPI cards, Calculated Fields, and per-visual Filters.',
    features: ['📈 Bar/Line/Area', '🔲 Pivot Matrix', '🎯 KPI Cards', '⚙ Smart Filters'],
    cta: 'Visualise Data →',
    accent: '#10b981', accentRgb: '16,185,129',
    grad: 'linear-gradient(135deg,#065f46,#10b981)',
    cardBg: 'rgba(1,12,10,0.96)',
    cardBorder: 'rgba(6,95,70,0.5)',
    topGlow: 'rgba(16,185,129,0.08)',
    chipBg: 'rgba(6,95,70,0.2)', chipBorder: 'rgba(6,95,70,0.4)', chipColor: '#6ee7b7',
    animDelay: '0.8s',
  },
  {
    id: 'analyzer', route: '/analyzer',
    icon: '📐', title: 'Stat Analyzer',
    step: '04',
    badges: [{ label: 'SCIPY', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' }],
    desc: 'Instantly get mean, median, std, quartiles, skewness, outlier counts, normality tests, missing-value analysis and a full Pearson correlation matrix.',
    features: ['📊 Distributions', '🔗 Correlation', '⚠️ Outliers', '🔬 Normality Test'],
    cta: 'Analyse Stats →',
    accent: '#f59e0b', accentRgb: '245,158,11',
    grad: 'linear-gradient(135deg,#92400e,#f59e0b)',
    cardBg: 'rgba(12,8,2,0.96)',
    cardBorder: 'rgba(120,70,0,0.5)',
    topGlow: 'rgba(245,158,11,0.08)',
    chipBg: 'rgba(120,70,0,0.2)', chipBorder: 'rgba(120,70,0,0.4)', chipColor: '#fbbf24',
    animDelay: '1.2s',
  },
  {
    id: 'insights', route: '/insights',
    icon: '🤖', title: 'AI Insights Engine',
    step: '05',
    badges: [
      { label: 'STATISTICAL', color: '#d8b4fe', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)' },
      { label: 'AUTO CHARTS', color: '#a78bfa', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.3)' },
    ],
    desc: 'Upload a dataset and get auto-detected relationships, trends, and patterns as clickable insight cards. Click any to generate a chart and AI explanation instantly.',
    features: ['🔗 Correlations', '📅 Trends', '📊 Group Diffs', '⚠️ Data Quality'],
    cta: 'Explore Insights →',
    accent: '#a855f7', accentRgb: '168,85,247',
    grad: 'linear-gradient(135deg,#5b21b6,#a855f7)',
    cardBg: 'rgba(10,4,26,0.96)',
    cardBorder: 'rgba(109,40,217,0.4)',
    topGlow: 'rgba(168,85,247,0.1)',
    chipBg: 'rgba(109,40,217,0.15)', chipBorder: 'rgba(109,40,217,0.3)', chipColor: '#c4b5fd',
    animDelay: '1.6s',
  },
];

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
  @keyframes float{0%,100%{transform:translateY(0px)}50%{transform:translateY(-9px)}}
  @keyframes pulse{0%,100%{opacity:0.45}50%{opacity:1}}
  @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
  @keyframes spin-slow{to{transform:rotate(360deg)}}
  @keyframes dot-grow{from{width:8px;opacity:0.4}to{width:28px;opacity:1}}

  .lp-root{min-height:100vh;overflow-x:hidden;font-family:'Syne',sans-serif;}

  /* ── Hero text gradient ── */
  .hero-grad{
    background:linear-gradient(120deg,#e0e8ff 0%,#6fa3ef 35%,#a78bfa 65%,#818cf8 100%);
    background-size:300% auto;
    -webkit-background-clip:text;
    -webkit-text-fill-color:transparent;
    background-clip:text;
    animation:shimmer 6s linear infinite;
  }

  /* ── Buttons ── */
  .btn-start{
    background:linear-gradient(135deg,#1d4ed8,#3b82f6);
    border:none;border-radius:12px;color:#fff;
    font-size:15px;font-weight:700;padding:14px 30px;
    cursor:pointer;font-family:'Syne',sans-serif;
    letter-spacing:0.3px;transition:all 0.22s;
    box-shadow:0 4px 20px rgba(59,130,246,0.3);
  }
  .btn-start:hover{transform:translateY(-2px);box-shadow:0 10px 36px rgba(59,130,246,0.5);}

  .btn-explore{
    background:rgba(30,58,138,0.1);
    border:1px solid rgba(59,130,246,0.3);
    border-radius:12px;color:#6fa3ef;
    font-size:15px;font-weight:600;padding:13px 28px;
    cursor:pointer;font-family:'Syne',sans-serif;
    transition:all 0.22s;
  }
  .btn-explore:hover{background:rgba(59,130,246,0.12);border-color:rgba(59,130,246,0.55);transform:translateY(-2px);}

  /* ── Arrow buttons ── */
  .arrow-btn{
    width:48px;height:48px;border-radius:50%;
    border:1px solid rgba(30,58,138,0.4);
    background:rgba(6,12,38,0.85);
    color:#6fa3ef;font-size:22px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    transition:all 0.2s;backdrop-filter:blur(10px);
    flex-shrink:0;user-select:none;
  }
  .arrow-btn:hover{background:rgba(30,58,138,0.5);border-color:rgba(59,130,246,0.6);color:#e0e8ff;transform:scale(1.1);}
  .arrow-btn:active{transform:scale(0.95);}

  /* ── Dot indicators ── */
  .carousel-dot{
    height:8px;border:none;border-radius:99px;
    cursor:pointer;padding:0;transition:all 0.35s cubic-bezier(0.25,0.46,0.45,0.94);
  }

  /* ── Module CTA button ── */
  .mod-cta{
    width:100%;padding:13px;border:none;border-radius:12px;
    color:#fff;font-size:14px;font-weight:700;cursor:pointer;
    font-family:'Syne',sans-serif;letter-spacing:0.3px;
    transition:all 0.2s;
  }
  .mod-cta:hover{filter:brightness(1.15);transform:translateY(-1px);}

  /* ── Card hover (active only) ── */
  .mod-card-active:hover{transform:translateY(-4px) !important;}

  /* ── Stats row ── */
  .stat-divider{width:1px;height:32px;background:rgba(30,58,138,0.4);}

  /* ── Mobile overrides ── */
  @media(max-width:639px){
    .arrow-btn{width:38px;height:38px;font-size:19px;}
    .mod-card-pad{padding:22px 16px 20px !important;}
    .hero-badge-text{display:none;}
    .hero-badge-short{display:inline !important;}
  }
  @media(min-width:640px){
    .hero-badge-short{display:none;}
  }
`;

// ─── Module card (module-level so React never remounts it) ────────────────────
function ModuleCard({ mod, navigate, isActive }) {
  return (
    <div
      className={`mod-card-pad${isActive ? ' mod-card-active' : ''}`}
      onClick={() => navigate(mod.route)}
      style={{
        background: mod.cardBg,
        border: `1px solid ${mod.cardBorder}`,
        borderRadius: 24,
        padding: '30px 26px 26px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.3s, box-shadow 0.4s',
        boxShadow: isActive
          ? `0 28px 80px rgba(${mod.accentRgb},0.22), inset 0 1px 0 rgba(255,255,255,0.05)`
          : 'none',
      }}
    >
      {/* Corner glow */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: mod.topGlow, borderRadius: '50%', transform: 'translate(50%,-50%)', pointerEvents: 'none' }} />

      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: '8%', right: '8%', height: 2,
        background: `linear-gradient(90deg, transparent, ${mod.accent}, transparent)`,
        opacity: isActive ? 0.9 : 0.25, transition: 'opacity 0.5s',
      }} />

      {/* Step number */}
      <div style={{
        position: 'absolute', top: 20, right: 22, fontFamily: "'Space Mono',monospace",
        fontSize: 11, color: `rgba(${mod.accentRgb},0.4)`, fontWeight: 700, letterSpacing: 1,
      }}>
        {mod.step} / 05
      </div>

      {/* Icon */}
      <div style={{
        fontSize: 42, marginBottom: 14, display: 'inline-block',
        animation: `float 3.5s ease-in-out ${mod.animDelay} infinite`,
      }}>
        {mod.icon}
      </div>

      {/* Title */}
      <h2 style={{ fontSize: 21, fontWeight: 800, color: '#e0e8ff', margin: '0 0 10px', letterSpacing: '-0.01em' }}>
        {mod.title}
      </h2>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {mod.badges.map(b => (
          <span key={b.label} style={{
            padding: '3px 9px', borderRadius: 6, fontSize: 9.5, fontWeight: 700,
            fontFamily: "'Space Mono',monospace", letterSpacing: 0.6,
            background: b.bg, border: `1px solid ${b.border}`, color: b.color,
          }}>
            {b.label}
          </span>
        ))}
      </div>

      {/* Description */}
      <p style={{ color: '#6b7a9a', fontSize: 13, lineHeight: 1.75, marginBottom: 18 }}>
        {mod.desc}
      </p>

      {/* Feature chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 22 }}>
        {mod.features.map(f => (
          <span key={f} style={{
            padding: '4px 10px', borderRadius: 20, fontSize: 11,
            background: mod.chipBg, border: `1px solid ${mod.chipBorder}`, color: mod.chipColor,
          }}>
            {f}
          </span>
        ))}
      </div>

      {/* CTA */}
      <button
        className="mod-cta"
        onClick={e => { e.stopPropagation(); navigate(mod.route); }}
        style={{ background: mod.grad }}
      >
        {mod.cta}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [windowW, setWindowW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const touchX = useRef(0);

  // Responsive breakpoints
  const isMobile = windowW < 640;
  const isTablet = windowW < 1024;

  useEffect(() => {
    const onResize = () => setWindowW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive(a => (a + 1) % MODULES.length), 4500);
    return () => clearInterval(t);
  }, [paused]);

  const prev = useCallback(() => setActive(a => (a - 1 + MODULES.length) % MODULES.length), []);
  const next = useCallback(() => setActive(a => (a + 1) % MODULES.length), []);

  // Touch swipe
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (dx > 48) prev();
    else if (dx < -48) next();
  };

  // Carousel sizing (mobile uses fade layout — no fixed dimensions needed)
  const CARD_W  = isTablet ? 330 : 420;
  const STEP    = isTablet ? 370 : 468;
  const TRACK_H = isTablet ? 510 : 488;

  const mod = MODULES[active];

  return (
    <div className="lp-root" style={{ background: 'var(--page-bg)', color: 'var(--page-text)' }}>
      <style>{CSS}</style>

      {/* ── Fixed background layers ── */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(30,58,138,0.045) 1px,transparent 1px),linear-gradient(90deg,rgba(30,58,138,0.045) 1px,transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '0%', left: '0%', width: 600, height: 600, borderRadius: '50%', background: 'rgba(59,130,246,0.07)', filter: 'blur(130px)', animation: 'pulse 6s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '25%', right: '-5%', width: 700, height: 700, borderRadius: '50%', background: 'rgba(139,92,246,0.055)', filter: 'blur(150px)', animation: 'pulse 7s ease-in-out infinite 2s', pointerEvents: 'none', zIndex: 0 }} />
      {/* Dynamic glow that follows active module accent */}
      <div style={{ position: 'fixed', bottom: '5%', left: '30%', width: 500, height: 500, borderRadius: '50%', background: `rgba(${mod.accentRgb},0.07)`, filter: 'blur(120px)', transition: 'background 1s ease', animation: 'pulse 5s ease-in-out infinite 1s', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Content wrapper ── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: isMobile ? '36px 16px 56px' : '56px 24px 72px' }}>

        {/* ══════════════════ HERO ══════════════════ */}
        <div style={{ textAlign: 'center', maxWidth: 820, animation: 'fadeUp 0.7s ease forwards', marginBottom: isMobile ? 48 : 64 }}>

          {/* Top pill badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.22)', borderRadius: 30, fontSize: 10.5, color: '#6fa3ef', fontFamily: "'Space Mono',monospace", letterSpacing: 1, marginBottom: 30, textTransform: 'uppercase' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block', boxShadow: '0 0 8px #3b82f6', flexShrink: 0 }} />
            <span className="hero-badge-text">Data Research Suite — 5 Powerful Tools</span>
            <span className="hero-badge-short">5 AI-Powered Tools</span>
          </div>

          {/* H1 */}
          <h1 style={{ fontWeight: 800, lineHeight: 1.08, marginBottom: 10, letterSpacing: '-0.025em' }}>
            <span className="hero-grad" style={{ fontSize: 'clamp(38px,5.8vw,72px)', display: 'block', marginBottom: 6 }}>
              One Platform
            </span>
            <span style={{ fontSize: 'clamp(22px,3.8vw,50px)', fontWeight: 700, color: 'var(--page-text)', lineHeight: 1.2, display: 'block' }}>
              for Dataset Discovery,<br />Cleaning &amp; AI Insights
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{ color: 'var(--page-subtext)', fontSize: 'clamp(14px,1.7vw,17px)', lineHeight: 1.75, maxWidth: 620, margin: '22px auto 36px' }}>
            Search reliable datasets, clean messy CSV files, visualize patterns, analyze statistics, and generate AI-powered insights — all in one seamless workflow.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-start" onClick={() => navigate('/finder')}>
              🚀 Get Started
            </button>
            <button className="btn-explore" onClick={() => document.getElementById('lp-carousel')?.scrollIntoView({ behavior: 'smooth' })}>
              Explore Tools ↓
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 16 : 32, marginTop: 44, flexWrap: 'wrap' }}>
            {[['5', 'Integrated Tools'], ['7', 'Reliability Factors'], ['AI', 'Powered Analysis']].map(([val, label], i) => (
              <div key={val} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 16 : 32 }}>
                {i > 0 && !isMobile && <div className="stat-divider" />}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: 800, color: '#6fa3ef', lineHeight: 1, letterSpacing: '-0.02em' }}>{val}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--page-subtext)', marginTop: 5, fontFamily: "'Space Mono',monospace", letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════ CAROUSEL ══════════════════ */}
        <div id="lp-carousel" style={{ width: '100%', maxWidth: 1120, animation: 'fadeUp 0.9s ease 0.15s both' }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 10.5, color: 'var(--page-subtext)', fontFamily: "'Space Mono',monospace", letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 10 }}>
              Explore Modules
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center' }}>
              <div style={{ height: 1, flex: 1, maxWidth: 100, background: 'linear-gradient(to right, transparent, rgba(30,58,138,0.5))' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: mod.accent, transition: 'color 0.4s', letterSpacing: '-0.01em' }}>
                {mod.icon} {mod.title}
              </span>
              <div style={{ height: 1, flex: 1, maxWidth: 100, background: 'linear-gradient(to left, transparent, rgba(30,58,138,0.5))' }} />
            </div>
          </div>

          {/* Arrow + Track + Arrow row */}
          <div
            style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 6 : 14, marginBottom: 22 }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >

            {/* Left arrow */}
            <button className="arrow-btn" onClick={prev} aria-label="Previous module"
              style={{ marginTop: isMobile ? 16 : 0, flexShrink: 0 }}>‹</button>

            {/* Carousel track */}
            {isMobile ? (
              /* ── Mobile: fade layout, height = card content ── */
              <div style={{ flex: 1, position: 'relative', minHeight: 10 }}>
                {MODULES.map((m, i) => {
                  const isAct = i === active;
                  return (
                    <div
                      key={m.id}
                      style={{
                        position: isAct ? 'relative' : 'absolute',
                        top: 0, left: 0, right: 0,
                        opacity: isAct ? 1 : 0,
                        transition: 'opacity 0.38s ease',
                        pointerEvents: isAct ? 'all' : 'none',
                        zIndex: isAct ? 2 : 1,
                      }}
                    >
                      <ModuleCard mod={m} navigate={navigate} isActive={isAct} />
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── Desktop/tablet: absolute 3D carousel ── */
              <div style={{ flex: 1, position: 'relative', height: TRACK_H, overflow: 'hidden' }}>
                {MODULES.map((m, i) => {
                  const offset   = i - active;
                  const absOff   = Math.abs(offset);
                  const isAct    = absOff === 0;
                  const isSide   = absOff === 1;

                  return (
                    <div
                      key={m.id}
                      style={{
                        position: 'absolute',
                        top: 0, left: '50%',
                        width: CARD_W,
                        transform: `translateX(calc(-50% + ${offset * STEP}px)) scale(${isAct ? 1 : isSide ? 0.87 : 0.74})`,
                        transformOrigin: 'top center',
                        opacity: isAct ? 1 : isSide ? 0.5 : 0,
                        filter: isAct ? 'none' : isSide ? 'blur(2px) brightness(0.75)' : 'blur(4px) brightness(0.5)',
                        zIndex: 20 - absOff * 6,
                        transition: 'transform 0.52s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.52s ease, filter 0.52s ease',
                        pointerEvents: isAct ? 'all' : 'none',
                        willChange: 'transform, opacity',
                      }}
                    >
                      <ModuleCard mod={m} navigate={navigate} isActive={isAct} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Right arrow */}
            <button className="arrow-btn" onClick={next} aria-label="Next module"
              style={{ marginTop: isMobile ? 16 : 0, flexShrink: 0 }}>›</button>
          </div>

          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: 7, justifyContent: 'center', alignItems: 'center', height: 20 }}>
            {MODULES.map((m, i) => (
              <button
                key={i}
                className="carousel-dot"
                onClick={() => setActive(i)}
                aria-label={`Go to ${m.title}`}
                style={{
                  width: i === active ? 28 : 8,
                  background: i === active ? m.accent : 'rgba(255,255,255,0.14)',
                  boxShadow: i === active ? `0 0 12px rgba(${m.accentRgb},0.7)` : 'none',
                }}
              />
            ))}
          </div>

          {/* Module-specific hint below dots */}
          <div style={{ textAlign: 'center', marginTop: 16, height: 18 }}>
            <span style={{ fontSize: 11, color: 'var(--page-subtext)', fontFamily: "'Space Mono',monospace", letterSpacing: 0.5, transition: 'color 0.4s' }}>
              {active + 1} of {MODULES.length} — click arrows or dots to explore
            </span>
          </div>
        </div>

        {/* ══════════════════ WORKFLOW HINT ══════════════════ */}
        <div style={{ marginTop: 56, padding: '18px 26px', background: 'rgba(10,18,50,0.55)', border: '1px solid rgba(30,58,138,0.22)', borderRadius: 18, maxWidth: 800, width: '100%', backdropFilter: 'blur(12px)', animation: 'fadeUp 1s ease 0.3s both' }}>
          <div style={{ fontSize: 11, color: 'var(--page-subtext)', fontFamily: "'Space Mono',monospace", letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
            💡 Recommended Workflow
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {[
              { label: '🔍 Finder', color: '#6fa3ef' },
              { label: '→', color: 'rgba(255,255,255,0.2)' },
              { label: '🧹 Debugger', color: '#a78bfa' },
              { label: '→', color: 'rgba(255,255,255,0.2)' },
              { label: '📐 Stat Analyzer', color: '#fbbf24' },
              { label: '→', color: 'rgba(255,255,255,0.2)' },
              { label: '🤖 AI Insights', color: '#d8b4fe' },
              { label: '→', color: 'rgba(255,255,255,0.2)' },
              { label: '📊 Visualizer', color: '#6ee7b7' },
            ].map(({ label, color }, i) => (
              <span key={i} style={{ fontSize: isMobile ? 12 : 13, fontWeight: label === '→' ? 400 : 700, color }}>
                {label}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
