/* ===== Інтерфейс ===== */
const $ = id => document.getElementById(id);
let toastT=null;
function toast(msg,cls=""){ if(S.quiet) return; const t=$("toast"); t.textContent=msg; t.className="toast "+cls; t.style.opacity=1; clearTimeout(toastT); toastT=setTimeout(()=>t.style.opacity=0,2600); }
const DEV_GROUPS = [["Захист ліній",["qf1p","qfn","qf2p","qf3p","qf4p","rcbo","afdd","rcd","rcd4","fuac"]],["Контроль напруги і УЗІП",["kv","kvf","pef","vm","spdac","spd3"]],["Облік",["pm1","pm3"]],["Комутація і АВР",["sw2","ats","qs","km2a","km3a"]],
  ["Керування",["sbp","sbs","hl","rel","kt","kimp","stair","photo","logo"]],["Двигуни",["qm"]],["Розподіл",["xtb","sock"]],["Розумний дім",["ssw","pm","tr","hub","kr2"]],["Сонячна станція (DC)",["qfdc","fudc","spdc"]]];
const TPL_ORDER = ["Конструктор","Квартира і будинок","АВР на 2 вводи","Сонячна станція","Двигуни"];
let clearArm=0;
function applyTemplate(name){ const t=TPL[name]||TPL.flat; t.build(); S.tpl=TPL[name]?name:"flat"; S.tplObj=t; S.env0=JSON.parse(JSON.stringify(S.env||{})); S.proj={id:null,name:t.name}; S.guide=null; S.lastCheck=null;
  Object.assign(S,{pend:null,selWire:null,selDev:null,pick:null,heat:{},log:[],demo:null}); S.leak.clear(); S.short.clear(); S.leakWarned.clear(); S.arc.clear(); S.arcWarned.clear();
  if(typeof resetHistory==="function"){ resetHistory(); S.baseSig=structSnap(); } if(typeof hideDemoBar==="function") hideDemoBar(); save(); }
function resetRuntime(){ for(const s of Object.values(S.src)){ s.on=false; s.U=230; s.lost={}; }
  for(const d of S.devices){ const t=T[d.type]; if(t.prot||t.rcd){ d.on=true; d.trip=null; } d.pulled=false; d.pressed=false; if(d.type==="logo"||d.type==="kv") { delete d.ks; if(t.init) t.init(d); } if(d.type==="ats") d.manual=false; if(d.type==="spdc") d.wear=0; }
  for(const f of S.field){ Object.assign(f,{jam:false,cap:true,fault:false,faultT:0,en:true,run:false,dead:false}); if(f.type==="valve") f.pos=100; }
  S.env=JSON.parse(JSON.stringify(S.env0||{})); S.heat={}; S.log=[]; S.leak.clear(); S.short.clear(); S.leakWarned.clear(); S.arc.clear(); S.arcWarned.clear(); }
function livePress(des){ const d=typeof des==="string"?byDes(des):des; if(!d) return; d.pressed=true; solve(0); renderAll(false);
  setTimeout(()=>{ d.pressed=false; solve(0); renderAll(false); },700); }

function hint(){ let h="";
  if(S.mode==="mount") h=S.pick?`<b>${T[S.pick].name}${S.pickRating?" "+S.pickRating+(T[S.pick].unit||""):""}</b> (${T[S.pick].w} мод.): торкніться вільного місця на рейці.`:"Оберіть апарат нижче і поставте на рейку. Торкніться апарата, щоб змінити його налаштування.";
  if(S.mode==="wire") h=S.moveEnd?"Торкніться нової клеми для дроту, що переносимо.":S.selWire?"Дріт вибрано: змініть його в панелі внизу або торкніться іншого дроту.":S.pend?`Початок: <b>${esc(termName(S.pend))}</b>. Торкніться другої клеми.`:"Торкніться першої клеми, потім другої. Торкніться дроту, щоб вибрати його.";
  if(S.mode==="test") h=S.demo?`Демонстрація: крок ${S.demo.i+1} з ${S.tplObj.demo.script.length}`:"Подайте напругу, тисніть кнопки й важелі на апаратах або запустіть демонстрацію.";
  $("hint").innerHTML=h; }
