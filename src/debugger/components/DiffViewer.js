export default function DiffViewer({ diff, stepName }) {
  if (!diff||Object.keys(diff).length===0) return <p style={{fontSize:12,color:'#4b5563',textAlign:'center',padding:'16px 0'}}>No diff data (source step).</p>;
  const D = ({ value, isPercent, inv }) => {
    if (value===null||value===undefined) return <span style={{color:'#4b5563'}}>-</span>;
    const pos=value>0; const good=inv?!pos:pos;
    const color=value===0?'#6b7280':pos?(good?'#22c55e':'#ef4444'):(good?'#22c55e':'#ef4444');
    return <span style={{color,fontSize:11,fontFamily:'monospace',fontWeight:600}}>{value>0?'▲':value<0?'▼':'−'} {isPercent?Math.abs(value).toFixed(1)+'%':Math.abs(value).toLocaleString()}</span>;
  };
  const card={background:'#161b27',border:'1px solid #252d40',borderRadius:8,padding:12,marginBottom:8};
  const lbl={fontSize:10,color:'#6b7280',textTransform:'uppercase',letterSpacing:0.8,display:'block',marginBottom:4};
  return (
    <div style={{fontSize:12}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
        <div style={card}><span style={lbl}>Rows</span><div style={{display:'flex',alignItems:'baseline',gap:8}}><span style={{color:'#fff',fontFamily:'monospace',fontSize:18,fontWeight:600}}>{(diff.row_count_after||0).toLocaleString()}</span><D value={diff.row_delta}/><D value={diff.row_delta_pct} isPercent inv/></div><p style={{margin:'4px 0 0',fontSize:10,color:'#4b5563',fontFamily:'monospace'}}>before: {(diff.row_count_before||0).toLocaleString()}</p></div>
        <div style={card}><span style={lbl}>Columns</span><div style={{display:'flex',alignItems:'baseline',gap:8}}><span style={{color:'#fff',fontFamily:'monospace',fontSize:18,fontWeight:600}}>{diff.col_count_after||0}</span><D value={(diff.col_count_after||0)-(diff.col_count_before||0)}/></div><p style={{margin:'4px 0 0',fontSize:10,color:'#4b5563',fontFamily:'monospace'}}>before: {diff.col_count_before||0}</p></div>
      </div>
      {((diff.columns_added||[]).length>0||(diff.columns_removed||[]).length>0)&&<div style={card}><span style={lbl}>Column Changes</span>{(diff.columns_added||[]).map(c=><div key={c} style={{color:'#22c55e',fontSize:11,fontFamily:'monospace'}}>+ {c}</div>)}{(diff.columns_removed||[]).map(c=><div key={c} style={{color:'#ef4444',fontSize:11,fontFamily:'monospace'}}>- {c}</div>)}</div>}
      {Object.keys(diff.type_changes||{}).length>0&&<div style={card}><span style={lbl}>Type Changes</span>{Object.entries(diff.type_changes||{}).map(([col,tc])=><div key={col} style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}><span style={{color:'#d1d5db',fontFamily:'monospace'}}>{col}</span><span style={{padding:'1px 6px',background:'#252d40',borderRadius:4,fontSize:10}}>{tc.before}</span><span style={{color:'#4b5563'}}>→</span><span style={{padding:'1px 6px',background:'rgba(59,130,246,0.2)',borderRadius:4,fontSize:10,color:'#93c5fd'}}>{tc.after}</span></div>)}</div>}
      {Object.entries(diff.null_changes||{}).filter(([,nc])=>(nc.delta||0)!==0).length>0&&(
        <div style={card}><span style={lbl}>Null Changes</span>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:'1px solid #252d40'}}>{['Column','Before','After','Δ'].map(h=><th key={h} style={{textAlign:h==='Column'?'left':'right',padding:'3px 0',fontSize:10,color:'#4b5563',fontWeight:500}}>{h}</th>)}</tr></thead>
            <tbody>{Object.entries(diff.null_changes||{}).filter(([,nc])=>(nc.delta||0)!==0).sort(([,a],[,b])=>Math.abs(b.delta||0)-Math.abs(a.delta||0)).slice(0,10).map(([col,nc])=>(
              <tr key={col} style={{borderBottom:'1px solid rgba(37,45,64,0.3)'}}><td style={{padding:'3px 0',color:'#d1d5db',fontFamily:'monospace'}}>{col}</td><td style={{textAlign:'right',color:'#6b7280',fontFamily:'monospace'}}>{nc.before??'-'}</td><td style={{textAlign:'right',fontFamily:'monospace'}}>{nc.after}</td><td style={{textAlign:'right'}}><D value={nc.delta} inv/></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {Object.entries(diff.stat_drift||{}).filter(([,sd])=>sd.drift_pct!==null&&Math.abs(sd.drift_pct)>1).length>0&&(
        <div style={card}><span style={lbl}>Mean Drift</span>{Object.entries(diff.stat_drift||{}).filter(([,sd])=>sd.drift_pct!==null&&Math.abs(sd.drift_pct)>1).sort(([,a],[,b])=>Math.abs(b.drift_pct||0)-Math.abs(a.drift_pct||0)).slice(0,8).map(([col,sd])=>(
          <div key={col} style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}><span style={{color:'#d1d5db',fontFamily:'monospace',width:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flexShrink:0}}>{col}</span><span style={{color:'#6b7280',fontFamily:'monospace',fontSize:10}}>{sd.mean_before!=null?sd.mean_before.toFixed(3):'-'}</span><span style={{color:'#4b5563'}}>→</span><span style={{fontFamily:'monospace',fontSize:10}}>{sd.mean_after!=null?sd.mean_after.toFixed(3):'-'}</span><D value={sd.drift_pct} isPercent inv/></div>
        ))}</div>
      )}
      {(diff.duplicate_delta||0)!==0&&<div style={{...card,display:'flex',alignItems:'center',gap:12}}><span style={{color:'#6b7280',fontSize:10,textTransform:'uppercase',letterSpacing:0.8,flex:1}}>Duplicates</span><span style={{fontFamily:'monospace',color:'#6b7280'}}>{diff.duplicate_before} →</span><span style={{fontFamily:'monospace'}}>{diff.duplicate_after}</span><D value={diff.duplicate_delta} inv/></div>}
    </div>
  );
}
