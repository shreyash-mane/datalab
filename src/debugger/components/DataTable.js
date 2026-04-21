const DTYPE_COLOR={'int64':'#60a5fa','float64':'#22d3ee','object':'#4ade80','bool':'#a78bfa','datetime64[ns]':'#fb923c'};
export default function DataTable({ rows, schema={}, nullCounts={}, totalRows, maxHeight='340px', highlightColumns=[], caption }) {
  if (!rows||rows.length===0) return <div style={{background:'#161b27',border:'1px solid #252d40',borderRadius:12,padding:24,textAlign:'center',color:'#6b7280',fontSize:13}}>No rows to display.</div>;
  const columns = Object.keys(rows[0]);
  return (
    <div style={{background:'#161b27',border:'1px solid #252d40',borderRadius:12,overflow:'hidden'}}>
      {caption&&<div style={{padding:'6px 16px',borderBottom:'1px solid #252d40',fontSize:11,color:'#6b7280',fontFamily:'monospace'}}>{caption}</div>}
      <div style={{overflow:'auto',maxHeight}}>
        <table style={{width:'100%',borderCollapse:'collapse',textAlign:'left'}}>
          <thead>
            <tr style={{background:'#1e2535',borderBottom:'1px solid #252d40',position:'sticky',top:0,zIndex:1}}>
              {columns.map(col=>{
                const dtype=schema[col]; const nc=nullCounts[col]||0; const hl=highlightColumns.includes(col);
                return (
                  <th key={col} style={{padding:'8px 12px',fontSize:12,fontWeight:500,whiteSpace:'nowrap',borderRight:'1px solid #252d40',color:hl?'#3b82f6':'#d1d5db',background:hl?'rgba(59,130,246,0.1)':'transparent'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span>{col}</span>
                      {dtype&&<span style={{fontSize:9,fontFamily:'monospace',opacity:0.7,color:DTYPE_COLOR[dtype]||'#6b7280'}}>{dtype}</span>}
                    </div>
                    {nc>0&&<div style={{fontSize:9,fontFamily:'monospace',color:'#d97706',marginTop:2}}>{nc} null</div>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row,ri)=>(
              <tr key={ri} style={{borderBottom:'1px solid rgba(37,45,64,0.5)'}}>
                {columns.map(col=>{
                  const val=row[col]; const isNull=val===null||val===undefined||val===''; const hl=highlightColumns.includes(col);
                  return (
                    <td key={col} style={{padding:'6px 12px',fontSize:12,fontFamily:'monospace',whiteSpace:'nowrap',borderRight:'1px solid rgba(37,45,64,0.3)',color:isNull?'#4b5563':'#d1d5db',fontStyle:isNull?'italic':'normal',background:hl?'rgba(59,130,246,0.05)':'transparent'}}>
                      {isNull?'null':typeof val==='boolean'?<span style={{color:val?'#22c55e':'#ef4444'}}>{String(val)}</span>:String(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalRows!==undefined&&<div style={{padding:'6px 16px',borderTop:'1px solid #252d40',fontSize:11,color:'#6b7280',fontFamily:'monospace'}}>Showing {rows.length} of {totalRows.toLocaleString()} rows</div>}
    </div>
  );
}
