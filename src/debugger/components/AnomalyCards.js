import { useState } from 'react';
const SEV = {
  critical:{ bg:'rgba(127,29,29,0.3)', border:'rgba(239,68,68,0.4)', color:'#fca5a5', label:'Critical', icon:'⛔' },
  warning: { bg:'rgba(120,53,15,0.3)', border:'rgba(245,158,11,0.4)', color:'#fcd34d', label:'Warning',  icon:'⚠️' },
  info:    { bg:'rgba(30,58,138,0.2)', border:'rgba(59,130,246,0.4)', color:'#93c5fd', label:'Info',     icon:'ℹ️' },
};
export default function AnomalyCards({ anomalies }) {
  const [expanded, setExpanded] = useState(0);
  if (!anomalies || anomalies.length === 0) return <div style={{textAlign:'center',padding:24,color:'#4b5563',fontSize:13}}><div style={{fontSize:20,marginBottom:8}}>✓</div>No anomalies detected.</div>;
  const criticals = anomalies.filter(a=>a.severity==='critical').length;
  const warnings  = anomalies.filter(a=>a.severity==='warning').length;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,fontSize:12}}>
        <span style={{color:'#6b7280'}}>{anomalies.length} issue{anomalies.length!==1?'s':''}</span>
        {criticals>0&&<span style={{padding:'2px 8px',background:'rgba(127,29,29,0.3)',border:'1px solid rgba(239,68,68,0.4)',borderRadius:6,fontSize:11,color:'#fca5a5'}}>{criticals} critical</span>}
        {warnings>0&&<span style={{padding:'2px 8px',background:'rgba(120,53,15,0.3)',border:'1px solid rgba(245,158,11,0.4)',borderRadius:6,fontSize:11,color:'#fcd34d'}}>{warnings} warning</span>}
      </div>
      {anomalies.map((a,i)=>{
        const s=SEV[a.severity]||SEV.info; const isOpen=expanded===i;
        return (
          <div key={i} onClick={()=>setExpanded(isOpen?null:i)} style={{background:s.bg,border:'1px solid '+s.border,borderRadius:8,cursor:'pointer',overflow:'hidden'}}>
            <div style={{padding:'10px 12px',display:'flex',alignItems:'flex-start',gap:8}}>
              <span style={{fontSize:13,flexShrink:0,marginTop:1}}>{s.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                  <span style={{fontSize:10,fontWeight:600,color:s.color,textTransform:'uppercase',letterSpacing:0.5}}>{s.label}</span>
                  {a.column&&<span style={{fontSize:10,fontFamily:'monospace',color:'#6b7280'}}>{a.column}</span>}
                </div>
                <p style={{margin:0,fontSize:12,color:s.color,lineHeight:1.5}}>{a.message}</p>
                {a.value!=null&&<div style={{marginTop:4,fontSize:10,fontFamily:'monospace',opacity:0.7,color:s.color}}>value: {String(a.value)}{a.threshold!=null?' (threshold: '+a.threshold+')':''}</div>}
              </div>
              <span style={{fontSize:10,color:'#4b5563',flexShrink:0}}>{isOpen?'▲':'▼'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
