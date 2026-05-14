import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { getPipeline, getDataset, listSteps, createStep, updateStep, deleteStep, reorderSteps, runPipeline, listUploads } from '../api/client';
import StepEditor from './StepEditor';
import AutoCleanPanel from './AutoCleanPanel';

const STEP_LABEL = { drop_missing:'Drop Missing', fill_missing:'Fill Missing', rename_column:'Rename Col', change_dtype:'Change Type', filter_rows:'Filter Rows', select_columns:'Select Cols', sort_values:'Sort Values', remove_duplicates:'Dedup', add_computed_column:'Computed Col', join:'Join', group_aggregate:'Group Agg' };

export default function PipelineBuilder() {
  const { pipelineId } = useParams();
  const pid = Number(pipelineId);
  const navigate = useNavigate();
  const { steps, setSteps, upsertStep, removeStep, setActivePipeline, setActiveDataset, setActiveRun, activePipeline, activeDataset, activeFile } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [expandedStep, setExpandedStep] = useState(null);
  const [showAutoClean, setShowAutoClean] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const pipeline = await getPipeline(pid);
        setActivePipeline(pipeline);
        const dataset = await getDataset(pipeline.dataset_id);
        setActiveDataset(dataset);
        const stps = await listSteps(pid);
        setSteps(stps);
        const { files } = await listUploads();
        setUploadedFiles(files);
      } catch(e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [pid]);

  const columns = activeDataset ? Object.keys(JSON.parse(activeDataset.schema_json || "{}")) : [];

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editingStep) { const u = await updateStep(editingStep.id, data); upsertStep(u); }
      else { const c = await createStep(pid, { ...data, order: steps.length }); upsertStep(c); }
      setShowEditor(false); setEditingStep(null);
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (step) => {
    if (!window.confirm("Delete step \"" + step.name + "\"?")) return;
    await deleteStep(step.id);
    removeStep(step.id);
  };

  const handleToggle = async (step) => {
    const u = await updateStep(step.id, { enabled: !step.enabled });
    upsertStep(u);
  };

  const moveStep = async (step, dir) => {
    const sorted = [...steps];
    const idx = sorted.findIndex(s => s.id === step.id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sorted.length) return;
    const orderMap = sorted.map((s, i) => ({ step_id: s.id, order: i }));
    orderMap[idx].order = newIdx; orderMap[newIdx].order = idx;
    await reorderSteps(pid, orderMap);
    const updated = [...steps];
    updated[idx] = { ...step, order: newIdx };
    updated[newIdx] = { ...sorted[newIdx], order: idx };
    setSteps(updated.sort((a, b) => a.order - b.order));
  };

  const handleRun = async () => {
    setError(null); setRunning(true);
    try {
      const run = await runPipeline(pid);
      setActiveRun(run);
      navigate("/debugger/debug/" + pid + "/" + run.id);
    } catch(e) { setError(e.message); }
    finally { setRunning(false); }
  };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#3b82f6', fontSize:24 }}>⏳</div>;

  const isMobile = window.innerWidth < 768;
  const S = {
    container: { display:'flex', height:'calc(100vh - 52px)', background:'var(--page-bg)', color:'var(--page-text)', fontFamily:"'Syne',sans-serif" },
    sidebar: { width:300, flexShrink:0, borderRight:'1px solid var(--card-border)', background:'var(--card-bg)', display:'flex', flexDirection:'column' },
    sideHead: { padding:14, borderBottom:'1px solid #252d40' },
    stepPill: (active, hasWarning) => ({ borderRadius:8, border: active ? '1px solid rgba(59,130,246,0.4)' : hasWarning ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent', background: active ? 'rgba(59,130,246,0.08)' : 'transparent', marginBottom:2, overflow:'hidden' }),
    main: { flex:1, overflowY:'auto', padding:24 },
  };

  return (
    <>
    <div style={{ ...S.container, flexDirection: isMobile ? 'column' : 'row', height: isMobile ? 'auto' : S.container.height || 'calc(100vh - 52px)', minHeight: isMobile ? 'calc(100vh - 52px)' : undefined, overflowY: isMobile ? 'auto' : 'hidden' }}>
      <div style={{ ...S.sidebar, width: isMobile ? '100%' : 300, borderRight: isMobile ? 'none' : '1px solid var(--card-border)', borderBottom: isMobile ? '1px solid #252d40' : 'none', height: isMobile ? 'auto' : S.sidebar.height, maxHeight: isMobile ? '50vh' : undefined }}>
        <div style={S.sideHead}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <button onClick={() => navigate('/debugger')} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:16, padding:2 }}>←</button>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#e5e7eb', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{activePipeline && activePipeline.name}</p>
              <p style={{ margin:0, fontSize:10, color:'#4b5563' }}>{steps.length} step{steps.length !== 1 ? 's' : ''} · {activeDataset && activeDataset.name}</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleRun} disabled={running || steps.filter(s => s.enabled).length === 0} style={{ flex:1, padding:'8px', background: running ? '#1e3a8a' : '#1d4ed8', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              {running ? '⏳ Running...' : '▶ Run Pipeline'}
            </button>
            <button onClick={() => { setEditingStep(null); setShowEditor(true); }} style={{ padding:'8px 12px', background:'#1e2535', border:'1px solid #252d40', borderRadius:8, color:'#d1d5db', fontSize:12, cursor:'pointer' }}>+ Add</button>
          </div>
          <button
            onClick={() => activeFile ? setShowAutoClean(true) : setError('Go back to Datasets and re-upload your file to use Auto-Clean.')}
            style={{ width:'100%', marginTop:8, padding:'8px', background: activeFile ? 'linear-gradient(135deg,#4c1d95,#7c3aed)' : '#1e2535', border: activeFile ? 'none' : '1px solid #252d40', borderRadius:8, color: activeFile ? '#e9d5ff' : '#4b5563', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
          >
            ✨ Auto-Clean{!activeFile && ' (re-upload to enable)'}
          </button>
          {error && <div style={{ marginTop:8, fontSize:11, color:'#f87171', background:'rgba(127,29,29,0.2)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:6, padding:8 }}>{error}</div>}
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:8 }}>
          {steps.length === 0 && <p style={{ fontSize:11, color:'#4b5563', textAlign:'center', padding:'32px 16px' }}>No steps yet. Click Add to start building.</p>}
          {steps.length > 0 && (
            <div style={{ padding:'6px 10px', borderRadius:6, background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.2)', marginBottom:4, fontSize:11, color:'#4ade80', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:16, height:16, borderRadius:'50%', background:'rgba(34,197,94,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8 }}>S</span>
              Source Dataset
              <span style={{ marginLeft:'auto', fontFamily:'monospace', fontSize:10, color:'#4b5563' }}>{activeDataset && activeDataset.row_count.toLocaleString()} rows</span>
            </div>
          )}
          {steps.map((step, idx) => (
            <div key={step.id}>
              <div style={{ marginLeft:8, width:1, height:6, background:'#252d40' }} />
              <div style={S.stepPill(expandedStep === step.id, false)}>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', cursor:'pointer', opacity: step.enabled ? 1 : 0.5 }} onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'#1e2535', border:'1px solid #252d40', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'#6b7280', flexShrink:0 }}>{idx+1}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:12, fontWeight:500, color:'#d1d5db', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{step.name}</p>
                    <p style={{ margin:0, fontSize:10, color:'#4b5563', fontFamily:'monospace' }}>{STEP_LABEL[step.step_type] || step.step_type}</p>
                  </div>
                  <span style={{ fontSize:10, color:'#4b5563' }}>{expandedStep === step.id ? '▲' : '▼'}</span>
                </div>
                {expandedStep === step.id && (
                  <div style={{ borderTop:'1px solid #252d40', padding:'6px 10px', display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>
                    <button onClick={() => { setEditingStep(step); setShowEditor(true); setExpandedStep(null); }} style={{ padding:'3px 10px', background:'#1e2535', border:'1px solid #252d40', borderRadius:6, color:'#d1d5db', fontSize:11, cursor:'pointer' }}>✏ Edit</button>
                    <button onClick={() => handleToggle(step)} style={{ padding:'3px 10px', background:'#1e2535', border:'1px solid #252d40', borderRadius:6, color: step.enabled ? '#4ade80' : '#6b7280', fontSize:11, cursor:'pointer' }}>{step.enabled ? '● On' : '○ Off'}</button>
                    <button onClick={() => moveStep(step, -1)} disabled={idx===0} style={{ padding:'3px 8px', background:'#1e2535', border:'1px solid #252d40', borderRadius:6, color:'#6b7280', fontSize:11, cursor:'pointer' }}>↑</button>
                    <button onClick={() => moveStep(step, 1)} disabled={idx===steps.length-1} style={{ padding:'3px 8px', background:'#1e2535', border:'1px solid #252d40', borderRadius:6, color:'#6b7280', fontSize:11, cursor:'pointer' }}>↓</button>
                    <button onClick={() => handleDelete(step)} style={{ padding:'3px 8px', background:'rgba(127,29,29,0.2)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:6, color:'#f87171', fontSize:11, cursor:'pointer', marginLeft:'auto' }}>🗑</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={S.main}>
        {showEditor ? (
          <div style={{ maxWidth:560, margin:'0 auto' }}>
            <h2 style={{ margin:'0 0 16px', fontSize:15, fontWeight:600 }}>{editingStep ? "Edit: " + editingStep.name : 'Add Step'}</h2>
            <div style={{ background:'#161b27', border:'1px solid #252d40', borderRadius:12, padding:20 }}>
              <StepEditor columns={columns} uploadedFiles={uploadedFiles} step={editingStep} nextOrder={steps.length} onSave={handleSave} onCancel={() => { setShowEditor(false); setEditingStep(null); }} saving={saving} />
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', textAlign:'center', gap:16, color:'#4b5563' }}>
            {steps.length === 0 ? (
              <>
                <div style={{ fontSize:40 }}>🔧</div>
                <p style={{ fontSize:15, color:'#6b7280', margin:0 }}>Build your pipeline</p>
                <p style={{ fontSize:13, margin:0 }}>Add transformation steps to clean and reshape your data.</p>
                <button onClick={() => { setEditingStep(null); setShowEditor(true); }} style={{ padding:'10px 20px', background:'#1d4ed8', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>+ Add First Step</button>
              </>
            ) : (
              <>
                <div style={{ fontSize:36 }}>▶</div>
                <p style={{ fontSize:14, color:'#9ca3af', margin:0 }}>{steps.filter(s => s.enabled).length} steps ready</p>
                <button onClick={handleRun} disabled={running} style={{ padding:'10px 24px', background:'#1d4ed8', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  {running ? 'Running...' : '▶ Run Pipeline'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
    {showAutoClean && activeFile && (
      <AutoCleanPanel
        file={activeFile}
        datasetName={activeDataset ? activeDataset.name : 'dataset.csv'}
        onClose={() => setShowAutoClean(false)}
      />
    )}
    </>
  );
}
