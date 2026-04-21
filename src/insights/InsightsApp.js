import { useState, useCallback, useMemo } from 'react';
import {
  ScatterChart, Scatter, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  aiInsightsUpload, aiInsightsDetect,
  aiInsightsDetails, aiInsightsChartPreview,
} from '../debugger/api/client';

const COLORS = ['#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#3b82f6','#ec4899','#14b8a6','#f97316'];
const PURPLE = '#7c3aed';

const TYPE_META = {
  numerical_numerical:    { icon: '📈', label: 'Correlation',  color: '#7c3aed' },
  categorical_numerical:  { icon: '📊', label: 'Group Compare', color: '#06b6d4' },
  date_numerical:         { icon: '📅', label: 'Time Trend',   color: '#10b981' },
  categorical_categorical:{ icon: '🔀', label: 'Association',  color: '#f59e0b' },
  distribution:           { icon: '🔔', label: 'Distribution', color: '#8b5cf6' },
  data_quality:           { icon: '⚠️', label: 'Data Quality', color: '#ef4444' },
};

const STRENGTH_COLOR = { strong:'#10b981', high:'#ef4444', moderate:'#f59e0b', weak:'#6b7a9a', 'very weak':'#4a5a7a', info:'#374151' };

const CSS = `
  *{box-sizing:border-box;}
  .ins-card{transition:all 0.18s ease;cursor:pointer;border-radius:12px;padding:14px 16px;border:1px solid rgba(124,58,237,0.15);background:rgba(15,10,35,0.6);}
  .ins-card:hover{border-color:rgba(124,58,237,0.5)!important;background:rgba(30,15,70,0.7)!important;transform:translateX(3px);}
  .ins-card.active{border-color:#7c3aed!important;background:rgba(124,58,237,0.12)!important;}
  .ins-drop{background:rgba(8,5,20,0.9);border:1px solid rgba(124,58,237,0.3);color:#c4b5fd;border-radius:8px;padding:7px 10px;font-size:13px;width:100%;cursor:pointer;outline:none;}
  .ins-drop:focus{border-color:#7c3aed;}
  .ins-btn{padding:9px 18px;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;transition:all 0.18s;font-family:"Syne",sans-serif;}
  .ins-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(124,58,237,0.4);}
  .ins-btn:disabled{opacity:0.45;cursor:not-allowed;}
  .ins-input{background:rgba(8,5,20,0.9);border:1px solid rgba(124,58,237,0.3);color:#c4b5fd;border-radius:8px;padding:7px 10px;font-size:13px;width:100%;outline:none;}
  .ins-input:focus{border-color:#7c3aed;}
  .cust-row{display:flex;flex-direction:column;gap:4px;margin-bottom:12px;}
  .cust-label{font-size:11px;color:#6b7a9a;font-family:"Space Mono",monospace;letter-spacing:0.5px;}
  @media(max-width:900px){.ins-layout{flex-direction:column!important;}}
`;

// ── Tooltip style ─────────────────────────────────────────────────────────────
const TT_STYLE = { background:'#0f0a2a', border:'1px solid rgba(124,58,237,0.4)', borderRadius:8, fontSize:12, color:'#c4b5fd' };

// ── Chart renderers ──────────────────────────────────────────────────────────