function ctlHTML(c,i){
  if(c.type==="src"){ const s=S.src[c.id]||{}, inp=S.board.inputs.find(x=>x.id===c.id)||{}, three=(inp.terms||[]).includes("L1");
    return `<div class="mains"><button class="switch" data-srcon="${c.id}" aria-pressed="${!!s.on}"><span class="knob"></span>${esc(c.label||inp.label)}</button>`+
      (c.noU?"":`<div class="volt"><input type="range" id="u-${c.id}" data-srcu="${c.id}" min="150" max="290" step="1" value="${Math.round(s.U||230)}" aria-label="Напруга"><output class="mono" id="uo-${c.id}">${three?Math.round((s.U||230)*1.732)+" В лін.":Math.round(s.U||230)+" В"}</output></div>`)+`</div>`; }
  if(c.type==="toggle") return `<button class="switch sm" data-ctl="${i}" aria-pressed="${!!c.get()}"><span class="knob"></span>${esc(c.label)}</button>`;
  if(c.type==="range") return `<div class="volt"><span class="lbl" style="min-width:auto">${esc(c.label)}</span><input type="range" id="c-${i}" data-ctl="${i}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.get()}"><output class="mono" id="co-${i}">${c.get()}</output></div>`;
  if(c.type==="choice") return `<div class="row"><span class="lbl">${esc(c.label)}</span>`+c.opts.map(([v,l])=>`<button class="chip" data-ctl="${i}" data-v="${v}" aria-pressed="${c.get()===v}">${esc(l)}</button>`).join("")+`</div>`;
  if(c.type==="btn") return `<button class="btn ${c.cls||""}" data-ctl="${i}">${esc(c.label)}</button>`;
  return ""; }
