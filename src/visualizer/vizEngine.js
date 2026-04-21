/**
 * vizEngine.js — Pure data-transformation layer for the Visualizer.
 * No React imports, no side effects. All functions are pure.
 */

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function _splitCSVLine(line) {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { q = !q; continue; }
    if (c === ',' && !q) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out;
}

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = _splitCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = _splitCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      const v = (vals[i] ?? '').trim().replace(/^"|"$/g, '');
      if (v === '' || v === 'null' || v === 'NULL' || v === 'NA' || v === 'N/A') {
        obj[h] = null;
      } else if (!isNaN(v) && v !== '') {
        obj[h] = Number(v);
      } else {
        obj[h] = v;
      }
    });
    return obj;
  });
  return { headers, rows };
}

// ─── Column Type Detection ────────────────────────────────────────────────────

export function detectTypes(headers, rows) {
  const sample = rows.slice(0, 100);
  const numeric = [], categorical = [];
  for (const h of headers) {
    const vals = sample.map(r => r[h]).filter(v => v !== null && v !== undefined);
    const numCount = vals.filter(v => typeof v === 'number').length;
    if (vals.length > 0 && numCount / vals.length > 0.6) numeric.push(h);
    else categorical.push(h);
  }
  return { numeric, categorical };
}

// ─── Aggregation helpers ──────────────────────────────────────────────────────

export const AGG_OPTIONS = [
  { id: 'sum',    label: 'Sum' },
  { id: 'avg',    label: 'Average' },
  { id: 'count',  label: 'Count' },
  { id: 'min',    label: 'Min' },
  { id: 'max',    label: 'Max' },
  { id: 'median', label: 'Median' },
];

function _agg(vals, fn) {
  if (!vals.length) return 0;
  switch (fn) {
    case 'avg':    return vals.reduce((a, b) => a + b, 0) / vals.length;
    case 'count':  return vals.length;
    case 'min':    return Math.min(...vals);
    case 'max':    return Math.max(...vals);
    case 'median': {
      const s = [...vals].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    }
    default:       return vals.reduce((a, b) => a + b, 0); // sum
  }
}

// ─── Single-series aggregation ────────────────────────────────────────────────

export function aggregateRows(rows, groupCol, valueCol, aggFn = 'sum') {
  if (!groupCol) return [];
  const groups = new Map();
  for (const row of rows) {
    const k = row[groupCol] === null ? '(empty)' : String(row[groupCol]);
    if (!groups.has(k)) groups.set(k, { count: 0, vals: [] });
    const e = groups.get(k);
    e.count++;
    if (typeof row[valueCol] === 'number') e.vals.push(row[valueCol]);
  }
  return [...groups.entries()].map(([k, e]) => ({
    [groupCol]: k,
    [valueCol]: aggFn === 'count' ? e.count : _agg(e.vals, aggFn),
  }));
}

// ─── Multi-series aggregation (for legend/color grouping) ────────────────────

export function multiSeriesData(rows, xCol, yCol, colorCol, aggFn = 'sum') {
  if (!colorCol) {
    return { data: aggregateRows(rows, xCol, yCol, aggFn), series: [yCol] };
  }
  const seriesKeys = [...new Set(rows.map(r => r[colorCol] === null ? '(empty)' : String(r[colorCol])))];
  const groups = new Map();
  for (const row of rows) {
    const xk = row[xCol] === null ? '(empty)' : String(row[xCol]);
    const ck = row[colorCol] === null ? '(empty)' : String(row[colorCol]);
    if (!groups.has(xk)) {
      const e = { [xCol]: xk };
      seriesKeys.forEach(sk => { e[`_vals_${sk}`] = []; e[`_cnt_${sk}`] = 0; });
      groups.set(xk, e);
    }
    const e = groups.get(xk);
    e[`_cnt_${ck}`]++;
    if (typeof row[yCol] === 'number') e[`_vals_${ck}`].push(row[yCol]);
  }
  const data = [...groups.values()].map(e => {
    const out = { [xCol]: e[xCol] };
    seriesKeys.forEach(sk => {
      out[sk] = aggFn === 'count' ? e[`_cnt_${sk}`] : _agg(e[`_vals_${sk}`], aggFn);
    });
    return out;
  });
  return { data, series: seriesKeys };
}

