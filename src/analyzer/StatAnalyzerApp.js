import { useState, useCallback, useMemo } from 'react';
import { statUpload, statAnalyzeColumn } from '../debugger/api/client';

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:       '#030712',
  surface:  '#0a0f18',
  surface2: '#0d1520',
  border:   '#1e2a3a',
  borderA:  'rgba(245,158,11,0.22)',
  amber:    '#f59e0b',
  amber2:   '#fbbf24',
  text:     '#e5e7eb',
  text2:    '#9ca3af',
  text3:    '#4b5563',
  green:    '#10b981',
  red:      '#ef4444',
  purple:   '#8b5cf6',
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const fmtN = (v, dp = 2) => {
  if (v === null || v === undefined) return '—';
  if (typeof v !== 'number') return String(v);
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(dp) + 'M';
  if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(dp) + 'K';
  return v.toLocaleString(undefined, { maximumFractionDigits: dp });
};

const TYPE_COLOR  = { numerical: C.amber, categorical: C.purple, date: C.green };
const TYPE_LABEL  = { numerical: 'NUMERICAL', categorical: 'CATEGORICAL', date: 'DATE' };
const TYPE_ICON   = { numerical: '123', categorical: 'Aa', date: '📅' };

function TypeBadge({ type }) {
  const color = TYPE_COLOR[type] || C.text3;
  return (
    <span style={{ padding:'2px 7px', background:`${color}18`, border:`1px solid ${color}44`, borderRadius:4, fontSize:9, color, fontFamily:'monospace', letterSpacing:0.5 }}>
      {TYPE_ICON[type] || '?'} {TYPE_LABEL[type] || type?.toUpperCase()}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, highlight }) {
  return (
    <div style={{ background: C.surface2, borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
      <div style={{ fontSize:9, color: C.text3, textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:16, fontWeight:800, color: highlight || C.text, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:10, color: C.text3, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

// ─── Box-plot strip ───────────────────────────────────────────────────────────
function BoxPlot({ r }) {
  const { min, max, q1, q2, q3 } = r;
  if (min === null || max === null) return null;
  const span = max - min || 1;
  const pct  = v => ((v - min) / span * 100).toFixed(1) + '%';
  return (
    <div style={{ marginTop:12 }}>
      <div style={{ fontSize:9, color: C.text3, textTransform:'uppercase', letterSpacing:0.8, marginBottom:5 }}>
        Distribution — Min · Q1 · Median · Q3 · Max
      </div>
      <div style={{ position:'relative', height:22, background:'#0d1e30', borderRadius:5 }}>
        {/* IQR box */}
        <div style={{ position:'absolute', top:4, height:14, left:pct(q1), width:`${((q3-q1)/span*100).toFixed(1)}%`, background:`rgba(245,158,11,0.28)`, border:`1.5px solid ${C.amber}`, borderRadius:3 }} />
        {/* Median line */}
        <div style={{ position:'absolute', top:3, height:16, width:3, left:`calc(${pct(q2)} - 1.5px)`, background: C.amber2, borderRadius:2 }} />
        {/* Min / Max whiskers */}
        {[min, max].map((v, i) => (
          <div key={i} style={{ position:'absolute', top:5, height:12, width:2, left:`calc(${pct(v)} - 1px)`, background: C.text3, borderRadius:1 }} />
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color: C.text3, marginTop:3 }}>
        <span>{fmtN(min, 1)}</span>
        <span>Q1 {fmtN(q1, 1)}</span>
        <span style={{ color: C.amber2 }}>M {fmtN(q2, 1)}</span>
        <span>Q3 {fmtN(q3, 1)}</span>
        <span>{fmtN(max, 1)}</span>
      </div>
    </div>
  );
}

// ─── Warnings strip ───────────────────────────────────────────────────────────
function Warnings({ items }) {
  if (!items?.length) return null;
  return (
    <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:5 }}>
      {items.map((w, i) => (
        <div key={i} style={{ display:'flex', gap:8, padding:'8px 12px', background:'rgba(245,158,11,0.07)', border:`1px solid rgba(245,158,11,0.2)`, borderRadius:7, fontSize:11, color:'#fcd34d', lineHeight:1.5 }}>
          <span style={{ flexShrink:0 }}>⚠</span>{w}
        </div>
      ))}
    </div>
  );
}

// ─── Numerical result panel ───────────────────────────────────────────────────
function NumericalPanel({ r }) {
  const skewColor = s => {
    if (!s) return C.text3;
    const a = Math.abs(s);
    if (a < 0.5) return C.green;
    if (a < 1.0) return C.amber;
    return C.red;
  };

  const grid1 = [
    { label:'Mean',     value: fmtN(r.mean) },
    { label:'Median',   value: fmtN(r.median) },
    { label:'Mode',     value: fmtN(r.mode) },
    { label:'Std Dev',  value: fmtN(r.std) },
    { label:'Variance', value: fmtN(r.variance) },
  ];
  const grid2 = [
    { label:'Min',   value: fmtN(r.min) },
    { label:'Max',   value: fmtN(r.max) },
    { label:'Range', value: fmtN(r.range) },
    { label:'Q1',    value: fmtN(r.q1) },
    { label:'Q3',    value: fmtN(r.q3) },
    { label:'IQR',   value: fmtN(r.iqr) },
  ];

  return (
    <div>
      {/* Error state */}
      {r.error && (
        <div style={{ padding:'12px 16px', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.22)', borderRadius:8, color:'#fca5a5', fontSize:12, marginBottom:12 }}>
          {r.error}
        </div>
      )}

      {/* Count / missing summary */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <div style={{ padding:'6px 14px', background: C.surface2, border:`1px solid ${C.border}`, borderRadius:7, fontSize:11, color: C.text2 }}>
          <span style={{ color: C.text3 }}>Valid values: </span>
          <strong style={{ color: C.text }}>{r.count?.toLocaleString()}</strong>
        </div>
        <div style={{ padding:'6px 14px', background: C.surface2, border:`1px solid ${r.missing > 0 ? 'rgba(245,158,11,0.3)' : C.border}`, borderRadius:7, fontSize:11 }}>
          <span style={{ color: C.text3 }}>Missing: </span>
          <strong style={{ color: r.missing > 0 ? C.amber2 : C.green }}>{r.missing} ({r.missing_pct}%)</strong>
        </div>
        {r.outlier_count > 0 && (
          <div style={{ padding:'6px 14px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:7, fontSize:11 }}>
            <span style={{ color: C.text3 }}>Outliers (IQR): </span>
            <strong style={{ color:'#fca5a5' }}>{r.outlier_count} ({r.outlier_pct}%)</strong>
          </div>
        )}
      </div>

      {/* Central tendency row */}
      <div style={{ marginBottom:6, fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:0.8 }}>Central tendency &amp; spread</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:6, marginBottom:12 }}>
        {grid1.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Range / quartiles row */}
      <div style={{ marginBottom:6, fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:0.8 }}>Range &amp; quartiles</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:6, marginBottom:14 }}>
        {grid2.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Skewness + kurtosis */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
        <div style={{ padding:'8px 14px', background: C.surface2, border:`1px solid ${C.border}`, borderRadius:8, display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontSize:10, color: C.text3 }}>Skewness</span>
          <span style={{ fontSize:15, fontWeight:700, color: skewColor(r.skewness) }}>{r.skewness ?? '—'}</span>
          <span style={{ fontSize:10, color: C.text3 }}>({r.skewness_label})</span>
        </div>
        {r.kurtosis !== null && r.kurtosis !== undefined && (
          <div style={{ padding:'8px 14px', background: C.surface2, border:`1px solid ${C.border}`, borderRadius:8, display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontSize:10, color: C.text3 }}>Kurtosis</span>
            <span style={{ fontSize:15, fontWeight:700, color: C.text2 }}>{r.kurtosis}</span>
          </div>
        )}
      </div>

      {/* Normality test */}
      {r.normality && (
        <div style={{ padding:'10px 14px', background: r.normality.is_normal ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)', border:`1px solid ${r.normality.is_normal ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius:8, marginBottom:14 }}>
          <div style={{ fontSize:10, color: C.text3, marginBottom:3, textTransform:'uppercase', letterSpacing:0.8 }}>Shapiro-Wilk Normality Test</div>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap', fontSize:12 }}>
            <span style={{ color: C.text2 }}>W = <strong style={{ color: C.text }}>{r.normality.statistic}</strong></span>
            <span style={{ color: C.text2 }}>p = <strong style={{ color: C.text }}>{r.normality.p_value}</strong></span>
            <span style={{ fontWeight:700, color: r.normality.is_normal ? C.green : C.red }}>{r.normality.interpretation}</span>
          </div>
        </div>
      )}

      {/* Box plot */}
      <BoxPlot r={r} />

      {/* Warnings */}
      <Warnings items={r.warnings} />
    </div>
  );
}

// ─── Categorical result panel ─────────────────────────────────────────────────
function CategoricalPanel({ r }) {
  const topVals = Object.entries(r.top_values || {});
  const topPcts = r.top_values_pct || {};
  const maxCount = topVals.length ? Math.max(...topVals.map(([, v]) => v)) : 1;

  return (
    <div>
      {r.error && (
        <div style={{ padding:'12px 16px', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.22)', borderRadius:8, color:'#fca5a5', fontSize:12, marginBottom:12 }}>
          {r.error}
        </div>
      )}

      {/* Summary row */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {[
          { label:'Total rows',   value: r.total?.toLocaleString() },
          { label:'Non-null',     value: r.count?.toLocaleString() },
          { label:'Missing',      value: `${r.missing} (${r.missing_pct}%)`, color: r.missing > 0 ? C.amber2 : C.green },
          { label:'Unique values',value: r.unique_count?.toLocaleString() },
          { label:'Cardinality',  value: `${r.cardinality_pct}%` },
        ].map(s => (
          <div key={s.label} style={{ padding:'8px 14px', background: C.surface2, border:`1px solid ${C.border}`, borderRadius:8, minWidth:100 }}>
            <div style={{ fontSize:9, color: C.text3, textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:14, fontWeight:700, color: s.color || C.text }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Mode */}
      <div style={{ padding:'10px 14px', background: C.surface2, border:`1px solid ${C.border}`, borderRadius:8, marginBottom:16, display:'flex', gap:14, alignItems:'center', flexWrap:'wrap' }}>
        <span style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:0.8 }}>Mode</span>
        <span style={{ fontSize:14, fontWeight:700, color: C.amber2 }}>{r.mode || '—'}</span>
        {r.mode && (
          <span style={{ fontSize:11, color: C.text3 }}>appears <strong style={{ color: C.text2 }}>{r.mode_count?.toLocaleString()}</strong> times ({r.mode_pct}% of non-null)</span>
        )}
      </div>

      {/* Top values chart */}
      {topVals.length > 0 && (
        <div>
          <div style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>
            Top {topVals.length} most frequent values
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {topVals.map(([label, count], i) => {
              const pct  = topPcts[label] || 0;
              const barW = (count / maxCount * 100).toFixed(1);
              const alpha = 0.6 - i * 0.05;
              return (
                <div key={label}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:12, color: C.text2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'65%' }} title={label}>{label}</span>
                    <span style={{ fontSize:11, color: C.text3, flexShrink:0 }}>{count.toLocaleString()} · {pct}%</span>
                  </div>
                  <div style={{ height:7, background:'#1e2a3a', borderRadius:4 }}>
                    <div style={{ width:`${barW}%`, height:'100%', background:`rgba(139,92,246,${alpha})`, borderRadius:4, transition:'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Warnings items={r.warnings} />
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function StatAnalyzerApp() {
  // Upload state
  const [fileId,    setFileId]    = useState(null);
  const [columns,   setColumns]   = useState([]);   // [{name, type}]
  const [fileMeta,  setFileMeta]  = useState(null); // {row_count, col_count, filename}
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');

  // Selection state
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedCol, setSelectedCol] = useState('');

  // Analysis state
  const [result,    setResult]   = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeErr, setAnalyzeErr] = useState('');

  const [dragOver, setDragOver] = useState(false);

  // ── Derived: filtered column list ──────────────────────────────────────────
  const filteredCols = useMemo(() => {
    if (typeFilter === 'all') return columns;
    return columns.filter(c => c.type === typeFilter);
  }, [columns, typeFilter]);

  const counts = useMemo(() => ({
    all:         columns.length,
    numerical:   columns.filter(c => c.type === 'numerical').length,
    categorical: columns.filter(c => c.type === 'categorical').length,
    date:        columns.filter(c => c.type === 'date').length,
  }), [columns]);

  // ── File upload handler ─────────────────────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv','xlsx','xls'].includes(ext)) {
      setUploadErr('Please upload a .csv, .xlsx, or .xls file.');
      return;
    }
    setUploading(true);
    setUploadErr('');
    setResult(null);
    setSelectedCol('');
    setColumns([]);
    setFileId(null);
    try {
      const data = await statUpload(file);
      setFileId(data.file_id);
      setColumns(data.columns);
      setFileMeta({ row_count: data.row_count, col_count: data.col_count, filename: file.name });
    } catch (e) {
      setUploadErr(e.message);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = e => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  // ── Analyze selected column ─────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!fileId || !selectedCol) return;
    setAnalyzing(true);
    setAnalyzeErr('');
    setResult(null);
    try {
      const data = await statAnalyzeColumn(fileId, selectedCol);
      setResult(data);
    } catch (e) {
      setAnalyzeErr(e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // When filter changes, clear selected column if it no longer appears in filtered list
  const handleFilterChange = tab => {
    setTypeFilter(tab);
    setResult(null);
    setAnalyzeErr('');
    const newFiltered = tab === 'all' ? columns : columns.filter(c => c.type === tab);
    if (!newFiltered.find(c => c.name === selectedCol)) setSelectedCol('');
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const hasFile = !!fileId;
  const canAnalyze = hasFile && !!selectedCol && !analyzing;

  return (
    <div style={{ minHeight:'calc(100vh - 52px)', background: C.bg, color: C.text, fontFamily:"'Syne',sans-serif" }}>
      <div style={{ maxWidth:960, margin:'0 auto', padding:'28px 20px' }}>

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:22, fontWeight:800, color: C.amber2, margin:'0 0 6px', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:26 }}>📐</span> Statistical Analyzer
          </h1>
          <p style={{ fontSize:13, color: C.text3, margin:0 }}>
            Upload a CSV or Excel file, pick a column, and click Analyze — stats are computed on demand.
          </p>
        </div>

        {/* ── Upload zone ──────────────────────────────────────────────── */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('sa-file-input').click()}
          style={{ border:`2px dashed ${dragOver ? C.amber : C.borderA}`, borderRadius:14, padding:'22px 24px', display:'flex', alignItems:'center', gap:16, cursor:'pointer', background: dragOver ? 'rgba(245,158,11,0.04)' : C.surface, transition:'all 0.2s', marginBottom:20 }}>
          <span style={{ fontSize:28, flexShrink:0 }}>📂</span>
          <div>
            {fileMeta ? (
              <>
                <div style={{ fontSize:13, fontWeight:600, color: C.amber2 }}>📄 {fileMeta.filename}</div>
                <div style={{ fontSize:11, color: C.text3, marginTop:2 }}>
                  {fileMeta.row_count.toLocaleString()} rows · {fileMeta.col_count} columns — click to replace
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize:13, color: C.text2 }}>Drop a file here or click to browse</div>
                <div style={{ fontSize:11, color: C.text3, marginTop:2 }}>Supports .csv · .xlsx · .xls</div>
              </>
            )}
          </div>
          {uploading && <span style={{ marginLeft:'auto', fontSize:12, color: C.amber, animation:'pulse 1s infinite' }}>Uploading…</span>}
          <input id="sa-file-input" type="file" accept=".csv,.xlsx,.xls" style={{ display:'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}`}</style>

        {uploadErr && (
          <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, color:'#fca5a5', fontSize:12, marginBottom:16 }}>⚠ {uploadErr}</div>
        )}

        {/* ── Column selector (shown after upload) ──────────────────────── */}
        {hasFile && (
          <div style={{ background: C.surface, border:`1px solid ${C.borderA}`, borderRadius:14, padding:'18px 20px', marginBottom:20 }}>

            {/* Filter tabs */}
            <div style={{ display:'flex', gap:2, marginBottom:14, flexWrap:'wrap' }}>
              {[
                { key:'all',         label:`All (${counts.all})` },
                { key:'numerical',   label:`Numerical (${counts.numerical})` },
                { key:'categorical', label:`Categorical (${counts.categorical})` },
                ...(counts.date > 0 ? [{ key:'date', label:`Date (${counts.date})` }] : []),
              ].map(tab => (
                <button key={tab.key} onClick={() => handleFilterChange(tab.key)}
                  style={{ padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:"'Syne',sans-serif", transition:'all 0.15s',
                    background: typeFilter === tab.key ? `rgba(245,158,11,0.15)` : 'transparent',
                    color:      typeFilter === tab.key ? C.amber2 : C.text3,
                    borderBottom: typeFilter === tab.key ? `2px solid ${C.amber}` : '2px solid transparent',
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Dropdown + Analyze button */}
            <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:220 }}>
                <label style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:0.8, display:'block', marginBottom:5 }}>
                  Select column to analyze
                </label>
                <select
                  value={selectedCol}
                  onChange={e => { setSelectedCol(e.target.value); setResult(null); setAnalyzeErr(''); }}
                  style={{ width:'100%', padding:'9px 12px', background:'#111827', border:`1px solid ${selectedCol ? C.borderA : C.border}`, borderRadius:8, color: selectedCol ? C.text : C.text3, fontSize:13, cursor:'pointer', outline:'none', fontFamily:"'Syne',sans-serif" }}>
                  <option value="">— choose a column —</option>
                  {filteredCols.map(col => (
                    <option key={col.name} value={col.name}>
                      {col.name}  ({col.type})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                style={{ padding:'10px 28px', borderRadius:10, border:'none', background: canAnalyze ? 'linear-gradient(135deg,#92400e,#f59e0b)' : '#1e2a3a', color: canAnalyze ? '#fff' : C.text3, fontSize:13, fontWeight:700, cursor: canAnalyze ? 'pointer' : 'not-allowed', fontFamily:"'Syne',sans-serif", transition:'all 0.15s', flexShrink:0, marginTop:20 }}>
                {analyzing ? '⟳ Analyzing…' : '▶ Analyze'}
              </button>
            </div>

            {/* Column type legend */}
            <div style={{ display:'flex', gap:14, marginTop:12, flexWrap:'wrap' }}>
              {[['numerical', C.amber, '123'], ['categorical', C.purple, 'Aa'], ['date', C.green, '📅']].map(([t, color, icon]) => (
                <div key={t} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color: C.text3 }}>
                  <span style={{ padding:'1px 5px', background:`${color}18`, border:`1px solid ${color}44`, borderRadius:3, fontFamily:'monospace', color, fontSize:9 }}>{icon}</span>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Analyze error ─────────────────────────────────────────────── */}
        {analyzeErr && (
          <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, color:'#fca5a5', fontSize:12, marginBottom:16 }}>⚠ {analyzeErr}</div>
        )}

        {/* ── Analyzing spinner ─────────────────────────────────────────── */}
        {analyzing && (
          <div style={{ textAlign:'center', padding:40, color: C.amber }}>
            <div style={{ fontSize:30, animation:'spin 0.9s linear infinite' }}>⟳</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ fontSize:13, margin:'10px 0 0', color: C.text3 }}>Analyzing <strong style={{ color: C.amber2 }}>{selectedCol}</strong>…</p>
          </div>
        )}

        {/* ── Results panel ─────────────────────────────────────────────── */}
        {result && !analyzing && (
          <div style={{ background: C.surface, border:`1px solid ${C.borderA}`, borderRadius:14, overflow:'hidden' }}>
            {/* Result header */}
            <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <span style={{ fontSize:16, fontWeight:800, color: C.text }}>{result.column}</span>
              <TypeBadge type={result.type} />
              {result.count !== undefined && (
                <span style={{ fontSize:11, color: C.text3, marginLeft:'auto' }}>{result.count?.toLocaleString()} valid values</span>
              )}
            </div>
            <div style={{ padding:'18px 20px' }}>
              {result.type === 'numerical'
                ? <NumericalPanel r={result} />
                : <CategoricalPanel r={result} />
              }
            </div>
          </div>
        )}

        {/* ── Empty state (file loaded, no analysis yet) ────────────────── */}
        {hasFile && !result && !analyzing && !analyzeErr && (
          <div style={{ textAlign:'center', padding:'48px 24px', color: C.text3 }}>
            <div style={{ fontSize:40, marginBottom:12, opacity:0.4 }}>📐</div>
            <p style={{ fontSize:13, margin:0 }}>Select a column and click <strong style={{ color: C.amber2 }}>Analyze</strong> to see the statistical profile.</p>
          </div>
        )}

        {/* ── Initial empty state ──────────────────────────────────────── */}
        {!hasFile && !uploading && (
          <div style={{ textAlign:'center', padding:'48px 24px', color: C.text3 }}>
            <div style={{ fontSize:48, marginBottom:14, opacity:0.35 }}>📐</div>
            <p style={{ fontSize:14, color: C.text3, margin:'0 0 6px' }}>Upload a file to get started</p>
            <p style={{ fontSize:12, margin:0, lineHeight:1.7 }}>
              Numerical columns: mean · median · std · quartiles · IQR · skewness · outliers · normality<br/>
              Categorical columns: unique count · mode · top-10 frequency bars · cardinality
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
