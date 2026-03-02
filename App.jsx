import { useState, useEffect, useRef, useCallback } from "react";

const STATES = ["Sunny", "Rainy", "Cloudy"];
const COLORS = { Sunny: "#f59e0b", Rainy: "#60a5fa", Cloudy: "#a78bfa" };
const GRAD = { Sunny: ["#f59e0b","#ef4444"], Rainy: ["#3b82f6","#06b6d4"], Cloudy: ["#8b5cf6","#6366f1"] };
const ICONS = { Sunny: "☀️", Rainy: "🌧️", Cloudy: "⛅" };
const BG = "#07090f";
const CARD = "#0d1117";
const BORDER = "#1e2d3d";

const MATRIX = [
  [0.7, 0.2, 0.1],
  [0.3, 0.4, 0.3],
  [0.2, 0.3, 0.5],
];

function mulVM(v, M) {
  return M[0].map((_, j) => v.reduce((s, vi, i) => s + vi * M[i][j], 0));
}
function stationary(M, n = 300) {
  let v = [1/3,1/3,1/3];
  for (let i=0;i<n;i++) v = mulVM(v,M);
  return v;
}
const STAT = stationary(MATRIX);

const NODE_POS = [
  { x: 260, y: 90 },
  { x: 105, y: 300 },
  { x: 415, y: 300 },
];

function lerp(a,b,t){ return a+(b-a)*t; }