function renderTools(){ const el=$("tools"), gh=(typeof guideHTML==="function"?guideHTML():""); let s="";
  if(S.mode==="mount"){
    const listed=new Set(DEV_GROUPS.flatMap(g=>g[1])), rest=Object.keys(T).filter(x=>!listed.has(x)), F=S.devFilter;
    if(F) s+=`<details class="dd2 dd-f" id="devDD" open><summary><span>${esc(F.title)}: оберіть апарат</span><span class="cnt">${F.opts.length} варіант${F.opts.length===1?"":F.opts.length<5?"и":"ів"}</span></summary><div class="cat"><div class="cat-g">`
      +F.opts.map((o,i)=>`<button class="cat-i" data-fpick="${i}" aria-pressed="${S.pick===o[0]&&(S.pickRating||null)===(o[1]||null)&&JSON.stringify(S.pickExtra||null)===JSON.stringify(o[3]||null)}"><span>${esc(o[2])}</span><small>${T[o[0]].w} мод.</small></button>`).join("")
      +`</div></div><div class="row" style="padding:0 10px 10px"><button class="btn" data-fall>Показати всі апарати</button></div></details>`; else
    s+=`<details class="dd2" id="devDD"${S.devOpen?" open":""}><summary><span>${S.pick?"Ставимо: <b>"+esc(T[S.pick].short)+"</b>":"Додати апарат"}</span><span class="cnt">${Object.keys(T).length} апаратів</span></summary><div class="cat">`
      +[...DEV_GROUPS,...(rest.length?[["Інше",rest]]:[])].map(([g,ks])=>`<div class="cat-g"><div class="cat-h">${esc(g)}</div>`+ks.filter(x=>T[x]).map(x=>`<button class="cat-i" data-pick="${x}" aria-pressed="${S.pick===x}"><span>${esc(T[x].name)}</span><small>${T[x].w} мод.</small></button>`).join("")+`</div>`).join("")+`</div></details>`;
    s+=`<details class="dd2" id="fldDD"${S.fldOpen?" open":""}><summary><span>Обладнання поза щитом (XT1)</span><span class="cnt">${S.field.length?S.field.length+" підключено":"двигуни, бойлер, PV…"}</span></summary><div class="cat"><div class="cat-g">`
      +FIELD_LIB.map(L=>`<button class="cat-i" data-fadd="${L.type}"><span>${esc(L.name)}</span><small>+${Object.keys(L.t).length} кл.</small></button>`).join("")+`</div></div></details>`;
    s+=`<div class="row"><span class="lbl">Шини</span><button class="chip" id="combBtn">${S.comb?"Зняти гребінку":"Поставити гребінку 1P"}</button><button class="btn" id="undoBtn" ${S.hist&&S.hist.length?"":"disabled"}>↶ Скасувати</button></div><p class="hint" style="margin:0">Гребінка з’єднує верхні клеми автоматів 1P поруч. Торкніться апарата або обладнання, щоб змінити підпис, номінал чи прибрати його.</p>`; }
  if(S.mode==="wire"){ const kind=S.wireKind, sec=S.wireSec;
    s+=`<div class="row"><span class="lbl">Новий дріт</span>`+Object.keys(WK).map(x=>`<button class="chip" data-kind="${x}" aria-pressed="${kind===x}"><span class="sw" style="background:${x==="PE"?"linear-gradient(90deg,var(--wPEy) 50%,var(--wPEg) 50%)":WK[x][1]}"></span>${WK[x][0]}</button>`).join("")+`</div>`;
    s+=`<div class="row"><span class="lbl">Переріз</span>`+SECS.map(x=>`<button class="chip mono" data-sec="${x}" aria-pressed="${sec===x}">${fmt(x,x%1?1:0)}</button>`).join("")+`<span class="hint" style="flex:0 0 auto">мм²</span></div>`;
    s+=wireListHTML();
    s+=`<div class="row"><button class="btn" id="undoBtn" ${S.hist&&S.hist.length?"":"disabled"}>↶ Скасувати</button><button class="btn danger" id="clearWires" ${S.wires.length?"":"disabled"}>${clearArm>Date.now()?"Натисніть ще раз для очищення":"Прибрати всі дроти"}</button></div>`; }
  if(S.mode==="test"){ const dm=S.tplObj&&S.tplObj.demo||{controls:[{type:"src",id:S.board.inputs[0].id}],script:[]};
    s+=`<p class="tplinfo"><b>${esc(S.tplObj?S.tplObj.name:"")}.</b> ${esc(S.tplObj?S.tplObj.info:"")}</p>`;
    if(dm.script.length) s+=`<div class="demo"><div class="row"><button class="btn primary" id="demoBtn">${S.demo?"■ Зупинити":"▶ Демонстрація"}</button><span class="hint" style="flex:1 1 160px">${S.demo?"Крок "+(S.demo.i+1)+" з "+dm.script.length:"Автоматичний сценарій з поясненнями. Стан щита скидається на початковий."}</span></div>`+
      `<div class="demo-say" id="demoSay"${S.demo?"":" hidden"}>${S.demo?esc(dm.script[S.demo.i].say):""}</div></div>`;
    s+=`<div class="ctl">`+dm.controls.map(ctlHTML).join("")+`</div>`;
    s+=`<div class="stl" id="stl"></div><div class="row"><button class="btn" id="allOn">Увімкнути всі апарати</button>${groupsOf().length?`<button class="btn" id="clrFaults" ${S.leak.size||S.short.size?"":"disabled"}>Прибрати аварії</button>`:""}</div>`;
    s+=`<div class="log" id="log" aria-live="polite"></div>`; }
  el.innerHTML=gh+s; if(S.mode==="test") updateLive(); }
function gStatus(d){ const R=S.sim&&S.sim.g[d.id]; if(!R||!anySource()) return `<span class="pill off">Знеструмлено</span>`;
  if(R.phase&&R.neutral) return (R.U>U_MAX||R.U<U_MIN)?`<span class="pill bad">${Math.round(R.U)} В!</span>`:`<span class="pill ok">Під напругою</span>`;
  return `<span class="pill bad">${R.phase?"Немає N":"Немає фази"}</span>`; }
