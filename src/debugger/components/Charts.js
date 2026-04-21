import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
function CT({ active, payload, label }) {
  if (!active||!payload||!payload.length) return null;
  return <div style={{background:'#1e2535',border:'1px solid #252d40',borderRadius:8,padding:'8px 12px',fontSize:11}}><p style={{margin:'0 0 4px',color:'#6b7280',fontFamily:'monospace'}}>{label}</p>{payload.map((p,i)=><p key={i} style={{margin:0,color:p.color||'#fff'}}>{p.name}: <strong style={{fontFamily:'monospace'}}>{p.value&&p.value.toLocaleString()}</strong></p>)}</div>;
}
export function RowCountChart({ snapshots, activeIndex }) {
  const data = snapshots.map(s=>({ name:s.step_name.length>14?s.step_name.slice(0,13)+'…':s.step_name, rows:s.row_count }));
  return (
    <div style={{background:'#161b27',border:'1px solid #252d40',borderRadius:12,padding:16}}>
      <p style={{margin:'0 0 12px',fontSize:11,color:'#6b7280',textTransform:'uppercase',letterSpacing:1}}>Row Count Across Steps</p>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{top:4,right:8,left:-16,bottom:0}}>
          <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#252d40"/>
          <XAxis dataKey="name" tick={{fontSize:9,fill:'#6b7280',fontFamily:'monospace'}}/>
          <YAxis tick={{fontSize:9,fill:'#6b7280',fontFamily:'monospace'}}/>
          <Tooltip content={<CT/>}/>
          {activeIndex>0&&data[activeIndex]&&<ReferenceLine x={data[activeIndex].name} stroke="#3b82f6" strokeDasharray="4 2" strokeWidth={1.5}/>}
          <Area type="monotone" dataKey="rows" stroke="#3b82f6" strokeWidth={2} fill="url(#rg)" dot={{fill:'#3b82f6',r:3,strokeWidth:0}} name="rows"/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function NullCountChart({ snapshot }) {
  const nullCounts = JSON.parse(snapshot.null_counts_json||'{}');
  const data = Object.entries(nullCounts).filter(([,v])=>v>0).sort(([,a],[,b])=>b-a).slice(0,10).map(([col,count])=>({ name:col.length>12?col.slice(0,11)+'…':col, nulls:count, pct:snapshot.row_count>0?Math.round(count/snapshot.row_count*100):0 }));
  if (data.length===0) return <div style={{background:'#161b27',border:'1px solid #252d40',borderRadius:12,padding:16}}><p style={{margin:'0 0 8px',fontSize:11,color:'#6b7280',textTransform:'uppercase',letterSpacing:1}}>Null Counts</p><p style={{fontSize:12,color:'#4b5563',textAlign:'center',padding:'12px 0'}}>No null values in this snapshot.</p></div>;
  return (
    <div style={{background:'#161b27',border:'1px solid #252d40',borderRadius:12,padding:16}}>
      <p style={{margin:'0 0 12px',fontSize:11,color:'#6b7280',textTransform:'uppercase',letterSpacing:1}}>Null Counts</p>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} layout="vertical" margin={{top:0,right:40,left:0,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#252d40" horizontal={false}/>
          <XAxis type="number" tick={{fontSize:9,fill:'#6b7280',fontFamily:'monospace'}}/>
          <YAxis dataKey="name" type="category" width={80} tick={{fontSize:9,fill:'#6b7280',fontFamily:'monospace'}}/>
          <Tooltip content={<CT/>}/>
          <Bar dataKey="nulls" name="nulls" radius={[0,3,3,0]} maxBarSize={14}>
            {data.map((e,i)=><Cell key={i} fill={e.pct>50?'#ef4444':e.pct>20?'#f59e0b':'#3b82f6'}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function RowDeltaChart({ snapshots }) {
  const data = snapshots.slice(1).map(s=>{ const d=JSON.parse(s.diff_json||'{}'); return { name:s.step_name.length>14?s.step_name.slice(0,13)+'…':s.step_name, delta:d.row_delta||0 }; });
  if (data.length===0) return null;
  return (
    <div style={{background:'#161b27',border:'1px solid #252d40',borderRadius:12,padding:16}}>
      <p style={{margin:'0 0 12px',fontSize:11,color:'#6b7280',textTransform:'uppercase',letterSpacing:1}}>Row Change Per Step</p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{top:4,right:8,left:-16,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#252d40"/>
          <XAxis dataKey="name" tick={{fontSize:9,fill:'#6b7280',fontFamily:'monospace'}}/>
          <YAxis tick={{fontSize:9,fill:'#6b7280',fontFamily:'monospace'}}/>
          <Tooltip content={<CT/>}/>
          <ReferenceLine y={0} stroke="#374151"/>
          <Bar dataKey="delta" name="rows" radius={[3,3,0,0]} maxBarSize={32}>
            {data.map((e,i)=><Cell key={i} fill={e.delta<0?'#ef4444':e.delta>0?'#22c55e':'#3b82f6'}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
