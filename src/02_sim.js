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
const g3 = d => !!T[d.type].gph;
// Клемна колодка XT2: кожна група має свої клеми L (або L1–L3), N, PE — до них підключено кабель лінії
const tbOn = () => !!S.board.tb, tbK = (d,t) => "tb:"+d.id+":"+t;
const tbTerms = d => g3(d) ? (d.type==="qf4p"?["L1","L2","L3","N","PE"]:["L1","L2","L3","PE"]) : ["L","N","PE"];
const gL0 = d => d.id+":b1";
const gL = d => tbOn() ? tbK(d,g3(d)?"L1":"L") : d.id+":b1", gN = d => tbOn() ? tbK(d,"N") : (d.type==="rcbo"||d.type==="qfn"||d.type==="afdd") ? d.id+":b2" : d.type==="qf3p" ? d.id+":b2" : d.type==="qf4p" ? d.id+":b4" : "xn:0";
const gABC = d => tbOn() ? ["L1","L2","L3"].map(t=>tbK(d,t)) : ["b1","b2","b3"].map(t=>d.id+":"+t);
const gPh = (d,X) => g3(d) ? gABC(d).every(k=>X.ph(k)) : !!X.ph(gL(d));
const kwOf = (d,all) => d.group.loads.reduce((a,l)=>a+(all||l.on?l.kw:0),0);
const poleClosed = (d,pi) => { const t=tdef(d); return t.closed ? t.closed(d,pi) : (d.on&&!d.trip); };
const protIn = d => d.Ir || inA(d.rating);

// Ввід від інвертора (inp.inv): вихід зникає при аварії (fault) або розрядженій АКБ (low)
const invInp = id => S.board.inputs.find(i=>i.id===id&&i.inv);
const srcLive = (inp,s) => !!(s&&s.on&&!(inp.inv&&(s.fault>0||s.low)));
function invFault(id,sec,msg){ const s=S.src[id]; if(!s) return; s.fault=sec; s.ovl=0; logp("e","Інвертор: "+msg); if(typeof toast==="function") toast("Інвертор вимкнувся","e"); }
function invTick(X,dt){ let loads=null;
  for(const inp of S.board.inputs){ if(!inp.inv) continue; const s=S.src[inp.id]; if(!s) continue; if(s.soc===undefined) s.soc=80;
    if(s.fault>0){ s.fault=Math.max(0,s.fault-dt); if(!s.fault&&s.on&&!s.low) logp("ok","Інвертор знову ввімкнувся"); }
    const live=srcLive(inp,s); let P=0;
    if(live){ loads=loads||computeLoads(X); for(const l of loads){ if(!l.a||!(l.I>0)) continue; const p=X.ph(l.a); if(p&&srcOf(p)===inp.id) P+=l.I*(l.U||230)/1000; } }
    s.P=P; const kw=inp.inv.kw||5, kwh=inp.inv.kwh||5;
    if(live&&P>kw+0.05){ s.ovl=(s.ovl||0)+dt; if(s.ovl>=2) invFault(inp.id,10,`перевантаження ${fmt(P,1)} кВт при номіналі ${fmt(kw,1)} кВт — вихід вимкнено на 10 с`); } else s.ovl=0;
    const grid=S.board.inputs.some(i=>!i.inv&&srcLive(i,S.src[i.id])&&S.src[i.id].U>=187&&S.src[i.id].U<=253);
    if(P>0) s.soc=Math.max(0,s.soc-P*(dt/60)/kwh*100);          // 1 с симуляції = 1 хв
    else if(grid&&s.soc<100) s.soc=Math.min(100,s.soc+Math.min(1.5,kw/3)*(dt/60)/kwh*100);
    s.chg=P===0&&grid&&s.soc<100;
    if(!s.low&&s.soc<=5&&s.on){ s.low=true; logp("e","Інвертор: АКБ розряджено до 5 % — вихід вимкнено, щоб зберегти батарею"); if(typeof toast==="function") toast("АКБ інвертора розряджено","e"); }
    if(s.low&&s.soc>=20){ s.low=false; if(s.on) logp("ok","Інвертор: АКБ заряджено до 20 % — вихід знову ввімкнено"); } } }