function ChartView({ chartData }) {
  if (!chartData) return <NoChartPlaceholder />;
  const { data, config } = chartData;
  if (!data || data.length === 0) return <div style={{color:'#6b7a9a',textAlign:'center',paddingTop:80}}>No data to display.</div>;

  const { chart_type, x_label, y_label, title, series } = config || {};
  const h = 320;

  if (chart_type === 'scatter') {
    const groups = data[0]?.group ? [...new Set(data.map(d => d.group))] : null;
    return (
      <ResponsiveContainer width="100%" height={h}>
        <ScatterChart margin={{top:10,right:20,bottom:30,left:10}}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.12)" />
          <XAxis dataKey="x" name={x_label} tick={{fill:'#8899bb',fontSize:11}} label={{value:x_label,position:'insideBottom',offset:-15,fill:'#6b7a9a',fontSize:12}}/>
          <YAxis dataKey="y" name={y_label} tick={{fill:'#8899bb',fontSize:11}} label={{value:y_label,angle:-90,position:'insideLeft',fill:'#6b7a9a',fontSize:12}}/>
          <Tooltip cursor={{strokeDasharray:'3 3'}} contentStyle={TT_STYLE} />
          {groups ? (
            groups.map((g,i) => (
              <Scatter key={g} name={g} data={data.filter(d=>d.group===g)} fill={COLORS[i%COLORS.length]} opacity={0.75} />
            ))
          ) : (
            <Scatter data={data} fill={PURPLE} opacity={0.7} />
          )}
          {groups && <Legend />}
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (chart_type === 'line') {
    const multiSeries = series && series.length > 0;
    return (
      <ResponsiveContainer width="100%" height={h}>
        <LineChart data={data} margin={{top:10,right:20,bottom:30,left:10}}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.12)" />
          <XAxis dataKey="date" tick={{fill:'#8899bb',fontSize:10}} label={{value:x_label,position:'insideBottom',offset:-15,fill:'#6b7a9a',fontSize:12}}/>
          <YAxis tick={{fill:'#8899bb',fontSize:11}} label={{value:y_label,angle:-90,position:'insideLeft',fill:'#6b7a9a',fontSize:12}}/>
          <Tooltip contentStyle={TT_STYLE} />
          {multiSeries ? (
            series.map((s,i) => <Line key={s} type="monotone" dataKey={s} stroke={COLORS[i%COLORS.length]} dot={false} strokeWidth={2} />)
          ) : (
            <Line type="monotone" dataKey="value" stroke={PURPLE} dot={false} strokeWidth={2} />
          )}
          {multiSeries && <Legend />}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chart_type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({name,pct})=>`${name} (${pct}%)`} labelLine={false}>
            {data.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={TT_STYLE} formatter={(v,n,p)=>[`${v} (${p.payload.pct}%)`,n]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chart_type === 'box') {
    const b = data[0];
    if (!b) return null;
    const range = b.max - b.min || 1;
    const pct = v => ((v - b.min) / range * 100).toFixed(1);
    return (
      <div style={{padding:'24px 32px'}}>
        <div style={{color:'#8899bb',fontSize:12,marginBottom:16,fontFamily:"'Space Mono',monospace"}}>{b.name}</div>
        <div style={{position:'relative',height:60,margin:'0 0 12px'}}>
          <div style={{position:'absolute',top:'50%',left:0,right:0,height:2,background:'rgba(124,58,237,0.25)',transform:'translateY(-50%)'}}/>
          {/* Whiskers */}
          <div style={{position:'absolute',left:`${pct(b.lower_fence)}%`,top:'25%',height:'50%',width:2,background:'#7c3aed'}}/>
          <div style={{position:'absolute',left:`${pct(b.lower_fence)}%`,top:'25%',width:`${pct(b.q1)-pct(b.lower_fence)}%`,height:2,background:'#7c3aed',top:'50%'}}/>
          <div style={{position:'absolute',right:`${(100-pct(b.upper_fence))}%`,top:'25%',height:'50%',width:2,background:'#7c3aed'}}/>
          <div style={{position:'absolute',left:`${pct(b.q3)}%`,top:'50%',width:`${pct(b.upper_fence)-pct(b.q3)}%`,height:2,background:'#7c3aed'}}/>
          {/* Box */}
          <div style={{position:'absolute',left:`${pct(b.q1)}%`,top:'20%',width:`${pct(b.q3)-pct(b.q1)}%`,height:'60%',background:'rgba(124,58,237,0.25)',border:'1px solid #7c3aed',borderRadius:4}}/>
          {/* Median */}
          <div style={{position:'absolute',left:`${pct(b.median)}%`,top:'10%',height:'80%',width:2,background:'#c4b5fd'}}/>
          {/* Outliers */}
          {b.outliers?.slice(0,20).map((v,i)=>(
            <div key={i} style={{position:'absolute',left:`${pct(v)}%`,top:'40%',width:6,height:6,borderRadius:'50%',background:'#ef4444',transform:'translate(-50%,-50%)'}}/>
          ))}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#6b7a9a',fontFamily:"'Space Mono',monospace"}}>
          {[['Min',b.min],['Q1',b.q1],['Median',b.median],['Q3',b.q3],['Max',b.max]].map(([l,v])=>(
            <div key={l} style={{textAlign:'center'}}>
              <div style={{color:'#c4b5fd',fontWeight:700}}>{typeof v==='number'?v.toFixed(2):v}</div>
              <div>{l}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Bar / grouped_bar / histogram
  const multiSeries = series && series.length > 0;
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} margin={{top:10,right:20,bottom:40,left:10}}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.12)" />
        <XAxis dataKey="name" tick={{fill:'#8899bb',fontSize:10}} angle={data.length>8?-35:0} textAnchor={data.length>8?"end":"middle"} interval={0} label={data.length<=8?{value:x_label,position:'insideBottom',offset:-25,fill:'#6b7a9a',fontSize:12}:undefined}/>
        <YAxis tick={{fill:'#8899bb',fontSize:11}} label={{value:y_label,angle:-90,position:'insideLeft',fill:'#6b7a9a',fontSize:12}}/>
        <Tooltip contentStyle={TT_STYLE} />
        {multiSeries ? (
          series.map((s,i) => <Bar key={s} dataKey={s} fill={COLORS[i%COLORS.length]} radius={[3,3,0,0]} />)
        ) : (
          <Bar dataKey={chart_type==='histogram'?'count':'value'} radius={[3,3,0,0]}>
            {data.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
          </Bar>
        )}
        {multiSeries && <Legend />}
      </BarChart>
    </ResponsiveContainer>
  );
}

function NoChartPlaceholder() {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:280,gap:12}}>
      <div style={{fontSize:48,opacity:0.3}}>📊</div>
      <div style={{color:'#4a5a7a',fontSize:14}}>Click an insight card to generate a chart</div>
    </div>
  );
}

// ── Insight card ─────────────────────────────────────────────────────────────
function InsightCard({ ins, active, onClick }) {
  const meta  = TYPE_META[ins.type] || { icon:'💡', label:'Insight', color:PURPLE };
  const scol  = STRENGTH_COLOR[ins.strength] || '#6b7a9a';
  return (
    <div className={`ins-card${active?' active':''}`} onClick={onClick}>
      <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
        <div style={{fontSize:20,flexShrink:0,marginTop:1}}>{meta.icon}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4,flexWrap:'wrap'}}>
            <span style={{padding:'1px 7px',background:`${meta.color}20`,border:`1px solid ${meta.color}40`,borderRadius:10,fontSize:10,color:meta.color,fontFamily:"'Space Mono',monospace"}}>{meta.label}</span>
            <span style={{padding:'1px 7px',background:`${scol}18`,border:`1px solid ${scol}35`,borderRadius:10,fontSize:10,color:scol,fontFamily:"'Space Mono',monospace"}}>{ins.strength}</span>
          </div>
          <div style={{fontSize:13,fontWeight:700,color:'#e0e8ff',marginBottom:4,lineHeight:1.3}}>{ins.title}</div>
          <div style={{fontSize:11,color:'#6b7a9a',lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{ins.summary}</div>
          <div style={{marginTop:6,display:'flex',gap:6,flexWrap:'wrap'}}>
            {ins.columns.map(c=>(
              <span key={c} style={{padding:'1px 6px',background:'rgba(124,58,237,0.1)',border:'1px solid rgba(124,58,237,0.2)',borderRadius:6,fontSize:10,color:'#a78bfa'}}>{c}</span>
            ))}
          </div>
        </div>
        <div style={{flexShrink:0,fontSize:11,color:'#4a5a7a',fontFamily:"'Space Mono',monospace"}}>{(ins.confidence*100).toFixed(0)}%</div>
      </div>
    </div>
  );
}

// ── Explanation panel ────────────────────────────────────────────────────────
function ExplanationPanel({ detail }) {
  if (!detail) return null;
  const lines = detail.explanation.split('\n\n');
  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{fontSize:13,fontWeight:700,color:'#e0e8ff'}}>{detail.title}</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
        <span style={{padding:'2px 8px',background:`${STRENGTH_COLOR[detail.strength]||'#6b7a9a'}18`,border:`1px solid ${STRENGTH_COLOR[detail.strength]||'#6b7a9a'}35`,borderRadius:8,fontSize:11,color:STRENGTH_COLOR[detail.strength]||'#6b7a9a',fontFamily:"'Space Mono',monospace"}}>{detail.strength}</span>
        <span style={{padding:'2px 8px',background:'rgba(124,58,237,0.12)',border:'1px solid rgba(124,58,237,0.3)',borderRadius:8,fontSize:11,color:'#a78bfa',fontFamily:"'Space Mono',monospace"}}>{(detail.confidence*100).toFixed(0)}% confidence</span>
      </div>
      <div style={{fontSize:12,color:'#8899bb',lineHeight:1.75}}>
        {lines.map((l,i)=>(
          <p key={i} style={{marginBottom:10}} dangerouslySetInnerHTML={{__html:l.replace(/\*\*(.*?)\*\*/g,'<strong style="color:#c4b5fd">$1</strong>').replace(/⚠️/g,'<span style="color:#f59e0b">⚠️</span>')}}/>
        ))}
      </div>
      {detail.reliability_notes?.length > 0 && (
        <div style={{background:'rgba(124,58,237,0.06)',border:'1px solid rgba(124,58,237,0.2)',borderRadius:8,padding:12}}>
          <div style={{fontSize:11,color:'#7c3aed',fontFamily:"'Space Mono',monospace",marginBottom:8}}>RELIABILITY NOTES</div>
          {detail.reliability_notes.map((n,i)=>(
            <div key={i} style={{fontSize:11,color:'#6b7a9a',lineHeight:1.6,display:'flex',gap:6}}>
              <span style={{color:'#4a5a7a'}}>•</span><span>{n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Customize panel ──────────────────────────────────────────────────────────
function CustomizePanel({ detail, fileId, onChartUpdate }) {
  const opts = detail?.customization_options || {};
  const rec  = detail?.recommended_chart || {};
  const [cfg, setCfg] = useState({
    chart_type:  rec.chart_type  || 'bar',
    x:           rec.x           || '',
    y:           rec.y           || '',
    aggregation: rec.aggregation || 'mean',
    group_by:    rec.group_by    || '',
    top_n:       '',
    sort_asc:    false,
    title:       rec.title       || '',
  });
  const [busy, setBusy]   = useState(false);
  const [err,  setErr]    = useState('');

  // Reset when detail changes
  useMemo(() => {
    if (rec.chart_type) setCfg({
      chart_type:  rec.chart_type  || 'bar',
      x:           rec.x           || '',
      y:           rec.y           || '',
      aggregation: rec.aggregation || 'mean',
      group_by:    rec.group_by    || '',
      top_n:       '',
      sort_asc:    false,
      title:       rec.title       || '',
    });
  }, [detail?.insight_id]);

  const set = (k,v) => setCfg(c=>({...c,[k]:v}));

  const preview = async () => {
    setBusy(true); setErr('');
    try {
      const result = await aiInsightsChartPreview({
        file_id: fileId,
        chart_type: cfg.chart_type,
        x: cfg.x,
        y: cfg.y || null,
        aggregation: cfg.aggregation || null,
        group_by: cfg.group_by || null,
        top_n: cfg.top_n ? parseInt(cfg.top_n) : null,
        sort_asc: cfg.sort_asc,
        title: cfg.title || null,
      });
      onChartUpdate(result);
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const Sel = ({label,k,options,allowEmpty=false}) => (
    <div className="cust-row">
      <div className="cust-label">{label}</div>
      <select className="ins-drop" value={cfg[k]} onChange={e=>set(k,e.target.value)}>
        {allowEmpty && <option value="">— none —</option>}
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',gap:0}}>
      <div style={{fontSize:11,color:PURPLE,fontFamily:"'Space Mono',monospace",marginBottom:14,letterSpacing:1}}>CUSTOMIZE CHART</div>
      <Sel label="CHART TYPE" k="chart_type" options={opts.chart_types||['bar','line','scatter','histogram','pie']} />
      <Sel label="X AXIS" k="x" options={opts.x_columns||[]} />
      <Sel label="Y AXIS" k="y" options={['count',...(opts.y_columns||[])]} allowEmpty={true} />
      <Sel label="AGGREGATION" k="aggregation" options={opts.aggregations||['mean','sum','count','median','min','max']} />
      <Sel label="GROUP BY" k="group_by" options={opts.group_columns||[]} allowEmpty={true} />
      <div className="cust-row">
        <div className="cust-label">TOP N (optional)</div>
        <input className="ins-input" type="number" min="1" max="50" value={cfg.top_n} onChange={e=>set('top_n',e.target.value)} placeholder="e.g. 10" />
      </div>
      <div className="cust-row">
        <div className="cust-label">CHART TITLE (optional)</div>
        <input className="ins-input" type="text" value={cfg.title} onChange={e=>set('title',e.target.value)} placeholder="Custom title…" />
      </div>
      <div className="cust-row">
        <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
          <input type="checkbox" checked={cfg.sort_asc} onChange={e=>set('sort_asc',e.target.checked)} style={{accentColor:PURPLE}} />
          <span style={{fontSize:12,color:'#8899bb'}}>Sort ascending</span>
        </label>
      </div>
      {err && <div style={{fontSize:11,color:'#ef4444',marginBottom:8}}>{err}</div>}
      <button className="ins-btn" onClick={preview} disabled={busy||!cfg.x} style={{background:`linear-gradient(135deg,#5b21b6,${PURPLE})`,color:'#fff',marginTop:4}}>
        {busy ? 'Generating…' : 'Preview Chart'}
      </button>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function InsightsApp() {
  const [fileId,       setFileId]       = useState('');
  const [columns,      setColumns]      = useState([]);
  const [summary,      setSummary]      = useState(null);
  const [insights,     setInsights]     = useState([]);
  const [selected,     setSelected]     = useState(null);   // insight object from list
  const [detail,       setDetail]       = useState(null);   // full detail from /insight-details
  const [customChart,  setCustomChart]  = useState(null);   // custom preview data
  const [dragOver,     setDragOver]     = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [detecting,    setDetecting]    = useState(false);
  const [loadingDetail,setLoadingDetail]= useState(false);
  const [uploadErr,    setUploadErr]    = useState('');
  const [detectErr,    setDetectErr]    = useState('');
  const [detailErr,    setDetailErr]    = useState('');

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setUploading(true); setUploadErr(''); setInsights([]); setSelected(null); setDetail(null);
    try {
      const res = await aiInsightsUpload(file);
      setFileId(res.file_id);
      setColumns(res.columns);
      setSummary(res.summary);
    } catch(e) { setUploadErr(e.message); }
    finally { setUploading(false); }
  }, []);

  const onDrop = useCallback(e => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onFileInput = e => { if (e.target.files[0]) handleFile(e.target.files[0]); };

  // ── Detect ────────────────────────────────────────────────────────────────
  const handleDetect = async () => {
    setDetecting(true); setDetectErr(''); setInsights([]); setSelected(null); setDetail(null);
    try {
      const res = await aiInsightsDetect(fileId);
      setInsights(res.insights);
    } catch(e) { setDetectErr(e.message); }
    finally { setDetecting(false); }
  };

  // ── Select insight ────────────────────────────────────────────────────────
  const handleInsightClick = async (ins) => {
    if (selected?.insight_id === ins.insight_id) return;
    setSelected(ins); setDetail(null); setCustomChart(null);
    setLoadingDetail(true); setDetailErr('');
    try {
      const res = await aiInsightsDetails(fileId, ins.insight_id);
      setDetail(res);
    } catch(e) { setDetailErr(e.message); }
    finally { setLoadingDetail(false); }
  };

  const activeChart = customChart || detail?.chart;

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:'calc(100vh - 52px)',background:'#030712',fontFamily:"'Syne',sans-serif",color:'#e0e8ff'}}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{padding:'28px 32px 0',maxWidth:1600,margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
          <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,#5b21b6,${PURPLE})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🤖</div>
          <div>
            <h1 style={{margin:0,fontSize:22,fontWeight:800,color:'#e0e8ff',letterSpacing:'-0.01em'}}>AI Insights Engine</h1>
            <div style={{fontSize:12,color:'#4a5a7a',fontFamily:"'Space Mono',monospace"}}>statistical relationship detection · auto chart generation · rule-based explanations</div>
          </div>
        </div>
      </div>

      {/* Upload bar */}
      <div style={{padding:'20px 32px',maxWidth:1600,margin:'0 auto'}}>
        {!fileId ? (
          <div
            onDragOver={e=>{e.preventDefault();setDragOver(true)}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={onDrop}
            style={{border:`2px dashed ${dragOver?PURPLE:'rgba(124,58,237,0.3)'}`,borderRadius:16,padding:'40px 24px',textAlign:'center',background:dragOver?'rgba(124,58,237,0.06)':'rgba(8,5,20,0.6)',transition:'all 0.2s',cursor:'pointer'}}
            onClick={()=>document.getElementById('ins-file-input').click()}
          >
            <input id="ins-file-input" type="file" accept=".csv,.xlsx,.xls" style={{display:'none'}} onChange={onFileInput}/>
            <div style={{fontSize:40,marginBottom:12}}>{uploading?'⏳':'📁'}</div>
            <div style={{fontSize:15,fontWeight:700,color:'#c4b5fd',marginBottom:6}}>
              {uploading ? 'Uploading…' : 'Drop your CSV or Excel file here'}
            </div>
            <div style={{fontSize:12,color:'#4a5a7a'}}>or click to browse · .csv, .xlsx, .xls supported</div>
            {uploadErr && <div style={{marginTop:12,fontSize:12,color:'#ef4444'}}>{uploadErr}</div>}
          </div>
        ) : (
          <div style={{display:'flex',alignItems:'center',gap:16,background:'rgba(8,5,20,0.8)',border:'1px solid rgba(124,58,237,0.3)',borderRadius:12,padding:'14px 20px',flexWrap:'wrap'}}>
            <div style={{fontSize:20}}>✅</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:'#c4b5fd'}}>File uploaded successfully</div>
              <div style={{fontSize:11,color:'#4a5a7a',fontFamily:"'Space Mono',monospace"}}>{summary?.rows?.toLocaleString()} rows · {summary?.columns} columns · {columns.length} detected</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              {insights.length === 0 && (
                <button className="ins-btn" onClick={handleDetect} disabled={detecting} style={{background:`linear-gradient(135deg,#5b21b6,${PURPLE})`,color:'#fff',padding:'9px 22px'}}>
                  {detecting ? '🔍 Detecting…' : '🔍 Detect Insights'}
                </button>
              )}
              {insights.length > 0 && (
                <button className="ins-btn" onClick={handleDetect} disabled={detecting} style={{background:'rgba(124,58,237,0.15)',color:'#a78bfa',border:'1px solid rgba(124,58,237,0.3)'}}>
                  {detecting ? 'Refreshing…' : '↺ Re-run'}
                </button>
              )}
              <button className="ins-btn" onClick={()=>{setFileId('');setColumns([]);setSummary(null);setInsights([]);setSelected(null);setDetail(null);setCustomChart(null);}} style={{background:'rgba(239,68,68,0.12)',color:'#ef4444',border:'1px solid rgba(239,68,68,0.3)'}}>
                ✕ Remove
              </button>
            </div>
            {detectErr && <div style={{width:'100%',fontSize:12,color:'#ef4444'}}>{detectErr}</div>}
          </div>
        )}
      </div>

      {/* No insights yet */}
      {fileId && insights.length === 0 && !detecting && (
        <div style={{padding:'0 32px',maxWidth:1600,margin:'0 auto'}}>
          <div style={{background:'rgba(8,5,20,0.6)',border:'1px solid rgba(124,58,237,0.2)',borderRadius:12,padding:'32px',textAlign:'center'}}>
            <div style={{fontSize:36,marginBottom:12}}>🔍</div>
            <div style={{fontSize:15,color:'#c4b5fd',fontWeight:700,marginBottom:6}}>Ready to detect insights</div>
            <div style={{fontSize:12,color:'#4a5a7a'}}>Click "Detect Insights" above to scan your dataset for meaningful relationships, trends, and patterns.</div>
          </div>
        </div>
      )}

      {detecting && (
        <div style={{padding:'0 32px',maxWidth:1600,margin:'0 auto'}}>
          <div style={{background:'rgba(8,5,20,0.6)',border:'1px solid rgba(124,58,237,0.2)',borderRadius:12,padding:'32px',textAlign:'center'}}>
            <div style={{fontSize:36,marginBottom:12,animation:'spin 1s linear infinite',display:'inline-block'}}>⚙️</div>
            <div style={{fontSize:14,color:'#c4b5fd',marginTop:8}}>Scanning your dataset for patterns…</div>
            <div style={{fontSize:11,color:'#4a5a7a',marginTop:4}}>Testing correlations, group differences, trends, and data quality signals</div>
          </div>
        </div>
      )}

      {/* Main 3-column layout */}
      {insights.length > 0 && (
        <div className="ins-layout" style={{display:'flex',gap:0,maxWidth:1600,margin:'0 auto',padding:'0 32px 40px',height:'calc(100vh - 220px)',minHeight:500}}>

          {/* LEFT — Insight cards */}
          <div style={{width:300,flexShrink:0,display:'flex',flexDirection:'column',gap:0,paddingRight:20}}>
            <div style={{fontSize:11,color:PURPLE,fontFamily:"'Space Mono',monospace",letterSpacing:1,marginBottom:12}}>
              TOP INSIGHTS ({insights.length})
            </div>
            <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:8,paddingRight:4}}>
              {insights.map(ins=>(
                <InsightCard
                  key={ins.insight_id}
                  ins={ins}
                  active={selected?.insight_id === ins.insight_id}
                  onClick={()=>handleInsightClick(ins)}
                />
              ))}
            </div>
          </div>

          {/* CENTER — Chart */}
          <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:0,borderLeft:'1px solid rgba(124,58,237,0.15)',borderRight:'1px solid rgba(124,58,237,0.15)',padding:'0 24px'}}>
            <div style={{fontSize:11,color:PURPLE,fontFamily:"'Space Mono',monospace",letterSpacing:1,marginBottom:12}}>
              {selected ? activeChart?.config?.title || selected.title : 'CHART PREVIEW'}
            </div>
            <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center'}}>
              {loadingDetail ? (
                <div style={{textAlign:'center',color:'#4a5a7a',paddingTop:60}}>
                  <div style={{fontSize:32,marginBottom:12}}>⚙️</div>
                  <div style={{fontSize:13}}>Generating chart…</div>
                </div>
              ) : detailErr ? (
                <div style={{textAlign:'center',color:'#ef4444',padding:24,fontSize:13}}>{detailErr}</div>
              ) : (
                <ChartView chartData={activeChart} />
              )}
            </div>
            {activeChart?.notes?.filter(n=>n).length > 0 && (
              <div style={{fontSize:11,color:'#4a5a7a',borderTop:'1px solid rgba(124,58,237,0.1)',paddingTop:8,marginTop:8}}>
                {activeChart.notes.map((n,i)=><div key={i}>ℹ️ {n}</div>)}
              </div>
            )}
          </div>

          {/* RIGHT — Explanation + Customize */}
          <div style={{width:300,flexShrink:0,paddingLeft:20,display:'flex',flexDirection:'column',gap:0,overflowY:'auto'}}>
            {!detail && !loadingDetail && (
              <div style={{color:'#4a5a7a',fontSize:12,textAlign:'center',paddingTop:60}}>
                <div style={{fontSize:32,marginBottom:8}}>💡</div>
                Select an insight card to see the full explanation and chart customisation options.
              </div>
            )}
            {loadingDetail && (
              <div style={{color:'#4a5a7a',fontSize:12,textAlign:'center',paddingTop:60}}>Loading explanation…</div>
            )}
            {detail && !loadingDetail && (
              <>
                <div style={{fontSize:11,color:PURPLE,fontFamily:"'Space Mono',monospace",letterSpacing:1,marginBottom:12}}>EXPLANATION</div>
                <ExplanationPanel detail={detail} />
                <div style={{height:1,background:'rgba(124,58,237,0.15)',margin:'20px 0'}}/>
                <CustomizePanel detail={detail} fileId={fileId} onChartUpdate={d=>{setCustomChart(d);}} />
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