function gLoad(d){ const kw=kwOf(d), I=kw*1000/(g3(d)?690:230), In=inA(d.rating), p=Math.min(100,I/In*100), c=I>In?"var(--red)":I>0.8*In?"var(--orange)":"var(--green)";
  return {txt:`${fmt(kw,2)} кВт · <b class="mono">${fmt(I)} А</b> / ${In} А`, bar:`<i style="width:${p}%;background:${c}"></i>`}; }
function renderGroups(){ const G=groupsOf(), el=$("groups"); $("groupsWrap").hidden=!G.length; if(!G.length){ el.innerHTML=""; return; }
  el.innerHTML=G.map(d=>{ const g=d.group, L=gLoad(d);
    return `<article class="gcard" style="--gc:${g.color}" data-card="${d.id}"><div class="gh"><div style="min-width:0;flex:1"><div class="des">${desig(d)} ${esc(d.rating)}</div>
      <input class="gname" id="gn-${d.id}" data-gname="${d.id}" value="${esc(g.name)}" aria-label="Назва групи"><div class="sub">${g3(d)?"3 фази · струм на фазу":d.type==="rcbo"?"N від диф-автомата":"N від XN1"} · PE від XPE1</div></div><span data-gstat="${d.id}">${gStatus(d)}</span></div>
      <ul class="loads">${g.loads.map((l,i)=>`<li><label><input type="checkbox" id="ld-${d.id}-${i}" data-load="${d.id}:${i}" ${l.on?"checked":""}>${esc(l.n)}</label><span class="kw">${fmt(l.kw,2)} кВт</span><button class="x" data-del="${d.id}:${i}" aria-label="Прибрати ${esc(l.n)}">×</button></li>`).join("")||`<li class="hint">Додайте прилади</li>`}</ul>
      <div class="gadd"><select id="ga-${d.id}" data-add="${d.id}" aria-label="Додати прилад"><option value="">+ Додати прилад…</option>${LOADS.map((l,i)=>`<option value="${i}">${l[0]} · ${fmt(l[1],2)} кВт</option>`).join("")}</select></div>
      <div class="gf"><div class="line"><span>Кабель <select id="gs-${d.id}" data-gsec="${d.id}">${SECS.slice(0,6).map(x=>`<option value="${x}" ${g.sec===x?"selected":""}>${fmt(x,x%1?1:0)} мм²</option>`).join("")}</select></span><span class="mono" style="color:${inA(d.rating)>CAB[g.sec]?"var(--red)":"var(--muted)"}">до ${CAB[g.sec]} А</span></div>
      <div class="line"><span>Увімкнено</span><span data-gload="${d.id}">${L.txt}</span></div><div class="bar" data-gbar="${d.id}">${L.bar}</div>
      ${S.mode==="test"?`<div class="gtest"><button class="btn" data-leak="${d.id}" style="${S.leak.has(d.id)?"border-color:var(--orange);color:var(--orange)":""}">Витік на корпус</button><button class="btn" data-short="${d.id}" style="${S.short.has(d.id)?"border-color:var(--red);color:var(--red)":""}">Коротке замикання</button><button class="btn" data-arc="${d.id}" style="${S.arc.has(d.id)?"border-color:var(--orange);color:var(--orange)":""}">Іскріння</button></div>`:""}</div></article>`; }).join(""); }
function totalKW(){ const R=S.sim; if(!R) return 0; let p=0; for(const l of R.loads){ if(l.abc) p+=l.g3?l.I*3*(l.U||230)/1000:Math.max(...l.Is)*400*1.732*0.85/1000; else if(l.I) p+=l.I*(l.U||230)/1000; } return p; }
function renderSummary(){ const mods=S.devices.reduce((a,d)=>a+T[d.type].w,0);
  $("summary").innerHTML=[["Модулі",`${mods}<small> / ${SLOTS*S.board.rails}</small>`],["Апарати",S.devices.length],["Дроти",S.wires.length],["Навантаження",`${fmt(totalKW(),2)}<small> кВт</small>`]]
    .map(([k,v])=>`<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`).join(""); }
