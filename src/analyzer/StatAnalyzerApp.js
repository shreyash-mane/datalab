import { useState, useCallback } from 'react';
import { analyzeFile } from '../debugger/api/client';

// ─── Colour helpers ───────────────────────────────────────────────────────────

const AMBER  = '#f59e0b';
const AMBER2 = '#fbbf24';
const AMBERD = '#92400e';
const DARK   = '#030712';
const CARD   = '#0a0f18';
const CARD2  = '#0d1520';
const BORDER = '#1e2a3a';
const BORDERA= 'rgba(245,158,11,0.2)';
const TEXT   = '#e5e7eb';
const TEXT2  = '#9ca3af';
const TEXT3  = '#4b5563';

function corrColor(v) {
  if (v === null || v === undefined) return 'rgba(14,22,40,0.6)';
  const abs = Math.abs(v);
  if (v > 0) {
    if (abs >= 0.7) return 'rgba(16,185,129,0.75)';
    if (abs >= 0.4) return 'rgba(16,185,129,0.40)';
    if (abs >= 0.2) return 'rgba(16,185,129,0.20)';
  } else {
    if (abs >= 0.7) return 'rgba(239,68,68,0.70)';
    if (abs >= 0.4) return 'rgba(239,68,68,0.38)';
    if (abs >= 0.2) return 'rgba(239,68,68,0.18)';
  }
  return 'rgba(20,30,50,0.5)';
}

function skewColor(sk) {
  if (!sk) return TEXT3;
  const a = Math.abs(sk);
  if (a < 0.5) return '#10b981';
  if (a < 1.0) return '#f59e0b';
  return '#ef4444';
}

function fmtN(v, dp = 2) {
  if (v === null || v === undefined) return '—';
  if (typeof v !== 'number') return String(v);
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(dp) + 'M';
  if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(dp) + 'K';
  return v.toLocaleString(undefined, { maximumFractionDigits: dp });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ label, value, color = AMBER2, sub }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDERA}`, borderRadius: 12, padding: '14px 18px', minWidth: 110, flex: 1 }}>
      <div style={{ fontSize: 10, color: TEXT3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: TEXT3, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function MissingBar({ pct }) {
  const w = Math.min(100, pct || 0);
  const color = w === 0 ? '#10b981' : w < 10 ? AMBER : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 5, background: '#1e2a3a', borderRadius: 3 }}>
        <div style={{ width: `${w}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 10, color: TEXT3, width: 36, textAlign: 'right' }}>{pct?.toFixed(1)}%</span>
    </div>
  );
}

