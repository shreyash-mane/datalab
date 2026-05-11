import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useDataLabStore } from '../store/dataLabStore';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  ScatterChart, Scatter, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  parseCSV, detectTypes, AGG_OPTIONS,
  aggregateRows, multiSeriesData, scatterPoints, pieSlices,
  buildPivot, computeKPI,
  applyFilters, sortRows,
  applyCalcField, validateCalcExpr,
  fmtNum,
} from './vizEngine';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = ['#6366f1','#10b981','#f59e0b','#ec4899','#3b82f6','#f97316','#8b5cf6','#14b8a6','#ef4444','#a855f7','#06b6d4','#84cc16'];

const VISUAL_TYPES = [
  { id:'bar',    icon:'📊', label:'Bar' },
  { id:'line',   icon:'📈', label:'Line' },
  { id:'area',   icon:'🏔',  label:'Area' },
  { id:'scatter',icon:'⚡', label:'Scatter' },
  { id:'pie',    icon:'🥧', label:'Pie' },
  { id:'table',  icon:'📋', label:'Table' },
  { id:'matrix', icon:'🔲', label:'Matrix' },
  { id:'kpi',    icon:'🎯', label:'KPI' },
];

const FILTER_OPS = [
  { id:'eq',       label:'=' },
  { id:'ne',       label:'≠' },
  { id:'gt',       label:'>' },
  { id:'lt',       label:'<' },
  { id:'gte',      label:'≥' },
  { id:'lte',      label:'≤' },
  { id:'contains', label:'contains' },
  { id:'notnull',  label:'not null' },
  { id:'isnull',   label:'is null' },
];

const S = {
  input: { padding:'5px 9px', background:'#1e2535', border:'1px solid #252d40', borderRadius:6, color:'#e5e7eb', fontSize:11, outline:'none', width:'100%', boxSizing:'border-box' },
  select: { padding:'5px 8px', background:'#1e2535', border:'1px solid #252d40', borderRadius:6, color:'#e5e7eb', fontSize:11, cursor:'pointer', outline:'none', width:'100%', boxSizing:'border-box' },
  label: { fontSize:10, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.8, display:'block', marginBottom:3 },
  btnSm: { padding:'4px 10px', borderRadius:5, border:'1px solid #252d40', background:'#1e2535', color:'#9ca3af', fontSize:11, cursor:'pointer' },
  btnGreen: { padding:'5px 12px', borderRadius:6, border:'none', background:'linear-gradient(135deg,#065f46,#10b981)', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' },
  btnRed: { padding:'4px 8px', borderRadius:5, border:'none', background:'transparent', color:'#4b5563', fontSize:13, cursor:'pointer', lineHeight:1 },
  tooltipStyle: { background:'#161b27', border:'1px solid #252d40', borderRadius:8, fontSize:11, color:'#e5e7eb' },
};

const axisStyle = { tick:{ fill:'#6b7280', fontSize:10 }, tickLine:false, axisLine:{ stroke:'#252d40' } };
const gridStyle = { strokeDasharray:'3 3', stroke:'#1e2535' };

let _cardId = 1;
let _filterId = 1;
let _calcId = 1;

// ─── KPI Visual ───────────────────────────────────────────────────────────────

function KpiVisual({ rows, cfg }) {
  const { valuesCol, aggFn, xCol } = cfg;
  if (!valuesCol) return <EmptyState msg="Select a Value column →" />;
  const { formatted, value } = computeKPI(rows, valuesCol, aggFn);
  const aggLabel = AGG_OPTIONS.find(a => a.id === aggFn)?.label || aggFn;
  const subtitle = xCol ? `${aggLabel} of ${valuesCol} by ${xCol}` : `${aggLabel} of ${valuesCol}`;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:4 }}>
      <div style={{ fontSize:11, color:'#6b7280', textTransform:'uppercase', letterSpacing:1 }}>{subtitle}</div>
      <div style={{ fontSize:52, fontWeight:800, color:'#6ee7b7', letterSpacing:'-0.02em', lineHeight:1 }}>{formatted}</div>
      {value !== null && Math.abs(value) >= 1000 && (
        <div style={{ fontSize:11, color:'#4b5563' }}>{value?.toLocaleString()}</div>
      )}
    </div>
  );
}

// ─── Table Visual ────────────────────────────────────────────────────────────