function renderSheet(){ const sw=S.mode==="wire"&&S.selWire&&wireById(S.selWire); if(sw){ renderWireSheet(sw); return; }
  const f=S.selDev&&S.field.find(x=>x.id===S.selDev); if(f){ renderFieldSheet(f); return; }
  const d=S.selDev&&S.devices.find(x=>x.id===S.selDev), sh=$("sheet"); if(!d){ sh.hidden=true; return; } sh.hidden=false; const t=T[d.type];
  let s=`<div class="sheet-h"><b>${desig(d)} · ${t.name}</b><button class="btn" id="sheetClose">Готово</button></div>`;
  s+=`<div class="row nowrap"><span class="lbl">Підпис</span><input class="inp" id="capIn" data-capfor="${d.id}" value="${esc(d.group?d.group.name:(d.cap||t.cap||t.short))}" maxlength="40" aria-label="Підпис (наклейка)"></div>`;
  if(t.group&&t.groupOpt) s+=`<div class="row"><span class="lbl">Група</span><button class="chip" data-gtoggle aria-pressed="${!!d.group}">${d.group?"Це група споживачів (3 фази)":"Зробити групою споживачів"}</button></div>`;
  const bl=brandsFor(d.type);
  if(bl.length>1) s+=`<div class="row"><span class="lbl">Виробник</span>${bl.map(b=>`<button class="chip" data-brand="${b}" aria-pressed="${brandOf(d)===b}">${esc(BR[b].s||BR[b].n)}</button>`).join("")}</div>`
    +`<div class="row">${modelOf(d)?`<span class="hint" style="flex:1 1 140px">Модель: <b>${esc(modelOf(d))}</b></span>`:""}<button class="btn" data-brandall>Цей виробник — усім апаратам</button></div>`;
  if(d.type==="stair") s+=`<div class="row"><span class="lbl">Час світла</span>${[10,30,60,120].map(v=>`<button class="chip mono" data-delay="${v}" aria-pressed="${d.delay===v}">${v} с</button>`).join("")}</div>`;
  if(d.type==="kt") s+=`<div class="row"><span class="lbl">Витримка</span>${[1,3,5,10,20,30].map(v=>`<button class="chip mono" data-delay="${v}" aria-pressed="${d.delay===v}">${v} с</button>`).join("")}</div>`;
  if(d.type==="sock") s+=`<div class="row"><span class="lbl">Розетка</span><button class="chip" data-plug aria-pressed="${!!d.plug}">${d.plug?"Інструмент 1,2 кВт увімкнено":"Увімкнути інструмент 1,2 кВт"}</button></div>`;
  if(d.type==="xtb") s+=`<div class="row"><span class="lbl">Колір</span>${[["grey","Сірий · L"],["blue","Синій · N"],["pe","Жовто-зелений · PE"]].map(([c,l])=>`<button class="chip" data-xcol="${c}" aria-pressed="${d.col===c}">${l}</button>`).join("")}</div>`;
  if(d.type==="photo") s+=`<div class="row"><span class="lbl">Поріг</span>${[10,20,40].map(v=>`<button class="chip mono" data-th="${v}" aria-pressed="${d.th===v}">${v} %</button>`).join("")}</div>`;
  if(t.ratings) s+=`<div class="row"><span class="lbl">${d.type==="qm"?"Діапазон":"Номінал"}</span>`+t.ratings.map(r=>`<button class="chip mono" data-rate="${r}" aria-pressed="${d.rating===r}">${r}${t.unit||""}</button>`).join("")+`</div>`;
  if(d.type==="qm") s+=`<div class="volt"><span class="lbl">Уставка Ir</span><input type="range" id="irset" min="${mprLo(d.rating)}" max="${mprHi(d.rating)}" step="0.1" value="${d.Ir}"><output class="mono" id="irout">${fmt(d.Ir,1)} А</output></div>`;
  if(d.type==="ats") s+=`<div class="row"><span class="lbl">Режим</span><button class="chip" data-atsm="0" aria-pressed="${!d.manual}">Автоматичний</button><button class="chip" data-atsm="1" aria-pressed="${!!d.manual}">Ручний</button><button class="chip" data-atsv="tomzn" aria-pressed="${d.variant==="tomzn"}">TOMZN</button><button class="chip" data-atsv="geya" aria-pressed="${d.variant==="geya"}">GEYA</button></div>`;
  if(d.type==="ssw") s+=`<div class="row"><span class="lbl">Застосунок</span><button class="chip" data-cmd="1" aria-pressed="${!!d.cmd}">Увімкнути</button><button class="chip" data-cmd="0" aria-pressed="${!d.cmd}">Вимкнути</button></div>`;
  if(d.type==="hl") s+=`<div class="row"><span class="lbl">Колір</span>${[["#3fbf4a","Зелений"],["#e23b3b","Червоний"],["#ffb21f","Жовтий"]].map(([c,l])=>`<button class="chip" data-hlc="${c}" aria-pressed="${d.col===c}">${l}</button>`).join("")}</div>`;
  s+=`<div class="row"><span class="lbl">Місце</span><button class="btn" data-move="-1">←</button><button class="btn" data-move="1">→</button>${S.board.rails>1?`<button class="btn" data-mrail="-1">↑ Рейка</button><button class="btn" data-mrail="1">↓ Рейка</button>`:""}
    ${t.prot||t.rcd?`<button class="btn" id="devToggle">${d.on&&!d.trip?"Вимкнути":"Увімкнути"}</button>`:""}<button class="btn danger" id="devDel">Зняти з рейки</button></div>`;
  $("sheetIn").innerHTML=s; }
