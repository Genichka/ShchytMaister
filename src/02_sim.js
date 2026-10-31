/* ===== Рушій v2: мережі, потенціали, логіка апаратів, аварії, струми ===== */
const isPh = p => /\.(L|L1|L2|L3)$/.test(p);
const isDC = p => /^(pv\d*|bat)[+-]$/.test(p);
const pvDev = sid => S.field.find(f=>f.type==="pv"&&(f.sid||"pv")===sid);
const pvKW = sid => { const d=pvDev(sid); return d&&!d.fault ? (d.n||10)*0.55*(S.env.sun||0)/100*(1-(S.env["shade_"+sid]||0)/100) : 0; };
const pvVmp = sid => ((pvDev(sid)||{}).n||10)*41.7;
const srcOf = p => p.split(".")[0];
const PH_ANG = {L:0,L1:0,L2:120,L3:240};
function srcU(p){ const s=srcOf(p); if(S.src[s]) return S.src[s].U; if(s==="inv") return 230; return 0; }
const tdef = d => T[d.type] || FT[d.type];
const K = (d,k) => T[d.type] ? d.id+":"+k : (d.map[k]||"");
const groupsOf = () => S.devices.filter(d=>T[d.type].group&&d.group).sort((a,b)=>((a.rail||0)-(b.rail||0))||(a.slot-b.slot));
const gL = d => d.id+":b1", gN = d => d.type==="rcbo" ? d.id+":b2" : "xn:0";
const kwOf = (d,all) => d.group.loads.reduce((a,l)=>a+(all||l.on?l.kw:0),0);
const poleClosed = (d,pi) => { const t=tdef(d); return t.closed ? t.closed(d,pi) : (d.on&&!d.trip); };
const protIn = d => d.Ir || inA(d.rating);

