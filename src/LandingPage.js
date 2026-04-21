import { useNavigate } from 'react-router-dom';

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#030712;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
  @keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}
  .card-hover{transition:transform 0.3s ease,box-shadow 0.3s ease,border-color 0.3s ease;}
  .finder-card:hover{transform:translateY(-8px);border-color:#3b82f6!important;box-shadow:0 32px 80px rgba(59,130,246,0.2)!important;}
  .debugger-card:hover{transform:translateY(-8px);border-color:#8b5cf6!important;box-shadow:0 32px 80px rgba(139,92,246,0.2)!important;}
  .viz-card:hover{transform:translateY(-8px);border-color:#10b981!important;box-shadow:0 32px 80px rgba(16,185,129,0.2)!important;}
  .analyzer-card:hover{transform:translateY(-8px);border-color:#f59e0b!important;box-shadow:0 32px 80px rgba(245,158,11,0.2)!important;}
  .insights-card:hover{transform:translateY(-8px);border-color:#a855f7!important;box-shadow:0 32px 80px rgba(168,85,247,0.2)!important;}
  .btn-violet{transition:all 0.2s;}
  .btn-violet:hover{transform:scale(1.04);box-shadow:0 8px 32px rgba(168,85,247,0.4);}
  .btn-blue{transition:all 0.2s;}
  .btn-blue:hover{transform:scale(1.04);box-shadow:0 8px 32px rgba(59,130,246,0.4);}
  .btn-purple{transition:all 0.2s;}
  .btn-purple:hover{transform:scale(1.04);box-shadow:0 8px 32px rgba(139,92,246,0.4);}
  .btn-green{transition:all 0.2s;}
  .btn-green:hover{transform:scale(1.04);box-shadow:0 8px 32px rgba(16,185,129,0.4);}
  .btn-amber{transition:all 0.2s;}
  .btn-amber:hover{transform:scale(1.04);box-shadow:0 8px 32px rgba(245,158,11,0.4);}
`;

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div style={{minHeight:'100vh',background:'radial-gradient(ellipse at 20% 50%,rgba(29,78,216,0.07) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(139,92,246,0.07) 0%,transparent 60%),radial-gradient(ellipse at 50% 90%,rgba(16,185,129,0.05) 0%,transparent 60%),#030712',fontFamily:"'Syne',sans-serif",color:'#e0e8ff',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 20px',position:'relative',overflow:'hidden'}}>
      <style>{CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(30,58,138,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(30,58,138,0.06) 1px,transparent 1px)',backgroundSize:'60px 60px',pointerEvents:'none'}}/>
      <div style={{position:'absolute',top:'10%',left:'15%',width:300,height:300,borderRadius:'50%',background:'rgba(59,130,246,0.05)',filter:'blur(80px)',animation:'pulse 4s ease-in-out infinite',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:'15%',right:'10%',width:400,height:400,borderRadius:'50%',background:'rgba(139,92,246,0.05)',filter:'blur(100px)',animation:'pulse 5s ease-in-out infinite 1s',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:'5%',left:'40%',width:300,height:300,borderRadius:'50%',background:'rgba(16,185,129,0.04)',filter:'blur(80px)',animation:'pulse 6s ease-in-out infinite 2s',pointerEvents:'none'}}/>

      <div style={{position:'relative',zIndex:1,width:'100%',maxWidth:1100,animation:'fadeUp 0.6s ease forwards'}}>
        <div style={{display:'flex',justifyContent:'center',marginBottom:24}}>
          <div style={{padding:'6px 16px',background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.3)',borderRadius:24,fontSize:11,color:'#6fa3ef',fontFamily:"'Space Mono',monospace",letterSpacing:1}}>🧪 DATA RESEARCH SUITE</div>
        </div>
        <h1 style={{textAlign:'center',fontSize:'clamp(40px,6vw,72px)',fontWeight:800,lineHeight:1.1,marginBottom:16,letterSpacing:'-0.02em'}}>
          <span style={{color:'#e0e8ff'}}>Data</span><span style={{background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Lab</span>
        </h1>
        <p style={{textAlign:'center',color:'#6b7a9a',fontSize:'clamp(14px,2vw,18px)',maxWidth:520,margin:'0 auto 52px',lineHeight:1.6}}>
          Find the right dataset, clean &amp; debug it, then visualise it — all in one place.
        </p>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:24,marginBottom:40}}>

          {/* Card 1 — Finder */}
          <div className="card-hover finder-card" onClick={() => navigate('/finder')} style={{background:'rgba(8,15,40,0.92)',border:'1px solid rgba(30,58,138,0.4)',borderRadius:24,padding:36,cursor:'pointer',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,right:0,width:200,height:200,background:'rgba(59,130,246,0.04)',borderRadius:'50%',transform:'translate(50%,-50%)',pointerEvents:'none'}}/>
            <div style={{fontSize:48,marginBottom:20,display:'inline-block',animation:'float 3s ease-in-out infinite'}}>🔍</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <h2 style={{fontSize:24,fontWeight:800,color:'#e0e8ff',margin:0}}>Dataset Finder</h2>
              <span style={{padding:'2px 8px',background:'rgba(59,130,246,0.15)',border:'1px solid rgba(59,130,246,0.3)',borderRadius:6,fontSize:10,color:'#6fa3ef',fontFamily:"'Space Mono',monospace"}}>AI-POWERED</span>
            </div>
            <p style={{color:'#6b7a9a',fontSize:14,lineHeight:1.7,marginBottom:28}}>Search, rank and discover the perfect dataset for your research idea. Scored across 7 reliability factors including citations, credibility, documentation and more.</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:28}}>
              {['🤖 AI Ranking','📚 7 Reliability Factors','💾 Save & Collect','📄 PDF Export'].map(f=>(
                <span key={f} style={{padding:'4px 10px',background:'rgba(30,58,138,0.2)',border:'1px solid rgba(30,58,138,0.4)',borderRadius:20,fontSize:11,color:'#8899bb'}}>{f}</span>
              ))}
            </div>
            <button className="btn-blue" style={{width:'100%',padding:14,border:'none',borderRadius:12,background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'Syne',sans-serif"}}>Find a Dataset →</button>
          </div>

          {/* Card 2 — Debugger + Cleaner */}
          <div className="card-hover debugger-card" onClick={() => navigate('/debugger')} style={{background:'rgba(10,8,30,0.92)',border:'1px solid rgba(109,40,217,0.3)',borderRadius:24,padding:36,cursor:'pointer',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,right:0,width:200,height:200,background:'rgba(139,92,246,0.04)',borderRadius:'50%',transform:'translate(50%,-50%)',pointerEvents:'none'}}/>
            <div style={{fontSize:48,marginBottom:20,display:'inline-block',animation:'float 3.5s ease-in-out infinite 0.5s'}}>🧹</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,flexWrap:'wrap'}}>
              <h2 style={{fontSize:24,fontWeight:800,color:'#e0e8ff',margin:0}}>Debugger &amp; Cleaner</h2>
            </div>
            <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
              <span style={{padding:'2px 8px',background:'rgba(139,92,246,0.15)',border:'1px solid rgba(139,92,246,0.3)',borderRadius:6,fontSize:10,color:'#a78bfa',fontFamily:"'Space Mono',monospace"}}>PIPELINE</span>
              <span style={{padding:'2px 8px',background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.3)',borderRadius:6,fontSize:10,color:'#818cf8',fontFamily:"'Space Mono',monospace"}}>ML CLEANING</span>
            </div>
            <p style={{color:'#6b7a9a',fontSize:14,lineHeight:1.7,marginBottom:28}}>Upload a CSV and let ML auto-detect what needs fixing per column — or build your own transformation pipeline step by step. Full anomaly detection and root cause explanations included.</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:28}}>
              {['✨ Auto-Clean ML','📊 Step Snapshots','⚠️ Anomaly Detection','🔍 Root Cause AI'].map(f=>(
                <span key={f} style={{padding:'4px 10px',background:'rgba(109,40,217,0.15)',border:'1px solid rgba(109,40,217,0.3)',borderRadius:20,fontSize:11,color:'#a78bfa'}}>{f}</span>
              ))}
            </div>
            <button className="btn-purple" style={{width:'100%',padding:14,border:'none',borderRadius:12,background:'linear-gradient(135deg,#6d28d9,#8b5cf6)',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'Syne',sans-serif"}}>Debug &amp; Clean →</button>
          </div>

          {/* Card 3 — Visualizer */}
          <div className="card-hover viz-card" onClick={() => navigate('/visualizer')} style={{background:'rgba(2,14,12,0.92)',border:'1px solid rgba(6,95,70,0.4)',borderRadius:24,padding:36,cursor:'pointer',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,right:0,width:200,height:200,background:'rgba(16,185,129,0.04)',borderRadius:'50%',transform:'translate(50%,-50%)',pointerEvents:'none'}}/>
            <div style={{fontSize:48,marginBottom:20,display:'inline-block',animation:'float 4s ease-in-out infinite 1s'}}>📊</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <h2 style={{fontSize:24,fontWeight:800,color:'#e0e8ff',margin:0}}>Data Visualizer</h2>
              <span style={{padding:'2px 8px',background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:6,fontSize:10,color:'#6ee7b7',fontFamily:"'Space Mono',monospace"}}>CHARTS</span>
            </div>
            <p style={{color:'#6b7a9a',fontSize:14,lineHeight:1.7,marginBottom:28}}>Build an interactive dashboard from your CSV. Bar, Line, Area, Scatter, Pie charts plus Pivot Matrix, KPI cards, Calculated Fields, and per-visual Filters.</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:28}}>
              {['📊 Bar/Line/Area','🔲 Pivot Matrix','🎯 KPI Cards','𝒇 Calc Fields','⚙ Filters'].map(f=>(
                <span key={f} style={{padding:'4px 10px',background:'rgba(6,95,70,0.2)',border:'1px solid rgba(6,95,70,0.4)',borderRadius:20,fontSize:11,color:'#6ee7b7'}}>{f}</span>
              ))}
            </div>
            <button className="btn-green" style={{width:'100%',padding:14,border:'none',borderRadius:12,background:'linear-gradient(135deg,#065f46,#10b981)',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'Syne',sans-serif"}}>Visualise Data →</button>
          </div>

          {/* Card 4 — Statistical Analyzer */}
          <div className="card-hover analyzer-card" onClick={() => navigate('/analyzer')} style={{background:'rgba(14,10,3,0.92)',border:'1px solid rgba(120,70,0,0.4)',borderRadius:24,padding:36,cursor:'pointer',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,right:0,width:200,height:200,background:'rgba(245,158,11,0.04)',borderRadius:'50%',transform:'translate(50%,-50%)',pointerEvents:'none'}}/>
            <div style={{fontSize:48,marginBottom:20,display:'inline-block',animation:'float 4.5s ease-in-out infinite 1.5s'}}>📐</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <h2 style={{fontSize:24,fontWeight:800,color:'#e0e8ff',margin:0}}>Stat Analyzer</h2>
              <span style={{padding:'2px 8px',background:'rgba(245,158,11,0.15)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:6,fontSize:10,color:'#fbbf24',fontFamily:"'Space Mono',monospace"}}>SCIPY</span>
            </div>
            <p style={{color:'#6b7a9a',fontSize:14,lineHeight:1.7,marginBottom:28}}>Upload a CSV and instantly get mean, median, std, quartiles, skewness, outlier counts, normality tests, missing-value analysis and a full Pearson correlation matrix.</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:28}}>
              {['📊 Distributions','🔗 Correlation','⚠️ Outliers','🔬 Normality','📋 Top Values'].map(f=>(
                <span key={f} style={{padding:'4px 10px',background:'rgba(120,70,0,0.2)',border:'1px solid rgba(120,70,0,0.4)',borderRadius:20,fontSize:11,color:'#fbbf24'}}>{f}</span>
              ))}
            </div>
            <button className="btn-amber" style={{width:'100%',padding:14,border:'none',borderRadius:12,background:'linear-gradient(135deg,#92400e,#f59e0b)',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'Syne',sans-serif"}}>Analyse Stats →</button>
          </div>

          {/* Card 5 — AI Insights Engine */}
          <div className="card-hover insights-card" onClick={() => navigate('/insights')} style={{background:'rgba(12,6,30,0.92)',border:'1px solid rgba(109,40,217,0.3)',borderRadius:24,padding:36,cursor:'pointer',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,right:0,width:200,height:200,background:'rgba(168,85,247,0.04)',borderRadius:'50%',transform:'translate(50%,-50%)',pointerEvents:'none'}}/>
            <div style={{fontSize:48,marginBottom:20,display:'inline-block',animation:'float 5s ease-in-out infinite 2s'}}>🤖</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,flexWrap:'wrap'}}>
              <h2 style={{fontSize:24,fontWeight:800,color:'#e0e8ff',margin:0}}>AI Insights Engine</h2>
            </div>
            <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
              <span style={{padding:'2px 8px',background:'rgba(168,85,247,0.15)',border:'1px solid rgba(168,85,247,0.3)',borderRadius:6,fontSize:10,color:'#d8b4fe',fontFamily:"'Space Mono',monospace"}}>STATISTICAL</span>
              <span style={{padding:'2px 8px',background:'rgba(124,58,237,0.15)',border:'1px solid rgba(124,58,237,0.3)',borderRadius:6,fontSize:10,color:'#a78bfa',fontFamily:"'Space Mono',monospace"}}>AUTO CHARTS</span>
            </div>
            <p style={{color:'#6b7a9a',fontSize:14,lineHeight:1.7,marginBottom:28}}>Upload a dataset and get automatically detected relationships, trends, and patterns as clickable insight cards. Click any card to generate a chart and explanation instantly.</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:28}}>
              {['🔗 Correlations','📅 Trends','📊 Group Diffs','⚠️ Data Quality','🎨 Customize'].map(f=>(
                <span key={f} style={{padding:'4px 10px',background:'rgba(109,40,217,0.15)',border:'1px solid rgba(109,40,217,0.3)',borderRadius:20,fontSize:11,color:'#c4b5fd'}}>{f}</span>
              ))}
            </div>
            <button className="btn-violet" style={{width:'100%',padding:14,border:'none',borderRadius:12,background:'linear-gradient(135deg,#5b21b6,#a855f7)',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'Syne',sans-serif"}}>Explore Insights →</button>
          </div>

        </div>

        <div style={{textAlign:'center',padding:'18px 24px',background:'rgba(14,24,58,0.5)',border:'1px solid rgba(30,58,138,0.2)',borderRadius:16,maxWidth:700,margin:'0 auto'}}>
          <p style={{color:'#4a5a7a',fontSize:13,lineHeight:1.7,margin:0}}>💡 <strong style={{color:'#6b7a9a'}}>Recommended workflow:</strong> Use <strong style={{color:'#6fa3ef'}}>Finder</strong> to discover a dataset → <strong style={{color:'#a78bfa'}}>Debugger &amp; Cleaner</strong> to validate and auto-clean it → <strong style={{color:'#fbbf24'}}>Stat Analyzer</strong> to understand distributions → <strong style={{color:'#d8b4fe'}}>AI Insights</strong> to discover relationships automatically → <strong style={{color:'#6ee7b7'}}>Visualizer</strong> to build your dashboard.</p>
        </div>
      </div>
    </div>
  );
}
