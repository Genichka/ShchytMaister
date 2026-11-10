/* ===== Модульні контактори з різними контактами (НВ / НЗ) і реле часу GEYA / TOMZN ===== */
// Контакт: [вхід, вихід, "NO"|"NC", роль]. НВ (NO) замкнений, коли котушка A1–A2 під напругою; НЗ (NC) — навпаки
const KMC_TXT = cs => { const no=cs.filter(c=>c[2]==="NO").length, nc=cs.length-no; return [no?`${no}НВ`:"",nc?`${nc}НЗ`:""].filter(Boolean).join("+"); };
const KMC_EN  = cs => { const no=cs.filter(c=>c[2]==="NO").length, nc=cs.length-no; return [no?`${no}NO`:"",nc?`${nc}NC`:""].filter(Boolean).join(""); };
function kmcFace(d,g,cs){ const p=!!d.pulled, tm=T[d.type].terms.filter(q=>q.s==="top");
  let s=tx(g.cx,g.y+67,mdl(d,`КОНТАКТОР ${cs.length}P ${d.rating} А`),{fs:modelOf(d)&&g.w<80?5.4:g.w<60?5.2:6.6,fw:700})+tx(g.cx,g.y+77,g.w<60?KMC_TXT(cs):`${KMC_TXT(cs)} · котушка 230 В`,{fs:6});
  s+=`<rect x="${g.cx-15}" y="${g.y+83}" width="30" height="24" rx="3" fill="#2a2d33"/><rect x="${g.cx-11}" y="${g.y+(p?94:87)}" width="22" height="10" rx="2" fill="${p?"#e0352b":"#8e9196"}"/>`;
  cs.forEach((c,i)=>{ const t0=tm.find(q=>q.k===c[0]), X=t0?termX(d,t0):g.cx, cl=c[2]==="NC"?!p:p, col=cl?"#2e9e3e":"#7a7f88", y0=g.y+114;
    s+=`<path d="M${X} ${y0}v6${cl?"v9":`l-5 8`}M${X} ${y0+15}v6" stroke="${col}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
      +(c[2]==="NC"?`<path d="M${X-4} ${y0+6}h8" stroke="${col}" stroke-width="1.2"/>`:"")+tx(X,y0+31,c[2]==="NC"?"НЗ":"НВ",{fs:5.6,fw:600,fill:col}); });
  return s+led(g.x+10,g.y+92,p?"#3fbf4a":"#9aa0aa"); }
function kmcDef(key,cs,w,def){ const pn=cs.length, roles=pn===1?["L"]:pn===2?["L","N"]:["P","P","P","N"];
  defType(key,{name:`Контактор модульний ${pn}P · ${KMC_TXT(cs)} (${KMC_EN(cs)})`, short:`Контактор ${pn}P ${KMC_TXT(cs)}`, cat:"Керування", w, pre:"KM",
    ratings:["25","40","63"], def, unit:" А",
    terms:[C("A1","top","A1"),...cs.map((c,i)=>({k:c[0],s:"top",r:roles[i],l:c[0]})),C("A2","bot","A2"),...cs.map((c,i)=>({k:c[1],s:"bot",r:roles[i],l:c[1]}))],
    poles:cs.map((c,i)=>({a:c[0],b:c[1],r:roles[i]==="N"?"N":"L"})), closed:(d,pi)=>cs[pi][2]==="NC"?!d.pulled:!!d.pulled,
    logic:coilLogic, cap:cs.every(c=>c[2]==="NC")?"Відключення навантаження":"Контактор", face:(d,g)=>kmcFace(d,g,cs)}); }
kmcDef("kmc1no",[["1","2","NO"]],1,"25");
kmcDef("kmc1nc",[["11","12","NC"]],1,"25");
kmcDef("kmc2no",[["1","2","NO"],["3","4","NO"]],2,"40");
kmcDef("kmc11",[["1","2","NO"],["11","12","NC"]],2,"40");
kmcDef("kmc2nc",[["11","12","NC"],["21","22","NC"]],2,"40");
kmcDef("kmc4no",[["1","2","NO"],["3","4","NO"],["5","6","NO"],["7","8","NO"]],3,"63");
kmcDef("kmc31",[["1","2","NO"],["3","4","NO"],["5","6","NO"],["11","12","NC"]],3,"63");
kmcDef("kmc22",[["1","2","NO"],["3","4","NO"],["11","12","NC"],["21","22","NC"]],3,"63");
kmcDef("kmc4nc",[["11","12","NC"],["21","22","NC"],["31","32","NC"],["41","42","NC"]],3,"63");

// ---- Реле часу: затримка вимкнення (GEYA GRT8-B1, TOMZN TORT7-B1) і багатофункційне (GEYA GRT8-M1)
const KT_TERMS=[C("A1","top","A1"),C("15","top","15"),C("A2","bot","A2"),C("16","bot","16"),C("18","bot","18")];
function ktDial(d,g,label,p,col){ const r=17, a=p*2*Math.PI, x2=g.cx+r*Math.sin(a), y2=g.y+100-r*Math.cos(a);
  return tx(g.cx,g.y+66,label,{fs:6.4,fw:700})+`<circle cx="${g.cx}" cy="${g.y+100}" r="${r}" fill="#2a2d33"/>`
    +(p>0&&p<1?`<path d="M${g.cx} ${g.y+100} L${g.cx} ${g.y+100-r} A${r} ${r} 0 ${p>0.5?1:0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${col}"/>`:p>=1?`<circle cx="${g.cx}" cy="${g.y+100}" r="${r}" fill="${col}"/>`:"")
    +led(g.x+14,g.y+136,d.coil?"#3fbf4a":"#5a5e66")+led(g.x+g.w-14,g.y+136,d.out?"#ffd23f":"#5a5e66")+tx(g.cx,g.y+150,d.out?"15–18":"15–16",{fs:7,ff:"var(--mono)"}); }
defType("ktb",{name:"Реле часу — затримка вимкнення", short:"Реле часу (вимк.)", cat:"Керування", w:2, pre:"KT", terms:KT_TERMS,
  aux:d=>d.out?[["15","18"]]:[["15","16"]], init:d=>{ d.delay=d.delay||5; d.t=0; }, cap:"Затримка вимкнення",
  logic(d,X){ const c=coilOn(d,X,"A1","A2"); d.coil=c; if(c){ d.t=0; if(!d.out){ d.out=true; return true; } } return false; },
  tick(d,X,dt){ if(!d.coil&&d.out){ d.t+=dt; if(d.t>=d.delay){ d.out=false; d.t=0; logp("ok",`${desig(d)}: живлення зникло ${d.delay} с тому — контакт 15–18 розімкнено`); } } },
  face(d,g){ return ktDial(d,g,mdl(d,"РЕЛЕ ЧАСУ")+" · ↓ "+d.delay+" с",!d.coil&&d.out?Math.min(1,(d.t||0)/d.delay):0,"#4aa3ff"); }});
// Багатофункційне: A — затримка ввімкнення, B — затримка вимкнення, C — цикл (T увімк. / T вимк.), D — імпульс на T після подачі живлення
const KTM_FN={A:"затримка ввімкнення",B:"затримка вимкнення",C:"цикл: T увімк. / T вимк.",D:"імпульс T після подачі"};
defType("ktm",{name:"Реле часу багатофункційне (A · B · C · D)", short:"Реле часу багатофункц.", cat:"Керування", w:2, pre:"KT", terms:KT_TERMS,
  aux:d=>d.out?[["15","18"]]:[["15","16"]], init:d=>{ d.delay=d.delay||5; d.t=0; d.fn=d.fn||"A"; }, cap:"Витримка часу",
  logic(d,X){ const c=coilOn(d,X,"A1","A2"), was=d.coil; d.coil=c; let ch=false;
    if(c&&!was){ d.t=0; if(d.fn==="B"||d.fn==="D"){ if(!d.out){ d.out=true; ch=true; } } }
    if(!c&&was){ d.t=0; if(d.fn!=="B"&&d.out){ d.out=false; ch=true; } }
    if(c&&d.fn==="B"&&!d.out){ d.out=true; ch=true; }
    return ch; },
  tick(d,X,dt){ const fn=d.fn||"A";
    if(fn==="A"&&d.coil&&!d.out){ d.t+=dt; if(d.t>=d.delay){ d.out=true; logp("ok",`${desig(d)}: функція A — ${d.delay} с минуло, 15–18 замкнено`); } }
    if(fn==="B"&&!d.coil&&d.out){ d.t+=dt; if(d.t>=d.delay){ d.out=false; d.t=0; logp("ok",`${desig(d)}: функція B — ${d.delay} с після зникнення живлення, 15–18 розімкнено`); } }
    if(fn==="C"&&d.coil){ d.t+=dt; if(d.t>=d.delay){ d.t=0; d.out=!d.out; } }
    if(fn==="D"&&d.coil&&d.out){ d.t+=dt; if(d.t>=d.delay){ d.out=false; logp("ok",`${desig(d)}: функція D — імпульс ${d.delay} с завершено`); } } },
  face(d,g){ const fn=d.fn||"A", run=(fn==="A"&&d.coil&&!d.out)||(fn==="B"&&!d.coil&&d.out)||fn==="C"&&d.coil||(fn==="D"&&d.coil&&d.out);
    return ktDial(d,g,mdl(d,"РЕЛЕ ЧАСУ")+" · "+fn+" · "+d.delay+" с",run?Math.min(1,(d.t||0)/d.delay):d.out?1:0,fn==="B"?"#4aa3ff":"#ffb21f"); }});