function sources(){
  const out=[];
  for(const inp of S.board.inputs){ const s=S.src[inp.id]||(S.src[inp.id]={on:false,U:230,lost:{}});
    for(const t of inp.terms){ const key=inp.id+":"+t;
      if(t==="N"||t==="PE") out.push([key,t]); else if(s.on&&!(s.lost&&s.lost[t])) out.push([key,inp.id+"."+t]); } }
  for(const d of [...S.devices,...S.field]){ const t=tdef(d); if(t.source) for(const [k,p] of t.source(d)) out.push([K(d,k),p]); }
  return out;
}
function build(o={}){
  const par=new Map();
  const f=k=>{ let r=k; while(par.has(r)&&par.get(r)!==r) r=par.get(r); let c=k; while(c!==r){ const n=par.get(c); par.set(c,r); c=n; } return r; };
  const u=(a,b)=>{ if(!a||!b) return; const ra=f(a), rb=f(b); if(ra!==rb) par.set(ra,rb); };
  for(const w of S.wires) if(w.id!==o.skip) u(w.a,w.b);
  for(let i=1;i<S.board.xn;i++) u("xn:"+i,"xn:0"); for(let i=1;i<S.board.xpe;i++) u("xpe:"+i,"xpe:0");
  if(S.comb){ const cov=S.devices.filter(d=>d.type==="qf1p"&&(d.rail||0)===(S.comb.rail||0)&&d.slot>=S.comb.from&&d.slot<=S.comb.to); for(let i=1;i<cov.length;i++) u(cov[0].id+":t1",cov[i].id+":t1"); }
  for(const d of [...S.devices,...S.field]){ const t=tdef(d);
    if(t.links) for(const [a,b] of t.links(d)) u(K(d,a),K(d,b));
    if(o.open&&o.open.has(d.id)) continue;
    (t.poles||[]).forEach((p,pi)=>{ if(o.openPole&&o.openPole.has(d.id+":"+pi)) return; if(o.ideal&&t.prot ? true : poleClosed(d,pi)) u(K(d,p.a),K(d,p.b)); });
    if(t.aux) for(const [a,b] of t.aux(d)) u(K(d,a),K(d,b)); }
  for(const [a,b] of (o.extra||[])) u(a,b);
  return f;
}
function makeX(f){
  const pot=new Map(); for(const [k,p] of sources()){ const r=f(k); if(!pot.has(r)) pot.set(r,new Set()); pot.get(r).add(p); }
  const P=k=>pot.get(f(k))||new Set();
  const X={f, pot, P,
    ph:k=>{ for(const p of P(k)) if(isPh(p)) return p; return null; },
    phs:k=>[...P(k)].filter(isPh), hasN:k=>P(k).has("N"), hasPE:k=>P(k).has("PE"),
    volt(a,b){ const A=P(a), B=P(b);
      for(const pa of A){ if(isPh(pa)){ if(B.has("N")||B.has("PE")) return srcU(pa);
          for(const pb of B) if(isPh(pb)&&pb!==pa&&srcOf(pb)===srcOf(pa)) return srcU(pa)*1.732; } }
      for(const pb of B) if(isPh(pb)&&(A.has("N")||A.has("PE"))) return srcU(pb);
      for(const pa of A){ const m=/^(pv\d*)\+$/.exec(pa); if(m&&B.has(m[1]+"-")) return S.env.sun>0?pvVmp(m[1]):0; } if(A.has("bat+")&&B.has("bat-")) return 51;
      return 0; } };
  return X;
}
function evaluate(o={}){
  let X;
  for(let it=0; it<12; it++){ X=makeX(build(o)); let ch=false;
    for(const d of [...S.devices,...S.field]){ const t=tdef(d); if(t.logic&&t.logic(d,X)) ch=true; }
    if(!ch) return X; if(it===11) X.chatter=true; }
  return X;
}
function conflicts(X){
  const C=[];
  for(const [r,ps] of X.pot){ const a=[...ps]; const ph=a.filter(isPh), dc=a.filter(isDC);
    let kind=null;
    if(dc.length&&(ph.length||ps.has("N"))) kind="ACDC";
    else if(a.some(p=>{ const m=/^(pv\d*)\+$/.exec(p); return m&&ps.has(m[1]+"-"); })||(ps.has("bat+")&&ps.has("bat-"))) kind="DC";
    else if(ph.length>1) kind=new Set(ph.map(srcOf)).size>1?"FEED":"LL";
    else if(ph.length&&ps.has("N")) kind="LN";
    else if(ph.length&&ps.has("PE")) kind="LPE";
    if(kind) C.push({kind, sig:a.sort().join("|"), pots:a}); }
  return C;
}
const FAULT = {LN:"коротке замикання L–N", LPE:"замикання фази на PE", LL:"міжфазне коротке замикання", FEED:"зустрічне ввімкнення двох джерел", DC:"коротке замикання на стороні DC", ACDC:"змішування кіл AC і DC"};

function computeLoads(X){
  const L=[];
  for(const d of groupsOf()){ const U=X.volt(gL(d),gN(d)), kw=kwOf(d); L.push({own:d.id, a:gL(d), b:gN(d), I:U>100?kw*1000/U:0, U, grp:true}); }
  for(const d of [...S.devices,...S.field]){ const t=tdef(d); if(t.load) for(const l of t.load(d,X)){ l.own=d.id; if(l.a) l.a=K(d,l.a); if(l.b) l.b=K(d,l.b); if(l.abc) l.abc=l.abc.map(k=>K(d,k)); L.push(l); } }
  return L;
}
function trip(d,why){ d.on=false; d.trip=why; S.heat[d.id]=0; logp("e",`${desig(d)} спрацював: ${why}`); if(typeof toast==="function") toast(`${desig(d)}: ${why}`,"e"); }
const rcdDevs = () => S.devices.filter(d=>T[d.type].rcd&&d.on&&!d.trip);
const lPole = d => tdef(d).poles.findIndex(p=>p.r!=="N"), nPole = d => tdef(d).poles.findIndex(p=>p.r==="N");
function affected(d,X,loads){ const Y=makeX(build({open:new Set([d.id])})); return loads.filter(l=>l.a&&X.ph(l.a)&&!Y.ph(l.a)).length; }

