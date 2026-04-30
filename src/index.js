import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const themeCSS = `
  :root {
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
    --body-bg: #030712;
  }
  .theme-light {
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
    --body-bg: #f8fafc;
  }
  * { box-sizing: border-box; }
  body { margin: 0; transition: background 0.25s; }
`;
const styleEl = document.createElement('style');
styleEl.textContent = themeCSS;
document.head.prepend(styleEl);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
