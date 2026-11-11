/* ===== Автопрокладання перемичок: повна схема з’єднань щитка (1 фаза, 3 фази, 2 вводи через АВР) =====
   wirePlan() перелічує всі потрібні перемички по кроках помічника:
     inwire — ввід → ввідний автомат;  bus — PE і нуль на шини;  jump — між модулями;  out — колодка XT2 і обладнання поза щитком.
   Пункт: {step, a, b, kind, sec, alt}. «xn:*» / «xpe:*» — будь-який вільний отвір шини.
   autoWire() прокладає всю схему одним натиском, а fixRatings() підганяє номінали й перерізи, щоб перевірка пройшла. */
const SWITCH_T = ["g2r","ats","toq5","toq7","to219","to119"];
const N_OWN = ["rcbo","qfn","afdd"];            // групові модулі з власним полюсом N
const byPosD = (a,c) => ((a.rail||0)-(c.rail||0))||(a.slot-c.slot);
function mainsOf(){ return S.devices.filter(d=>["qf2p","qf3p","qf4p"].includes(d.type)&&!d.group).sort(byPosD); }
function wirePlan(){
  const b=S.board, kind=boardKind(b), three=kind==="3ph", two=kind==="2in"||kind==="2inv", out=[], use={};
  const K2=(d,t)=>d.id+":"+t, pos=(...ts)=>S.devices.filter(d=>ts.includes(d.type)).sort(byPosD);
  const same=(x,a,c)=>(x.a===a&&x.b===c)||(x.a===c&&x.b===a);
  const add=(step,a,c,k,sec,alt)=>{ if(!a||!c||a===c||out.some(x=>same(x,a,c))) return;
    out.push({step,a,b:c,kind:k,sec:sec||2.5,alt}); for(const q of [a,c]) use[q]=(use[q]||0)+1; };
  // відгалуження (реле фаз, УЗІП): з рівноцінних клем беремо ту, де ще менше двох перемичок
  const tap=c=>c.filter(Boolean).find(q=>(use[q]||0)<2)||c.find(Boolean);
  const mains=mainsOf(), feeds=b.inputs.filter(i=>i.terms.some(t=>/^L/.test(t)));
  if(!mains.length||!feeds.length) return out;
  const m0=mains[0], PHW=three?["L1","L2","L3"]:["L"];
  const tops=m=>T[m.type].terms.filter(x=>x.s==="top"&&x.r!=="N"&&x.r!=="C").map(x=>K2(m,x.k));
  const bots=m=>T[m.type].terms.filter(x=>x.s==="bot"&&x.r!=="N"&&x.r!=="C").map(x=>K2(m,x.k));
  const nT=m=>{ const t=T[m.type].terms.find(x=>x.s==="top"&&x.r==="N"); return t?K2(m,t.k):null; };
  const nB=m=>{ const t=T[m.type].terms.find(x=>x.s==="bot"&&x.r==="N"); return t?K2(m,t.k):null; };
  const rc4=three?pos("rcd4")[0]:null, rc1=!three?pos("rcd")[0]:null, kv=!three?pos("kv","tovpd1")[0]:null, kvf=three?pos("kvf","kvf2")[0]:null;
  const spd=!three?pos("spdac")[0]:null, spd3=three?pos("spd3")[0]:null, sw=two?pos(...SWITCH_T)[0]:null;
  const secMain=Math.max(...mains.map(m=>secFor(protIn(m))));
  // 1. Ввід → ввідний автомат; два вводи — кожен на свій автомат
  feeds.forEach((inp,ix)=>{ const m=two?mains[ix]:m0; if(!m) return; const sec=secFor(protIn(m)), ph=tops(m);
    for(const t of inp.terms){ if(t==="PE") continue;
      if(t==="N") add("inwire",inp.id+":N",nT(m)||(rc4?K2(rc4,"t4"):"xn:*"),"N",sec);
      else { const q=ph[t==="L"?0:+t.slice(1)-1]; if(q) add("inwire",inp.id+":"+t,q,t==="L"?"L":t,sec); } } });
  const pe=b.inputs.find(i=>i.terms.includes("PE")); if(pe&&b.xpe) add("bus",pe.id+":PE","xpe:*","PE",secMain);
  // 2. Після ввідного: для двох вводів — через АВР
  let ph, n, n2j=null;                              // n2j — нуль вводу 2 для TO119G (1P перемикає лише фазу)
  if(two){ const m1=mains[0], m2=mains[1];
    if(!m2||!sw){ out.push({step:"jump",bad:true,ok:false,t:!m2?"Поставте другий ввідний автомат 2P — для вводу 2":"Поставте АВР: GEYA G2R-63, модуль АВР, TOQ5/TOQ7 або перемикач I–0–II TO219G / TO119G — без нього вводи нема чим перемикати"}); return out; }
    const L1=K2(m1,"b1"), N1=K2(m1,"b2"), L2=K2(m2,"b1"), N2=K2(m2,"b2"), s1=secFor(protIn(m1)), s2=secFor(protIn(m2));
    if(sw.type==="ats"||sw.type==="g2r"){ add("jump",L1,K2(sw,"IL"),"L",s1); add("jump",N1,K2(sw,"IN"),"N",s1); add("jump",L2,K2(sw,"IIL"),"L",s2); add("jump",N2,K2(sw,"IIN"),"N",s2); ph=[K2(sw,"L")]; n=K2(sw,"N"); }
    else if(sw.type==="toq5"||sw.type==="toq7"){ add("jump",L1,K2(sw,"RA"),"L",s1); add("jump",N1,K2(sw,"NA"),"N",s1); add("jump",L2,K2(sw,"RB"),"L",s2); add("jump",N2,K2(sw,"NB"),"N",s2);
      add("jump",K2(sw,"RA"),K2(sw,"AR"),"L",1.5); add("jump",K2(sw,"NA"),K2(sw,"AN"),"N",1.5); add("jump",K2(sw,"RB"),K2(sw,"BR"),"L",1.5); add("jump",K2(sw,"NB"),K2(sw,"BN"),"N",1.5);
      ph=[K2(sw,"RL")]; n=K2(sw,"NL"); }
    else if(sw.type==="to119"){ add("jump",L1,K2(sw,"2"),"L",s1); add("jump",L2,K2(sw,"4"),"L",s2); ph=[K2(sw,"1")]; n=N1; n2j=[N2,s2]; }
    else { add("jump",L1,K2(sw,"2"),"L",s1); add("jump",N1,K2(sw,"6"),"N",s1); add("jump",L2,K2(sw,"4"),"L",s2); add("jump",N2,K2(sw,"8"),"N",s2); ph=[K2(sw,"1")]; n=K2(sw,"5"); } }
  else { ph=bots(m0); n=nB(m0)||(feeds[0].id+":N"); }
  const ph0=ph.slice(), n0=n;                       // точки до реле й ПЗВ — для відгалужень
  // 3. Реле напруги (1 фаза): фаза через реле, нуль — лише на вимір
  if(kv){ add("jump",ph[0],K2(kv,"t2"),"L",secMain); add("jump",n,K2(kv,"t1"),"N",1.5,["xn:0"]); ph=[K2(kv,"b2")]; }
  // 4. ПЗВ: фази й нуль через нього, нижній N — на шину N
  let nPost=n, next=[];
  if(rc4){ ["t1","t2","t3"].forEach((t,i)=>add("jump",ph[i],K2(rc4,t),PHW[i],secMain)); add("jump",n,K2(rc4,"t4"),"N",secMain);
    next=["t1","t2","t3"].map(t=>K2(rc4,t)); ph=["b1","b2","b3"].map(t=>K2(rc4,t)); nPost=K2(rc4,"b4"); }
  else if(rc1){ add("jump",ph[0],K2(rc1,"t1"),"L",secMain); add("jump",n,K2(rc1,"t2"),"N",secMain); next=[K2(rc1,"t1")]; ph=[K2(rc1,"b1")]; nPost=K2(rc1,"b2"); }
  // TO119G: нуль вводу 2 — до нуля вводу 1 перед ПЗВ (на шину N після ПЗВ не можна — ПЗВ спрацює від небалансу)
  if(n2j) add("jump",n2j[0],rc1?K2(rc1,"t2"):"xn:*","N",n2j[1]);
  // 5. Групи: трифазні модулі шлейфом по L1–L3, однофазні — по черзі на L1, L2, L3 (рівномірне навантаження)
  const G=groupsOf(), qms=pos("qm"), single=G.filter(g=>!g3(g)), multi=[...G.filter(g3),...(three?qms:[])].sort(byPosD), phK={};
  let prev3=ph.slice();
  if(three) for(const d of multi){ const tt=d.type==="qm"?["1","3","5"]:["t1","t2","t3"];
    tt.forEach((t,i)=>add("jump",prev3[i],K2(d,t),PHW[i],secMain)); prev3=tt.map(t=>K2(d,t));
    if(d.type==="qf4p") add("jump","xn:*",K2(d,"t4"),"N",secFor(protIn(d))); }
  const prev=three?prev3.slice():ph.slice();
  single.sort(byPosD).forEach((g,j)=>{ const p=three?j%3:0; phK[g.id]=PHW[p];
    add("jump",prev[p],K2(g,"t1"),PHW[p],secMain); prev[p]=K2(g,"t1");
    if(N_OWN.includes(g.type)) add("jump","xn:*",K2(g,"t2"),"N",secFor(protIn(g))); });
  // 6. Шина N: її живить нижня N ПЗВ (або ввідний, якщо ПЗВ немає)
  const fieldN=S.field.some(f=>["motor1","lamp","boiler","floor"].includes(f.type));
  if(b.xn&&(single.length||G.some(g=>g.type==="qf4p")||tbOn()||fieldN)) add("bus",nPost,"xn:*","N",secMain);
  // 7. Відгалуження: реле контролю фаз, УЗІП — одразу після ввідного (до ПЗВ)
  if(kvf){ ["L1","L2","L3"].forEach((t,i)=>add("jump",tap([ph0[i],next[i]]),K2(kvf,t),PHW[i],1.5)); add("jump",tap([n0,rc4&&K2(rc4,"t4")]),K2(kvf,"N"),"N",1.5); }
  if(spd3){ ["L1","L2","L3"].forEach((t,i)=>add("jump",tap([ph0[i],next[i]]),K2(spd3,t),PHW[i],4)); add("jump",tap([n0,rc4&&K2(rc4,"t4")]),K2(spd3,"N"),"N",4); add("bus",K2(spd3,"pe"),"xpe:*","PE",4); }
  if(spd){ add("jump",tap([ph0[0],kv?K2(kv,"t2"):next[0]]),K2(spd,"L"),"L",4); add("jump",tap([n0,kv?K2(kv,"t1"):rc1&&K2(rc1,"t2")]),K2(spd,"N"),"N",4); add("bus",K2(spd,"pe"),"xpe:*","PE",4); }
  // 8. Колодка XT2: кабель кожної групи
  const nOf=g=>N_OWN.includes(g.type)?K2(g,"b2"):g.type==="qf4p"?K2(g,"b4"):"xn:*";
  if(tbOn()) for(const g of G){ const sec=g.group.sec||2.5;
    (g3(g)?["L1","L2","L3"]:["L"]).forEach((t,i)=>add("out",K2(g,"b"+(i+1)),tbK(g,t),g3(g)?t:(phK[g.id]||"L"),sec));
    if(tbTerms(g).includes("N")) add("out",nOf(g),tbK(g,"N"),"N",sec,["xn:0"]);
    add("out","xpe:*",tbK(g,"PE"),"PE",sec); }
  // 9. Обладнання поза щитком (клеми XT1): двигун 3~ — від автомата двигуна, прилади 230 В — кожен від своєї групи
  const used=new Set();
  for(const f of S.field){ const m=f.map;
    if(f.type==="motor3"){ const q=qms.find(x=>!used.has(x.id)), g=q||G.filter(g3).find(x=>!used.has(x.id)); if(!g) continue; used.add(g.id);
      const src=q?["2","4","6"].map(t=>K2(q,t)):tbOn()?["L1","L2","L3"].map(t=>tbK(g,t)):["b1","b2","b3"].map(t=>K2(g,t));
      ["U","V","W"].forEach((t,i)=>add("out",src[i],m[t],["L1","L2","L3"][i],2.5));
      if(m.PE) add("out",!q&&tbOn()?tbK(g,"PE"):"xpe:*",m.PE,"PE",2.5); }
    else if(["motor1","lamp","boiler","floor"].includes(f.type)){ const g=single.find(x=>!used.has(x.id))||single[single.length-1]; if(!g) continue; used.add(g.id);
      const sec=g.group.sec||2.5, L=tbOn()?tbK(g,"L"):K2(g,"b1"), N=tbOn()?tbK(g,"N"):nOf(g);
      add("out",L,m.L,phK[g.id]||"L",sec); add("out",N,m.N,"N",sec,["xn:0"]); if(m.PE) add("out",tbOn()?tbK(g,"PE"):"xpe:*",m.PE,"PE",sec); } }
  return out; }

