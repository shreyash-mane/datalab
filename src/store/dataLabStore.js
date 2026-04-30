import { create } from 'zustand';

const savedTheme = localStorage.getItem('dlab_theme') || 'dark';
if (savedTheme === 'light') document.documentElement.classList.add('theme-light');

export const useDataLabStore = create((set) => ({
  // Cross-module handoff
  // shape: { origin, datasetName, finderMeta, cleanedCsv, cleaningSummary }
  handoff: null,
  setHandoff: (data) => set({ handoff: data }),
  clearHandoff: () => set({ handoff: null }),

  // Theme
  theme: savedTheme,
  setTheme: (t) => {
    localStorage.setItem('dlab_theme', t);
    document.documentElement.classList.toggle('theme-light', t === 'light');
    set({ theme: t });
  },
}));
