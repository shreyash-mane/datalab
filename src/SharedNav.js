import { useNavigate, useLocation } from 'react-router-dom';

export default function SharedNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isFinder   = pathname.startsWith('/finder');
  const isDebugger = pathname.startsWith('/debugger');
  const isVisualizer = pathname.startsWith('/visualizer');
  const isAnalyzer  = pathname.startsWith('/analyzer');
  const isInsights  = pathname.startsWith('/insights');
  const navBtn = (active, color, label, path) => (
    <button onClick={() => navigate(path)} style={{padding:'5px 14px',borderRadius:8,border: active ? `1px solid ${color}50` : '1px solid transparent',background: active ? `${color}15` : 'transparent',color: active ? color : '#4a5a7a',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'Syne',sans-serif",transition:'all 0.15s'}}>
      {label}
    </button>
  );
  return (
    <div style={{background:'rgba(3,7,18,0.95)',borderBottom:'1px solid rgba(30,58,138,0.25)',padding:'0 20px',height:52,display:'flex',alignItems:'center',gap:20,position:'sticky',top:0,zIndex:1000,backdropFilter:'blur(12px)',fontFamily:"'Syne',sans-serif"}}>
      <div onClick={() => navigate('/')} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',userSelect:'none',flexShrink:0}}>
        <div style={{width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#1d4ed8,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>🧪</div>
        <span style={{fontWeight:800,fontSize:15,color:'#e0e8ff',letterSpacing:'-0.01em'}}>DataLab</span>
      </div>
      <div style={{width:1,height:20,background:'rgba(30,58,138,0.4)'}}/>
      <div style={{display:'flex',gap:4}}>
        {navBtn(isFinder,    '#6fa3ef', '🔍 Finder',    '/finder')}
        {navBtn(isDebugger,  '#a78bfa', '🧹 Debugger',  '/debugger')}
        {navBtn(isVisualizer,'#6ee7b7', '📊 Visualizer','/visualizer')}
        {navBtn(isAnalyzer,  '#fbbf24', '📐 Analyzer',  '/analyzer')}
        {navBtn(isInsights,  '#a855f7', '🤖 AI Insights','/insights')}
      </div>
      <div style={{marginLeft:'auto',fontSize:11,color:'#1e3a8a',fontFamily:"'Space Mono',monospace"}}>
        {isFinder && '● FINDER'}{isDebugger && '● DEBUGGER'}{isVisualizer && '● VISUALIZER'}{isAnalyzer && '● ANALYZER'}{isInsights && '● AI INSIGHTS'}
      </div>
    </div>
  );
}