// Номінали й перерізи, з якими перевірка не пройде: ПЗВ і реле слабші за ввідний, автомат групи завеликий для кабелю
function fixRatings(){ const fix=[], mains=mainsOf(); if(!mains.length) return fix; const mainIn=Math.min(...mains.map(protIn));
  for(const d of S.devices){ const t=T[d.type];
    if((d.type==="rcd"||d.type==="rcd4"||d.type==="kv"||d.type==="tovpd1")&&inA(d.rating)<mainIn){ const r=t.ratings.find(x=>inA(x)>=mainIn)||t.ratings[t.ratings.length-1];
      if(r!==d.rating){ fix.push(`${desig(d)}: ${d.rating} → ${r}${t.unit||""}`); d.rating=r; } } }
  for(const g of groupsOf()){ const In=inA(g.rating); if(In>CAB[g.group.sec]){ const s=secFor(In); fix.push(`${desig(g)}: кабель ${fmt(g.group.sec,1)} → ${fmt(s,1)} мм²`); g.group.sec=s; } }
  return fix; }

// Прокласти весь щиток за схемою. Перемички між модулями зі схеми, яких у ній немає, прибираються; перемички до інших модулів лишаються.
function autoWire(){ const plan=wirePlan(), bad=plan.find(x=>x.bad);
  if(!mainsOf().length){ toast("Спершу поставте ввідний автомат","w"); return false; }
  if(bad){ toast(bad.t,"w"); return false; }
  const fix=fixRatings();
  const own=k=>{ const p=k.split(":"); return p[0]==="tb"?"tb:"+p[1]:p[0]==="xt"?k:p[0]; };
  const known=new Set(["xn","xpe",...S.board.inputs.map(i=>i.id),...plan.flatMap(x=>[own(x.a),own(x.b)])]);
  const before=S.wires.length; S.wires=S.wires.filter(w=>![w.a,w.b].every(k=>known.has(own(k)))); const removed=before-S.wires.length;
  let added=0; for(const it of plan){ const f0=build({allOpen:true}), m=x=>x==="xn:*"?"xn:0":x==="xpe:*"?"xpe:0":x;
    if(f0(m(it.a))===f0(m(it.b))) continue; gConnect(it); added++; }
  S.pend=null; S.selWire=null; S.selDev=null; S.mode="wire"; commit();
  logp("ok",`Помічник проклав перемички (${added}) за схемою${fix.length?"; виправлено: "+fix.join(", "):""}`);
  checkNow();
  const e=S.lastCheck?S.lastCheck.errors:0;
  toast(e?`Перемички прокладено (${added}), але перевірка знайшла помилок: ${e}`:`Щиток зібрано: перемичок — ${added}${fix.length?", виправлено номінали":""}. Перевірка пройдена${removed?" · «Назад» поверне попередні перемички":""}`,e?"w":"ok");
  return !e; }
document.addEventListener("click",e=>{ if(e.target.closest("[data-gall]")) autoWire(); });