function updateLive(){
  for(const d of groupsOf()){ const st=document.querySelector(`[data-gstat="${d.id}"]`); if(st) st.innerHTML=gStatus(d);
    const c=document.querySelector(`[data-card="${d.id}"]`); const R=S.sim&&S.sim.g[d.id]; if(c) c.classList.toggle("live",!!(R&&R.phase&&R.neutral)); }
  const lg=$("log"); if(lg) lg.innerHTML=S.log.length?S.log.map(l=>`<div class="${l.cls}">${esc(l.msg)}</div>`).join(""):`<div>Журнал подій порожній.</div>`;
  const st=$("stl"); if(st&&S.tplObj&&S.tplObj.demo&&S.tplObj.demo.status){ try{ st.innerHTML=S.tplObj.demo.status().map(([a,b,c])=>`<div class="sl"><span>${esc(a)}</span><b class="${c||""}">${esc(b)}</b></div>`).join(""); }catch(e){ st.innerHTML=""; } }
  document.querySelectorAll("[data-srcon]").forEach(b=>b.setAttribute("aria-pressed",!!(S.src[b.dataset.srcon]||{}).on));
  const dm=S.tplObj&&S.tplObj.demo; if(dm) document.querySelectorAll("[data-ctl]").forEach(el=>{ const c=dm.controls[+el.dataset.ctl]; if(!c) return;
    if(c.type==="toggle") el.setAttribute("aria-pressed",!!c.get()); if(c.type==="choice") el.setAttribute("aria-pressed",c.get()===el.dataset.v); });
  if(typeof updateDemoStat==="function") updateDemoStat();
}
function renderAll(full=true){ render(); hint(); renderSummary(); renderSheet(); if(full){ renderTools(); renderGroups(); } else updateLive();
  document.querySelectorAll(".modes button").forEach(b=>b.setAttribute("aria-selected",b.dataset.mode===S.mode));
  $("svg").style.width=(S.zoom*100)+"%"; $("zFit").textContent=Math.round(S.zoom*100)+"%"; }
function commit(full=true){ if(typeof trackHistory==="function") trackHistory(); save(); solve(0); renderAll(full); }