function resolveFaults(){
  for(let it=0; it<16; it++){
    const X=evaluate({extra:shortsExtra()}), C=conflicts(X);
    const arcC=C.filter(z=>z.kind==="DC"&&z.pots.every(p=>p.startsWith("pv")));
    if(arcC.length&&!S.env.arc){ S.env.arc=true; logp("e","Дуга DC! Струм КЗ стрінга ≈ Isc (близько 14 А) — запобіжники й автомат самі не спрацюють. Вимкніть DC-автомат вручну."); if(typeof toast==="function") toast("Дуга DC: вимкніть DC-автомат!","e"); }
    if(!arcC.length&&S.env.arc){ S.env.arc=false; logp("ok","Дугу DC погашено"); }
    C.splice(0,C.length,...C.filter(z=>!arcC.includes(z)));
    if(C.length){ const c=C[0], still=Y=>conflicts(Y).some(z=>z.sig===c.sig), loads=computeLoads(X);
      const test=d=>!still(makeX(build({open:new Set([d.id]),extra:shortsExtra()})));
      let cand=[];
      if(c.kind==="LPE") cand=rcdDevs().filter(test);
      if(!cand.length) cand=S.devices.filter(d=>T[d.type].prot&&d.on&&!d.trip).filter(test);
      if(cand.length){ cand.sort((a,b)=>(protIn(a)-protIn(b))||(affected(a,X,loads)-affected(b,X,loads))); trip(cand[0],FAULT[c.kind]); continue; }
      let acted=false;
      for(const p of c.pots){ if(isPh(p)&&S.src[srcOf(p)]&&S.src[srcOf(p)].on){ S.src[srcOf(p)].on=false; acted=true;
          logp("e",`${FAULT[c.kind]} до захисних апаратів: спрацював захист джерела «${(S.board.inputs.find(i=>i.id===srcOf(p))||{}).label}», його вимкнено`); } }
      for(const d of S.field){ const t=FT[d.type]; if(t.onFault&&t.onFault(d,c)) acted=true; }
      if(typeof toast==="function") toast("Аварія: "+FAULT[c.kind],"e");
      if(acted) continue; return;
    }
    let tripped=false; const loads=computeLoads(X).filter(l=>l.a&&l.b&&l.I>0.015);
    for(const R of rcdDevs()){ const lp=lPole(R), np=nPole(R); if(lp<0||np<0) continue;
      const YL=makeX(build({openPole:new Set([R.id+":"+lp]),extra:shortsExtra()})), YN=makeX(build({openPole:new Set([R.id+":"+np]),extra:shortsExtra()}));
      for(const l of loads){ const pt=!YL.ph(l.a), nt=!YN.hasN(l.b);
        if(pt!==nt){ trip(R,`дисбаланс струмів: ${l.grp?"група «"+devById(l.own).group.name+"»":desig(devById(l.own))} (N ${nt?"через ПЗВ, а фаза — ні":"в обхід ПЗВ"})`); tripped=true; break; } }
      if(tripped) break; }
    if(tripped) continue;
    for(const id of S.leak){ const g=devById(id); if(!g||!X.ph(gL(g))) continue;
      const rs=rcdDevs().filter(R=>{ const lp=lPole(R); return !makeX(build({openPole:new Set([R.id+":"+lp])})).ph(gL(g)); });
      if(rs.length){ rs.sort((a,b)=>affected(a,X,computeLoads(X))-affected(b,X,computeLoads(X))); trip(rs[0],`витік струму в групі «${g.group.name}»`); tripped=true; break; }
      if(!S.leakWarned.has(id)){ S.leakWarned.add(id); logp("e",`Група «${g.group.name}»: витік на корпус, ПЗВ немає — небезпека ураження!`); if(typeof toast==="function") toast("Небезпека ураження: група без ПЗВ","e"); } }
    if(tripped) continue;
    return;
  }
}
function shortsExtra(){ return [...S.short].filter(id=>devById(id)).map(id=>{ const d=devById(id); return [gL(d),gN(d)]; }).concat(S.tplObj&&S.tplObj.extra?S.tplObj.extra():[]); }
const anySource = () => Object.values(S.src).some(s=>s.on) || S.field.some(d=>FT[d.type].source&&FT[d.type].source(d).length);

