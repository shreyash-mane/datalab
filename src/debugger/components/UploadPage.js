import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useDataLabStore } from '../../store/dataLabStore';
import {
  uploadDataset, listDatasets, deleteDataset, createPipeline
} from '../api/client';
import DataTable from './DataTable';
import AutoCleanPanel from './AutoCleanPanel';

function FinderHandoffBanner({ meta, onFileReady, onDismiss }) {
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [fetchDone, setFetchDone] = useState(false);

  const tryAutoFetch = async () => {
    const { url, name } = meta;
    if (!url) { setFetchError('No direct download URL available for this dataset.'); return; }
    setFetching(true); setFetchError(null);
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      if (!text.trim().startsWith('<') && text.includes(',')) {
        const blob = new Blob([text], { type: 'text/csv' });
        const file = new File([blob], (name || 'dataset').replace(/\s+/g, '_') + '.csv', { type: 'text/csv' });
        onFileReady(file);
        setFetchDone(true);
      } else {
        throw new Error('URL does not appear to be a direct CSV link.');
      }
    } catch (e) {
      setFetchError('Auto-fetch failed: ' + e.message + '. Download the CSV manually and drop it below.');
    } finally {
      setFetching(false);
    }
  };

  return (
    <div style={{
      margin: '0 0 20px', padding: '14px 18px',
      background: 'rgba(91,33,182,0.08)', border: '1px solid rgba(124,58,237,0.3)',
      borderRadius: 12, fontFamily: "'Syne',sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>🔍</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>Dataset from Finder</span>
            <span style={{ padding: '1px 8px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, fontSize: 10, color: '#a78bfa', fontFamily: 'monospace' }}>
              {meta.source || 'EXTERNAL'}
            </span>
          </div>
          <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#c4b5fd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {meta.name}
          </p>
          {meta.description && (
            <p style={{ margin: '0 0 8px', fontSize: 11, color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {meta.description}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {meta.url && (
              <a href={meta.url} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', background: 'rgba(30,58,138,0.25)', border: '1px solid rgba(30,58,138,0.4)', borderRadius: 7, color: '#6fa3ef', fontSize: 11, textDecoration: 'none', fontWeight: 600 }}>
                Open Source ↗
              </a>
            )}
            {!fetchDone && (
              <button
                onClick={tryAutoFetch} disabled={fetching}
                style={{ padding: '5px 12px', background: fetching ? '#1e2535' : 'rgba(91,33,182,0.2)', border: '1px solid rgba(124,58,237,0.35)', borderRadius: 7, color: fetching ? '#6b7280' : '#a78bfa', fontSize: 11, cursor: fetching ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >
                {fetching ? '⏳ Fetching…' : '⚡ Auto-Fetch CSV'}
              </button>
            )}
            {fetchDone && <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>✓ Loaded — drop it into the panel or upload below</span>}
            <button onClick={onDismiss} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1 }}>✕</button>
          </div>
          {fetchError && (
            <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(127,29,29,0.2)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 7, fontSize: 11, color: '#fca5a5' }}>
              ⚠ {fetchError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  const navigate = useNavigate();
  const { datasets, setDatasets, setActiveDataset, setActivePipeline, setActiveFile } = useAppStore();
  const { handoff, clearHandoff } = useDataLabStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [backendDown, setBackendDown] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [creatingPipeline, setCreatingPipeline] = useState(false);
  const [showAutoClean, setShowAutoClean] = useState(false);
  const [showFinderBanner, setShowFinderBanner] = useState(handoff?.origin === 'finder');
  const fileInputRef = { current: null };

  useEffect(() => {
    listDatasets()
      .then(setDatasets)
      .catch(e => {
        if (e.message && (e.message.includes('Cannot reach') || e.message.includes('Failed to fetch'))) {
          setBackendDown(true);
        } else {
          setError(e.message);
        }
      });
  }, []);

  const handleFile = async (file) => {
    if (!file.name.endsWith('.csv')) { setError('Only .csv files are supported.'); return; }
    setError(null);
    setUploading(true);
    try {
      const ds = await uploadDataset(file);
      setDatasets([ds, ...datasets]);
      setPreview(ds);
      setPreviewFile(file);
      setActiveFile(file);
    } catch(e) { setError(e.message); }
    finally { setUploading(false); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDelete = async (ds, e) => {
    e.stopPropagation();
    await deleteDataset(ds.id);
    setDatasets(datasets.filter(d => d.id !== ds.id));
    if (preview && preview.id === ds.id) { setPreview(null); setPreviewFile(null); }
  };

  const handleCreatePipeline = async (ds) => {
    const name = newPipelineName.trim() || ("Pipeline for " + ds.name);
    setCreatingPipeline(true);
    try {
      const p = await createPipeline(name, ds.id);
      setActiveDataset(ds);
      setActivePipeline(p);
      navigate("/debugger/pipeline/" + p.id);
    } catch(e) { setError(e.message); }
    finally { setCreatingPipeline(false); }
  };

  const schema = preview ? JSON.parse(preview.schema_json || "{}") : {};
  const stats = preview ? JSON.parse(preview.stats_json || "{}") : {};
  const sample = preview ? JSON.parse(preview.sample_json || "[]") : [];
  const nullCounts = preview
    ? Object.fromEntries(Object.entries(stats).map(([col, s]) => [col, s.null_count || 0]))
    : {};

  const s = {
    sidebar: { width:280, flexShrink:0, borderRight:'1px solid #252d40', background:'#0f1117', display:'flex', flexDirection:'column', height:'calc(100vh - 52px)', overflow:'hidden' },
    sideHead: { padding:16, borderBottom:'1px solid #252d40' },
    dropzone: { border:'2px dashed #252d40', borderRadius:12, padding:20, display:'flex', flexDirection:'column', alignItems:'center', gap:8, cursor:'pointer', transition:'all 0.2s', background: dragOver ? 'rgba(59,130,246,0.08)' : 'transparent', borderColor: dragOver ? '#3b82f6' : '#252d40' },
    main: { flex:1, overflowY:'auto', padding:24 },
  };

  return (
    <>
    <div style={{ display:'flex', height:'calc(100vh - 52px)', fontFamily:"'Syne', sans-serif", background:'#0f1117', color:'#e5e7eb' }}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sideHead}>
          <h2 style={{ margin:'0 0 12px', fontSize:13, fontWeight:600, color:'#d1d5db' }}>Datasets</h2>
          <div
            style={s.dropzone}
            onClick={() => document.getElementById('debugger-file-input').click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div style={{ fontSize:20 }}>{uploading ? '⏳' : '📤'}</div>
            <p style={{ fontSize:11, color:'#6b7280', textAlign:'center', margin:0 }}>
              {uploading ? 'Uploading...' : 'Drop CSV or click to browse'}
            </p>
            <input id="debugger-file-input" type="file" accept=".csv" style={{ display:'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          </div>
          {error && <div style={{ marginTop:8, fontSize:11, color:'#f87171', display:'flex', alignItems:'center', gap:4 }}>⚠ {error}</div>}
          {backendDown && (
            <div style={{ marginTop:8, padding:10, background:'rgba(127,29,29,0.2)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, fontSize:11, color:'#fca5a5' }}>
              <div style={{ fontWeight:600, marginBottom:4 }}>⛔ Backend not reachable</div>
              <p style={{ margin:0, fontFamily:'monospace', fontSize:10 }}>cd backend && uvicorn main:app --reload --port 8000</p>
            </div>
          )}
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:8 }}>
          {datasets.length === 0 && <p style={{ fontSize:11, color:'#4b5563', textAlign:'center', padding:'32px 16px' }}>No datasets yet. Upload a CSV to get started.</p>}
          {datasets.map(ds => (
            <div key={ds.id} onClick={() => setPreview(ds)} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:8, cursor:'pointer', marginBottom:2, background: preview && preview.id === ds.id ? 'rgba(59,130,246,0.1)' : 'transparent', border: preview && preview.id === ds.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent' }}>
              <span style={{ fontSize:14 }}>📄</span>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontSize:12, fontWeight:500, color:'#d1d5db', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ds.name}</p>
                <p style={{ margin:0, fontSize:10, color:'#4b5563', fontFamily:'monospace' }}>{ds.row_count.toLocaleString()} x {ds.col_count}</p>
              </div>
              <button onClick={e => handleDelete(ds, e)} style={{ background:'none', border:'none', color:'#4b5563', cursor:'pointer', fontSize:13, padding:2 }}>🗑</button>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        {/* Finder handoff banner */}
        {showFinderBanner && handoff?.finderMeta && (
          <FinderHandoffBanner
            meta={handoff.finderMeta}
            onFileReady={(file) => { handleFile(file); setShowAutoClean(true); }}
            onDismiss={() => { setShowFinderBanner(false); clearHandoff(); }}
          />
        )}
        {!preview && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#4b5563', gap:12 }}>
            <div style={{ fontSize:40 }}>📊</div>
            <p style={{ fontSize:14 }}>Select a dataset to preview</p>
          </div>
        )}
        {preview && (
          <>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
              <div>
                <h1 style={{ margin:'0 0 4px', fontSize:20, fontWeight:700 }}>{preview.name}</h1>
                <p style={{ margin:0, fontSize:12, color:'#6b7280', fontFamily:'monospace' }}>{preview.row_count.toLocaleString()} rows · {preview.col_count} columns</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <input style={{ padding:'8px 12px', background:'#1e2535', border:'1px solid #252d40', borderRadius:8, color:'#e5e7eb', fontSize:12, outline:'none', width:200 }} placeholder="Pipeline name (optional)" value={newPipelineName} onChange={e => setNewPipelineName(e.target.value)} />
                <button onClick={() => handleCreatePipeline(preview)} disabled={creatingPipeline} style={{ padding:'8px 16px', background:'#1d4ed8', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                  {creatingPipeline ? '...' : '+ New Pipeline →'}
                </button>
                {previewFile && (
                  <button onClick={() => setShowAutoClean(true)} style={{ padding:'8px 14px', background:'linear-gradient(135deg,#6d28d9,#8b5cf6)', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                    ✨ Auto-Clean
                  </button>
                )}
                {!previewFile && (
                  <span style={{ fontSize:11, color:'#4b5563', fontStyle:'italic' }}>Re-upload to use Auto-Clean</span>
                )}
              </div>
            </div>

            <h2 style={{ fontSize:11, fontWeight:500, color:'#6b7280', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Schema</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:8, marginBottom:24 }}>
              {Object.entries(schema).map(([col, dtype]) => {
                const st = stats[col] || {};
                const nullPct = preview.row_count ? Math.round(((st.null_count||0)/preview.row_count)*100) : 0;
                return (
                  <div key={col} style={{ background:'#161b27', border:'1px solid #252d40', borderRadius:10, padding:12 }}>
                    <p style={{ margin:'0 0 4px', fontSize:12, fontWeight:500, color:'#e5e7eb', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={col}>{col}</p>
                    <span style={{ padding:'2px 6px', background:'#252d40', borderRadius:4, fontSize:10, color:'#6b7280', fontFamily:'monospace' }}>{String(dtype)}</span>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:10, color:'#4b5563', fontFamily:'monospace' }}>
                      <span>{(st.unique_count||0).toLocaleString()} uniq</span>
                      {nullPct > 0 && <span style={{ color: nullPct > 50 ? '#ef4444' : '#f59e0b' }}>{nullPct}% null</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <h2 style={{ fontSize:11, fontWeight:500, color:'#6b7280', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Sample Data (first 50 rows)</h2>
            <DataTable rows={sample} schema={schema} nullCounts={nullCounts} totalRows={preview.row_count} />
          </>
        )}
      </div>
    </div>
    {showAutoClean && previewFile && (
      <AutoCleanPanel
        file={previewFile}
        datasetName={preview ? preview.name : 'dataset.csv'}
        onClose={() => setShowAutoClean(false)}
      />
    )}
    </>
  );
}
