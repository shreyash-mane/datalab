import { create } from 'zustand';

const savedTheme = localStorage.getItem('dlab_theme') || 'dark';
if (savedTheme === 'light') document.documentElement.classList.add('theme-light');

const loadAuth = () => {
  try {
    const raw = localStorage.getItem('dlab_auth');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const saveAuth = (auth) => {
  if (auth) localStorage.setItem('dlab_auth', JSON.stringify(auth));
  else localStorage.removeItem('dlab_auth');
};

const initialAuth = loadAuth();

export const useDataLabStore = create((set, get) => ({
  // ── Cross-module handoff ──────────────────────────────────────────────────
  handoff: null,
  setHandoff: (data) => set({ handoff: data }),
  clearHandoff: () => set({ handoff: null }),

  // ── Theme ─────────────────────────────────────────────────────────────────
  theme: savedTheme,
  setTheme: (t) => {
    localStorage.setItem('dlab_theme', t);
    document.documentElement.classList.toggle('theme-light', t === 'light');
    set({ theme: t });
  },

  // ── Auth & Search Quota ───────────────────────────────────────────────────
  // datalabUser: null (not authenticated) | { name, email, isGuest }
  datalabUser: initialAuth?.user ?? null,
  searchesLeft: initialAuth?.searchesLeft ?? 0,

  loginDataLab: (user) => {
    const auth = { user: { ...user, isGuest: false }, searchesLeft: 3 };
    saveAuth(auth);
    set({ datalabUser: auth.user, searchesLeft: 3 });
  },

  continueAsGuest: () => {
    const auth = { user: { name: 'Guest', email: '', isGuest: true }, searchesLeft: 1 };
    saveAuth(auth);
    set({ datalabUser: auth.user, searchesLeft: 1 });
  },

  consumeSearch: () => {
    const current = get().searchesLeft;
    if (current <= 0) return;
    const next = current - 1;
    const auth = { user: get().datalabUser, searchesLeft: next };
    saveAuth(auth);
    set({ searchesLeft: next });
  },

  logoutDataLab: () => {
    localStorage.removeItem('dlab_auth');
    localStorage.removeItem('token');
    set({ datalabUser: null, searchesLeft: 0 });
  },
}));
