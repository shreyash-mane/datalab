import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { getPipeline, getDataset, getRun, listSnapshots, runPipeline } from '../api/client';
import DataTable from './DataTable';
import DiffViewer from './DiffViewer';
import AnomalyCards from './AnomalyCards';
import ExplanationPanel from './ExplanationPanel';
import { RowCountChart, NullCountChart, RowDeltaChart } from './Charts';

export default function DebuggerPage() {
  const { pipelineId, runId } = useParams();
  const pid = Number(pipelineId);
  const rid = Number(runId);
  const navigate = useNavigate();
  const { snapshots, setSnapshots, activeStepIndex, setActiveStepIndex, setActivePipeline, setActiveDataset, setActiveRun, activeRun, activePipeline } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rerunning, setRerunning] = useState(false);
  const [rightTab, setRightTab] = useState('anomalies');

  useEffect(() => {
    (async () => {
      try {
        const [pipeline, run, snaps] = await Promise.all([getPipeline(pid), getRun(rid), listSnapshots(rid)]);
        setActivePipeline(pipeline);
        setActiveRun(run);
        setSnapshots(snaps);
        setActiveStepIndex(0);
        const dataset = await getDataset(pipeline.dataset_id);
        setActiveDataset(dataset);
      } catch(e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [pid, rid]);

  const activeSnapshot = snapshots[activeStepIndex] || null;
  const anomalies = activeSnapshot ? JSON.parse(activeSnapshot.anomalies_json || "[]") : [];
  const explanations = activeSnapshot ? JSON.parse(activeSnapshot.explanation_json || "[]") : [];
  const diff = activeSnapshot ? JSON.parse(activeSnapshot.diff_json || "{}") : null;
  const sample = activeSnapshot ? JSON.parse(activeSnapshot.sample_json || "[]") : [];
  const schema = activeSnapshot ? JSON.parse(activeSnapshot.schema_json || "{}") : {};
  const nullCounts = activeSnapshot ? JSON.parse(activeSnapshot.null_counts_json || "{}") : {};
  const changedCols = diff ? [...(diff.columns_added || []), ...Object.keys(diff.type_changes || {})] : [];

  const anomalyCountPerSnap = snapshots.reduce((acc, s) => {
    const anoms = JSON.parse(s.anomalies_json || "[]");
    acc[s.step_index] = { critical: anoms.filter(a => a.severity === "critical").length, warning: anoms.filter(a => a.severity === "warning").length };
    return acc;
  }, {});

  const totalCritical = Object.values(anomalyCountPerSnap).reduce((sum, v) => sum + v.critical, 0);
  const totalWarning = Object.values(anomalyCountPerSnap).reduce((sum, v) => sum + v.warning, 0);

  const handleRerun = async () => {
    setRerunning(true);
    try { const run = await runPipeline(pid); navigate("/debugger/debug/" + pid + "/" + run.id); }
    catch(e) { setError(e.message); }
    finally { setRerunning(false); }
  };

  const handleExport = () => {
    const report = { pipeline_id:pid, run_id:rid, run_status: activeRun && activeRun.status, generated_at: new Date().toISOString(), steps: snapshots.map(s => ({ step:s.step_name, row_count:s.row_count, col_count:s.col_count, anomalies:JSON.parse(s.anomalies_json||"[]"), explanations:JSON.parse(s.explanation_json||"[]") })) };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = "debug_report_run_" + rid + ".json"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', fontSize:24 }}>⏳</div>;
  if (error) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#f87171', fontSize:14 }}>⛔ {error}</div>;

  const tabBtn = (tab, label, count) => (
    <button onClick={() => setRightTab(tab)} style={{ flex:1, padding:'10px 4px', background:'none', border:'none', borderBottom: rightTab===tab ? '2px solid #3b82f6' : '2px solid transparent', color: rightTab===tab ? '#e5e7eb' : '#6b7280', fontSize:12, fontWeight:500, cursor:'pointer', position:'relative' }}>
      {label}
      {count > 0 && <span style={{ marginLeft:4, padding:'1px 5px', background: anomalies.some(a => a.severity==='critical') ? 'rgba(127,29,29,0.5)' : 'rgba(120,53,15,0.5)', borderRadius:4, fontSize:10, color: anomalies.some(a => a.severity==='critical') ? '#fca5a5' : '#fcd34d' }}>{count}</span>}
    </button>
  );

  return (
    <div style={{ display:'flex', height:'calc(100vh - 52px)', background:'var(--page-bg)', color:'var(--page-text)', fontFamily:"'Syne',sans-serif" }}>
      {/* Left: step sidebar */}
      <div style={{ width:240, flexShrink:0, borderRight:'1px solid var(--card-border)', background:'var(--card-bg)', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:12, borderBottom:'1px solid #252d40' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
            <button onClick={() => navigate("/debugger/pipeline/" + pid)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:14, padding:2 }}>←</button>
            <span style={{ fontSize:11, color:'#6b7280', fontFamily:'monospace', flex:1 }}>Debug Run #{rid}</span>
            <span style={{ padding:'2px 7px', borderRadius:5, fontSize:10, background: activeRun && activeRun.status === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(127,29,29,0.2)', color: activeRun && activeRun.status === 'success' ? '#4ade80' : '#f87171', border: '1px solid ' + (activeRun && activeRun.status === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)') }}>{activeRun && activeRun.status}</span>
          </div>
          <div style={{ display:'flex', gap:6, fontSize:11, marginBottom:10 }}>
            <span style={{ color:'#4b5563' }}>{snapshots.length} steps</span>
            {totalCritical > 0 && <span style={{ color:'#f87171' }}>⛔ {totalCritical}</span>}
            {totalWarning > 0 && <span style={{ color:'#fbbf24' }}>⚠ {totalWarning}</span>}
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={handleRerun} disabled={rerunning} style={{ flex:1, padding:'6px', background:'#1e2535', border:'1px solid #252d40', borderRadius:6, color:'#d1d5db', fontSize:11, cursor:'pointer' }}>{rerunning ? '...' : '↺ Re-run'}</button>
            <button onClick={handleExport} style={{ flex:1, padding:'6px', background:'#1e2535', border:'1px solid #252d40', borderRadius:6, color:'#d1d5db', fontSize:11, cursor:'pointer' }}>↓ Export</button>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:6 }}>
          {snapshots.map((snap, idx) => {
            const counts = anomalyCountPerSnap[snap.step_index] || {};
            const hasCritical = counts.critical > 0;
            const hasWarning = counts.warning > 0;
            const isActive = activeStepIndex === idx;
            return (
              <button key={snap.id} onClick={() => setActiveStepIndex(idx)} style={{ width:'100%', textAlign:'left', padding:'8px 10px', borderRadius:8, border: isActive ? '1px solid rgba(59,130,246,0.3)' : hasCritical ? '1px solid rgba(239,68,68,0.2)' : hasWarning ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent', background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent', cursor:'pointer', marginBottom:2, display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:16, height:16, borderRadius:'50%', background: hasCritical ? 'rgba(127,29,29,0.4)' : hasWarning ? 'rgba(120,53,15,0.4)' : 'rgba(34,197,94,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, flexShrink:0, color: hasCritical ? '#f87171' : hasWarning ? '#fbbf24' : '#4ade80' }}>
                  {hasCritical ? '!' : hasWarning ? '~' : '✓'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:11, fontWeight:500, color: isActive ? '#e5e7eb' : '#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{snap.step_name}</p>
                  <p style={{ margin:0, fontSize:10, color:'#4b5563', fontFamily:'monospace' }}>{snap.row_count.toLocaleString()} rows</p>
                </div>
                {(hasCritical || hasWarning) && (
                  <span style={{ fontSize:10, padding:'1px 5px', borderRadius:4, background: hasCritical ? 'rgba(127,29,29,0.3)' : 'rgba(120,53,15,0.3)', color: hasCritical ? '#fca5a5' : '#fcd34d', flexShrink:0 }}>{hasCritical ? counts.critical : counts.warning}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Center: data + charts */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {activeSnapshot && (
          <div style={{ padding:'10px 16px', borderBottom:'1px solid #252d40', background:'rgba(15,17,23,0.8)', display:'flex', alignItems:'center', gap:20, flexShrink:0 }}>
            <div>
              <p style={{ margin:0, fontSize:14, fontWeight:600 }}>{activeSnapshot.step_name}</p>
              <p style={{ margin:0, fontSize:10, color:'#6b7280', fontFamily:'monospace' }}>Step {activeSnapshot.step_index} of {snapshots.length-1}</p>
            </div>
            {[['Rows', activeSnapshot.row_count.toLocaleString()], ['Cols', String(activeSnapshot.col_count)], ['Nulls', Object.values(nullCounts).reduce((a,b)=>a+b,0).toLocaleString()], ['Issues', String(anomalies.length)]].map(([l,v]) => (
              <div key={l}>
                <p style={{ margin:0, fontSize:9, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.8 }}>{l}</p>
                <p style={{ margin:0, fontSize:14, fontWeight:600, fontFamily:'monospace', color: l==='Issues' && anomalies.some(a=>a.severity==='critical') ? '#f87171' : l==='Issues' && anomalies.length>0 ? '#fbbf24' : '#e5e7eb' }}>{v}</p>
              </div>
            ))}
            {diff && diff.row_delta !== 0 && diff.row_delta !== undefined && (
              <div style={{ marginLeft:'auto', padding:'4px 12px', borderRadius:8, border:'1px solid', fontSize:12, fontFamily:'monospace', background: diff.row_delta<0 ? 'rgba(127,29,29,0.2)' : 'rgba(20,83,45,0.2)', borderColor: diff.row_delta<0 ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)', color: diff.row_delta<0 ? '#f87171' : '#4ade80' }}>
                {diff.row_delta>0?'+':''}{diff.row_delta.toLocaleString()} rows {diff.row_delta_pct !== null ? ("(" + (diff.row_delta>0?'+':'') + (diff.row_delta_pct ? diff.row_delta_pct.toFixed(1) : 0) + "%)") : ''}
              </div>
            )}
          </div>
        )}
        <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
          {snapshots.length > 1 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <RowCountChart snapshots={snapshots} activeIndex={activeStepIndex} />
              <RowDeltaChart snapshots={snapshots} />
            </div>
          )}
          {activeSnapshot && <NullCountChart snapshot={activeSnapshot} />}
          {activeSnapshot && (
            <div>
              <p style={{ margin:'0 0 8px', fontSize:11, color:'#6b7280', textTransform:'uppercase', letterSpacing:1 }}>Sample Data - {activeSnapshot.step_name}</p>
              <DataTable rows={sample} schema={schema} nullCounts={nullCounts} totalRows={activeSnapshot.row_count} maxHeight="280px" highlightColumns={changedCols} caption={changedCols.length > 0 ? "Highlighted: " + changedCols.join(', ') : undefined} />
            </div>
          )}
        </div>
      </div>

      {/* Right: tabs */}
      <div style={{ width:300, flexShrink:0, borderLeft:'1px solid var(--card-border)', background:'var(--card-bg)', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', borderBottom:'1px solid #252d40', flexShrink:0 }}>
          {tabBtn('anomalies', 'Anomalies', anomalies.length)}
          {tabBtn('explanations', 'Explain', explanations.length)}
          {tabBtn('diff', 'Diff', 0)}
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:12 }}>
          {rightTab === 'anomalies' && <AnomalyCards anomalies={anomalies} />}
          {rightTab === 'explanations' && <ExplanationPanel explanations={explanations} />}
          {rightTab === 'diff' && diff && <DiffViewer diff={diff} stepName={activeSnapshot ? activeSnapshot.step_name : ''} />}
          {rightTab === 'diff' && !diff && <p style={{ fontSize:12, color:'#4b5563', textAlign:'center', padding:'16px 0' }}>No diff for source step.</p>}
        </div>
      </div>
    </div>
  );
}