function CurvedArrow({ i, j, prob, dimmed, active }) {
  const from = NODE_POS[i], to = NODE_POS[j];
  const isSelf = i===j;
  const baseColor = COLORS[STATES[i]];
  const color = active ? baseColor : dimmed ? "#1e2d3d" : "#2e3f52";
  const tw = active ? 3.5 : dimmed ? 1 : 1.8;
  const opacity = active ? 1 : dimmed ? 0.12 : 0.45;

  if (isSelf) {
    const cx = from.x, cy = from.y;
    const sweep = i===0 ? `M${cx-34} ${cy-10} C${cx-75} ${cy-80} ${cx+75} ${cy-80} ${cx+34} ${cy-10}`
      : i===1 ? `M${cx-10} ${cy-34} C${cx-80} ${cy-75} ${cx-80} ${cy+75} ${cx-10} ${cy+34}`
      : `M${cx+10} ${cy-34} C${cx+80} ${cy-75} ${cx+80} ${cy+75} ${cx+10} ${cy+34}`;
    const lx = i===0?cx:i===1?cx-88:cx+88, ly=i===0?cy-88:cy;
    return (
      <g opacity={opacity} style={{transition:"all 0.4s"}}>
        <defs><marker id={`ah${i}${j}`} markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill={color}/></marker></defs>
        {active && <path d={sweep} fill="none" stroke={baseColor} strokeWidth={8} opacity={0.18}/>} 
        <path d={sweep} fill="none" stroke={color} strokeWidth={tw} markerEnd={`url(#ah${i}${j})`} strokeDasharray={active?"none":"none"}/>
        <text x={lx} y={ly} textAnchor="middle" fontSize={active?"13":"11"} fill={color} fontWeight="bold">{prob}</text>
      </g>
    );
  }

  const mx=(from.x+to.x)/2, my=(from.y+to.y)/2;
  const dx=to.x-from.x, dy=to.y-from.y, len=Math.sqrt(dx*dx+dy*dy);
  const nx=-dy/len, ny=dx/len;
  const bend=42;
  const qx=mx+nx*bend, qy=my+ny*bend;
  const t1=0.18, t2=0.82;
  const x1=lerp(lerp(from.x,qx,t1),lerp(qx,to.x,t1),t1);
  const y1=lerp(lerp(from.y,qy,t1),lerp(qy,to.y,t1),t1);
  const x2=lerp(lerp(from.x,qx,t2),lerp(qx,to.x,t2),t2);
  const y2=lerp(lerp(from.y,qy,t2),lerp(qy,to.y,t2),t2);
  const lx=qx+nx*14, ly=qy+ny*14;

  return (
    <g opacity={opacity} style={{transition:"all 0.4s"}}>
      <defs><marker id={`ah${i}${j}`} markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill={color}/></marker></defs>
      {active && <path d={`M${x1} ${y1} Q${qx} ${qy} ${x2} ${y2}`} fill="none" stroke={baseColor} strokeWidth={10} opacity={0.18}/>} 
      <path d={`M${x1} ${y1} Q${qx} ${qy} ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={tw} markerEnd={`url(#ah${i}${j})`}/>
      <text x={lx} y={ly} textAnchor="middle" fontSize={active?"13":"11"} fill={color} fontWeight="bold">{prob}</text>
    </g>
  );
}

function GlowNode({ i, active, prev, hovered, onHover }) {
  const s = STATES[i], pos = NODE_POS[i];
  const c = COLORS[s], [g1,g2] = GRAD[s];
  const gid = `ng${i}`;
  const pulse = active || hovered;
  const wasPrev = prev === i;
  return (
    <g style={{cursor:"pointer"}} onMouseEnter={()=>onHover(i)} onMouseLeave={()=>onHover(null)}>
      <defs>
        <radialGradient id={gid} cx="50%" cy="40%">
          <stop offset="0%" stopColor={g1}/>
          <stop offset="100%" stopColor={g2}/>
        </radialGradient>
        <filter id={`glow${i}`}> 
          <feGaussianBlur stdDeviation={active?10:wasPrev?5:hovered?6:2} result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic/></feMerge>
        </filter>
      </defs>
      {active && <circle cx={pos.x} cy={pos.y} r={58} fill={c} opacity={0.1}/>} 
      {wasPrev && !active && <circle cx={pos.x} cy={pos.y} r={46} fill={c} opacity={0.07}/>} 
      <circle cx={pos.x} cy={pos.y} r={38}
        fill={active?`url(#${gid})`:wasPrev?"#111827":"#0d1117"}
        stroke={active?c:wasPrev?c+"88":"#1e2d3d"}
        strokeWidth={active?3.5:wasPrev?2:1.5}
        filter={`url(#glow${i})`}
        style={{transition:"all 0.4s"}}/>
      <text x={pos.x} y={pos.y-8} textAnchor="middle" fontSize="22" style={{pointerEvents:"none"}}>{ICONS[s]}</text>
      <text x={pos.x} y={pos.y+15} textAnchor="middle" fontSize="11.5" fill={active?"#fff":wasPrev?c+"cc":"#475569"} fontWeight="bold" style={{pointerEvents:"none"}}>{s}</text>
    </g>
  );
}

// Animated travel dot along a quadratic bezier
function TravelDot({ from, to, color, visible }) {
  const [t, setT] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const dur = 500; // ms

  useEffect(() => {
    if (!visible) { setT(0); return; }
    startRef.current = null;
    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / dur, 1);
      // ease in-out
      const eased = progress < 0.5 ? 2*progress*progress : -1+(4-2*progress)*progress;
      setT(eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible, from, to]);

  if (!visible || from === null || to === null) return null;

  const isSelf = from === to;
  const fPos = NODE_POS[from], tPos = NODE_POS[to];

  let x, y;
  if (isSelf) {
    // approximate arc midpoint
    const cx = fPos.x, cy = fPos.y;
    const angle = t * Math.PI * 2;
    x = cx + Math.sin(angle) * 52;
    y = cy - Math.cos(angle) * 40;
  } else {
    const mx=(fPos.x+tPos.x)/2, my=(fPos.y+tPos.y)/2;
    const dx=tPos.x-fPos.x, dy=tPos.y-fPos.y, len=Math.sqrt(dx*dx+dy*dy);
    const nx=-dy/len, ny=dx/len;
    const qx=mx+nx*42, qy=my+ny*42;
    x = (1-t)*(1-t)*fPos.x + 2*(1-t)*t*qx + t*t*tPos.x;
    y = (1-t)*(1-t)*fPos.y + 2*(1-t)*t*qy + t*t*tPos.y;
  }

  return (
    <g>
      <circle cx={x} cy={y} r={9} fill={color} opacity={0.25}/>
      <circle cx={x} cy={y} r={5} fill={color} opacity={0.9}/>
    </g>
  );
}

function Sparkline({ data, color }) {
  if (data.length < 2) return null;
  const w=120, h=32, pad=4;
  const min=Math.min(...data), max=Math.max(...data)||1;
  const pts = data.map((v,i)=>{
    const x=pad+i*(w-2*pad)/(data.length-1);
    const y=h-pad-(v-min)/(max-min||1)*(h-2*pad);
    return `${x},${y}`;
  }).join(" ");
  const last = pts.split(" ").at(-1).split(",");
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <circle cx={last[0]} cy={last[1]} r="3" fill={color}/>
    </svg>
  );
}

function DistBar({ label, icon, value, statVal, color }) {
  return (
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
        <span style={{color,fontWeight:"bold",fontSize:13}}>{icon} {label}</span>
        <div style={{display:"flex",gap:16}}>
          <span style={{color:"#64748b",fontSize:11}}>Current</span>
          <span style={{color:"#64748b",fontSize:11}}>Stationary</span>
        </div>
      </div>
      <div style={{position:"relative",height:10,background:"#0d1117",borderRadius:8,overflow:"hidden",marginBottom:4}}>
        <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${value*100}%",background:`linear-gradient(90deg,${color}aa,${color})`,borderRadius:8,transition:"width 0.6s cubic-bezier(.4,0,.2,1)"}}/>
        <div style={{position:"absolute",left:`${statVal*100}%`,top:-2,height:14,width:2,background:"#f8fafc",borderRadius:2,transform:"translateX(-50%)"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#64748b"}}>
        <span style={{color}}>{(value*100).toFixed(1)}%</span>
        <span style={{color:"#94a3b8"}}>π = {(statVal*100).toFixed(1)}%</span>
      </div>
    </div>
  );
}

function Card({ children, style={} }) {
  return <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,padding:18,...style}}>{children}</div>;
}
function SectionTitle({ children }) {
  return <div style={{fontSize:13,color:"#64748b",fontWeight:"bold",letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>{children}</div>;
}

const TAB_META = [
  {id:"simulate", label:"Simulate", icon:"🎮"},
  {id:"analytics", label:"Analytics", icon:"📊"},
  {id:"theory",   label:"Theory",   icon:"🧮"},
];

export default function App() {
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState(null);
  const [history, setHistory] = useState([0]);
  const [dist, setDist] = useState([1,0,0]);
  const [tab, setTab] = useState("simulate");
  const [hovered, setHovered] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [animating, setAnimating] = useState(false);
  const [dotKey, setDotKey] = useState(0);
  const stepRef = useRef(null);

  const doStep = useCallback(() => {
    setCur(prev => {
      const r=Math.random(); let next=0,cum=0;
      for(let i=0;i<3;i++){cum+=MATRIX[prev][i];if(r<cum){next=i;break;}}
      setPrev(prev);
      setHistory(h=>[...h.slice(-59),next]);
      setDist(d=>mulVM(d,MATRIX));
      setAnimating(true);
      setDotKey(k=>k+1);
      setTimeout(()=>setAnimating(false), 550);
      return next;
    });
  },[]);

  useEffect(()=>{
    if(autoPlay){ stepRef.current=setInterval(doStep,speed); }
    else clearInterval(stepRef.current);
    return ()=>clearInterval(stepRef.current);
  },[autoPlay,speed,doStep]);

  const reset = () => { setCur(0); setPrev(null); setHistory([0]); setDist([1,0,0]); setAutoPlay(false); setAnimating(false); };

  const stateCounts = STATES.map((_,i)=>history.filter(h=>h===i).length);
  const empFreq = stateCounts.map(c=>c/history.length);
  const sparkData = STATES.map((_,si)=>{
    const window=Math.min(history.length,20);
    const recent=history.slice(-window);
    const out=[];
    for(let i=1;i<=window;i++){
      const chunk=recent.slice(0,i);
      out.push(chunk.filter(x=>x===si).length/chunk.length);
    }
    return out;
  });

  // which arrow is the active transition
  const activeFrom = animating ? prev : null;
  const activeTo   = animating ? cur  : null;

  return (
    <div style={{background:BG,minHeight:"100vh",color:"#e2e8f0",fontFamily:"'Inter',system-ui,sans-serif",maxWidth:680,margin:"0 auto",padding:"20px 14px 40px"}}>
      {/* Header */}
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:11,letterSpacing:3,color:"#3b82f6",textTransform:"uppercase",marginBottom:6,fontWeight:600}}>Interactive Learning</div>
        <h1 style={{fontSize:26,fontWeight:800,background:"linear-gradient(90deg,#60a5fa,#a78bfa,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:0}}>
          Markov Chain Explorer
        </h1>
        <p style={{color:"#475569",fontSize:13,marginTop:6}}>Weather Model · State-Space Diagram · Analytical Deep Dive</p>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:4,marginBottom:20,gap:4}}>
        {TAB_META.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"9px 0",border:"none",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:"bold",transition:"all 0.25s",
            background:tab===t.id?"linear-gradient(135deg,#1d4ed8,#6d28d9)":"transparent",
            color:tab===t.id?"#fff":"#64748b",boxShadow:tab===t.id?"0 2px 12px #6d28d944":""
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* ─── SIMULATE TAB ─── */}
      {tab==="simulate" && (<>
        {/* State diagram */}
        <Card style={{marginBottom:14,padding:10}}>
          {/* Transition label above diagram */}
          {prev !== null && (
            <div style={{textAlign:"center",marginBottom:4,fontSize:13,color:"#94a3b8",minHeight:22,transition:"all 0.3s"}}>
              {animating
                ? <span>{ICONS[STATES[prev]]} <span style={{color:COLORS[STATES[prev]],fontWeight:"bold"}}>{STATES[prev]}</span> <span style={{color:"#475569"}}>→</span> {ICONS[STATES[cur]]} <span style={{color:COLORS[STATES[cur]],fontWeight:"bold"}}>{STATES[cur]}</span></span>
                : <span style={{color:"#334155"}}>{ICONS[STATES[prev]]} {STATES[prev]} → {ICONS[STATES[cur]]} {STATES[cur]}</span>
              }
            </div>
          )}
          <svg viewBox="0 0 520 390" width="100%" height="auto">
            {/* non-active arrows first (background) */}
            {STATES.map((_,i)=>STATES.map((_,j)=>{
              if(MATRIX[i][j]===0) return null;
              const isActive = activeFrom===i && activeTo===j;
              const dim = activeFrom!==null && !isActive;
              return !isActive && (
                <CurvedArrow key={`${i}${j}`} i={i} j={j} prob={MATRIX[i][j].toFixed(1)} dimmed={dim} active={false}/>
              );
            }))}
            {/* active arrow on top */}
            {activeFrom!==null && MATRIX[activeFrom][activeTo]>0 && (
              <CurvedArrow i={activeFrom} j={activeTo} prob={MATRIX[activeFrom][activeTo].toFixed(1)} dimmed={false} active={true}/>
            )}
            {/* Animated dot */}
            <TravelDot key={dotKey} from={prev} to={cur} color={prev!==null?COLORS[STATES[prev]]:"#fff"} visible={animating}/>
            {/* Nodes */}
            {STATES.map((_,i)=>(
              <GlowNode key={i} i={i} active={cur===i} prev={animating?null:prev} hovered={hovered===i} onHover={setHovered}/>
            ))}
            <text x="260" y="378" textAnchor="middle" fontSize="11.5" fill="#2e3f52">Hover a node to highlight its transitions</text>
          </svg>
        </Card>

        {/* Current state panel */}
        <Card style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{fontSize:40}}>{ICONS[STATES[cur]]}</div>
            <div>
              <div style={{fontSize:11,color:"#475569",textTransform:"uppercase",letterSpacing:1}}>Current State · Step {history.length}</div>
              <div style={{fontSize:22,fontWeight:800,color:COLORS[STATES[cur]]}}>{STATES[cur]}</div>
            </div>
            <div style={{marginLeft:"auto",textAlign:"right"}}>
              <div style={{fontSize:11,color:"#475569"}}>Times visited</div>
              <div style={{fontSize:20,fontWeight:700,color:"#f8fafc"}}>{stateCounts[cur]}</div>
            </div>
          </div>
          <div style={{fontSize:11,color:"#64748b",marginBottom:8,fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>Tomorrow's Probabilities</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {STATES.map((s,j)=>(
              <div key={s} style={{background:BG,borderRadius:10,padding:"10px 8px",textAlign:"center",border:`1px solid ${MATRIX[cur][j]>0.4?COLORS[s]+"55":BORDER}",transition:"border 0.3s"}}>
                <div style={{fontSize:20}}>{ICONS[s]}</div>
                <div style={{fontSize:11,color:COLORS[s],fontWeight:"bold",margin:"2px 0"}}>{s}</div>
                <div style={{fontSize:20,fontWeight:800,color:"#f8fafc"}}>{(MATRIX[cur][j]*100).toFixed(0)}<span style={{fontSize:11}}>%</span></div>
                <div style={{height:4,background:COLORS[s],borderRadius:4,opacity:MATRIX[cur][j],marginTop:4}}/>
              </div>
            ))}
          </div>
        </Card>

        {/* Controls */}
        <Card style={{marginBottom:14}}>
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            <button onClick={doStep} disabled={animating} style={{flex:1,minWidth:110,background:"linear-gradient(135deg,#1d4ed8,#6d28d9)",color:"#fff",border:"none",borderRadius:10,padding:"11px 0",fontSize:14,cursor:animating?"not-allowed":"pointer",fontWeight:"bold",opacity:animating?0.6:1}}>
              ▶ Next Day
            </button>
            <button onClick={()=>setAutoPlay(a=>!a)} style={{flex:1,minWidth:110,background:autoPlay?"#dc2626":"#064e3b",color:"#fff",border:"none",borderRadius:10,padding:"11px 0",fontSize:14,cursor:"pointer",fontWeight:"bold"}}>
              {autoPlay?"⏹ Stop":"⏩ Auto-run"}
            </button>
            <button onClick={reset} style={{background:CARD,color:"#94a3b8",border:`1px solid ${BORDER}`,borderRadius:10,padding:"11px 16px",fontSize:14,cursor:"pointer"}}>↺</button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:12,color:"#475569",whiteSpace:"nowrap"}}>Speed</span>
            <input type="range" min={100} max={1200} step={100} value={1300-speed}
              onChange={e=>setSpeed(1300-+e.target.value)}
              style={{flex:1,accentColor:"#6366f1"}}/>
            <span style={{fontSize:12,color:"#6366f1",whiteSpace:"nowrap"}}>{Math.round(1000/speed)} s/s</span>
          </div>
        </Card>

        {/* History */}
        <Card>
          <SectionTitle>State History ({history.length} steps)</SectionTitle>
          <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:10}}>
            {history.map((s,i)=>(
              <span key={i} title={STATES[s]} style={{fontSize:16,opacity:0.25+0.75*(i/history.length)}}>{ICONS[STATES[s]]}</span>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {STATES.map((s,i)=>(
              <div key={s} style={{background:BG,borderRadius:8,padding:"8px 10px",border:`1px solid ${BORDER}`}}>
                <div style={{fontSize:11,color:COLORS[s],fontWeight:"bold"}}>{ICONS[s]} {s}</div>
                <div style={{fontSize:17,fontWeight:700,color:"#f8fafc",margin:"2px 0"}}>{stateCounts[i]}×</div>
                <div style={{fontSize:11,color:"#475569"}}>{(empFreq[i]*100).toFixed(1)}% observed</div>
              </div>
            ))}
          </div>
        </Card>
      </>)},

      {/* ─── ANALYTICS TAB ─── */}
      {tab==="analytics" && (<>
        <Card style={{marginBottom:14}}>
          <SectionTitle>📐 Transition Matrix P</SectionTitle>
          <p style={{color:"#475569",fontSize:12,marginBottom:14}}>P[i][j] = probability of moving from state i → j. Each row sums to 1.0.</p>
          <table style={{width:"100%",borderCollapse:"separate",borderSpacing:4,fontSize:13}}>
            <thead>
              <tr>
                <th style={{color:"#334155",padding:"6px 8px",textAlign:"left",fontSize:11}}>From ↓ To →</th>
                {STATES.map(s=><th key={s} style={{color:COLORS[s],padding:"6px 8px",textAlign:"center",fontSize:11,fontWeight:"bold"}}>{ICONS[s]} {s}</th>)}
                <th style={{color:"#334155",padding:"6px 8px",textAlign:"center",fontSize:11}}>Σ</th>
              </tr>
            </thead>
            <tbody>
              {STATES.map((from,i)=>(
                <tr key={from}>
                  <td style={{color:COLORS[from],padding:"8px",fontWeight:"bold",fontSize:12}}>{ICONS[from]} {from}</td>
                  {MATRIX[i].map((p,j)=>{
                    <td key={j} style={{padding:"8px",textAlign:"center",background:`${COLORS[STATES[j]]}${Math.round(p*55+10).toString(16).padStart(2,"0")}`,borderRadius:8,color:"#f8fafc",fontWeight:"bold"}}>
                      {p.toFixed(2)}
                    </td>
                  }))}
                  <td style={{padding:"8px",textAlign:"center",color:"#4ade80",fontWeight:"bold"}}>1.00 ✓</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card style={{marginBottom:14}}>
          <SectionTitle>📈 Stationary Distribution π</SectionTitle>
          <p style={{color:"#475569",fontSize:12,marginBottom:14}}>Long-run proportion of time in each state. Satisfies <span style={{color:"#a5b4fc",fontFamily:"monospace"}}>π = πP</span>. White tick = equilibrium.</p>
          {STATES.map((s,i)=>(
            <DistBar key={s} label={s} icon={ICONS[s]} value={dist[i]} statVal={STAT[i]} color={COLORS[s]}/>
          ))}
        </Card>

        <Card style={{marginBottom:14}}>
          <SectionTitle>📉 Frequency Convergence</SectionTitle>
          {STATES.map((s,i)=>(
            <div key={s} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,background:BG,borderRadius:10,padding:"10px 12px"}}>
              <div style={{minWidth:70}}>
                <div style={{color:COLORS[s],fontWeight:"bold",fontSize:12}}>{ICONS[s]} {s}</div>
                <div style={{fontSize:11,color:"#475569"}}>Now: {(empFreq[i]*100).toFixed(1)}%</div>
                <div style={{fontSize:11,color:"#64748b"}}>π: {(STAT[i]*100).toFixed(1)}%</div>
              </div>
              <Sparkline data={sparkData[i]} color={COLORS[s]}/>
              <div style={{fontSize:20,fontWeight:800,color:COLORS[s],minWidth:45,textAlign:"right"}}>{(empFreq[i]*100).toFixed(0)}<span style={{fontSize:11}}>%</span></div>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>🔢 Key Analytical Values</SectionTitle>
          {[
            {label:"Expected return to Sunny", val:`${(1/STAT[0]).toFixed(1)} steps`, desc:"Mean recurrence time = 1/π"},
            {label:"Expected return to Rainy",  val:`${(1/STAT[1]).toFixed(1)} steps`, desc:"Mean recurrence time = 1/π"},
            {label:"Expected return to Cloudy", val:`${(1/STAT[2]).toFixed(1)} steps`, desc:"Mean recurrence time = 1/π"},
            {label:"Is chain irreducible?", val:"✅ Yes", desc:"Every state reachable from every other"},
            {label:"Is chain aperiodic?",   val:"✅ Yes", desc:"Self-loops guarantee period = 1"},
            {label:"Unique stationary dist?",val:"✅ Yes", desc:"Irreducible + aperiodic → ergodic"},
          ].map(({label,val,desc})=>(
            <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"9px 0",borderBottom:`1px solid ${BORDER}`}}>
              <div>
                <div style={{fontSize:13,color:"#cbd5e1",fontWeight:600}}>{label}</div>
                <div style={{fontSize:11,color:"#475569"}}>{desc}</div>
              </div>
              <div style={{color:"#a5b4fc",fontWeight:"bold",fontSize:13,marginLeft:12,textAlign:"right"}}>{val}</div>
            </div>
          ))}
        </Card>
      </>)

      {/* ─── THEORY TAB ─── */}
      {tab==="theory" && (<>
        <Card style={{marginBottom:14}}>
          <SectionTitle>📖 Core Definitions</SectionTitle>
          {[
            {icon:"🎯",term:"Markov Property",def:"P(Xₙ₊₁=j | X₀,...,Xₙ) = P(Xₙ₊₁=j | Xₙ). Future depends only on present, not history."},
            {icon:"🗺️",term:"State Space S",def:"The finite set of all possible states. Here S = {Sunny, Rainy, Cloudy}."},
            {icon:"📊",term:"Transition Matrix P",def:"n×n matrix where Pᵢⱼ = P(go to j | in i). Every row sums to 1 (stochastic matrix)."},
            {icon:"🔄",term:"Irreducibility",def:"Every state can reach every other state — the chain can't get permanently trapped."},
            {icon:"📅",term:"Aperiodicity",def:"Period d = gcd of return times. If d=1 for all states, the chain is aperiodic."},
            {icon:"⚖️",term:"Stationary Dist. π",def:"Distribution satisfying πP = π. Unique when chain is ergodic (irreducible + aperiodic)."},
            {icon:"♾️",term:"Ergodic Theorem",def:"Empirical averages converge to expected values under π for irreducible + aperiodic chains."},
            {icon:"⏱️",term:"Mean Recurrence Time",def:"Expected steps to return to state i = 1/πᵢ. Derived from stationary distribution."},
          ].map(({icon,term,def})=>(
            <div key={term} style={{display:"flex",gap:12,padding:"11px 0",borderBottom:`1px solid ${BORDER}`}}>
              <span style={{fontSize:22,minWidth:30}}>{icon}</span>
              <div>
                <div style={{color:"#a5b4fc",fontWeight:"bold",fontSize:13,marginBottom:3}}>{term}</div>
                <div style={{color:"#94a3b8",fontSize:12,lineHeight:1.6}}>{def}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card style={{marginBottom:14}}>
          <SectionTitle>🏙️ Analogies Cheat-Sheet</SectionTitle>
          {[
            {mc:"States",ana:"Rooms in a building",why:"You occupy exactly one room at a time"},
            {mc:"Transitions",ana:"Doors between rooms",why:"You move room-to-room via doors with fixed probabilities"},
            {mc:"Markov Property",ana:"GPS routing",why:"Needs only current position, not your full journey history"},
            {mc:"Stationary dist.",ana:"Rush-hour traffic",why:"Long-run fraction of cars in each zone is fixed"},
            {mc:"Memorylessness",ana:"Goldfish memory",why:"Chain forgets everything except the present state"},
            {mc:"Absorbing state",ana:"Hotel checkout",why:"Once you leave, you can never return"},
          ].map(({mc,ana,why})=>(
            <div key={mc} style={{padding:"9px 0",borderBottom:`1px solid ${BORDER}`,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div>
                <div style={{fontSize:11,color:"#6366f1",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>Markov</div>
                <div style={{color:"#e2e8f0",fontSize:13,fontWeight:600}}>{mc}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:"#f59e0b",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>Analogy</div>
                <div style={{color:"#f8fafc",fontSize:13,fontWeight:600}}>{ana}</div>
                <div style={{color:"#64748b",fontSize:11,marginTop:2}}>{why}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>🌍 Real-World Applications</SectionTitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              {icon:"🔍",title:"Google PageRank",desc:"Web graph as a Markov chain on web pages"},
              {icon:"🧬",title:"DNA Sequences",desc:"Nucleotide transitions modeled probabilistically"},
              {icon:"💹",title:"Finance",desc:"Credit rating migrations, stock regime models"},
              {icon:"🤖",title:"NLP & LLMs",desc:"Early text generation used n-gram Markov models"},
              {icon:"🎮",title:"Game AI",desc:"NPC behaviour as probabilistic state machines"},
              {icon:"📡",title:"Queueing Theory",desc:"Network packet arrivals modeled as Markov chains"},
            ].map(({icon,title,desc})=>(
              <div key={title} style={{background:BG,borderRadius:10,padding:"12px",border:`1px solid ${BORDER}`}}>
                <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
                <div style={{color:"#e2e8f0",fontWeight:"bold",fontSize:13}}>{title}</div>
                <div style={{color:"#64748b",fontSize:11,marginTop:3,lineHeight:1.5}}>{desc}</div>
              </div>
            ))}
          </div>
        </Card>
      </>)}
    </div>
  );
}