import { useState } from 'react';
const CONF={high:'#22c55e',medium:'#f59e0b',low:'#6b7280'};
const SCOL={critical:'#f87171',warning:'#fbbf24',info:'#60a5fa'};
export default function ExplanationPanel({ explanations }) {
  const [expanded, setExpanded] = useState(0);
  if (!explanations||explanations.length===0) return <div style={{textAlign:'center',padding:24,color:'#4b5563',fontSize:13}}>No explanations yet.</div>;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {explanations.map((exp,i)=>{
        const isOpen=expanded===i;
        return (
          <div key={i} style={{background:'#161b27',border:'1px solid #252d40',borderRadius:8,overflow:'hidden',cursor:'pointer'}} onClick={()=>setExpanded(isOpen?null:i)}>
            <div style={{padding:'10px 12px',display:'flex',alignItems:'center',gap:8,background:'#1e2535'}}>
              <span style={{fontSize:13,color:SCOL[exp.severity]||'#6b7280'}}>💡</span>
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:0,fontSize:12,fontWeight:500,color:'#e5e7eb',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{exp.summary}</p>
                {exp.column&&<p style={{margin:0,fontSize:10,fontFamily:'monospace',color:'#6b7280',marginTop:2}}>{exp.column}</p>}
              </div>
              <span style={{fontSize:10,padding:'2px 7px',border:'1px solid '+(CONF[exp.confidence]||'#6b7280'),borderRadius:4,color:CONF[exp.confidence]||'#6b7280',flexShrink:0}}>{exp.confidence}</span>
              <span style={{fontSize:10,color:'#4b5563'}}>{isOpen?'▲':'▼'}</span>
            </div>
            {isOpen&&(
              <div style={{padding:12,borderTop:'1px solid #252d40',display:'flex',flexDirection:'column',gap:10,fontSize:12}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                  <span style={{color:'#3b82f6',flexShrink:0}}>✓</span>
                  <div><p style={{margin:'0 0 3px',fontSize:10,color:'#6b7280',textTransform:'uppercase',letterSpacing:0.5}}>Likely Cause</p><p style={{margin:0,color:'#e5e7eb',lineHeight:1.6}}>{exp.likely_cause}</p></div>
                </div>
                {exp.recommended_checks&&exp.recommended_checks.length>0&&(
                  <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                    <span style={{color:'#f59e0b',flexShrink:0}}>🔍</span>
                    <div><p style={{margin:'0 0 4px',fontSize:10,color:'#6b7280',textTransform:'uppercase',letterSpacing:0.5}}>Checks</p>
                    <ul style={{margin:0,padding:0,listStyle:'none'}}>
                      {exp.recommended_checks.map((c,ci)=><li key={ci} style={{color:'#d1d5db',marginBottom:2}}>• {c}</li>)}
                    </ul></div>
                  </div>
                )}
                <div style={{display:'flex',alignItems:'flex-start',gap:8,background:'#0f1117',borderRadius:8,padding:10}}>
                  <span style={{color:'#22c55e',flexShrink:0}}>🔧</span>
                  <div><p style={{margin:'0 0 3px',fontSize:10,color:'#6b7280',textTransform:'uppercase',letterSpacing:0.5}}>Suggested Fix</p><p style={{margin:0,color:'#e5e7eb',lineHeight:1.6}}>{exp.suggested_fix}</p></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
