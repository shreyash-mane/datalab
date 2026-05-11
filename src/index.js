import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const themeCSS = `
  :root {
    /* ── Nav ── */
    --nav-bg: rgba(3,7,18,0.95);
    --nav-border: rgba(30,58,138,0.25);
    --nav-text: #4a5a7a;
    --nav-text-active: #e0e8ff;
    --workflow-bg: rgba(4,8,20,0.97);
    --workflow-border: rgba(30,58,138,0.3);
    --badge-bg: rgba(59,130,246,0.12);
    --badge-border: rgba(59,130,246,0.3);
    --badge-text: #6fa3ef;
    --handoff-bg: rgba(8,14,34,0.96);
    --handoff-border: rgba(30,58,138,0.35);
    --handoff-text: #8899bb;
    --handoff-accent: #6fa3ef;

    /* ── Page ── */
    --body-bg: #030712;
    --page-bg: #030712;
    --page-text: #e0e8ff;
    --page-subtext: #6b7a9a;
    --page-muted: #2a3a5a;

    /* ── Cards / panels ── */
    --card-bg: rgba(8,15,40,0.95);
    --card-border: rgba(30,58,138,0.4);
    --card-bg-2: rgba(14,24,58,0.6);
    --card-border-2: rgba(30,58,138,0.25);
    --card-hover: rgba(20,34,70,0.7);

    /* ── Inputs ── */
    --input-bg: rgba(8,15,40,0.9);
    --input-border: rgba(30,58,138,0.5);
    --input-text: #e0e8ff;
    --input-placeholder: #4a5a7a;

    /* ── Grid / decorative ── */
    --grid-line: rgba(30,58,138,0.06);
    --glow-blue: rgba(59,130,246,0.06);
    --glow-purple: rgba(139,92,246,0.05);

    /* ── Scrollbar ── */
    --scrollbar-thumb: rgba(30,58,138,0.4);
    --scrollbar-track: rgba(3,7,18,0.5);
  }

  .theme-light {
    /* ── Nav ── */
    --nav-bg: rgba(255,255,255,0.97);
    --nav-border: rgba(148,163,184,0.3);
    --nav-text: #64748b;
    --nav-text-active: #1e293b;
    --workflow-bg: rgba(248,250,252,0.98);
    --workflow-border: rgba(148,163,184,0.25);
    --badge-bg: rgba(99,102,241,0.08);
    --badge-border: rgba(99,102,241,0.25);
    --badge-text: #4f46e5;
    --handoff-bg: rgba(241,245,249,0.98);
    --handoff-border: rgba(99,102,241,0.3);
    --handoff-text: #475569;
    --handoff-accent: #4f46e5;

    /* ── Page ── */
    --body-bg: #f1f5f9;
    --page-bg: #f1f5f9;
    --page-text: #1e293b;
    --page-subtext: #64748b;
    --page-muted: #94a3b8;

    /* ── Cards / panels ── */
    --card-bg: rgba(255,255,255,0.97);
    --card-border: rgba(148,163,184,0.35);
    --card-bg-2: rgba(241,245,249,0.9);
    --card-border-2: rgba(148,163,184,0.2);
    --card-hover: rgba(226,232,240,0.8);

    /* ── Inputs ── */
    --input-bg: rgba(255,255,255,0.95);
    --input-border: rgba(148,163,184,0.5);
    --input-text: #1e293b;
    --input-placeholder: #94a3b8;

    /* ── Grid / decorative ── */
    --grid-line: rgba(99,102,241,0.06);
    --glow-blue: rgba(99,102,241,0.04);
    --glow-purple: rgba(139,92,246,0.03);

    /* ── Scrollbar ── */
    --scrollbar-thumb: rgba(148,163,184,0.5);
    --scrollbar-track: rgba(241,245,249,0.8);
  }

  * { box-sizing: border-box; }
  body, #root {
    margin: 0;
    background: var(--body-bg);
    color: var(--page-text);
    transition: background 0.25s, color 0.25s;
    min-height: 100vh;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--scrollbar-track); }
  ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }

  /* Global input theming */
  input, textarea, select {
    color: var(--input-text);
    background: var(--input-bg);
  }
  input::placeholder, textarea::placeholder { color: var(--input-placeholder); }
`;
const styleEl = document.createElement('style');
styleEl.textContent = themeCSS;
document.head.prepend(styleEl);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
