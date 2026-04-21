import { useState, useEffect } from 'react';

const STEP_TYPES = [
  { value:'drop_missing', label:'Drop Missing', description:'Remove rows with null values' },
  { value:'fill_missing', label:'Fill Missing', description:'Replace nulls with a value or statistic' },
  { value:'rename_column', label:'Rename Column', description:'Rename one or more columns' },
  { value:'change_dtype', label:'Change Data Type', description:'Cast a column to a new type' },
  { value:'filter_rows', label:'Filter Rows', description:'Keep rows matching a condition' },
  { value:'select_columns', label:'Select Columns', description:'Keep only specified columns' },
  { value:'sort_values', label:'Sort Values', description:'Sort rows by one or more columns' },
  { value:'remove_duplicates', label:'Remove Duplicates', description:'Drop duplicate rows' },
  { value:'add_computed_column', label:'Add Computed Column', description:'Create a new column from existing ones' },
  { value:'join', label:'Join Dataset', description:'Merge with a second uploaded CSV' },
  { value:'group_aggregate', label:'Group & Aggregate', description:'GroupBy + aggregate functions' },
];

const inp = { width:'100%', padding:'8px 12px', background:'#1e2535', border:'1px solid #2d3748', borderRadius:8, color:'#e5e7eb', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' };
const lbl = { display:'block', fontSize:11, fontWeight:500, color:'#6b7280', marginBottom:4 };

function ColSelect({ label, value, onChange, columns, multi }) {
  if (multi) {
    const selected = Array.isArray(value) ? value : [];
    const toggle = (col) => onChange(selected.includes(col) ? selected.filter(c => c!==col) : [...selected, col]);
    return (
      <div style={{ marginBottom:12 }}>
        <span style={lbl}>{label}</span>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, padding:8, background:'#1e2535', borderRadius:8, border:'1px solid #2d3748', maxHeight:110, overflowY:'auto' }}>
          {columns.map(col => (
            <button key={col} type="button" onClick={() => toggle(col)} style={{ padding:'3px 10px', borderRadius:6, border: selected.includes(col) ? '1px solid rgba(59,130,246,0.6)' : '1px solid #2d3748', background: selected.includes(col) ? 'rgba(59,130,246,0.2)' : '#252d40', color: selected.includes(col) ? '#93c5fd' : '#6b7280', fontSize:11, fontFamily:'monospace', cursor:'pointer' }}>{col}</button>
          ))}
        </div>
        {selected.length > 0 && <p style={{ margin:'4px 0 0', fontSize:10, color:'#4b5563', fontFamily:'monospace' }}>Selected: {selected.join(', ')}</p>}
      </div>
    );
  }
  return (
    <div style={{ marginBottom:12 }}>
      <span style={lbl}>{label}</span>
      <select style={{ ...inp, cursor:'pointer' }} value={value || ''} onChange={e => onChange(e.target.value)}>
        <option value="">- choose column -</option>
        {columns.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );
}

