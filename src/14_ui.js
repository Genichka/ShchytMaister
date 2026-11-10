/* ===== Інтерфейс ===== */
const $ = id => document.getElementById(id);
let toastT=null;
function toast(msg,cls=""){ if(S.quiet) return; const t=$("toast"); t.textContent=msg; t.className="toast "+cls; t.style.opacity=1; clearTimeout(toastT); toastT=setTimeout(()=>t.style.opacity=0,2600); }
const DEV_GROUPS = [["Захист ліній",["qf1p","qfn","qf2p","qf3p","qf4p","rcbo","afdd","rcd","rcd4","fuac"]],["Контроль напруги і УЗІП",["kv","tovpd1","kvf","kvf2","pef","vm","spdac","spd3"]],["Облік",["pm1","pm3"]],["Комутація і АВР",["sw2","ats","toq5","toq7","to219","qs","km2a","km3a","km4a"]],
  ["Керування",["sbp","sbs","hl","rel","kt","ktb","ktm","kimp","stair","photo","logo","kmc1no","kmc1nc","kmc2no","kmc11","kmc2nc","kmc4no","kmc31","kmc22","kmc4nc","lc1d"]],["Двигуни",["qm"]],["Розподіл",["xtb","sock"]],["Розумний дім",["ssw","pm","tr","hub","kr2"]],["Сонячна станція (DC)",["qfdc","fudc","spdc"]]];
const TPL_ORDER = ["Конструктор","Квартира і будинок","АВР на 2 вводи","3 фази + інвертор","Сонячна станція","Двигуни"];
let clearArm=0;
function applyTemplate(name){ const t=TPL[name]||TPL.flat; t.build(); S.tpl=TPL[name]?name:"flat"; S.tplObj=t; S.env0=JSON.parse(JSON.stringify(S.env||{})); S.proj={id:null,name:t.name}; S.guide=null; S.lastCheck=null;
  Object.assign(S,{pend:null,selWire:null,selDev:null,pick:null,heat:{},log:[],demo:null}); S.leak.clear(); S.short.clear(); S.leakWarned.clear(); S.arc.clear(); S.arcWarned.clear();
  if(typeof resetHistory==="function"){ resetHistory(); S.baseSig=structSnap(); } if(typeof hideDemoBar==="function") hideDemoBar(); save(); }
function resetRuntime(){ for(const s of Object.values(S.src)){ s.on=false; s.U=230; s.lost={}; }
  for(const d of S.devices){ const t=T[d.type]; if(t.prot||t.rcd){ d.on=true; d.trip=null; } d.pulled=false; d.pressed=false; if(d.type==="logo"||d.type==="kv"||d.type==="tovpd1") { delete d.ks; if(t.init) t.init(d); } if(d.type==="ats"||d.type==="toq5") d.manual=false; if(d.type==="spdc") d.wear=0; }
  for(const f of S.field){ Object.assign(f,{jam:false,cap:true,fault:false,faultT:0,en:true,run:false,dead:false}); if(f.type==="valve") f.pos=100; }
  S.env=JSON.parse(JSON.stringify(S.env0||{})); S.heat={}; S.log=[]; S.leak.clear(); S.short.clear(); S.leakWarned.clear(); S.arc.clear(); S.arcWarned.clear(); }
function livePress(des){ const d=typeof des==="string"?byDes(des):des; if(!d) return; d.pressed=true; solve(0); renderAll(false);
  setTimeout(()=>{ d.pressed=false; solve(0); renderAll(false); },700); }