function poleCurrents(d,X,loads){
  const t=tdef(d); let max=0; const per=[];
  (t.poles||[]).forEach((p,pi)=>{ if(!poleClosed(d,pi)) { per.push(0); return; }
    const Y=makeX(build({openPole:new Set([d.id+":"+pi]),extra:shortsExtra()})); let I=0;
    for(const l of loads){ if(l.abc){ l.abc.forEach((k,i)=>{ if(X.ph(k)&&!Y.ph(k)) I+=l.Is[i]; }); }
      else if(l.a&&l.I>0){ if(p.r==="N"){ if(X.hasN(l.b)&&!Y.hasN(l.b)) I+=l.I; } else if(X.ph(l.a)&&!Y.ph(l.a)) I+=l.I;
        else if(l.dc&&((X.P(l.a).size&&!Y.P(l.a).size)||(X.P(l.b).size&&!Y.P(l.b).size))) I+=l.I; } }
    per.push(I); max=Math.max(max,I); });
  return {max, per};
}
function solve(dt=0){
  let X=evaluate({extra:shortsExtra()});
  if(dt>0){ for(const d of [...S.devices,...S.field]){ const t=tdef(d); if(t.tick) t.tick(d,X,dt); }
    if(S.tplObj&&S.tplObj.tick) S.tplObj.tick(X,dt); X=evaluate({extra:shortsExtra()}); }
  if(anySource()){ resolveFaults(); X=evaluate({extra:shortsExtra()}); } else if(S.env.arc){ S.env.arc=false; }
  const loads=computeLoads(X), R={X, loads, I:{}, per:{}, liveW:new Set(), g:{}, totalI:0, chatter:!!X.chatter};
  for(const d of S.devices){ const t=T[d.type]; if(!(t.prot||t.meter)||(t.prot&&(!d.on||d.trip))) continue;
    const pc=poleCurrents(d,X,loads); R.I[d.id]=pc.max; R.per[d.id]=pc.per;
    if(dt>0&&t.prot){ const In=protIn(d), I=pc.max; let k=I/In;
      if(t.prot==="mpcb"){ const nz=pc.per.filter(x=>x>0.3*In).length; if(nz>0&&nz<pc.per.length&&pc.per.length===3) k*=1.6; }
      if(k>1.13){ S.heat[d.id]=(S.heat[d.id]||0)+dt*Math.min(0.5,(k*k-1)/6);
        if(S.heat[d.id]>=1){ trip(d,t.prot==="fuse"?`вставка згоріла: ${fmt(I)} А при номіналі ${fmt(In,0)} А`:`перевантаження ${fmt(I)} А при ${t.prot==="mpcb"?"уставці":"номіналі"} ${fmt(In,In%1?1:0)} А`); return solve(0); } }
      else S.heat[d.id]=Math.max(0,(S.heat[d.id]||0)-dt*0.3); } }
  for(const d of groupsOf()){ const l=loads.find(x=>x.own===d.id&&x.grp);
    R.g[d.id]={phase:!!X.ph(gL(d)), neutral:X.hasN(gN(d)), U:l.U, I:l.I, kw:kwOf(d)}; R.totalI+=l.I; }
  const anyI=loads.some(l=>(l.I||0)>0||(l.Is&&l.Is.some(x=>x>0)));
  for(const w of S.wires){ const ps=X.P(w.a); if([...ps].some(p=>isPh(p)||isDC(p))||(ps.has("N")&&anyI&&w.kind==="N")) R.liveW.add(w.id); }
  const bad=Object.values(S.src).some(s=>s.on&&(s.U>U_MAX||s.U<U_MIN)), exposed=groupsOf().some(d=>R.g[d.id].phase&&R.g[d.id].neutral&&(R.g[d.id].U>U_MAX||R.g[d.id].U<U_MIN));
  if(exposed&&!S.uWarned){ S.uWarned=true; logp("w","Напруга поза межами 170–250 В доходить до споживачів"); }
  if(!bad) S.uWarned=false;
  S.sim=R; return R;
}