// ─── Scatter points ───────────────────────────────────────────────────────────

export function scatterPoints(rows, xCol, yCol, limit = 500) {
  return rows.slice(0, limit)
    .filter(r => typeof r[xCol] === 'number' && typeof r[yCol] === 'number')
    .map(r => ({ x: r[xCol], y: r[yCol] }));
}

// ─── Pie slices ───────────────────────────────────────────────────────────────

export function pieSlices(rows, labelCol, valueCol, aggFn = 'sum', limit = 12) {
  const agg = aggregateRows(rows, labelCol, valueCol, aggFn);
  return agg
    .sort((a, b) => Math.abs(b[valueCol]) - Math.abs(a[valueCol]))
    .slice(0, limit)
    .map(r => ({ name: r[labelCol], value: Math.abs(r[valueCol]) }));
}

// ─── Pivot / Matrix table ─────────────────────────────────────────────────────

export function buildPivot(rows, rowCol, colCol, valueCol, aggFn = 'sum') {
  if (!rowCol || !valueCol) {
    return { rowHeaders: [], colHeaders: ['Value'], cells: {}, rowTotals: {}, colTotals: {}, grandTotal: 0 };
  }
  const rowKeys = [...new Set(rows.map(r => r[rowCol] === null ? '(empty)' : String(r[rowCol])))];
  const colKeys = colCol
    ? [...new Set(rows.map(r => r[colCol] === null ? '(empty)' : String(r[colCol])))]
    : ['Value'];

  const cells = {};
  const rowTotals = {};
  const colTotals = {};

  for (const rk of rowKeys) {
    cells[rk] = {};
    for (const ck of colKeys) {
      const subset = colCol
        ? rows.filter(r => String(r[rowCol] ?? '(empty)') === rk && String(r[colCol] ?? '(empty)') === ck)
        : rows.filter(r => String(r[rowCol] ?? '(empty)') === rk);
      const vals = subset.map(r => r[valueCol]).filter(v => typeof v === 'number');
      cells[rk][ck] = aggFn === 'count' ? subset.length : (vals.length ? _agg(vals, aggFn) : null);
    }
    const rowVals = colKeys.map(ck => cells[rk][ck]).filter(v => typeof v === 'number');
    rowTotals[rk] = rowVals.length ? _agg(rowVals, aggFn === 'count' ? 'sum' : aggFn) : null;
  }
  for (const ck of colKeys) {
    const cv = rowKeys.map(rk => cells[rk][ck]).filter(v => typeof v === 'number');
    colTotals[ck] = cv.length ? _agg(cv, aggFn === 'count' ? 'sum' : aggFn) : null;
  }
  const allVals = rowKeys.flatMap(rk => colKeys.map(ck => cells[rk][ck])).filter(v => typeof v === 'number');
  const grandTotal = allVals.length ? _agg(allVals, aggFn === 'count' ? 'sum' : aggFn) : 0;

  return { rowHeaders: rowKeys, colHeaders: colKeys, cells, rowTotals, colTotals, grandTotal };
}

// ─── KPI ──────────────────────────────────────────────────────────────────────