function hint(){ let h=""; if(S.noDoc){ $("hint").innerHTML="<span>Робоча зона порожня. Створіть новий щиток або відкрийте приклад; збережені проєкти та імпорт — кнопка «Проєкт» справа вгорі.</span>"; return; } const gh0=(!S.pick&&!S.selDev&&!S.selWire&&typeof guideHint==="function")?guideHint():"";
  if(S.mode==="mount") h=S.pick?`<b>${T[S.pick].name}${S.pickRating?" "+S.pickRating+(T[S.pick].unit||""):""}</b>: торкніться вільного місця на рейці${S.pickQty>1?` — поставиться ${S.pickQty} шт. підряд`:""}. ✕ унизу — скасувати.`:"Перетягніть модуль із нижньої панелі на рейку (мишею; пальцем — затисніть і тягніть). Модуль на рейці, шини N і PE, колодку XT2 — затисніть і тягніть, щоб пересунути; дотик — налаштування.";
  if(S.mode==="wire") h=S.moveEnd?"Торкніться нової клеми для перемички, яку переносимо.":S.selWire?"Перемичку вибрано: кружечок на кінці — на іншу клему; середину перемички — тягніть, щоб прокласти інакше.":S.pend?`Початок: <b>${esc(termName(S.pend))}</b>. Торкніться другої клеми.`:"Нова перемичка — тягніть від клеми до клеми. Перемичку — затисніть посередині й тягніть, щоб відвести вбік. Модуль — затисніть і тягніть.";
  if(S.mode==="test") h=S.demo?`Демонстрація: крок ${S.demo.i+1} з ${S.tplObj.demo.script.length}`:"Подайте напругу, тисніть кнопки й важелі на модулях або запустіть демонстрацію.";
  if(!gh0&&(S.mode==="mount"||S.mode==="wire")&&!S.pick&&!S.selDev&&!S.selWire&&!S.pend&&!S.moveEnd&&checkedOK())
    h=`<b class="hok">✓ Щиток готовий.</b> <button class="hlink" data-hgo="fin">Зберегти PDF / Visio</button> · <button class="hlink" data-hgo="test">⚡ Тест</button>`;
  if(S.moveDev) h="✥ Торкніться вільного місця на рейці — модуль переїде туди разом із перемичками.";
  else if(S.repl&&S.mode==="mount") h="🔁 Оберіть унизу новий модуль — він стане на те саме місце, перемички на однакові клеми лишаться.";
  if(gh0&&!S.moveDev&&!S.repl) h=gh0; $("hint").innerHTML=`<span>${h}</span>`; }
function ctlHTML(c,i){
  if(c.type==="src"){ const s=S.src[c.id]||{}, inp=S.board.inputs.find(x=>x.id===c.id)||{}, three=(inp.terms||[]).includes("L1");
    return `<div class="mains"><button class="switch" data-srcon="${c.id}" aria-pressed="${!!s.on}"><span class="knob"></span>${esc(c.label||inp.label)}</button>`+
      (c.noU?"":`<div class="volt"><input type="range" id="u-${c.id}" data-srcu="${c.id}" min="150" max="290" step="1" value="${Math.round(s.U||230)}" aria-label="Напруга"><output class="mono" id="uo-${c.id}">${three?Math.round((s.U||230)*1.732)+" В лін.":Math.round(s.U||230)+" В"}</output></div>`)+`</div>`; }
  if(c.type==="toggle") return `<button class="switch sm" data-ctl="${i}" aria-pressed="${!!c.get()}"><span class="knob"></span>${esc(c.label)}</button>`;
  if(c.type==="range") return `<div class="volt"><span class="lbl" style="min-width:auto">${esc(c.label)}</span><input type="range" id="c-${i}" data-ctl="${i}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.get()}"><output class="mono" id="co-${i}">${c.get()}</output></div>`;
  if(c.type==="choice") return `<div class="row"><span class="lbl">${esc(c.label)}</span>`+c.opts.map(([v,l])=>`<button class="chip" data-ctl="${i}" data-v="${v}" aria-pressed="${c.get()===v}">${esc(l)}</button>`).join("")+`</div>`;
  if(c.type==="btn") return `<button class="btn ${c.cls||""}" data-ctl="${i}">${esc(c.label)}</button>`;
  return ""; }