function TableVisual({ rows, cfg, allCols }) {
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState(cfg.sortCol || '');
  const [sortDir, setSortDir] = useState(cfg.sortDir || 'asc');
  const PAGE = 15;

  const cols = cfg.tableCols?.length ? cfg.tableCols : allCols.slice(0, 8);
  const sorted = useMemo(() => sortRows(rows, sortCol, sortDir), [rows, sortCol, sortDir]);
  const total = sorted.length;
  const pageRows = sorted.slice(page * PAGE, (page + 1) * PAGE);
  const pages = Math.ceil(total / PAGE);

  const toggleSort = col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const thStyle = col => ({
    padding:'6px 10px', textAlign:'left', fontSize:11, fontWeight:600, color:'#6ee7b7',
    background:'#0d1520', borderBottom:'1px solid #252d40', cursor:'pointer', whiteSpace:'nowrap',
    userSelect:'none', position:'sticky', top:0,
    ...(col === sortCol ? { color:'#10b981' } : {}),
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <div style={{ flex:1, overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr>
              {cols.map(col => (
                <th key={col} style={thStyle(col)} onClick={() => toggleSort(col)}>
                  {col} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? '#0a0f18' : '#0d1520' }}>
                {cols.map(col => (
                  <td key={col} style={{ padding:'5px 10px', color:'#d1d5db', borderBottom:'1px solid #1a2030', whiteSpace:'nowrap' }}>
                    {row[col] === null ? <span style={{ color:'#374151' }}>—</span> : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div style={{ padding:'6px 10px', borderTop:'1px solid #252d40', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0} style={{ ...S.btnSm, opacity: page === 0 ? 0.4 : 1 }}>‹</button>
          <span style={{ fontSize:10, color:'#6b7280' }}>{page + 1} / {pages} ({total.toLocaleString()} rows)</span>
          <button onClick={() => setPage(p => Math.min(pages-1, p+1))} disabled={page >= pages-1} style={{ ...S.btnSm, opacity: page >= pages-1 ? 0.4 : 1 }}>›</button>
        </div>
      )}
    </div>
  );
}

// ─── Matrix / Pivot Visual ───────────────────────────────────────────────────

function MatrixVisual({ rows, cfg }) {
  const { rowsCol, colsCol, valuesCol, aggFn } = cfg;
  if (!rowsCol || !valuesCol) return <EmptyState msg="Select Rows and Values →" />;
  const pivot = useMemo(() => buildPivot(rows, rowsCol, colsCol, valuesCol, aggFn), [rows, rowsCol, colsCol, valuesCol, aggFn]);
  const { rowHeaders, colHeaders, cells, rowTotals, colTotals, grandTotal } = pivot;

  const cell = v => v === null ? '—' : fmtNum(v);
  const thS = { padding:'5px 8px', fontSize:10, fontWeight:600, color:'#6ee7b7', background:'#0d1520', borderBottom:'1px solid #252d40', whiteSpace:'nowrap', position:'sticky', top:0 };
  const tdS = { padding:'5px 8px', fontSize:11, color:'#d1d5db', borderBottom:'1px solid #1a2030', textAlign:'right', whiteSpace:'nowrap' };
  const totS = { ...tdS, color:'#6ee7b7', fontWeight:600, background:'rgba(16,185,129,0.05)' };

  return (
    <div style={{ overflow:'auto', height:'100%' }}>
      <table style={{ borderCollapse:'collapse', fontSize:11 }}>
        <thead>
          <tr>
            <th style={{ ...thS, textAlign:'left', minWidth:100 }}>{rowsCol}</th>
            {colHeaders.map(ck => <th key={ck} style={thS}>{ck}</th>)}
            {colsCol && <th style={{ ...thS, color:'#f59e0b' }}>Total</th>}
          </tr>
        </thead>
        <tbody>
          {rowHeaders.map((rk, ri) => (
            <tr key={rk} style={{ background: ri % 2 === 0 ? '#0a0f18' : '#0d1520' }}>
              <td style={{ ...tdS, textAlign:'left', color:'#9ca3af', fontWeight:500 }}>{rk}</td>
              {colHeaders.map(ck => <td key={ck} style={tdS}>{cell(cells[rk][ck])}</td>)}
              {colsCol && <td style={totS}>{cell(rowTotals[rk])}</td>}
            </tr>
          ))}
          {colsCol && (
            <tr style={{ background:'rgba(16,185,129,0.03)' }}>
              <td style={{ ...tdS, textAlign:'left', color:'#f59e0b', fontWeight:600 }}>Total</td>
              {colHeaders.map(ck => <td key={ck} style={totS}>{cell(colTotals[ck])}</td>)}
              <td style={{ ...totS, color:'#f59e0b' }}>{cell(grandTotal)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Chart Visual ────────────────────────────────────────────────────────────

function EmptyState({ msg }) {
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#374151', fontSize:12 }}>{msg}</div>;
}

function ChartVisual({ rows, cfg, index }) {
  const { type, xCol, yCol, colorCol, aggFn } = cfg;
  if (!xCol) return <EmptyState msg="Select X-Axis →" />;

  const color = COLORS[index % COLORS.length];

  if (type === 'scatter') {
    if (!yCol) return <EmptyState msg="Select Y-Axis →" />;
    const data = useMemo(() => scatterPoints(rows, xCol, yCol), [rows, xCol, yCol]);
    if (!data.length) return <EmptyState msg="No numeric data" />;
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top:5, right:10, left:-10, bottom:5 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis type="number" dataKey="x" name={xCol} {...axisStyle} />
          <YAxis type="number" dataKey="y" name={yCol} {...axisStyle} axisLine={false} />
          <Tooltip contentStyle={S.tooltipStyle} cursor={{ strokeDasharray:'3 3' }} />
          <Scatter data={data} fill={color} opacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'pie') {
    if (!yCol) return <EmptyState msg="Select Value →" />;
    const data = useMemo(() => pieSlices(rows, xCol, yCol, aggFn), [rows, xCol, yCol, aggFn]);
    if (!data.length) return <EmptyState msg="No data" />;
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="47%" outerRadius="68%"
            dataKey="value" nameKey="name"
            label={({ name, percent }) => percent > 0.04 ? name.slice(0,12) + ' ' + (percent*100).toFixed(0)+'%' : ''}
            labelLine={false} fontSize={10}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={S.tooltipStyle} />
          <Legend wrapperStyle={{ fontSize:10, color:'#9ca3af' }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // Bar / Line / Area — support multi-series via colorCol
  if (!yCol) return <EmptyState msg="Select Y-Axis →" />;
  const { data, series } = useMemo(
    () => multiSeriesData(rows, xCol, yCol, colorCol, aggFn),
    [rows, xCol, yCol, colorCol, aggFn]
  );
  if (!data.length) return <EmptyState msg="No data" />;

  const commonProps = { data, margin:{ top:5, right:10, left:-10, bottom:5 } };
  const xAxisProps = { dataKey: xCol, ...axisStyle };

  if (type === 'bar') return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart {...commonProps}>
        <CartesianGrid {...gridStyle} />
        <XAxis {...xAxisProps} />
        <YAxis {...axisStyle} axisLine={false} />
        <Tooltip contentStyle={S.tooltipStyle} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize:10, color:'#9ca3af' }} />}
        {series.map((s, i) => <Bar key={s} dataKey={s} fill={COLORS[i % COLORS.length]} radius={[3,3,0,0]} />)}
      </BarChart>
    </ResponsiveContainer>
  );

  if (type === 'line') return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart {...commonProps}>
        <CartesianGrid {...gridStyle} />
        <XAxis {...xAxisProps} />
        <YAxis {...axisStyle} axisLine={false} />
        <Tooltip contentStyle={S.tooltipStyle} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize:10, color:'#9ca3af' }} />}
        {series.map((s, i) => <Line key={s} type="monotone" dataKey={s} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />)}
      </LineChart>
    </ResponsiveContainer>
  );

  if (type === 'area') return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart {...commonProps}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s} id={`ag_${s}_${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0}/>
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...gridStyle} />
        <XAxis {...xAxisProps} />
        <YAxis {...axisStyle} axisLine={false} />
        <Tooltip contentStyle={S.tooltipStyle} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize:10, color:'#9ca3af' }} />}
        {series.map((s, i) => (
          <Area key={s} type="monotone" dataKey={s} stroke={COLORS[i % COLORS.length]} strokeWidth={2} fill={`url(#ag_${s}_${i})`} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );

  return null;
}

// ─── Card Config Panel ───────────────────────────────────────────────────────

function FieldWells({ cfg, onUpdate, allCols, numCols, catCols }) {
  const { type, xCol, yCol, colorCol, rowsCol, colsCol, valuesCol, tableCols, aggFn, sortCol, sortDir } = cfg;

  const sel = (label, key, options, extra = '') => (
    <div style={{ marginBottom:8 }}>
      <label style={S.label}>{label}{extra && <span style={{ color:'#4b5563', marginLeft:4 }}>({extra})</span>}</label>
      <select value={cfg[key] || ''} onChange={e => onUpdate({ [key]: e.target.value })} style={S.select}>
        <option value="">— select —</option>
        {options.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );

  if (type === 'kpi') return (
    <div>
      {sel('Value column', 'valuesCol', numCols, 'numeric')}
      {sel('Aggregation', 'aggFn', AGG_OPTIONS.map(a => a.id))}
    </div>
  );

  if (type === 'matrix') return (
    <div>
      {sel('Rows', 'rowsCol', allCols)}
      {sel('Columns', 'colsCol', allCols, 'optional')}
      {sel('Values', 'valuesCol', numCols, 'numeric')}
      {sel('Aggregation', 'aggFn', AGG_OPTIONS.map(a => a.id))}
    </div>
  );

  if (type === 'table') {
    const toggleCol = col => {
      const cur = tableCols || [];
      onUpdate({ tableCols: cur.includes(col) ? cur.filter(c => c !== col) : [...cur, col] });
    };
    return (
      <div>
        <label style={S.label}>Visible columns <span style={{ color:'#4b5563' }}>(click to toggle)</span></label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
          {allCols.map(col => {
            const on = !tableCols?.length || tableCols.includes(col);
            return (
              <span key={col} onClick={() => toggleCol(col)} style={{ padding:'2px 8px', borderRadius:4, fontSize:10, cursor:'pointer', background: on ? 'rgba(16,185,129,0.15)' : 'rgba(30,37,53,0.8)', border:`1px solid ${on ? 'rgba(16,185,129,0.4)' : '#252d40'}`, color: on ? '#6ee7b7' : '#4b5563' }}>
                {col}
              </span>
            );
          })}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:6 }}>
          <div>
            <label style={S.label}>Sort by</label>
            <select value={sortCol || ''} onChange={e => onUpdate({ sortCol: e.target.value })} style={S.select}>
              <option value="">— none —</option>
              {allCols.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Direction</label>
            <select value={sortDir || 'asc'} onChange={e => onUpdate({ sortDir: e.target.value })} style={S.select}>
              <option value="asc">ASC ↑</option>
              <option value="desc">DESC ↓</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'scatter') return (
    <div>
      {sel('X-Axis', 'xCol', numCols, 'numeric')}
      {sel('Y-Axis', 'yCol', numCols, 'numeric')}
    </div>
  );

  if (type === 'pie') return (
    <div>
      {sel('Label', 'xCol', allCols)}
      {sel('Value', 'yCol', numCols, 'numeric')}
      {sel('Aggregation', 'aggFn', AGG_OPTIONS.map(a => a.id))}
    </div>
  );

  // bar, line, area
  return (
    <div>
      {sel('X-Axis', 'xCol', allCols)}
      {sel('Y-Axis', 'yCol', numCols, 'numeric')}
      {sel('Legend / Color by', 'colorCol', allCols, 'optional')}
      {sel('Aggregation', 'aggFn', AGG_OPTIONS.map(a => a.id))}
    </div>
  );
}

function FiltersPanel({ filters, onUpdate, allCols }) {
  const add = () => onUpdate([...filters, { id: _filterId++, col: '', op: 'eq', val: '' }]);
  const remove = id => onUpdate(filters.filter(f => f.id !== id));
  const patch = (id, patch) => onUpdate(filters.map(f => f.id === id ? { ...f, ...patch } : f));
  const needsVal = op => !['notnull','isnull'].includes(op);

  return (
    <div>
      {filters.map(f => (
        <div key={f.id} style={{ display:'flex', gap:4, marginBottom:5, alignItems:'center' }}>
          <select value={f.col} onChange={e => patch(f.id, { col: e.target.value })} style={{ ...S.select, flex:2 }}>
            <option value="">Col</option>
            {allCols.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={f.op} onChange={e => patch(f.id, { op: e.target.value })} style={{ ...S.select, flex:1, minWidth:60 }}>
            {FILTER_OPS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          {needsVal(f.op) && (
            <input value={f.val} onChange={e => patch(f.id, { val: e.target.value })} placeholder="value" style={{ ...S.input, flex:2 }} />
          )}
          <button onClick={() => remove(f.id)} style={S.btnRed}>✕</button>
        </div>
      ))}
      <button onClick={add} style={{ ...S.btnSm, fontSize:10 }}>+ Add filter</button>
    </div>
  );
}

// ─── Visual Card ─────────────────────────────────────────────────────────────

function VisualCard({ chart, idx, allCols, numCols, catCols, baseRows, onUpdate, onRemove }) {
  const [tab, setTab] = useState('fields'); // 'fields' | 'filter' | 'style'
  const vtype = VISUAL_TYPES.find(t => t.id === chart.type) || VISUAL_TYPES[0];

  const filteredRows = useMemo(
    () => applyFilters(baseRows, chart.filters),
    [baseRows, chart.filters]
  );

  const isChart = ['bar','line','area','scatter','pie'].includes(chart.type);
  const previewH = chart.type === 'kpi' ? 140 : chart.type === 'table' ? 280 : chart.type === 'matrix' ? 240 : 240;

  return (
    <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ padding:'9px 12px', borderBottom:'1px solid #252d40', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:14 }}>{vtype.icon}</span>
        {chart.editing ? (
          <input value={chart.title} onChange={e => onUpdate({ title: e.target.value })}
            style={{ ...S.input, flex:1, fontSize:12, fontWeight:600 }} />
        ) : (
          <span style={{ fontSize:12, fontWeight:600, color:'#e5e7eb', flex:1 }}>{chart.title || 'Untitled'}</span>
        )}
        <button onClick={() => onUpdate({ editing: !chart.editing })} title="Configure"
          style={{ ...S.btnRed, color: chart.editing ? '#6ee7b7' : '#6b7280', fontSize:14 }}>⚙</button>
        <button onClick={onRemove} title="Remove" style={{ ...S.btnRed, fontSize:14 }}>✕</button>
      </div>

      {/* Config panel */}
      {chart.editing && (
        <div style={{ background:'#111827', borderBottom:'1px solid #252d40' }}>
          {/* Visual type selector */}
          <div style={{ display:'flex', gap:2, padding:'8px 12px 0', flexWrap:'wrap' }}>
            {VISUAL_TYPES.map(vt => (
              <button key={vt.id} onClick={() => onUpdate({ type: vt.id })}
                style={{ padding:'4px 8px', borderRadius:5, border:'none', cursor:'pointer', fontSize:11,
                  background: chart.type === vt.id ? 'rgba(16,185,129,0.2)' : 'transparent',
                  color: chart.type === vt.id ? '#6ee7b7' : '#6b7280' }}>
                {vt.icon} {vt.label}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:0, padding:'8px 12px 0' }}>
            {['fields','filter','style'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding:'4px 10px', border:'none', cursor:'pointer', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:0.8, background:'transparent', color: tab === t ? '#6ee7b7' : '#4b5563', borderBottom: tab === t ? '2px solid #10b981' : '2px solid transparent' }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ padding:'10px 12px' }}>
            {tab === 'fields' && (
              <FieldWells cfg={chart} onUpdate={onUpdate} allCols={allCols} numCols={numCols} catCols={catCols} />
            )}
            {tab === 'filter' && (
              <FiltersPanel filters={chart.filters} onUpdate={filters => onUpdate({ filters })} allCols={allCols} />
            )}
            {tab === 'style' && (
              <div>
                <label style={S.label}>Card title</label>
                <input value={chart.title} onChange={e => onUpdate({ title: e.target.value })} style={S.input} placeholder="Visual title..." />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      <div style={{ height: previewH, padding: chart.type === 'table' || chart.type === 'matrix' ? '4px 0 0' : '8px 4px', overflow:'hidden' }}>
        {isChart
          ? <ChartVisual rows={filteredRows} cfg={chart} index={idx} />
          : chart.type === 'kpi'
          ? <KpiVisual rows={filteredRows} cfg={chart} />
          : chart.type === 'table'
          ? <TableVisual rows={filteredRows} cfg={chart} allCols={allCols} />
          : <MatrixVisual rows={filteredRows} cfg={chart} />
        }
      </div>

      {/* Footer: row count */}
      <div style={{ padding:'4px 12px', borderTop:'1px solid #1a2030', fontSize:9, color:'#374151' }}>
        {filteredRows.length.toLocaleString()} row{filteredRows.length !== 1 ? 's' : ''} {chart.filters?.length ? `(${chart.filters.length} filter${chart.filters.length>1?'s':''})` : ''}
      </div>
    </div>
  );
}

// ─── Sidebar: Calculated Fields ───────────────────────────────────────────────

function CalcFieldsPanel({ calcFields, setCalcFields, columns }) {
  const [name, setName] = useState('');
  const [expr, setExpr] = useState('');
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const save = () => {
    const error = validateCalcExpr(name.trim(), expr.trim(), columns);
    if (error) { setErr(error); return; }
    if (editId !== null) {
      setCalcFields(fs => fs.map(f => f.id === editId ? { ...f, name: name.trim(), expr: expr.trim(), error: null } : f));
      setEditId(null);
    } else {
      setCalcFields(fs => [...fs, { id: _calcId++, name: name.trim(), expr: expr.trim(), error: null }]);
    }
    setName(''); setExpr(''); setErr('');
  };

  const startEdit = f => { setName(f.name); setExpr(f.expr); setEditId(f.id); setErr(''); setOpen(true); };
  const remove = id => setCalcFields(fs => fs.filter(f => f.id !== id));
  const cancel = () => { setName(''); setExpr(''); setErr(''); setEditId(null); };

  return (
    <div style={{ borderTop:'1px solid rgba(16,185,129,0.1)', paddingTop:10, marginTop:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', marginBottom:6 }} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize:10, color:'#6b7280', textTransform:'uppercase', letterSpacing:1, fontWeight:600 }}>𝒇 Calculated Fields</span>
        <span style={{ marginLeft:'auto', color:'#4b5563', fontSize:10 }}>{open ? '▲' : '▼'}</span>
        <span style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:3, fontSize:9, color:'#6ee7b7', padding:'1px 5px' }}>{calcFields.length}</span>
      </div>

      {/* Existing fields */}
      {calcFields.map(f => (
        <div key={f.id} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 6px', marginBottom:2, background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.1)', borderRadius:5 }}>
          <span style={{ fontSize:10, color:'#6ee7b7', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={`${f.name} = ${f.expr}`}>
            <strong>{f.name}</strong> = <span style={{ color:'#9ca3af' }}>{f.expr}</span>
          </span>
          <button onClick={() => startEdit(f)} style={{ ...S.btnRed, color:'#6b7280', fontSize:11 }}>✎</button>
          <button onClick={() => remove(f.id)} style={{ ...S.btnRed, fontSize:11 }}>✕</button>
        </div>
      ))}

      {open && (
        <div style={{ marginTop:6 }}>
          <div style={{ marginBottom:5 }}>
            <label style={S.label}>Field name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Profit" style={S.input} />
          </div>
          <div style={{ marginBottom:5 }}>
            <label style={S.label}>Expression</label>
            <input value={expr} onChange={e => { setExpr(e.target.value); setErr(''); }} placeholder="e.g. Salary - Bonus" style={S.input} />
          </div>
          <div style={{ fontSize:9, color:'#374151', marginBottom:5, lineHeight:1.5 }}>
            Use column names directly. Supports: +, -, *, /, (), SUM(col), AVG(col), COUNT(col), MIN(col), MAX(col). Use backticks for names with spaces: <code style={{ color:'#6b7280' }}>`Col Name`</code>
          </div>
          {err && <div style={{ fontSize:10, color:'#f87171', marginBottom:5, lineHeight:1.4 }}>{err}</div>}
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={save} style={S.btnGreen}>{editId !== null ? 'Update' : 'Add Field'}</button>
            {editId !== null && <button onClick={cancel} style={S.btnSm}>Cancel</button>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar: Global Filters ──────────────────────────────────────────────────

function GlobalFiltersPanel({ filters, setFilters, columns }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop:'1px solid rgba(16,185,129,0.1)', paddingTop:10, marginTop:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', marginBottom:6 }} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize:10, color:'#6b7280', textTransform:'uppercase', letterSpacing:1, fontWeight:600 }}>⚙ Global Filters</span>
        <span style={{ marginLeft:'auto', color:'#4b5563', fontSize:10 }}>{open ? '▲' : '▼'}</span>
        {filters.length > 0 && <span style={{ background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:3, fontSize:9, color:'#fbbf24', padding:'1px 5px' }}>{filters.length}</span>}
      </div>
      {open && (
        <FiltersPanel filters={filters} onUpdate={setFilters} allCols={columns} />
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

function autoSuggestCharts(numeric, categorical) {
  const suggestions = [];
  if (categorical.length > 0 && numeric.length > 0) {
    suggestions.push({
      id: _cardId++, title: `${categorical[0]} by ${numeric[0]}`,
      type: 'bar', xCol: categorical[0], yCol: numeric[0], colorCol: '',
      rowsCol: '', colsCol: '', valuesCol: numeric[0],
      tableCols: [], aggFn: 'sum', sortCol: '', sortDir: 'asc', filters: [], editing: false,
    });
  }
  if (numeric.length >= 2) {
    suggestions.push({
      id: _cardId++, title: `${numeric[0]} vs ${numeric[1]}`,
      type: 'scatter', xCol: numeric[0], yCol: numeric[1], colorCol: '',
      rowsCol: '', colsCol: '', valuesCol: '',
      tableCols: [], aggFn: 'mean', sortCol: '', sortDir: 'asc', filters: [], editing: false,
    });
  }
  if (numeric.length > 0) {
    suggestions.push({
      id: _cardId++, title: `Avg ${numeric[0]}`,
      type: 'kpi', xCol: '', yCol: '', colorCol: '',
      rowsCol: '', colsCol: '', valuesCol: numeric[0],
      tableCols: [], aggFn: 'mean', sortCol: '', sortDir: 'asc', filters: [], editing: false,
    });
  }
  if (categorical.length > 0 && numeric.length > 0) {
    suggestions.push({
      id: _cardId++, title: `${numeric[0]} distribution`,
      type: 'line', xCol: categorical[0], yCol: numeric[0], colorCol: '',
      rowsCol: '', colsCol: '', valuesCol: numeric[0],
      tableCols: [], aggFn: 'count', sortCol: '', sortDir: 'asc', filters: [], editing: false,
    });
  }
  return suggestions;
}

export default function VisualizerApp() {
  const { handoff, clearHandoff } = useDataLabStore();
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [numericCols, setNumericCols] = useState([]);
  const [catCols, setCatCols] = useState([]);
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [charts, setCharts] = useState([]);
  const [calcFields, setCalcFields] = useState([]);
  const [globalFilters, setGlobalFilters] = useState([]);
  const [cleaningSummary, setCleaningSummary] = useState(null);
  const [fromDebugger, setFromDebugger] = useState(false);

  // Apply calculated fields + global filters to produce base rows for all visuals
  const enrichedRows = useMemo(() => {
    let r = rows;
    for (const cf of calcFields.filter(f => !f.error)) {
      r = applyCalcField(r, cf.name, cf.expr, columns);
    }
    return applyFilters(r, globalFilters);
  }, [rows, calcFields, globalFilters, columns]);

  // All available columns (original + calculated fields)
  const allCols = useMemo(
    () => [...columns, ...calcFields.filter(f => !f.error).map(f => f.name)],
    [columns, calcFields]
  );
  const allNumCols = useMemo(
    () => {
      const calcNumNames = calcFields.filter(f => !f.error).map(f => f.name);
      return [...numericCols, ...calcNumNames];
    },
    [numericCols, calcFields]
  );

  // Auto-load cleaned data handed off from the Debugger
  useEffect(() => {
    if (handoff?.origin === 'debugger' && handoff?.cleanedCsv) {
      const { headers, rows: parsed } = parseCSV(handoff.cleanedCsv);
      const { numeric, categorical } = detectTypes(headers, parsed);
      setFileName(handoff.datasetName || 'cleaned_data.csv');
      setColumns(headers);
      setRows(parsed);
      setNumericCols(numeric);
      setCatCols(categorical);
      setCalcFields([]);
      setGlobalFilters([]);
      setCharts(autoSuggestCharts(numeric, categorical));
      setCleaningSummary(handoff.cleaningSummary || null);
      setFromDebugger(true);
      clearHandoff();
    }
  }, []); // intentional: run once on mount to consume handoff

  const handleFile = useCallback((file) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.tsv')) {
      alert('Please upload a CSV file.');
      return;
    }
    setFileName(file.name);
    setFromDebugger(false);
    setCleaningSummary(null);
    const reader = new FileReader();
    reader.onload = e => {
      const { headers, rows: parsed } = parseCSV(e.target.result);
      const { numeric, categorical } = detectTypes(headers, parsed);
      setColumns(headers);
      setRows(parsed);
      setNumericCols(numeric);
      setCatCols(categorical);
      setCalcFields([]);
      setGlobalFilters([]);
      setCharts([]);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = e => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const addChart = (type = 'bar') => {
    const xGuess = catCols[0] || columns[0] || '';
    const yGuess = numericCols[0] || columns[1] || '';
    setCharts(cs => [...cs, {
      id: _cardId++, title: `${VISUAL_TYPES.find(t => t.id === type)?.label || 'Visual'} ${_cardId - 1}`,
      type, xCol: xGuess, yCol: yGuess, colorCol: '', rowsCol: '', colsCol: '', valuesCol: yGuess,
      tableCols: [], aggFn: 'sum', sortCol: '', sortDir: 'asc', filters: [], editing: true,
    }]);
  };

  const updateChart = (id, patch) => setCharts(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c));
  const removeChart = id => setCharts(cs => cs.filter(c => c.id !== id));

  const resetAll = () => { setCharts([]); setCalcFields([]); setGlobalFilters([]); };

  return (
    <div style={{ display:'flex', height:'calc(100vh - 52px)', background:'var(--page-bg)', color:'var(--page-text)', fontFamily:"'Syne',sans-serif", overflow:'hidden' }}>

      {/* ── Sidebar ── */}
      <div style={{ width:268, flexShrink:0, borderRight:'1px solid rgba(16,185,129,0.2)', background:'var(--card-bg)', display:'flex', flexDirection:'column', overflowY:'auto' }}>
        <div style={{ padding:14, borderBottom:'1px solid rgba(16,185,129,0.1)' }}>
          <h2 style={{ margin:'0 0 12px', fontSize:13, fontWeight:700, color:'#6ee7b7', letterSpacing:0.5 }}>📊 Data Visualizer</h2>

          {/* Upload */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('viz-file-input').click()}
            style={{ border:`2px dashed ${dragOver ? '#10b981' : 'rgba(16,185,129,0.3)'}`, borderRadius:10, padding:12, display:'flex', flexDirection:'column', alignItems:'center', gap:5, cursor:'pointer', background: dragOver ? 'rgba(16,185,129,0.07)' : 'transparent', transition:'all 0.2s' }}>
            <span style={{ fontSize:20 }}>📂</span>
            <span style={{ fontSize:10, color:'#6b7280', textAlign:'center' }}>Drop CSV or click to upload</span>
            <input id="viz-file-input" type="file" accept=".csv" style={{ display:'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          </div>
          {fileName && <p style={{ margin:'7px 0 0', fontSize:10, color:'#6ee7b7', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>📄 {fileName}</p>}
          {rows.length > 0 && <p style={{ margin:'3px 0 0', fontSize:10, color:'#4b5563', fontFamily:'monospace' }}>{rows.length.toLocaleString()} rows · {columns.length} cols</p>}
        </div>

        {/* Column browser */}
        {columns.length > 0 && (
          <div style={{ padding:'10px 14px', flex:1 }}>
            <p style={{ margin:'0 0 6px', fontSize:10, color:'#4b5563', textTransform:'uppercase', letterSpacing:1, fontWeight:600 }}>Columns</p>
            {allCols.map(col => {
              const isNum = allNumCols.includes(col);
              const isCalc = calcFields.some(f => f.name === col);
              return (
                <div key={col} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 7px', borderRadius:5, marginBottom:2, background:'rgba(16,185,129,0.04)', border:`1px solid ${isCalc ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.08)'}` }}>
                  <span style={{ fontSize:9, width:24, textAlign:'center', padding:'1px 3px', background: isCalc ? 'rgba(245,158,11,0.15)' : isNum ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)', borderRadius:3, color: isCalc ? '#fbbf24' : isNum ? '#6ee7b7' : '#c4b5fd', fontFamily:'monospace' }}>
                    {isCalc ? '𝒇' : isNum ? '123' : 'Aa'}
                  </span>
                  <span style={{ fontSize:10, color:'#d1d5db', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{col}</span>
                </div>
              );
            })}

            {/* Calculated fields panel */}
            <CalcFieldsPanel calcFields={calcFields} setCalcFields={setCalcFields} columns={allCols} />

            {/* Global filters panel */}
            <GlobalFiltersPanel filters={globalFilters} setFilters={setGlobalFilters} columns={allCols} />
          </div>
        )}
      </div>

      {/* ── Main Canvas ── */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>

        {/* Debugger handoff banner */}
        {fromDebugger && cleaningSummary && (
          <div style={{ margin:'16px 20px 0', padding:'10px 16px', background:'rgba(5,150,105,0.08)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:10, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', flexShrink:0 }}>
            <span style={{ fontSize:16 }}>🧹</span>
            <span style={{ fontSize:12, color:'#6ee7b7', fontWeight:600 }}>Loaded from Debugger</span>
            <span style={{ fontSize:11, color:'#4b5563', fontFamily:'monospace' }}>{fileName}</span>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginLeft:8 }}>
              {[['Rows before', cleaningSummary.rows_before], ['Rows after', cleaningSummary.rows_after], ['Cells changed', cleaningSummary.total_cells_changed]].map(([label, val]) => val != null ? (
                <span key={label} style={{ fontSize:11, color:'#9ca3af' }}>
                  <span style={{ color:'#6b7280' }}>{label}: </span>
                  <span style={{ color:'#e5e7eb', fontFamily:'monospace' }}>{String(val)}</span>
                </span>
              ) : null)}
            </div>
            <span style={{ marginLeft:'auto', fontSize:10, color:'#4ade80', fontFamily:'monospace' }}>✓ {charts.length} charts auto-suggested</span>
            <button onClick={() => setFromDebugger(false)} style={{ background:'none', border:'none', color:'#4b5563', cursor:'pointer', fontSize:16, padding:'0 2px', lineHeight:1 }}>✕</button>
          </div>
        )}

        {/* Empty state */}
        {rows.length === 0 && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:14, color:'#4b5563', padding:24 }}>
            <div style={{ fontSize:56 }}>📊</div>
            <p style={{ fontSize:16, color:'#6b7280', margin:0 }}>Upload a CSV to start building visuals</p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
              {VISUAL_TYPES.map(t => (
                <span key={t.id} style={{ padding:'4px 12px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:20, fontSize:11, color:'#6ee7b7' }}>{t.icon} {t.label}</span>
              ))}
            </div>
            <p style={{ fontSize:12, color:'#374151', textAlign:'center', maxWidth:400, margin:0, lineHeight:1.6 }}>
              Bar · Line · Area · Scatter · Pie charts, sortable Tables, Pivot Matrix, KPI cards, Calculated Fields, Filters &amp; Aggregations.
            </p>
          </div>
        )}

        {/* Toolbar */}
        {rows.length > 0 && (
          <div style={{ padding:'12px 20px 8px', display:'flex', alignItems:'center', gap:10, flexShrink:0, borderBottom:'1px solid #1a2030', flexWrap:'wrap' }}>
            <span style={{ fontSize:12, color:'#6b7280' }}>{charts.length} visual{charts.length !== 1 ? 's' : ''} · {enrichedRows.length.toLocaleString()} rows{globalFilters.length ? ` (${globalFilters.length} global filter${globalFilters.length>1?'s':''})` : ''}</span>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {VISUAL_TYPES.map(t => (
                <button key={t.id} onClick={() => addChart(t.id)} style={{ padding:'5px 10px', borderRadius:7, border:'1px solid rgba(16,185,129,0.25)', background:'rgba(16,185,129,0.06)', color:'#6ee7b7', fontSize:11, cursor:'pointer', fontFamily:"'Syne',sans-serif" }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            {charts.length > 0 && (
              <button onClick={resetAll} style={{ ...S.btnSm, marginLeft:'auto' }}>↺ Reset all</button>
            )}
          </div>
        )}

        {/* Cards grid */}
        {rows.length > 0 && charts.length === 0 && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, gap:10, color:'#374151', padding:24 }}>
            <div style={{ fontSize:36 }}>➕</div>
            <p style={{ fontSize:13, color:'#4b5563', margin:0 }}>Click a visual type above to add your first chart</p>
          </div>
        )}

        {charts.length > 0 && (
          <div style={{ padding:16, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(480px, 1fr))', gap:14, alignItems:'start' }}>
            {charts.map((chart, idx) => (
              <VisualCard
                key={chart.id}
                chart={chart}
                idx={idx}
                allCols={allCols}
                numCols={allNumCols}
                catCols={catCols}
                baseRows={enrichedRows}
                onUpdate={patch => updateChart(chart.id, patch)}
                onRemove={() => removeChart(chart.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
