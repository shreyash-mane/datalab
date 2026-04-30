import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataLabStore } from '../../store/dataLabStore';
import { predictCleaning, cleanColumns, downloadClean } from '../api/client';

const ACTION_LABELS = {
  no_change: 'No Change',
  impute_mean: 'Fill Mean',
  impute_median: 'Fill Median',
  convert_and_flag: 'Convert & Flag',
  parse_and_flag: 'Parse & Flag',
  normalize_and_flag: 'Normalize & Flag',
  normalize_boolean: 'Normalize Bool',
  flag_outliers: 'Flag Outliers',
  fill_mode: 'Fill Mode',
  fill_unknown: 'Fill Unknown',
  date_manual_review: 'Review Dates',
};
const ALL_ACTIONS = Object.keys(ACTION_LABELS);

const confColor = (c) =>
  c > 0.85 ? '#4ade80' : c > 0.65 ? '#fbbf24' : '#f87171';

export default function AutoCleanPanel({ file, datasetName, onClose }) {
  const navigate = useNavigate();
  const { setHandoff } = useDataLabStore();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [template, setTemplate] = useState(null);
  const [selected, setSelected] = useState({});
  const [overrides, setOverrides] = useState({});
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sendingToViz, setSendingToViz] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await predictCleaning(file);
        const preds = data.predictions || [];
        setPredictions(preds);
        setTemplate(data.template || null);

        const sel = {}, ov = {};
        preds.forEach(p => {
          // prefer template action when available, else ML prediction
          const action = p.template_action || p.predicted_action;
          sel[p.column] = action !== 'no_change';
          ov[p.column] = action;
        });
        setSelected(sel);
        setOverrides(ov);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [file]);

  const handleApply = async () => {
    setCleaning(true); setError(null);
    try {
      const cols = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
      if (cols.length === 0) { setError('Select at least one column to clean.'); setCleaning(false); return; }
      const data = await cleanColumns(file, cols);
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setCleaning(false); }
  };

  const handleDownload = () => {
    if (!result?.preview) return;
    const rows = result.preview;
    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => {
        const v = r[h]; if (v === null || v === undefined) return '';
        const s = String(v); return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cleaned_' + datasetName; a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendToVisualizer = async () => {
    setSendingToViz(true);
    let csvText = null;
    try {
      // Fetch the full cleaned dataset from the backend
      csvText = await downloadClean(file);
    } catch {
      // Fall back to preview rows if download fails
      const rows = result.preview || [];
      if (rows.length > 0) {
        const headers = Object.keys(rows[0]);
        csvText = [
          headers.join(','),
          ...rows.map(r => headers.map(h => {
            const v = r[h]; if (v === null || v === undefined) return '';
            const s = String(v); return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
          }).join(',')),
        ].join('\n');
      }
    }
    if (!csvText) { setSendingToViz(false); return; }
    setHandoff({
      origin: 'debugger',
      datasetName: 'cleaned_' + datasetName,
      finderMeta: null,
      cleanedCsv: csvText,
      cleaningSummary: result.summary || null,
    });
    navigate('/visualizer');
  };

  const toggleAll = (val) => {
    const sel = {};
    predictions.forEach(p => { sel[p.column] = val; });
    setSelected(sel);
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'stretch' }}>
      {/* backdrop */}
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} onClick={onClose} />

      {/* panel */}
      <div style={{ width: 580, background: '#0a0d14', borderLeft: '1px solid #252d40', display: 'flex', flexDirection: 'column', overflowY: 'auto', fontFamily: "'Syne',sans-serif" }}>

        {/* header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #252d40', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 20 }}>✨</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#e5e7eb' }}>Auto-Clean</span>
              <span style={{ padding: '2px 7px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 6, fontSize: 10, color: '#a78bfa', fontFamily: 'monospace' }}>ML-POWERED</span>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{datasetName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 20, padding: 4 }}>✕</button>
        </div>

        <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* loading */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '48px 0' }}>
              <div style={{ fontSize: 32 }}>🔍</div>
              <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>Analysing dataset…</p>
              <p style={{ color: '#4b5563', fontSize: 11, margin: 0 }}>Detecting type · Running ML predictions</p>
            </div>
          )}

          {/* error */}
          {error && !loading && (
            <div style={{ padding: 12, background: 'rgba(127,29,29,0.2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 12, color: '#fca5a5' }}>
              ⛔ {error}
            </div>
          )}

          {!loading && !result && predictions.length > 0 && (
            <>
              {/* ── Dataset Type Card ── */}
              {template && template.dataset_type !== 'generic' && (
                <div style={{ padding: '14px 16px', borderRadius: 12, border: `1px solid ${template.color}30`, background: `${template.color}08` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 24 }}>{template.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{template.name} detected</span>
                        <span style={{ padding: '1px 7px', borderRadius: 20, fontSize: 10, fontFamily: 'monospace', background: `${template.color}20`, color: template.color, border: `1px solid ${template.color}40` }}>
                          {(template.confidence * 100).toFixed(0)}% confident
                        </span>
                      </div>
                      {template.detected_signals?.length > 0 && (
                        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#6b7280' }}>
                          Signals: {template.detected_signals.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* template overrides info */}
                  {(() => {
                    const overrideCount = predictions.filter(p => p.template_action && p.template_action !== p.predicted_action).length;
                    return overrideCount > 0 ? (
                      <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 7, fontSize: 11, color: '#9ca3af', marginBottom: 8 }}>
                        📐 Template adjusted <strong style={{ color: '#e5e7eb' }}>{overrideCount}</strong> ML prediction{overrideCount !== 1 ? 's' : ''} using domain knowledge
                      </div>
                    ) : null;
                  })()}

                  {/* warnings */}
                  {template.warnings?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {template.warnings.map((w, i) => (
                        <div key={i} style={{ display: 'flex', gap: 6, fontSize: 11, color: '#fbbf24', alignItems: 'flex-start' }}>
                          <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* summary bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 9 }}>
                <span style={{ fontSize: 12, color: '#c4b5fd', flex: 1 }}>
                  {predictions.length} columns · <strong>{predictions.filter(p => (p.template_action || p.predicted_action) !== 'no_change').length}</strong> need cleaning
                </span>
                <button onClick={() => toggleAll(true)} style={{ padding: '3px 9px', background: '#1e2535', border: '1px solid #252d40', borderRadius: 6, color: '#d1d5db', fontSize: 11, cursor: 'pointer' }}>All</button>
                <button onClick={() => toggleAll(false)} style={{ padding: '3px 9px', background: '#1e2535', border: '1px solid #252d40', borderRadius: 6, color: '#d1d5db', fontSize: 11, cursor: 'pointer' }}>None</button>
              </div>

              {/* column rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {predictions.map(p => {
                  const isSelected = selected[p.column];
                  const currentAction = overrides[p.column] || p.predicted_action;
                  const hasTemplateOverride = p.template_action && p.template_action !== p.predicted_action;

                  return (
                    <div key={p.column} style={{ padding: '10px 12px', borderRadius: 8, border: isSelected ? '1px solid #252d40' : '1px solid rgba(255,255,255,0.04)', background: isSelected ? '#141820' : 'rgba(255,255,255,0.02)', opacity: isSelected ? 1 : 0.45, transition: 'all 0.15s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="checkbox" checked={!!isSelected} onChange={e => setSelected(s => ({ ...s, [p.column]: e.target.checked }))} style={{ accentColor: '#8b5cf6', cursor: 'pointer', flexShrink: 0 }} />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{p.column}</span>
                            <span style={{ padding: '1px 6px', background: '#252d40', borderRadius: 4, fontSize: 10, color: '#6b7280', fontFamily: 'monospace', flexShrink: 0 }}>{p.col_type}</span>
                            {hasTemplateOverride && (
                              <span style={{ padding: '1px 6px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 4, fontSize: 9, color: '#fbbf24', flexShrink: 0 }}>📐 template</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                            <span style={{ fontSize: 11, color: '#4b5563' }}>{(p.missing_rate * 100).toFixed(1)}% missing</span>
                            <span style={{ fontSize: 10, color: p.method === 'ml' ? '#818cf8' : '#6b7280', fontFamily: 'monospace' }}>{p.method === 'ml' ? '🤖 ML' : '📐 rule'}</span>
                            <span style={{ fontSize: 10, color: confColor(p.confidence) }}>{(p.confidence * 100).toFixed(0)}%</span>
                          </div>
                          {/* template reason */}
                          {hasTemplateOverride && p.template_reason && (
                            <p style={{ margin: '3px 0 0', fontSize: 10, color: '#fbbf24', fontStyle: 'italic' }}>💡 {p.template_reason}</p>
                          )}
                        </div>

                        {/* action dropdown */}
                        <select
                          value={currentAction}
                          onChange={e => setOverrides(o => ({ ...o, [p.column]: e.target.value }))}
                          style={{ padding: '4px 8px', background: '#1e2535', border: '1px solid #2d3748', borderRadius: 6, color: '#e5e7eb', fontSize: 11, cursor: 'pointer', outline: 'none', flexShrink: 0 }}
                        >
                          {ALL_ACTIONS.map(a => <option key={a} value={a}>{ACTION_LABELS[a]}</option>)}
                        </select>
                      </div>

                      {/* confidence bar */}
                      <div style={{ marginTop: 6, height: 2, background: '#1e2535', borderRadius: 1, marginLeft: 24 }}>
                        <div style={{ width: (p.confidence * 100) + '%', height: '100%', background: confColor(p.confidence), borderRadius: 1, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* apply button */}
              <button onClick={handleApply} disabled={cleaning || selectedCount === 0} style={{ width: '100%', padding: '11px', background: cleaning || selectedCount === 0 ? '#1e2535' : 'linear-gradient(135deg,#6d28d9,#8b5cf6)', border: 'none', borderRadius: 10, color: selectedCount === 0 ? '#4b5563' : '#fff', fontSize: 13, fontWeight: 700, cursor: selectedCount === 0 ? 'not-allowed' : 'pointer' }}>
                {cleaning ? '⏳ Cleaning…' : `✨ Clean ${selectedCount} column${selectedCount !== 1 ? 's' : ''}`}
              </button>
            </>
          )}

          {/* ── Results ── */}
          {result && (
            <>
              <div style={{ padding: '14px 16px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10 }}>
                <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#4ade80' }}>✅ Cleaning complete</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    ['Rows before', result.summary?.rows_before ?? '—'],
                    ['Rows after', result.summary?.rows_after ?? '—'],
                    ['Cells changed', result.summary?.total_cells_changed ?? '—'],
                    ['Cells flagged', result.summary?.total_cells_flagged ?? '—'],
                    ['ML actions', result.summary?.ml_used_count ?? '—'],
                    ['Rule actions', result.summary?.rule_used_count ?? '—'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p style={{ margin: 0, fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#e5e7eb', fontFamily: 'monospace' }}>{String(val)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {result.report && (
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Column Report</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {result.report.map(r => (
                      <div key={r.column} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#141820', borderRadius: 6, fontSize: 11 }}>
                        <span style={{ color: '#e5e7eb', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.column}</span>
                        <span style={{ padding: '1px 6px', background: '#252d40', borderRadius: 4, color: '#a78bfa', fontFamily: 'monospace', fontSize: 10 }}>{ACTION_LABELS[r.action] || r.action}</span>
                        {r.cells_changed > 0 && <span style={{ color: '#4ade80', fontFamily: 'monospace', fontSize: 10 }}>+{r.cells_changed}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.preview?.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Preview (first 10 rows)</p>
                  <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #252d40' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'monospace' }}>
                      <thead>
                        <tr>{Object.keys(result.preview[0]).slice(0, 8).map(h => (
                          <th key={h} style={{ padding: '6px 10px', background: '#161b27', color: '#6b7280', textAlign: 'left', fontWeight: 500, whiteSpace: 'nowrap', borderBottom: '1px solid #252d40' }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {result.preview.slice(0, 10).map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(37,45,64,0.5)' }}>
                            {Object.keys(result.preview[0]).slice(0, 8).map(h => (
                              <td key={h} style={{ padding: '5px 10px', color: row[h] === null ? '#4b5563' : '#d1d5db', whiteSpace: 'nowrap' }}>{row[h] === null ? 'null' : String(row[h]).slice(0, 20)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                <button
                  onClick={handleSendToVisualizer}
                  disabled={sendingToViz}
                  style={{ width: '100%', padding: '11px', background: sendingToViz ? '#1e2535' : 'linear-gradient(135deg,#0369a1,#0ea5e9)', border: 'none', borderRadius: 10, color: sendingToViz ? '#4b5563' : '#fff', fontSize: 13, fontWeight: 700, cursor: sendingToViz ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {sendingToViz ? '⏳ Preparing…' : '📊 Visualize Data →'}
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleDownload} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg,#6d28d9,#8b5cf6)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    ↓ Download Cleaned CSV
                  </button>
                  <button onClick={() => { setResult(null); setError(null); }} style={{ padding: '10px 14px', background: '#1e2535', border: '1px solid #252d40', borderRadius: 8, color: '#d1d5db', fontSize: 12, cursor: 'pointer' }}>
                    ← Back
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