function gStatus(d){ const R=S.sim&&S.sim.g[d.id]; if(!R||!anySource()) return `<span class="pill off">Знеструмлено</span>`;
  if(R.phase&&R.neutral) return (R.U>U_MAX||R.U<U_MIN)?`<span class="pill bad">${Math.round(R.U)} В!</span>`:`<span class="pill ok">Під напругою</span>`;
  return `<span class="pill bad">${R.phase?"Немає N":"Немає фази"}</span>`; }
function gLoad(d){ const kw=kwOf(d), I=kw*1000/(g3(d)?690:230), In=inA(d.rating), p=Math.min(100,I/In*100), c=I>In?"var(--red)":I>0.8*In?"var(--orange)":"var(--green)";
  return {txt:`${fmt(kw,2)} кВт · <b class="mono">${fmt(I)} А</b> / ${In} А`, bar:`<i style="width:${p}%;background:${c}"></i>`}; }
function totalKW(){ const R=S.sim; if(!R) return 0; let p=0; for(const l of R.loads){ if(l.abc) p+=l.g3?l.I*3*(l.U||230)/1000:Math.max(...l.Is)*400*1.732*0.85/1000; else if(l.I) p+=l.I*(l.U||230)/1000; } return p; }
function updateLive(){
  for(const d of groupsOf()){ const st=document.querySelector(`[data-gstat="${d.id}"]`); if(st) st.innerHTML=gStatus(d); }
  const ll=$("logline"); if(ll) ll.innerHTML=S.log.length?`<span class="${S.log[0].cls}">${esc(S.log[0].msg)}</span><i>журнал ›</i>`:`<span>Журнал подій порожній</span>`;
  const st=$("stl"); if(st&&S.tplObj&&S.tplObj.demo&&S.tplObj.demo.status){ try{ st.innerHTML=S.tplObj.demo.status().map(([a,b,c])=>`<span class="pill2"><span>${esc(a)}</span> <b class="${c||""}">${esc(b)}</b></span>`).join(""); }catch(e){ st.innerHTML=""; } }
  document.querySelectorAll("[data-srcon]").forEach(b=>b.setAttribute("aria-pressed",!!(S.src[b.dataset.srcon]||{}).on));
  const dm=S.tplObj&&S.tplObj.demo; if(dm) document.querySelectorAll("[data-ctl]").forEach(el=>{ const c=dm.controls[+el.dataset.ctl]; if(!c) return;
    if(c.type==="toggle") el.setAttribute("aria-pressed",!!c.get()); if(c.type==="choice") el.setAttribute("aria-pressed",c.get()===el.dataset.v); });
  if(typeof updateDemoStat==="function") updateDemoStat();
}
function renderAll(full=true){ render(); hint(); renderBar(); if(!full) updateLive();
  for(const [id,c] of [[S.moveDev,"mv"],[S.repl,"rp"]]) if(id){ const g=document.querySelector(`[data-dev="${id}"]`); if(g) g.classList.add(c); }
  document.querySelectorAll(".tb[data-mode]").forEach(b=>b.setAttribute("aria-selected",b.dataset.mode===S.mode));
  $("undoTop").disabled=S.noDoc||!(S.hist&&S.hist.length); $("redoTop").disabled=S.noDoc||!(S.fut&&S.fut.length);
  document.querySelectorAll(".tb[data-mode],#btnCheck,#docsBtn").forEach(b=>b.disabled=!!S.noDoc); document.querySelector(".fab").hidden=!!S.noDoc; $("closeBtn").hidden=!!S.noDoc; $("scroller").classList.toggle("empty",!!S.noDoc);
  $("svg").style.width=(S.noDoc?100:S.zoom*100)+"%"; $("zFit").textContent=Math.round(S.zoom*100)+"%"; }
function commit(full=true){ if(typeof trackHistory==="function") trackHistory(); save(); solve(0); renderAll(full); }