function ConfigFields({ stepType, config, setField, columns, uploadedFiles }) {
  switch (stepType) {
    case 'drop_missing': return (
      <div>
        <ColSelect label="Columns (empty = all)" value={config.columns} onChange={v => setField('columns', v)} columns={columns} multi />
        <div style={{ marginBottom:12 }}><span style={lbl}>How</span>
          <select style={{ ...inp, cursor:'pointer' }} value={config.how||'any'} onChange={e => setField('how', e.target.value)}>
            <option value="any">any - drop if any column is null</option>
            <option value="all">all - drop only if ALL columns are null</option>
          </select>
        </div>
      </div>
    );
    case 'fill_missing': return (
      <div>
        <ColSelect label="Column *" value={config.column} onChange={v => setField('column', v)} columns={columns} />
        <div style={{ marginBottom:12 }}><span style={lbl}>Fill Method</span>
          <select style={{ ...inp, cursor:'pointer' }} value={config.method||'value'} onChange={e => setField('method', e.target.value)}>
            <option value="value">Constant value</option><option value="mean">Mean</option>
            <option value="median">Median</option><option value="mode">Mode</option>
            <option value="ffill">Forward fill</option><option value="bfill">Backward fill</option>
          </select>
        </div>
        {(!config.method || config.method === 'value') && (
          <div style={{ marginBottom:12 }}><span style={lbl}>Fill Value</span><input style={inp} placeholder="e.g. 0 or Unknown" value={config.value||''} onChange={e => setField('value', e.target.value)} /></div>
        )}
      </div>
    );
    case 'rename_column': return (
      <div>
        <span style={lbl}>Column Renames (old to new)</span>
        {columns.map(col => {
          const mappings = config.mappings || {};
          return (
            <div key={col} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ fontSize:11, fontFamily:'monospace', color:'#6b7280', width:110, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis' }}>{col}</span>
              <span style={{ color:'#4b5563', fontSize:12 }}>to</span>
              <input style={{ ...inp, fontSize:11 }} placeholder="new name" value={mappings[col]||''} onChange={e => {
                const nm = {...mappings};
                if (e.target.value) nm[col] = e.target.value; else delete nm[col];
                setField('mappings', nm);
              }} />
            </div>
          );
        })}
      </div>
    );
    case 'change_dtype': return (
      <div>
        <ColSelect label="Column *" value={config.column} onChange={v => setField('column', v)} columns={columns} />
        <div style={{ marginBottom:12 }}><span style={lbl}>Target Type</span>
          <select style={{ ...inp, cursor:'pointer' }} value={config.dtype||'float'} onChange={e => setField('dtype', e.target.value)}>
            <option value="int">Integer</option><option value="float">Float</option>
            <option value="str">String</option><option value="bool">Boolean</option><option value="datetime">Datetime</option>
          </select>
        </div>
      </div>
    );
    case 'filter_rows': return (
      <div>
        <ColSelect label="Column *" value={config.column} onChange={v => setField('column', v)} columns={columns} />
        <div style={{ marginBottom:12 }}><span style={lbl}>Operator</span>
          <select style={{ ...inp, cursor:'pointer' }} value={config.operator||'=='} onChange={e => setField('operator', e.target.value)}>
            <option value="==">== equals</option><option value="!=">!= not equals</option>
            <option value=">">greater than</option><option value=">=">greater or equal</option>
            <option value="<">less than</option><option value="<=">less or equal</option>
            <option value="contains">contains</option><option value="startswith">starts with</option>
            <option value="isnull">is null</option><option value="notnull">is not null</option>
          </select>
        </div>
        {!['isnull','notnull'].includes(config.operator) && (
          <div style={{ marginBottom:12 }}><span style={lbl}>Value</span><input style={inp} placeholder="e.g. completed" value={config.value||''} onChange={e => setField('value', e.target.value)} /></div>
        )}
      </div>
    );
    case 'select_columns': return <ColSelect label="Columns to keep *" value={config.columns} onChange={v => setField('columns', v)} columns={columns} multi />;
    case 'sort_values': return (
      <div>
        <ColSelect label="Sort by *" value={config.columns} onChange={v => setField('columns', v)} columns={columns} multi />
        <div style={{ marginBottom:12 }}><span style={lbl}>Direction</span>
          <select style={{ ...inp, cursor:'pointer' }} value={String(config.ascending !== false)} onChange={e => setField('ascending', e.target.value === 'true')}>
            <option value="true">Ascending</option><option value="false">Descending</option>
          </select>
        </div>
      </div>
    );
    case 'remove_duplicates': return (
      <div>
        <ColSelect label="Subset columns (empty = all)" value={config.columns} onChange={v => setField('columns', v)} columns={columns} multi />
        <div style={{ marginBottom:12 }}><span style={lbl}>Keep</span>
          <select style={{ ...inp, cursor:'pointer' }} value={config.keep||'first'} onChange={e => setField('keep', e.target.value)}>
            <option value="first">Keep first</option><option value="last">Keep last</option><option value="false">Drop all</option>
          </select>
        </div>
      </div>
    );
    case 'add_computed_column': return (
      <div>
        <div style={{ marginBottom:12 }}><span style={lbl}>New Column Name *</span><input style={inp} placeholder="e.g. profit_margin" value={config.new_column||''} onChange={e => setField('new_column', e.target.value)} /></div>
        <div style={{ marginBottom:12 }}><span style={lbl}>Operation</span>
          <select style={{ ...inp, cursor:'pointer' }} value={config.operation||'add'} onChange={e => setField('operation', e.target.value)}>
            <option value="add">Add</option><option value="subtract">Subtract</option>
            <option value="multiply">Multiply</option><option value="divide">Divide</option>
            <option value="concat">Concatenate strings</option><option value="constant">Set constant</option>
          </select>
        </div>
        {config.operation !== 'constant' && <ColSelect label="Column A *" value={config.col_a} onChange={v => setField('col_a', v)} columns={columns} />}
        {config.operation !== 'constant' && (
          <div>
            <ColSelect label="Column B (empty = use constant)" value={config.col_b} onChange={v => setField('col_b', v)} columns={['', ...columns]} />
            {!config.col_b && <div style={{ marginBottom:12 }}><span style={lbl}>Constant Value</span><input style={inp} placeholder="e.g. 100" value={config.constant_value||''} onChange={e => setField('constant_value', e.target.value)} /></div>}
          </div>
        )}
        {config.operation === 'constant' && <div style={{ marginBottom:12 }}><span style={lbl}>Constant Value</span><input style={inp} placeholder="e.g. 0" value={config.constant_value||''} onChange={e => setField('constant_value', e.target.value)} /></div>}
      </div>
    );
    case 'join': return (
      <div>
        <div style={{ marginBottom:12 }}>
          <span style={lbl}>Right Dataset *</span>
          <select style={{ ...inp, cursor:'pointer' }} value={config.right_dataset_path||''} onChange={e => setField('right_dataset_path', e.target.value)}>
            <option value="">- select uploaded file -</option>
            {uploadedFiles.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          {uploadedFiles.length === 0 && (
            <p style={{ margin:'5px 0 0', fontSize:11, color:'#f59e0b' }}>⚠ No files available. Go back to Datasets and upload a second CSV first, then return here.</p>
          )}
        </div>
        <div style={{ marginBottom:12 }}>
          <span style={lbl}>Join Key(s) * <span style={{ color:'#4b5563', fontWeight:400 }}>(column name shared by both datasets)</span></span>
          <input style={inp} placeholder="e.g. customer_id or order_id, product_id" value={Array.isArray(config.on) ? config.on.join(', ') : (config.on||'')} onChange={e => {
            const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
            setField('on', val.length === 1 ? val[0] : val);
          }} />
        </div>
        <div style={{ marginBottom:12 }}><span style={lbl}>Join Type</span>
          <select style={{ ...inp, cursor:'pointer' }} value={config.how||'inner'} onChange={e => setField('how', e.target.value)}>
            <option value="inner">Inner — keep only matching rows</option>
            <option value="left">Left — keep all left rows</option>
            <option value="right">Right — keep all right rows</option>
            <option value="outer">Outer — keep all rows from both</option>
          </select>
        </div>
      </div>
    );
    case 'group_aggregate': {
      const aggs = config.aggregations || {};
      return (
        <div>
          <ColSelect label="Group By *" value={config.group_by} onChange={v => setField('group_by', v)} columns={columns} multi />
          <span style={lbl}>Aggregations</span>
          <div style={{ maxHeight:160, overflowY:'auto' }}>
            {columns.filter(c => !(config.group_by||[]).includes(c)).map(col => (
              <div key={col} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                <span style={{ fontSize:11, fontFamily:'monospace', color:'#6b7280', width:110, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis' }}>{col}</span>
                <select style={{ ...inp, fontSize:11, padding:'4px 8px', cursor:'pointer' }} value={aggs[col]||''} onChange={e => {
                  const na = {...aggs};
                  if (e.target.value) na[col] = e.target.value; else delete na[col];
                  setField('aggregations', na);
                }}>
                  <option value="">- skip -</option>
                  <option value="sum">sum</option><option value="mean">mean</option>
                  <option value="count">count</option><option value="min">min</option>
                  <option value="max">max</option><option value="first">first</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      );
    }
    default: return <p style={{ fontSize:12, color:'#6b7280' }}>No configuration needed.</p>;
  }
}

export default function StepEditor({ columns, uploadedFiles, step, nextOrder, onSave, onCancel, saving }) {
  const [name, setName] = useState(step ? step.name : '');
  const [stepType, setStepType] = useState(step ? step.step_type : 'filter_rows');
  const [config, setConfig] = useState({});
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (step) {
      setName(step.name);
      setStepType(step.step_type);
      try { setConfig(JSON.parse(step.config_json)); } catch { setConfig({}); }
    } else { setConfig({}); }
  }, [step]);

  const handleTypeChange = (t) => {
    setStepType(t);
    setConfig({});
    if (!name) { const meta = STEP_TYPES.find(s => s.value === t); if (meta) setName(meta.label); }
  };

  const setField = (k, v) => setConfig(c => ({ ...c, [k]: v }));

  const handleSave = () => {
    setValidationError(null);
    if (stepType === 'join') {
      if (!config.right_dataset_path) {
        setValidationError('Select a right dataset to join with. Upload a second CSV in the Datasets panel first if the list is empty.');
        return;
      }
      if (!config.on || (Array.isArray(config.on) ? config.on.length === 0 : config.on.trim() === '')) {
        setValidationError('Enter at least one join key column name (e.g. customer_id).');
        return;
      }
    }
    const meta = STEP_TYPES.find(s => s.value === stepType);
    onSave({ name: name || (meta ? meta.label : stepType), step_type: stepType, config_json: JSON.stringify(config), order: step ? step.order : nextOrder });
  };

  return (
    <div style={{ fontFamily:"'Syne', sans-serif" }}>
      <div style={{ marginBottom:16 }}>
        <span style={lbl}>Step Name</span>
        <input style={inp} placeholder="e.g. Remove nulls in salary" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div style={{ marginBottom:16 }}>
        <span style={lbl}>Transformation Type</span>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, maxHeight:200, overflowY:'auto', paddingRight:2 }}>
          {STEP_TYPES.map(t => (
            <button key={t.value} type="button" onClick={() => handleTypeChange(t.value)} style={{ textAlign:'left', padding:'8px 12px', borderRadius:8, border: stepType===t.value ? '1px solid rgba(59,130,246,0.5)' : '1px solid #2d3748', background: stepType===t.value ? 'rgba(59,130,246,0.15)' : '#1e2535', cursor:'pointer' }}>
              <div style={{ fontSize:12, fontWeight:500, color: stepType===t.value ? '#93c5fd' : '#d1d5db' }}>{t.label}</div>
              <div style={{ fontSize:10, color:'#4b5563', marginTop:2 }}>{t.description}</div>
            </button>
          ))}
        </div>
      </div>
      <ConfigFields stepType={stepType} config={config} setField={setField} columns={columns} uploadedFiles={uploadedFiles} />
      {validationError && (
        <div style={{ padding:'8px 12px', background:'rgba(127,29,29,0.2)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, fontSize:12, color:'#fca5a5', marginBottom:4 }}>
          ⛔ {validationError}
        </div>
      )}
      <div style={{ display:'flex', gap:8, paddingTop:8 }}>
        <button onClick={handleSave} disabled={saving} style={{ flex:1, padding:'10px', background: saving ? '#1e3a8a' : '#1d4ed8', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Saving...' : step ? 'Update Step' : 'Add Step'}
        </button>
        <button onClick={onCancel} style={{ padding:'10px 16px', background:'transparent', border:'1px solid #2d3748', borderRadius:8, color:'#6b7280', fontSize:13, cursor:'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}