export function computeKPI(rows, col, aggFn = 'sum') {
  const vals = rows.map(r => r[col]).filter(v => typeof v === 'number');
  if (!vals.length) return { value: null, formatted: '—' };
  const value = _agg(vals, aggFn);
  let formatted;
  if (Math.abs(value) >= 1_000_000)     formatted = (value / 1_000_000).toFixed(2) + 'M';
  else if (Math.abs(value) >= 1_000)    formatted = (value / 1_000).toFixed(1) + 'K';
  else if (!Number.isInteger(value))    formatted = value.toFixed(2);
  else                                  formatted = value.toLocaleString();
  return { value, formatted };
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export function applyFilters(rows, filters) {
  if (!filters?.length) return rows;
  return rows.filter(row => filters.every(f => {
    if (!f.col || !f.op) return true;
    const v = row[f.col];
    const fv = f.val;
    switch (f.op) {
      case 'eq':       return String(v ?? '') === String(fv);
      case 'ne':       return String(v ?? '') !== String(fv);
      case 'gt':       return Number(v) > Number(fv);
      case 'lt':       return Number(v) < Number(fv);
      case 'gte':      return Number(v) >= Number(fv);
      case 'lte':      return Number(v) <= Number(fv);
      case 'contains': return String(v ?? '').toLowerCase().includes(String(fv).toLowerCase());
      case 'notnull':  return v !== null && v !== undefined && v !== '';
      case 'isnull':   return v === null || v === undefined || v === '';
      default:         return true;
    }
  }));
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

export function sortRows(rows, col, dir = 'asc') {
  if (!col) return rows;
  return [...rows].sort((a, b) => {
    const av = a[col], bv = b[col];
    if (av === null) return 1; if (bv === null) return -1;
    const cmp = typeof av === 'number' && typeof bv === 'number'
      ? av - bv : String(av).localeCompare(String(bv));
    return dir === 'desc' ? -cmp : cmp;
  });
}

// ─── Safe expression evaluator for calculated fields ─────────────────────────
// Supports: col references (exact or backtick-quoted), numbers, +,-,*,/,(),
//           SUM(col), AVG(col), AVERAGE(col), COUNT(col), MIN(col), MAX(col), MEDIAN(col)

function _tokenize(expr, colNames) {
  const tokens = [];
  let i = 0;
  const sorted = [...colNames].sort((a, b) => b.length - a.length); // longest first

  while (i < expr.length) {
    if (/\s/.test(expr[i])) { i++; continue; }
    if ('+-*/()'.includes(expr[i])) { tokens.push({ t: expr[i] }); i++; continue; }
    if (/\d/.test(expr[i])) {
      let n = '';
      while (i < expr.length && /[\d.]/.test(expr[i])) n += expr[i++];
      tokens.push({ t: 'N', v: parseFloat(n) }); continue;
    }
    // Backtick-quoted column name
    if (expr[i] === '`') {
      let name = ''; i++;
      while (i < expr.length && expr[i] !== '`') name += expr[i++];
      i++; tokens.push({ t: 'ID', v: name.trim() }); continue;
    }
    if (/[A-Za-z_]/.test(expr[i])) {
      const rest = expr.slice(i);
      // Try to match a column name (longest first, case-insensitive)
      let matched = false;
      for (const col of sorted) {
        if (rest.toLowerCase().startsWith(col.toLowerCase())) {
          const after = rest[col.length];
          if (!after || /[+\-*/() \t\r\n]/.test(after)) {
            tokens.push({ t: 'ID', v: col });
            i += col.length; matched = true; break;
          }
        }
      }
      if (!matched) {
        // Plain word (function name or unknown identifier)
        let w = '';
        while (i < expr.length && /[A-Za-z0-9_]/.test(expr[i])) w += expr[i++];
        tokens.push({ t: 'ID', v: w });
      }
      continue;
    }
    i++;
  }
  return tokens;
}

const _AGG_FNS = {
  SUM:     vals => vals.reduce((a, b) => a + b, 0),
  AVG:     vals => vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
  AVERAGE: vals => vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
  COUNT:   (vals, rows, col) => rows ? rows.filter(r => r[col] !== null && r[col] !== undefined).length : vals.length,
  MIN:     vals => Math.min(...vals),
  MAX:     vals => Math.max(...vals),
  MEDIAN:  vals => {
    if (!vals.length) return 0;
    const s = [...vals].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  },
};

function _makeEvaluator(tokens, row, rows, colNames) {
  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];
  const findCol = name => colNames.find(c => c.toLowerCase() === name.toLowerCase().trim());

  function parseExpr() {
    let left = parseTerm();
    while (peek() && (peek().t === '+' || peek().t === '-')) {
      const op = consume().t;
      const r = parseTerm();
      left = op === '+' ? left + r : left - r;
    }
    return left;
  }
  function parseTerm() {
    let left = parseFactor();
    while (peek() && (peek().t === '*' || peek().t === '/')) {
      const op = consume().t;
      const r = parseFactor();
      left = op === '*' ? left * r : (r !== 0 ? left / r : NaN);
    }
    return left;
  }
  function parseFactor() {
    const t = peek();
    if (!t) return 0;
    if (t.t === 'N') { consume(); return t.v; }
    if (t.t === '(') { consume(); const v = parseExpr(); if (peek()?.t === ')') consume(); return v; }
    if (t.t === '-') { consume(); return -parseFactor(); }
    if (t.t === 'ID') {
      const name = t.v;
      const upper = name.toUpperCase().trim();
      // Aggregate function call?
      if (_AGG_FNS[upper] && tokens[pos + 1]?.t === '(') {
        consume(); consume(); // fn name + (
        const argT = consume(); // column arg
        if (peek()?.t === ')') consume(); // )
        const col = findCol(argT?.v ?? '');
        if (!col || !rows) return 0;
        const vals = rows.map(r => r[col]).filter(v => typeof v === 'number');
        return _AGG_FNS[upper](vals, rows, col);
      }
      // Column reference
      consume();
      const col = findCol(name);
      if (col !== undefined) {
        if (row) {
          const val = row[col];
          return typeof val === 'number' ? val : 0;
        }
        if (rows) {
          const vals = rows.map(r => r[col]).filter(v => typeof v === 'number');
          return vals.reduce((a, b) => a + b, 0); // default SUM
        }
      }
      return 0;
    }
    consume(); return 0;
  }
  return parseExpr;
}

export function evalCalcField(expr, row, rows, colNames) {
  try {
    const tokens = _tokenize(expr, colNames);
    const parse = _makeEvaluator(tokens, row, rows, colNames);
    const result = parse();
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch { return null; }
}

export function applyCalcField(rows, name, expr, colNames) {
  const isAgg = /\b(SUM|AVG|AVERAGE|COUNT|MIN|MAX|MEDIAN)\s*\(/i.test(expr);
  if (isAgg) {
    const val = evalCalcField(expr, null, rows, colNames);
    return rows.map(r => ({ ...r, [name]: val }));
  }
  return rows.map(r => ({ ...r, [name]: evalCalcField(expr, r, rows, colNames) }));
}

export function validateCalcExpr(name, expr, colNames) {
  if (!name.trim()) return 'Field name is required';
  if (!/^[A-Za-z][A-Za-z0-9_ ]*$/.test(name.trim())) return 'Name must start with a letter and contain only letters, numbers, spaces, or underscores';
  if (!expr.trim()) return 'Expression is empty';
  const testRow = Object.fromEntries(colNames.map(c => [c, 1]));
  const result = evalCalcField(expr, testRow, [testRow], colNames);
  if (result === null) return 'Expression could not be evaluated — check column names and syntax. Use backticks for column names with spaces: `Column Name`';
  return null;
}

// ─── Format number ────────────────────────────────────────────────────────────

export function fmtNum(v, decimals = 1) {
  if (v === null || v === undefined) return '—';
  if (typeof v !== 'number') return String(v);
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(decimals) + 'M';
  if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(decimals) + 'K';
  if (!Number.isInteger(v))     return v.toFixed(2);
  return v.toLocaleString();
}