function sources(){
  const out=[];
  for(const inp of S.board.inputs){ const s=S.src[inp.id]||(S.src[inp.id]={on:false,U:230,lost:{}}), live=srcLive(inp,s);
    for(const t of inp.terms){ const key=inp.id+":"+t;
      if(t==="N"||t==="PE") out.push([key,t]); else if(live&&!(s.lost&&s.lost[t])) out.push([key,inp.id+"."+(s.swap&&t==="L2"?"L3":s.swap&&t==="L3"?"L2":t)]); } }
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
    if(o.allOpen||(o.open&&o.open.has(d.id))) continue;   // allOpen — лише дроти й постійні перемички, усі полюси розімкнені
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
  for(const d of groupsOf()){ const kw=kwOf(d);
    if(g3(d)){ const ok=gPh(d,X), U=ok?srcU(X.ph(gL(d))):0, I=ok?kw*1000/(3*U):0; L.push({own:d.id, abc:gABC(d), Is:[I,I,I], I, U, grp:true, g3:true}); continue; }
    const U=X.volt(gL(d),gN(d)); L.push({own:d.id, a:gL(d), b:gN(d), I:U>100?kw*1000/U:0, U, grp:true}); }
  for(const d of [...S.devices,...S.field]){ const t=tdef(d); if(t.load) for(const l of t.load(d,X)){ l.own=d.id; if(l.a) l.a=K(d,l.a); if(l.b) l.b=K(d,l.b); if(l.abc) l.abc=l.abc.map(k=>K(d,k)); L.push(l); } }
  return L;
}
function trip(d,why){ d.on=false; d.trip=why; S.heat[d.id]=0; logp("e",`${desig(d)} спрацював: ${why}`); if(typeof toast==="function") toast(`${desig(d)}: ${why}`,"e"); }
const rcdDevs = () => S.devices.filter(d=>T[d.type].rcd&&d.on&&!d.trip);
const lPole = d => tdef(d).poles.findIndex(p=>p.r!=="N"), nPole = d => tdef(d).poles.findIndex(p=>p.r==="N");
const lPoles = d => tdef(d).poles.map((p,i)=>p.r!=="N"?d.id+":"+i:null).filter(Boolean);
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
      if(c.kind==="FEED"){ const iv=c.pots.filter(isPh).map(srcOf).find(invInp);
        if(iv){ invFault(iv,30,"на вихід інвертора потрапила напруга іншого джерела (зустрічне ввімкнення) — аварійне вимкнення на 30 с. Справжній інвертор від цього може згоріти"); continue; } }
      if(!cand.length) cand=S.devices.filter(d=>T[d.type].prot&&d.on&&!d.trip).filter(test);
      if(cand.length){ cand.sort((a,b)=>(protIn(a)-protIn(b))||(affected(a,X,loads)-affected(b,X,loads))); trip(cand[0],FAULT[c.kind]); continue; }
      let acted=false;
      for(const p of c.pots){ if(isPh(p)&&invInp(srcOf(p))&&srcLive(invInp(srcOf(p)),S.src[srcOf(p)])){ invFault(srcOf(p),10,`${FAULT[c.kind]} на виході — внутрішній захист вимкнув вихід на 10 с`); acted=true; continue; }
        if(isPh(p)&&S.src[srcOf(p)]&&S.src[srcOf(p)].on){ S.src[srcOf(p)].on=false; acted=true;
          logp("e",`${FAULT[c.kind]} до захисних апаратів: спрацював захист джерела «${(S.board.inputs.find(i=>i.id===srcOf(p))||{}).label}», його вимкнено`); } }
      for(const d of S.field){ const t=FT[d.type]; if(t.onFault&&t.onFault(d,c)) acted=true; }
      if(typeof toast==="function") toast("Аварія: "+FAULT[c.kind],"e");
      if(acted) continue; return;
    }
    let tripped=false; const loads=computeLoads(X).filter(l=>l.a&&l.b&&l.I>0.015);
    for(const R of rcdDevs()){ const lp=lPole(R), np=nPole(R); if(lp<0||np<0) continue;
      const YL=makeX(build({openPole:new Set(lPoles(R)),extra:shortsExtra()})), YN=makeX(build({openPole:new Set([R.id+":"+np]),extra:shortsExtra()}));
      for(const l of loads){ const pt=!YL.ph(l.a), nt=!YN.hasN(l.b);
        if(pt!==nt){ trip(R,`дисбаланс струмів: ${l.grp?"група «"+devById(l.own).group.name+"»":desig(devById(l.own))} (N ${nt?"через ПЗВ, а фаза — ні":"в обхід ПЗВ"})`); tripped=true; break; } }
      if(tripped) break; }
    if(tripped) continue;
    for(const id of S.arc){ const g=devById(id); if(!g||!X.ph(gL(g))) continue; const ld=loads.find(l=>l.own===id&&l.grp); if(!ld||ld.I<0.5) continue;
      const af=S.devices.filter(R=>T[R.type].afdd&&R.on&&!R.trip&&!makeX(build({open:new Set([R.id])})).ph(gL(g)));
      if(af.length){ trip(af[0],`іскріння (дуговий пробій) у групі «${g.group.name}»`); tripped=true; break; }
      if(!S.arcWarned.has(id)){ S.arcWarned.add(id); logp("e",`Група «${g.group.name}»: іскріння в проводці! Автомат і ПЗВ його не бачать — пожежна небезпека. Захищає лише AFDD.`); if(typeof toast==="function") toast("Іскріння: потрібен AFDD","e"); } }
    if(tripped) continue;
    for(const id of S.leak){ const g=devById(id); if(!g||!X.ph(gL(g))) continue;
      const rs=rcdDevs().filter(R=>!makeX(build({openPole:new Set(lPoles(R))})).ph(gL(g)));
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
// Струм у дротах: який дріт несе струм навантаження, скільки і в який бік (від джерела до навантаження; нуль і «−» — назад)
function wireFlow(X,loads){ const ex=shortsExtra(), adj=new Map();
  const add=(a,b)=>{ if(!a||!b) return; if(!adj.has(a)) adj.set(a,[]); if(!adj.has(b)) adj.set(b,[]); adj.get(a).push(b); adj.get(b).push(a); };
  for(const w of S.wires) add(w.a,w.b);
  for(let i=1;i<S.board.xn;i++) add("xn:"+i,"xn:0"); for(let i=1;i<S.board.xpe;i++) add("xpe:"+i,"xpe:0");
  if(S.comb){ const cov=S.devices.filter(d=>d.type==="qf1p"&&(d.rail||0)===(S.comb.rail||0)&&d.slot>=S.comb.from&&d.slot<=S.comb.to); for(let i=1;i<cov.length;i++) add(cov[0].id+":t1",cov[i].id+":t1"); }
  for(const d of [...S.devices,...S.field]){ const t=tdef(d); if(t.links) for(const [a,b] of t.links(d)) add(K(d,a),K(d,b));
    (t.poles||[]).forEach((p,pi)=>{ if(poleClosed(d,pi)) add(K(d,p.a),K(d,p.b)); }); if(t.aux) for(const [a,b] of t.aux(d)) add(K(d,a),K(d,b)); }
  for(const [a,b] of ex) add(a,b);
  const bfs=keys=>{ const D=new Map(), q=[...keys]; keys.forEach(k=>D.set(k,0)); for(let i=0;i<q.length;i++){ for(const n of adj.get(q[i])||[]) if(!D.has(n)){ D.set(n,D.get(q[i])+1); q.push(n); } } return D; };
  const src=sources(), Dp=bfs(src.filter(([k,p])=>isPh(p)||/\+$/.test(p)).map(x=>x[0])), Dn=bfs(src.filter(([k,p])=>p==="N"||/-$/.test(p)).map(x=>x[0]));
  const act=loads.filter(l=>(l.I||0)>0.01||(l.Is&&l.Is.some(x=>x>0.01))), out={};
  if(!act.length) return out;
  const lost=(Y,k)=>{ const A=X.P(k); if(!A.size) return false; const B=Y.P(k); for(const p of A) if(!B.has(p)&&p!=="PE") return true; return false; };
  for(const w of S.wires){ const ps=X.P(w.a); if(!ps.size||ps.has("PE")&&ps.size===1) continue;
    const Y=makeX(build({skip:w.id,extra:ex})); let Ia=0, Ib=0;
    for(const l of act){ if(l.abc){ l.abc.forEach((k,i)=>{ if(lost(Y,k)) Ia+=l.Is[i]; }); continue; }
      if(l.a&&lost(Y,l.a)) Ia+=l.I; else if(l.b&&lost(Y,l.b)) Ib+=l.I; }
    const I=Math.max(Ia,Ib); if(I<0.01) continue; const D=Ia>=Ib?Dp:Dn, da=D.get(w.a), db=D.get(w.b);
    let dir=da===undefined||db===undefined?1:da<=db?1:-1; if(Ib>Ia) dir=-dir;   // фаза — від джерела, нуль — до джерела
    out[w.id]={I,dir}; }
  return out; }
function solve(dt=0){
  let X=evaluate({extra:shortsExtra()});
  if(dt>0){ for(const d of [...S.devices,...S.field]){ const t=tdef(d); if(t.tick) t.tick(d,X,dt); }
    if(S.tplObj&&S.tplObj.tick) S.tplObj.tick(X,dt); invTick(X,dt); X=evaluate({extra:shortsExtra()}); }
  if(anySource()){ resolveFaults(); X=evaluate({extra:shortsExtra()}); } else if(S.env.arc){ S.env.arc=false; }
  const loads=computeLoads(X), R={X, loads, I:{}, per:{}, liveW:new Set(), g:{}, totalI:0, chatter:!!X.chatter};
  for(const d of S.devices){ const t=T[d.type]; if(!(t.prot||t.meter||t.rcd||t.amm)||((t.prot||t.rcd)&&(!d.on||d.trip))) continue;
    const pc=poleCurrents(d,X,loads); R.I[d.id]=pc.max; R.per[d.id]=pc.per;
    if(dt>0&&t.prot){ const In=protIn(d), I=pc.max; let k=I/In;
      if(t.prot==="mpcb"){ const nz=pc.per.filter(x=>x>0.3*In).length; if(nz>0&&nz<pc.per.length&&pc.per.length===3) k*=1.6; }
      if(k>1.13){ S.heat[d.id]=(S.heat[d.id]||0)+dt*Math.min(0.5,(k*k-1)/6);
        if(S.heat[d.id]>=1){ trip(d,t.prot==="fuse"?`вставка згоріла: ${fmt(I)} А при номіналі ${fmt(In,0)} А`:`перевантаження ${fmt(I)} А при ${t.prot==="mpcb"?"уставці":"номіналі"} ${fmt(In,In%1?1:0)} А`); return solve(0); } }
      else S.heat[d.id]=Math.max(0,(S.heat[d.id]||0)-dt*0.3); } }
  for(const d of groupsOf()){ const l=loads.find(x=>x.own===d.id&&x.grp);
    R.g[d.id]={phase:gPh(d,X), neutral:g3(d)?true:X.hasN(gN(d)), U:l.U, I:l.I, kw:kwOf(d)}; R.totalI+=l.I; }
  const anyI=loads.some(l=>(l.I||0)>0||(l.Is&&l.Is.some(x=>x>0)));
  for(const w of S.wires){ const ps=X.P(w.a); if([...ps].some(p=>isPh(p)||isDC(p))) R.liveW.add(w.id); }
  R.flow=S.quiet?{}:wireFlow(X,loads);
  const bad=Object.values(S.src).some(s=>s.on&&(s.U>U_MAX||s.U<U_MIN)), exposed=groupsOf().some(d=>R.g[d.id].phase&&R.g[d.id].neutral&&(R.g[d.id].U>U_MAX||R.g[d.id].U<U_MIN));
  if(exposed&&!S.uWarned){ S.uWarned=true; logp("w","Напруга поза межами 170–250 В доходить до споживачів"); }
  if(!bad) S.uWarned=false;
  S.sim=R; return R;
}
