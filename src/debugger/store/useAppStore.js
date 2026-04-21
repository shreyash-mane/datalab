import { create } from 'zustand';

const initial = { activeDataset:null, activePipeline:null, activeRun:null, activeStepIndex:0, datasets:[], pipelines:[], steps:[], snapshots:[], isRunning:false, runError:null, activeFile:null };

export const useAppStore = create((set, get) => ({
  ...initial,
  setActiveDataset: d => set({ activeDataset:d }),
  setActivePipeline: p => set({ activePipeline:p }),
  setActiveRun: r => set({ activeRun:r }),
  setActiveStepIndex: i => set({ activeStepIndex:i }),
  setDatasets: ds => set({ datasets:ds }),
  setPipelines: ps => set({ pipelines:ps }),
  setSteps: ss => set({ steps:[...ss].sort((a,b)=>a.order-b.order) }),
  setSnapshots: ss => set({ snapshots:[...ss].sort((a,b)=>a.step_index-b.step_index) }),
  setIsRunning: v => set({ isRunning:v }),
  setRunError: e => set({ runError:e }),
  setActiveFile: f => set({ activeFile: f }),
  upsertStep: step => {
    const existing = get().steps;
    const idx = existing.findIndex(s => s.id === step.id);
    let updated;
    if (idx >= 0) { updated = [...existing]; updated[idx] = step; }
    else { updated = [...existing, step]; }
    set({ steps: updated.sort((a,b) => a.order-b.order) });
  },
  removeStep: step_id => set({ steps: get().steps.filter(s => s.id !== step_id) }),
  reset: () => set(initial),
}));