// Quartile box-plot visualization (CSS only, no recharts)
function BoxPlot({ col }) {
  const { min, max, q1, q2, q3 } = col;
  if (min === null || max === null) return null;
  const range = max - min || 1;
  const pct = v => ((v - min) / range * 100).toFixed(1) + '%';
  const w = v => (((v) / range) * 100).toFixed(1) + '%';
  return (
    <div style={{ marginTop: 10, padding: '6px 0' }}>
      <div style={{ fontSize: 9, color: TEXT3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>Distribution (min → Q1 → median → Q3 → max)</div>
      <div style={{ position: 'relative', height: 20, background: '#111827', borderRadius: 4 }}>
        {/* IQR box */}
        <div style={{
          position: 'absolute', top: 3, height: 14,
          left: pct(q1), width: `${((q3 - q1) / range * 100).toFixed(1)}%`,
          background: `rgba(245,158,11,0.35)`, border: `1px solid ${AMBER}`, borderRadius: 2,
        }} />
        {/* Median line */}
        <div style={{
          position: 'absolute', top: 2, height: 16, width: 2,
          left: `calc(${pct(q2)} - 1px)`, background: AMBER2, borderRadius: 1,
        }} />
        {/* Min / Max ticks */}
        {[min, max].map((v, i) => (
          <div key={i} style={{ position: 'absolute', top: 4, height: 12, width: 2, left: `calc(${pct(v)} - 1px)`, background: TEXT3, borderRadius: 1 }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: TEXT3, marginTop: 3 }}>
        <span>{fmtN(min, 0)}</span>
        <span style={{ color: '#6b7280' }}>Q1 {fmtN(q1, 0)}</span>
        <span style={{ color: AMBER2 }}>M {fmtN(q2, 0)}</span>
        <span style={{ color: '#6b7280' }}>Q3 {fmtN(q3, 0)}</span>
        <span>{fmtN(max, 0)}</span>
      </div>
    </div>
  );
}

function NumericalCard({ name, col }) {
  const stats = [
    { label: 'Mean',    value: fmtN(col.mean) },
    { label: 'Median',  value: fmtN(col.median) },
    { label: 'Std Dev', value: fmtN(col.std) },
    { label: 'Variance',value: fmtN(col.variance) },
    { label: 'Min',     value: fmtN(col.min) },
    { label: 'Max',     value: fmtN(col.max) },
    { label: 'Q1',      value: fmtN(col.q1) },
    { label: 'Q3',      value: fmtN(col.q3) },
    { label: 'IQR',     value: fmtN(col.iqr) },
    { label: 'Range',   value: fmtN(col.range) },
  ];

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: TEXT }}>{name}</span>
        <span style={{ padding: '2px 7px', background: 'rgba(245,158,11,0.12)', border: `1px solid ${BORDERA}`, borderRadius: 4, fontSize: 9, color: AMBER2, fontFamily: 'monospace' }}>NUMERICAL</span>
        {col.outlier_count > 0 && (
          <span style={{ padding: '2px 7px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, fontSize: 9, color: '#fca5a5' }}>
            {col.outlier_count} outlier{col.outlier_count > 1 ? 's' : ''}
          </span>
        )}
        {col.missing > 0 && (
          <span style={{ padding: '2px 7px', background: 'rgba(156,163,175,0.08)', border: '1px solid #1e2a3a', borderRadius: 4, fontSize: 9, color: TEXT3 }}>
            {col.missing} missing
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: TEXT3 }}>{col.count?.toLocaleString()} values</span>
      </div>

      {/* Stats grid */}
      <div style={{ padding: '10px 14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 10 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: CARD2, borderRadius: 6, padding: '7px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: TEXT3, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Skewness */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: TEXT3 }}>Skewness:</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: skewColor(col.skewness) }}>
            {col.skewness !== null ? col.skewness?.toFixed(4) : '—'}
          </span>
          <span style={{ fontSize: 10, color: TEXT3 }}>({col.skewness_label})</span>
          {col.kurtosis !== null && (
            <>
              <span style={{ fontSize: 10, color: '#374151', marginLeft: 8 }}>Kurtosis:</span>
              <span style={{ fontSize: 11, color: TEXT2 }}>{col.kurtosis?.toFixed(4)}</span>
            </>
          )}
          {col.negative_count > 0 && (
            <span style={{ marginLeft: 8, padding: '2px 6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, fontSize: 9, color: '#fca5a5' }}>
              {col.negative_count} negative
            </span>
          )}
          {col.zeros > 0 && (
            <span style={{ padding: '2px 6px', background: 'rgba(156,163,175,0.08)', border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 9, color: TEXT3 }}>
              {col.zeros} zero{col.zeros > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Missing rate bar */}
        {col.missing_pct !== undefined && (
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 9, color: TEXT3, marginRight: 6 }}>Missing rate:</span>
            <MissingBar pct={col.missing_pct} />
          </div>
        )}

        {/* Normality */}
        {col.normality && (
          <div style={{ fontSize: 10, color: TEXT3 }}>
            Normality test (Shapiro-Wilk): p = {col.normality.p_value} →{' '}
            <span style={{ color: col.normality.is_normal ? '#10b981' : '#f87171' }}>
              {col.normality.is_normal ? 'normal distribution' : 'not normal'}
            </span>
          </div>
        )}

        {/* Box-plot */}
        <BoxPlot col={col} />
      </div>
    </div>
  );
}

function CategoricalCard({ name, col }) {
  const topVals = Object.entries(col.top_values || {});
  const topPcts = col.top_values_pct || {};
  const maxCount = topVals.length ? Math.max(...topVals.map(([, v]) => v)) : 1;

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: TEXT }}>{name}</span>
        <span style={{ padding: '2px 7px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 4, fontSize: 9, color: '#c4b5fd', fontFamily: 'monospace' }}>CATEGORICAL</span>
        {col.missing > 0 && (
          <span style={{ padding: '2px 7px', background: 'rgba(156,163,175,0.08)', border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 9, color: TEXT3 }}>
            {col.missing} missing
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: TEXT3 }}>{col.count?.toLocaleString()} values</span>
      </div>

      <div style={{ padding: '10px 14px' }}>
        {/* Key stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
          {[
            { label: 'Unique', value: col.unique_values?.toLocaleString() },
            { label: 'Mode', value: col.mode ? (col.mode.length > 12 ? col.mode.slice(0, 12) + '…' : col.mode) : '—' },
            { label: 'Mode %', value: col.mode_frequency != null ? col.mode_frequency + '%' : '—' },
          ].map(s => (
            <div key={s.label} style={{ background: CARD2, borderRadius: 6, padding: '7px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: TEXT3, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Missing bar */}
        {col.missing_pct !== undefined && col.missing_pct > 0 && (
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 9, color: TEXT3, marginRight: 6 }}>Missing rate:</span>
            <MissingBar pct={col.missing_pct} />
          </div>
        )}

        {/* Top values */}
        <div style={{ fontSize: 9, color: TEXT3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
          Top {topVals.length} values
        </div>
        {topVals.map(([label, count], i) => {
          const pct = topPcts[label] || 0;
          const barW = (count / maxCount * 100).toFixed(1);
          return (
            <div key={label} style={{ marginBottom: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 11, color: TEXT2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }} title={label}>{label}</span>
                <span style={{ fontSize: 10, color: TEXT3, flexShrink: 0 }}>{count.toLocaleString()} · {pct}%</span>
              </div>
              <div style={{ height: 5, background: '#1e2a3a', borderRadius: 3 }}>
                <div style={{ width: `${barW}%`, height: '100%', background: `rgba(139,92,246,${0.3 + 0.5 * (1 - i / topVals.length)})`, borderRadius: 3 }} />
              </div>
            </div>
          );
        })}

        {/* Entropy / cardinality */}
        <div style={{ marginTop: 10, display: 'flex', gap: 12, fontSize: 10, color: TEXT3 }}>
          {col.entropy !== null && <span>Entropy: <strong style={{ color: TEXT2 }}>{col.entropy?.toFixed(3)} bits</strong></span>}
          {col.cardinality_ratio !== null && <span>Cardinality: <strong style={{ color: TEXT2 }}>{col.cardinality_ratio?.toFixed(1)}%</strong></span>}
        </div>
      </div>
    </div>
  );
}

function CorrelationMatrix({ matrix }) {
  const keys = Object.keys(matrix);
  if (keys.length < 2) return null;

  const cellSize = Math.max(52, Math.min(80, Math.floor(600 / keys.length)));
  const headerStyle = { padding: `4px 6px`, fontSize: 10, color: TEXT2, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: cellSize, fontWeight: 600 };
  const colHeaderStyle = { ...headerStyle, textAlign: 'center', writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: 100, verticalAlign: 'bottom' };

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: AMBER2, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 1 }}>
        🔗 Correlation Matrix
        <span style={{ fontSize: 10, color: TEXT3, fontWeight: 400, textTransform: 'none', marginLeft: 10 }}>Pearson · numerical columns only</span>
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 3 }}>
          <thead>
            <tr>
              <th style={{ width: cellSize, minWidth: cellSize }} />
              {keys.map(k => <th key={k} style={{ ...colHeaderStyle, width: cellSize, minWidth: cellSize }} title={k}>{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {keys.map(row => (
              <tr key={row}>
                <td style={headerStyle} title={row}>{row.length > 14 ? row.slice(0, 13) + '…' : row}</td>
                {keys.map(col => {
                  const v = matrix[row]?.[col];
                  const isDiag = row === col;
                  return (
                    <td key={col} title={`${row} vs ${col}: ${v}`} style={{
                      width: cellSize, height: cellSize, textAlign: 'center',
                      background: isDiag ? 'rgba(245,158,11,0.15)' : corrColor(v),
                      borderRadius: 6, fontSize: 11, fontWeight: isDiag ? 700 : 400,
                      color: isDiag ? AMBER2 : (Math.abs(v || 0) > 0.3 ? '#f0f0f0' : TEXT3),
                      cursor: 'default',
                    }}>
                      {v !== null && v !== undefined ? v.toFixed(2) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        {[
          { color: 'rgba(16,185,129,0.75)', label: 'Strong positive (≥0.7)' },
          { color: 'rgba(16,185,129,0.40)', label: 'Moderate positive (0.4–0.7)' },
          { color: 'rgba(14,22,40,0.6)',    label: 'Weak / no correlation' },
          { color: 'rgba(239,68,68,0.38)',  label: 'Moderate negative' },
          { color: 'rgba(239,68,68,0.70)',  label: 'Strong negative (≤-0.7)' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: item.color, border: `1px solid ${BORDER}` }} />
            <span style={{ fontSize: 10, color: TEXT3 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MissingHeatmap({ summary }) {
  const cols = Object.entries(summary.missing_per_column || {}).filter(([, v]) => v > 0);
  if (!cols.length) return (
    <div style={{ padding: '10px 0', fontSize: 12, color: '#10b981' }}>✓ No missing values in any column</div>
  );
  const maxMissing = Math.max(...cols.map(([, v]) => v));
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 11, color: TEXT2, marginBottom: 8 }}>{cols.length} column{cols.length > 1 ? 's' : ''} with missing values:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {cols.sort(([, a], [, b]) => b - a).map(([col, count]) => {
          const pct = (count / summary.total_rows * 100).toFixed(1);
          const intensity = count / maxMissing;
          return (
            <div key={col} style={{ padding: '5px 10px', borderRadius: 6, background: `rgba(239,68,68,${0.08 + intensity * 0.35})`, border: `1px solid rgba(239,68,68,${0.15 + intensity * 0.4})`, fontSize: 10, color: TEXT2 }}>
              <span style={{ color: TEXT }}>{col}</span> — {count.toLocaleString()} ({pct}%)
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function StatAnalyzerApp() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all | numerical | categorical

  const handleFile = useCallback(async (file) => {
    if (!file.name.endsWith('.csv')) { setError('Please upload a CSV file.'); return; }
    setFileName(file.name);
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await analyzeFile(file);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = e => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const summary = result?.dataset_summary;
  const columns = result?.columns || {};
  const corrMatrix = result?.correlation_matrix || {};

  const filteredCols = Object.entries(columns).filter(([name, col]) => {
    if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== 'all' && col.type !== typeFilter) return false;
    return true;
  });

  const numCount  = Object.values(columns).filter(c => c.type === 'numerical').length;
  const catCount  = Object.values(columns).filter(c => c.type === 'categorical').length;

  return (
    <div style={{ minHeight: 'calc(100vh - 52px)', background: DARK, color: TEXT, fontFamily: "'Syne', sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px' }}>

        {/* Page title */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: AMBER2, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>📐</span> Statistical Analyzer
          </h1>
          <p style={{ fontSize: 13, color: TEXT3, margin: 0 }}>
            Upload a CSV to get per-column statistics, distribution shapes, outlier counts, missing-value analysis and a full correlation matrix.
          </p>
        </div>

        {/* Upload zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('stat-file-input').click()}
          style={{ border: `2px dashed ${dragOver ? AMBER : BORDERA}`, borderRadius: 14, padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', background: dragOver ? `rgba(245,158,11,0.04)` : CARD, transition: 'all 0.2s', marginBottom: 20 }}>
          <span style={{ fontSize: 32 }}>📂</span>
          <span style={{ fontSize: 14, color: TEXT2 }}>{fileName ? `Loaded: ${fileName}` : 'Drop a CSV here or click to browse'}</span>
          <span style={{ fontSize: 11, color: TEXT3 }}>Supports any CSV with headers in the first row</span>
          <input id="stat-file-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 48, color: AMBER }}>
            <div style={{ fontSize: 32, marginBottom: 12, animation: 'spin 1s linear infinite' }}>⟳</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ fontSize: 14, margin: 0 }}>Analysing dataset…</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, color: '#fca5a5', fontSize: 13, marginBottom: 20 }}>
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {/* ── Dataset summary pills ── */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
              <StatPill label="Total Rows"   value={summary.total_rows?.toLocaleString()} />
              <StatPill label="Columns"      value={summary.total_columns} sub={`${numCount} num · ${catCount} cat`} />
              <StatPill label="Duplicate Rows" value={summary.duplicate_rows?.toLocaleString()} color={summary.duplicate_rows > 0 ? '#fca5a5' : '#10b981'} />
              <StatPill label="Missing Cells" value={`${summary.missing_rate_pct}%`} color={summary.missing_rate_pct > 10 ? '#fca5a5' : summary.missing_rate_pct > 0 ? AMBER : '#10b981'} sub={`${summary.total_missing_cells?.toLocaleString()} cells`} />
              <StatPill label="Complete Rows" value={summary.complete_rows?.toLocaleString()} color="#10b981" sub={`${((summary.complete_rows / summary.total_rows) * 100).toFixed(1)}%`} />
              <StatPill label="Memory" value={`${summary.memory_usage_kb} KB`} color={TEXT2} />
            </div>

            {/* Missing heatmap */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: AMBER, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 1 }}>Missing Values</h3>
              <MissingHeatmap summary={summary} />
            </div>

            {/* Column filter controls */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search columns…"
                style={{ padding: '7px 12px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12, outline: 'none', width: 220 }}
              />
              {['all', 'numerical', 'categorical'].map(f => (
                <button key={f} onClick={() => setTypeFilter(f)} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${typeFilter === f ? BORDERA : BORDER}`, background: typeFilter === f ? 'rgba(245,158,11,0.1)' : 'transparent', color: typeFilter === f ? AMBER2 : TEXT3, fontSize: 11, cursor: 'pointer', textTransform: 'capitalize', fontFamily: "'Syne', sans-serif" }}>
                  {f === 'all' ? `All (${Object.keys(columns).length})` : f === 'numerical' ? `Numerical (${numCount})` : `Categorical (${catCount})`}
                </button>
              ))}
              <span style={{ fontSize: 11, color: TEXT3, marginLeft: 'auto' }}>Showing {filteredCols.length} of {Object.keys(columns).length} columns</span>
            </div>

            {/* Column cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 14 }}>
              {filteredCols.map(([name, col]) => (
                col.type === 'numerical'
                  ? <NumericalCard key={name} name={name} col={col} />
                  : <CategoricalCard key={name} name={name} col={col} />
              ))}
            </div>

            {filteredCols.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48, color: TEXT3 }}>
                No columns match the current filter.
              </div>
            )}

            {/* Correlation matrix */}
            {Object.keys(corrMatrix).length >= 2 && (
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 18px', marginTop: 24 }}>
                <CorrelationMatrix matrix={corrMatrix} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
