/* ===== Проєкти, майстер нового щита, корпус, обладнання, «Скасувати», демо-панель ===== */
// ---- Діалог
let DLG=[];
function dialog(title, body, buttons){
  $("dlgCard").innerHTML=`<h2 id="dlgTitle">${esc(title)}</h2><div class="dlg-b">${body}</div><div class="row dlg-f">${buttons.map((b,i)=>`<button class="btn ${b.cls||""}" data-dlg="${i}">${esc(b.label)}</button>`).join("")}</div>`;
  DLG=buttons; $("dlg").hidden=false; const f=$("dlg").querySelector(".btn.primary"); if(f) f.focus(); }
const closeDlg = () => { $("dlg").hidden=true; };

// ---- Структурний знімок і «Скасувати»
const SKEYS=["id","type","rail","slot","rating","group","cap","model","Ir","variant","col","uc","delay","plug","th","noGroup","sid","n","name","map"];
const pickS = o => { const r={}; for(const key of SKEYS) if(o[key]!==undefined) r[key]=o[key]; return r; };
function structSnap(){ return JSON.stringify({board:S.board, devices:S.devices.map(pickS), field:S.field.map(pickS), wires:S.wires, comb:S.comb, plan:S.plan||null}); }
S.hist=[]; S.lastSnap=null;
function resetHistory(){ S.hist=[]; S.fut=[]; S.lastSnap=structSnap(); }
function trackHistory(){ const cur=structSnap(); if(S.lastSnap===null){ S.lastSnap=cur; return; } if(cur!==S.lastSnap){ S.hist.push(S.lastSnap); if(S.hist.length>60) S.hist.shift(); S.lastSnap=cur; S.fut=[]; } }
function redo(){ if(!S.fut||!S.fut.length){ toast("Немає дій для повтору","w"); return; } S.hist.push(structSnap()); applySnap(JSON.parse(S.fut.pop())); toast("Повторено","ok"); }
function undo(){ if(!S.hist.length){ toast("Немає дій для скасування","w"); return; } (S.fut||(S.fut=[])).push(structSnap()); applySnap(JSON.parse(S.hist.pop())); toast("Скасовано","ok"); }
function applySnap(j){
  S.board=j.board; S.comb=j.comb; S.wires=j.wires;
  S.devices=j.devices.map(d=>{ const nd={...d,on:true,trip:null}; if(T[d.type]&&T[d.type].init) T[d.type].init(nd); return nd; });
  S.field=j.field.map(f=>{ const nd={...f}; if(FT[f.type].init) FT[f.type].init(nd); return nd; });
  S.plan=j.plan||null; S.lastSnap=structSnap(); GEO=null; Object.assign(S,{selDev:null,selWire:null,pend:null}); save(); solve(0); renderAll(true); }

// ---- Проєкти
const PKEY="shchyt-projects";
function projDB(){ try{ const j=JSON.parse(localStorage.getItem(PKEY)||"null"); return j&&Array.isArray(j.list)?j:{list:[]}; }catch(e){ return {list:[]}; } }
function projSave(db){ try{ localStorage.setItem(PKEY,JSON.stringify(db)); return true; }catch(e){ toast("Не вдалося зберегти: пам’ять браузера недоступна або заповнена","e"); return false; } }
function curData(){ return JSON.parse(JSON.stringify({tpl:S.tpl, board:S.board, devices:S.devices, field:S.field, wires:S.wires, comb:S.comb, src:S.src, env:S.env, env0:S.env0, guide:S.guide||null, plan:S.plan||null, UID})); }
function storeProject(){ if(!S.proj||!S.proj.id) return; const db=projDB(), p=db.list.find(x=>x.id===S.proj.id); if(!p) return;
  p.data=curData(); p.name=S.proj.name; p.updated=Date.now(); db.cur=p.id; projSave(db); }
function newProjectFromCurrent(name){ const db=projDB(), id="p"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  db.list.push({id,name,updated:Date.now(),data:curData()}); db.cur=id; if(!projSave(db)) return;
  S.proj={id,name}; S.baseSig=structSnap(); save(); renderProjBtn(); toast(`Проєкт «${name}» збережено`,"ok"); }
function loadData(d){ Object.assign(S,{tpl:d.tpl||"custom", board:d.board, devices:d.devices||[], field:d.field||[], wires:d.wires||[], comb:d.comb||null,
  src:d.src||{}, env:d.env||{}, env0:d.env0||d.env||{}, guide:d.guide||null, plan:d.plan||null}); UID=Math.max(UID,d.UID||1);
  for(const i of S.board.inputs){ S.src[i.id]=S.src[i.id]||{U:230,lost:{}}; S.src[i.id].on=false; } S.tplObj=TPL[S.tpl]||TPL.custom; }
function openProject(id){ const db=projDB(), p=db.list.find(x=>x.id===id); if(!p) return; loadData(p.data); S.proj={id:p.id,name:p.name}; db.cur=id; projSave(db); afterSwitch(); toast(`Відкрито: «${p.name}»`,"ok"); }
function afterSwitch(){ GEO=null; Object.assign(S,{pend:null,selWire:null,selDev:null,pick:null,heat:{},log:[]}); if(S.demo) demoStop(); S.leak.clear(); S.short.clear(); S.leakWarned.clear(); S.arc.clear(); S.arcWarned.clear();
  resetHistory(); S.baseSig=structSnap(); clearCheck(); save(); solve(0); renderAll(true); tplLabel(); renderProjBtn(); }
function renderProjBtn(){ const el=$("projName"); if(!el) return; const ok=!!(S.proj&&S.proj.id); el.textContent=(S.proj&&S.proj.name)||"Новий щит"; const b=$("projBtn"); if(b){ b.classList.toggle("unsaved",!ok); b.title=ok?"Збережено · відкрити меню проєкту":"Не збережено · відкрити меню проєкту"; } }
const isDirty = () => !(S.proj&&S.proj.id) && S.baseSig && structSnap()!==S.baseSig;
function confirmLeave(next){
  if(!isDirty()){ next(); return; }
  dialog("Зберегти поточний щит?",`<p>Цей щит змінено, але не збережено як проєкт. Після переходу зміни зникнуть.</p><label class="lbl2" for="dlgName">Назва проєкту</label><input class="inp" id="dlgName" value="${esc((S.proj&&S.proj.name)||"Мій щит")}">`,
    [{label:"Скасувати"},{label:"Не зберігати",cls:"danger",act:next},{label:"Зберегти",cls:"primary",act:()=>{ newProjectFromCurrent(($("dlgName").value||"").trim()||"Мій щит"); next(); }}]); }
function exportProject(){ const name=(S.proj&&S.proj.name)||(S.tplObj&&S.tplObj.name)||"Щит";
  const blob=new Blob([JSON.stringify({app:"ShchytMaister",v:APP.v,name,data:curData()},null,1)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name.replace(/[\\/:*?"<>|]+/g,"_")+".shchyt.json"; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); toast("Файл проєкту збережено в «Завантаження»","ok"); }
function importProject(file){ const r=new FileReader();
  r.onload=()=>{ try{ const j=JSON.parse(r.result), d=j.data||j; if(!d.board||!Array.isArray(d.devices)) throw new Error("format");
      if(d.devices.some(x=>!T[x.type])||(d.field||[]).some(x=>!FT[x.type])) throw new Error("types");
      const db=projDB(), id="p"+Date.now().toString(36), name=(j.name||file.name.replace(/\.shchyt\.json$|\.json$/,""))+"";
      db.list.push({id,name,updated:Date.now(),data:d}); projSave(db); closeDlg(); confirmLeave(()=>openProject(id)); }
    catch(e){ toast(e.message==="types"?"Файл з новішої версії ЩитМайстра: оновіть застосунок":"Це не файл проєкту ЩитМайстра","e"); } };
  r.readAsText(file); }
const PIC = {new:"M12 5v14M5 12h14", open:"M3 7h6l2 2h10v10H3z", save:"M5 3h11l3 3v15H5zM8 3v6h8V3M8 21v-7h8v7", copy:"M8 8h12v12H8zM4 16V4h12",
  exp:"M12 3v12M7 10l5 5 5-5M4 19h16", imp:"M12 21V9M7 14l5-5 5 5M4 5h16", close:"M6 6l12 12M18 6 6 18"};
const pic = k => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${PIC[k]}"/></svg>`;
const fWhen = t => new Date(t).toLocaleString("uk-UA",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
function projStatus(){ const cur=S.proj||{}, p=cur.id&&projDB().list.find(x=>x.id===cur.id);
  return p?{ok:true,txt:`Збережено · зміни зберігаються автоматично · ${fWhen(p.updated)}`}:{ok:false,txt:isDirty()?"Не збережено — є зміни, натисніть «Зберегти»":"Не збережено як проєкт"}; }
function openProjects(){ const db=projDB(), list=db.list.slice().sort((a,b)=>b.updated-a.updated), cur=S.proj||{}, st=projStatus();
  const body=`<div class="pcur"><label class="lbl2" for="pName">Відкритий щит</label><input id="pName" class="inp" value="${esc(cur.name||"Мій щит")}" maxlength="60" aria-label="Назва щита">
      <p class="pst ${st.ok?"ok":"no"}"><i></i>${esc(st.txt)}</p></div>
    <div class="pgrid">
      <button class="pbtn" data-pa="new">${pic("new")}<b>Створити</b><small>новий щит</small></button>
      <button class="pbtn" data-pa="openlist">${pic("open")}<b>Відкрити</b><small>збережений</small></button>
      <button class="pbtn${st.ok?"":" hot"}" data-pa="save">${pic("save")}<b>Зберегти</b><small>${cur.id?"під цією назвою":"як новий проєкт"}</small></button>
      <button class="pbtn" data-pa="copy">${pic("copy")}<b>Зберегти як…</b><small>копію з новою назвою</small></button>
      <button class="pbtn" data-pa="export">${pic("exp")}<b>Експорт</b><small>у файл .json</small></button>
      <button class="pbtn" data-pa="import">${pic("imp")}<b>Імпорт</b><small>з файлу</small></button>
      <button class="pbtn wide" data-pa="close">${pic("close")}<b>Закрити щит</b><small>${cur.id?"проєкт лишиться в списку":"незбережені зміни буде втрачено"}</small></button></div>
    <div class="lbl2" id="plistH">Збережені проєкти · ${list.length}</div><div class="plist">${list.length?list.map(p=>`<div class="pi${p.id===cur.id?" cur":""}"><div class="pi-n"><b>${esc(p.name)}</b><small>${fWhen(p.updated)} · ${(p.data.devices||[]).length} апаратів · ${(p.data.wires||[]).length} дротів</small></div>
      ${p.id===cur.id?`<span class="pill ok">відкрито</span>`:`<button class="btn" data-pa="open" data-pid="${p.id}">Відкрити</button>`}<button class="btn danger" data-pa="del" data-pid="${p.id}" aria-label="Видалити ${esc(p.name)}">✕</button></div>`).join(""):`<p class="hint" style="padding:10px">Збережених проєктів ще немає. Натисніть «Зберегти», щоб додати поточний щит.</p>`}</div>`;
  dialog("Проєкт",body,[{label:"Готово",cls:"primary"}]); }
function saveProject(){ const n=(($("pName")&&$("pName").value)||(S.proj&&S.proj.name)||"Мій щит").trim()||"Мій щит";
  if(S.proj&&S.proj.id){ S.proj.name=n; storeProject(); renderProjBtn(); toast(`Збережено: «${n}»`,"ok"); } else newProjectFromCurrent(n); }
function closeBoard(){ confirmLeave(()=>{ applyTemplate("empty"); S.proj={id:null,name:"Новий щит"}; S.baseSig=structSnap(); S.mode="mount"; save(); clearCheck(); afterSwitch(); toast("Щит закрито","ok"); openProjects(); }); }

// ---- Майстер нового щита і налаштування корпусу
let WZ=null;
const boardKind = b => b.inputs.length>1?(b.inputs[1].inv?"2inv":"2in"):b.inputs[0].terms.includes("L1")?"3ph":b.inputs[0].terms.length===1?"gnd":"1ph";
const KINDS = [["1ph","1 фаза · 230 В","Квартира, дім, дача. Ввід L, N, PE."],["3ph","3 фази · 400 В","Будинок, майстерня, двигуни. Ввід L1, L2, L3, N, PE."],["2in","2 вводи · мережа + генератор","Резервне живлення через АВР. Ввід 1 — L, N, PE; ввід 2 — L, N."],
  ["2inv","2 вводи · мережа + інвертор","Резерв від інвертора з АКБ через АВР. Ввід 1 — мережа L, N, PE; ввід 2 — вихід інвертора L, N."]];
const INV_KW=[3,3.6,5,6,8], INV_KWH=[2.5,5,10,15];
const kindTitle = w => w.kind==="2inv"?`2 вводи · мережа + інвертор ${fmt(w.ikw,w.ikw%1?1:0)} кВт, АКБ ${fmt(w.ikwh,w.ikwh%1?1:0)} кВт·год`:(KINDS.find(x=>x[0]===w.kind)||["","DC-бокс"])[1];
function boardFor(w){ const cur=S.board;
  const inputs = w.kind==="gnd"?cur.inputs : w.kind==="3ph"?[{id:"in",label:"Ввід 3~ 400 В",terms:["L1","L2","L3","N","PE"]}]
    : w.kind==="2in"?[{id:"in",label:"Ввід 1 · мережа",terms:["L","N","PE"]},{id:"in2",label:"Ввід 2 · генератор",terms:["L","N"]}]
    : w.kind==="2inv"?[{id:"in",label:"Ввід 1 · мережа",terms:["L","N","PE"]},{id:"in2",label:"Ввід 2 · інвертор",terms:["L","N"],inv:{kw:w.ikw,kwh:w.ikwh}}] : [{id:"in",label:"Ввід",terms:["L","N","PE"]}];
  return {rails:w.rails, inputs, xn:w.xn, xpe:w.xpe, xt:w.edit?cur.xt:[]}; }
function openWizard(edit){ const b=S.board;
  const iv=(b.inputs.find(i=>i.inv)||{}).inv||{kw:5,kwh:5};
  WZ=edit?{edit:true,step:1,name:(S.proj&&S.proj.name)||"Мій щит",kind:boardKind(b),rails:b.rails,xn:b.xn,xpe:b.xpe,guide:false,ikw:iv.kw,ikwh:iv.kwh}
    :{edit:false,step:0,name:"Мій щит "+(projDB().list.length+1),kind:"1ph",rails:2,xn:8,xpe:8,guide:true,ikw:5,ikwh:5};
  renderWizard(); $("dlg").hidden=false; }
function renderWizard(){ const w=WZ, names=["Назва","Ввід","Корпус","Шини","Готово"], first=w.edit?1:0, last=4; let b="";
  if(w.step===0) b=`<label class="lbl2" for="wzName">Як назвати щит?</label><input class="inp" id="wzName" value="${esc(w.name)}" maxlength="60"><p class="hint">Назва з’явиться в «Проєктах», щит зберігатиметься автоматично.</p>`;
  if(w.step===1) b=(w.kind==="gnd"?`<p class="hint">У цьому щиті лише контур заземлення (DC-бокс), тип вводу не змінюється.</p>`:`<p class="hint">Звідки живиться щит?</p>`+KINDS.map(([k,t,d])=>`<button class="wz-opt" data-wk="${k}" aria-pressed="${w.kind===k}"><b>${t}</b><span>${d}</span></button>`).join("")
    +(w.kind==="2inv"?`<div class="wz-inv"><div class="row"><span class="lbl">Інвертор</span>${INV_KW.map(v=>`<button class="chip mono" data-wikw="${v}" aria-pressed="${w.ikw===v}">${fmt(v,v%1?1:0)} кВт</button>`).join("")}</div>
      <div class="row"><span class="lbl">АКБ</span>${INV_KWH.map(v=>`<button class="chip mono" data-wikwh="${v}" aria-pressed="${w.ikwh===v}">${fmt(v,v%1?1:0)} кВт·год</button>`).join("")}</div>
      <p class="hint">Вихід інвертора заходить на ввід 2, АВР перемикає щит на нього, коли зникає мережа. АКБ заряджається від мережі, поки вона є.</p></div>`:""));
  if(w.step===2) b=`<p class="hint">Скільки DIN-рейок у корпусі? На кожній — 12 модулів.</p>`+[1,2,3,4].map(r=>`<button class="wz-opt" data-wr="${r}" aria-pressed="${w.rails===r}"><b>ЩРН-${r*12}</b><span>${r} рейк${r===1?"а":"и"} · ${r*12} модулів</span></button>`).join("");
  if(w.step===3) b=`<p class="hint">Скільки отворів на шинах? Кожна група займає по отвору на N і PE.</p>
    <div class="volt"><span class="lbl">Шина N</span><input type="range" id="wzXn" min="0" max="12" value="${w.xn}"><output class="mono" id="wzXnO">${w.xn}</output></div>
    <div class="volt"><span class="lbl">Шина PE</span><input type="range" id="wzXpe" min="2" max="12" value="${w.xpe}"><output class="mono" id="wzXpeO">${w.xpe}</output></div>`;
  if(w.step===4) b=`<ul class="wz-sum"><li><span>Назва</span><b>${esc(w.name)}</b></li><li><span>Ввід</span><b>${esc(kindTitle(w))}</b></li><li><span>Корпус</span><b>ЩРН-${w.rails*12}</b></li><li><span>Шини</span><b>N ${w.xn} · PE ${w.xpe}</b></li></ul>`
    +(w.edit?"":`<label class="chk"><input type="checkbox" id="wzGuide" ${w.guide?"checked":""}> Увімкнути покроковий помічник складання</label>`);
  $("dlgCard").innerHTML=`<h2>${w.edit?"Корпус і ввід":"Новий щит"}</h2><ol class="wz-steps">${names.slice(first).map((n,j)=>`<li class="${j+first<w.step?"done":j+first===w.step?"cur":""}">${n}</li>`).join("")}</ol><div class="dlg-b">${b}</div>
    <div class="row dlg-f"><button class="btn" data-wz="cancel">Скасувати</button>${w.step>first?`<button class="btn" data-wz="prev">Назад</button>`:""}${w.step<last?`<button class="btn primary" data-wz="next">Далі</button>`:`<button class="btn primary" data-wz="${w.edit?"apply":"create"}">${w.edit?"Застосувати":"Створити щит"}</button>`}</div>`;
  const f=$("dlgCard").querySelector("input.inp,.wz-opt[aria-pressed=true],.btn.primary"); if(f) f.focus(); }
function wizardCreate(){ const w=WZ; tplStart(boardFor(w)); S.tpl="custom"; S.tplObj=TPL.custom; S.env={sun:60,lux:60,soc:70}; S.env0=JSON.parse(JSON.stringify(S.env));
  S.proj={id:null,name:w.name}; S.guide=w.guide?{on:true,skip:[],testOK:false}:null; S.mode="mount"; S.devOpen=!w.guide; closeDlg(); afterSwitch(); newProjectFromCurrent(w.name);
  $("scroller").scrollIntoView({behavior:"smooth",block:"start"}); }
function wizardApply(){ const w=WZ, nb=boardFor(w);
  const lost=S.devices.filter(d=>(d.rail||0)>=w.rails); if(lost.length){ toast(`Спершу зніміть апарати з рейки ${w.rails+1}: ${lost.map(desig).join(", ")}`,"w"); return; }
  const keys=new Set(); for(const i of nb.inputs) for(const t of i.terms) keys.add(i.id+":"+t); for(let i=0;i<nb.xn;i++) keys.add("xn:"+i); for(let i=0;i<nb.xpe;i++) keys.add("xpe:"+i);
  const boardKey=x=>/^(in2?|gnd|xn|xpe):/.test(x), drop=S.wires.filter(x=>[x.a,x.b].some(q=>boardKey(q)&&!keys.has(q)));
  const go=()=>{ S.wires=S.wires.filter(x=>!drop.includes(x)); Object.assign(S.board,{rails:nb.rails,inputs:nb.inputs,xn:nb.xn,xpe:nb.xpe});
    const src={}; for(const i of nb.inputs) src[i.id]=S.src[i.id]||{on:false,U:230,lost:{}}; S.src=src; if(S.comb&&(S.comb.rail||0)>=nb.rails) S.comb=null;
    if(S.proj) S.proj.name=w.name; closeDlg(); GEO=null; commit(); renderProjBtn(); toast("Корпус і ввід змінено","ok"); };
  if(drop.length) dialog("Прибрати дроти?",`<p>${drop.length} дрот(и) підключено до клем, яких після змін не буде. Їх буде прибрано.</p>`,[{label:"Скасувати"},{label:"Прибрати і застосувати",cls:"primary",act:go}]); else go(); }

// ---- Обладнання поза щитом (через клемник XT1)
const FIELD_LIB=[
  {type:"motor1",name:"Двигун 1~ 1,1 кВт",pre:"M",t:{L:["L","L"],N:["N","N"],PE:["PE","PE"]}},
  {type:"motor3",name:"Двигун 3~ 4 кВт",pre:"M",t:{U:["U","P"],V:["V","P"],W:["W","P"],PE:["PE","PE"]}},
  {type:"lamp",name:"Освітлення 0,2 кВт",pre:"EL",t:{L:["L","L"],N:["N","N"]}},
  {type:"boiler",name:"Бойлер 2 кВт",pre:"EK",t:{L:["L","L"],N:["N","N"]}},
  {type:"floor",name:"Тепла підлога 1,5 кВт",pre:"EK",t:{L:["L","L"],N:["N","N"]}},
  {type:"valve",name:"Кран з електроприводом",pre:"YV",t:{N:["N","N"],O:["Відкр","L"],Cl:["Закр","L"]}},
  {type:"pv",name:"Стрінг PV 10 × 550 Вт",pre:"PV",t:{p:["+","DC+"],m:["−","DC-"]}},
  {type:"invpv",name:"Інвертор мережевий (вхід PV)",pre:"UZ",t:{p:["PV+","DC+"],m:["PV−","DC-"]}},
  {type:"inv",name:"Гібридний інвертор 6 кВт",pre:"UZ",one:true,t:{pp:["PV+","DC+"],pm:["PV−","DC-"],bp:["B+","DC+"],bm:["B−","DC-"],gL:["G-L","L"],gN:["G-N","N"],oL:["O-L","L"],oN:["O-N","N"],pe:["PE","PE"]}},
  {type:"bat",name:"АКБ 51 В · 10 кВт·год",pre:"GB",one:true,t:{p:["+","DC+"],m:["−","DC-"]}}];
function addField(type){ const L=FIELD_LIB.find(x=>x.type===type);
  if(L.one&&S.field.some(f=>f.type===type)){ toast("Такий пристрій може бути лише один","w"); return; }
  if(type==="invpv"&&S.field.some(f=>f.type==="invpv")){ toast("Мережевий інвертор може бути лише один","w"); return; }
  let n=1; while(S.field.some(f=>f.name===L.pre+n)) n++; const name=L.pre+n, map={};
  for(const [t,[lbl,role]] of Object.entries(L.t)){ let key=(name+lbl).replace(/[:\s]/g,""); while(S.board.xt.some(x=>x.k===key)) key+="_"; S.board.xt.push({k:key,l:name+" "+lbl,r:role}); map[t]="xt:"+key; }
  const extra={name}; if(type==="pv"){ let s=1; while(S.field.some(f=>f.sid==="pv"+s)) s++; extra.sid="pv"+s; extra.n=10; if(S.env.sun===undefined) S.env.sun=60; }
  if(type==="bat"&&S.env.soc===undefined) S.env.soc=70;
  S.field.push(mkField(type,map,extra)); GEO=null; S.fldOpen=false; commit(); toast(`${name} додано: його клеми — на клемнику XT1 унизу щита`,"ok"); }
function removeField(f){ const keys=Object.values(f.map); S.field=S.field.filter(x=>x!==f); S.board.xt=S.board.xt.filter(x=>!keys.includes("xt:"+x.k));
  S.wires=S.wires.filter(w=>!keys.includes(w.a)&&!keys.includes(w.b)); S.selDev=null; GEO=null; commit(); }
function renderFieldSheet(f){ const L=FIELD_LIB.find(x=>x.type===f.type)||{name:FT[f.type].name};
  let s=`<div class="sheet-h"><b>${esc(f.name||desig(f))} · ${esc(L.name)}</b><button class="btn" id="sheetClose">Готово</button></div>`;
  s+=`<p class="hint" style="margin:0">Клеми на XT1: ${Object.values(f.map).map(k=>esc(termName(k).replace(/^Клема XT1 /,""))).join(", ")}</p>`;
  if(f.type==="pv") s+=`<div class="row"><span class="lbl">Панелей</span>${[6,8,10,12].map(n=>`<button class="chip mono" data-pvn="${n}" aria-pressed="${f.n===n}">${n}</button>`).join("")}<span class="hint">Voc ≈ ${Math.round((f.n||10)*49.6)} В</span></div>`;
  s+=`<div class="row"><button class="btn danger" data-fdel="${f.id}">Прибрати обладнання</button></div>`;
  $("sheet").hidden=false; $("sheetIn").innerHTML=s; }

// ---- Керування для власних щитів (будуються з того, що є на щиті)
function surgeAll(){ const f=build({ideal:true}), pe=S.board.inputs.find(i=>i.terms.includes("PE"));
  const ac=S.board.inputs.filter(i=>i.terms.includes("N")&&i.terms.some(t=>/^L/.test(t)));
  if(ac.length){ const ph=ac.flatMap(i=>i.terms.filter(t=>/^L/.test(t)).map(t=>f(i.id+":"+t)));
    const ok=S.devices.filter(d=>(d.type==="spdac"||d.type==="spd3")&&(d.wear||0)<2&&pe&&f(k(d,"pe"))===f(pe.id+":PE")&&ph.includes(f(k(d,d.type==="spd3"?"L1":"L"))));
    if(ok.length){ ok.forEach(d=>{ d.wear=(d.wear||0)+1; }); logp("ok",`Імпульс з мережі: ${ok.map(desig).join(", ")} відвів його на PE`); toast("УЗІП відвів імпульс","ok"); }
    else { logp("e","Імпульс з мережі пройшов у щит: немає справного УЗІП AC між фазою, N і PE — техніка під загрозою"); toast("Імпульс пройшов у щит без УЗІП","e"); } }
  if(S.field.some(x=>x.type==="pv")&&S.field.some(x=>x.type==="invpv")) surge(); }
function autoControls(){ const c=[], b=S.board;
  for(const i of b.inputs) if(i.terms.some(t=>/^L/.test(t))){ c.push({type:"src",id:i.id,label:i.inv?"Інвертор (ввід 2)":i.label,noU:i.id==="in2"});
    if(i.inv) c.push(invSocCtl(i.id)); }
  if(b.inputs.some(i=>i.terms.includes("L1"))){ const s=()=>S.src.in;
    c.push({type:"toggle",label:"Обрив фази L3",get:()=>!!(s().lost||{}).L3,set:v=>{ (s().lost||(s().lost={})).L3=v; }});
    c.push({type:"toggle",label:"Переплутано L2 і L3 на вводі",get:()=>!!s().swap,set:v=>{ s().swap=v; }}); }
  if(S.field.some(f=>f.type==="pv")) c.push({type:"range",label:"Сонце, %",min:0,max:100,step:5,get:()=>S.env.sun??60,set:v=>{ S.env.sun=v; }});
  if(S.devices.some(d=>d.type==="photo")) c.push({type:"range",label:"Освітленість, %",min:0,max:100,step:5,get:()=>S.env.lux??60,set:v=>{ S.env.lux=v; }});
  for(const f of S.field){ if(f.type==="motor1") c.push({type:"toggle",label:`${f.name}: конденсатор справний`,get:()=>f.cap!==false,set:v=>{ f.cap=v; }});
    if(/^motor/.test(f.type)) c.push({type:"toggle",label:`${f.name}: вал заклинило`,get:()=>!!f.jam,set:v=>{ f.jam=v; }});
    if(f.type==="inv") c.push({type:"toggle",label:`${f.name}: інвертор увімкнено`,get:()=>f.en!==false,set:v=>{ f.en=v; }});
    if(/^inv/.test(f.type)) c.push({type:"btn",label:`${f.name}: відремонтувати`,act:()=>{ f.dead=false; f.faultT=0; }}); }
  const sb=S.devices.filter(d=>d.type==="sbp"||d.type==="sbs"); for(const d of sb) c.push({type:"btn",label:`${desig(d)} ${d.type==="sbp"?"Пуск":"Стоп"}`,cls:d.type==="sbp"?"go":"stop",act:()=>livePress(d)});
  if(b.inputs.some(i=>i.terms.includes("N"))||S.field.some(f=>f.type==="pv")) c.push({type:"btn",label:"Удар блискавки поруч",act:surgeAll});
  return c; }
function autoStatus(){ const R=S.sim, rows=[];
  for(const i of S.board.inputs) if(i.terms.some(t=>/^L/.test(t))){ const s=S.src[i.id]||{};
    if(i.inv){ rows.push(...invRows(i)); continue; }
    rows.push([i.label,s.on?Math.round(s.U*(i.terms.includes("L1")?1.732:1))+" В":"вимкнено",s.on?"ok":""]); }
  rows.push(["Навантаження",fmt(totalKW(),2)+" кВт",""]);
  for(const f of S.field){ if(/^motor/.test(f.type)) rows.push([f.name,f.run?(f.dir<0?"обертається вліво":"обертається"):f.hum?"гуде, не обертається":"стоїть",f.run?"ok":f.hum?"e":""]);
    if(f.type==="inv") rows.push([f.name,({grid:"мережевий",backup:"резервний",off:"вимкнено",fault:"захист"})[f.mode]||"—",f.mode==="grid"?"ok":f.mode==="fault"?"e":"w"]);
    if(f.type==="invpv") rows.push([f.name,f.dead?"пошкоджено":f.on?fmt(f.kw||0,2)+" кВт":"без DC",f.on?"ok":f.dead?"e":""]);
    if(f.type==="valve") rows.push([f.name,f.pos>=100?"відкрито":f.pos<=0?"закрито":"рух",""]);
    if(["lamp","boiler","floor"].includes(f.type)) rows.push([f.name,f.on?"працює":"без живлення",f.on?"ok":""]); }
  if(S.field.some(f=>f.type==="bat")) rows.push(["Заряд АКБ",fmt(S.env.soc||0,0)+" %",""]);
  if(S.env.arc) rows.push(["Дуга DC","ГОРИТЬ","e"]); return rows; }
TPL.custom = { name:"Власний щит", cat:"Конструктор", hidden:true, info:"Ваш щит. Апарати й дроти — у режимах «Апарати» і «Проводка». Тут подайте напругу і випробуйте схему.",
  build(){}, demo:{ get controls(){ return autoControls(); }, status:autoStatus, script:[] }};
for(const key of ["empty","empty3","empty2"]) if(TPL[key]) TPL[key].demo={ get controls(){ return autoControls(); }, status:autoStatus, script:[] };

// ---- Демо-панель (видно і пояснення, і щит)
function showDemoBar(){ $("demobar").hidden=false; document.body.classList.add("demo-on"); $("scroller").scrollIntoView({behavior:"smooth",block:"start"}); }
function hideDemoBar(){ $("demobar").hidden=true; document.body.classList.remove("demo-on"); }
function updateDemoBar(){ if(!S.demo||$("demobar").hidden) return; const sc=S.tplObj.demo.script, st=sc[S.demo.i]; if(!st) return;
  $("dbStep").textContent=`Крок ${S.demo.i+1} з ${sc.length}`; $("dbSay").textContent=st.say; $("dbPause").textContent=S.demo.paused?"▶":"⏸";
  $("dbPause").setAttribute("aria-label",S.demo.paused?"Продовжити":"Пауза"); $("dbProg").style.width=((S.demo.i+1)/sc.length*100)+"%"; }
function updateDemoStat(){ const el=$("dbStat"); if(!el||$("demobar").hidden||!S.tplObj.demo.status) return;
  try{ el.innerHTML=S.tplObj.demo.status().slice(0,4).map(([a,b,c])=>`<span class="dbs ${c||""}"><i>${esc(a)}</i> ${esc(b)}</span>`).join(""); }catch(e){ el.innerHTML=""; } }

// ---- Події
document.addEventListener("click",e=>{ const q=s=>e.target.closest(s); let el;
  if(el=q("[data-dlg]")){ const x=DLG[+el.dataset.dlg]; closeDlg(); if(x&&x.act) x.act(); return; }
  if(e.target.id==="dlg"){ closeDlg(); return; }
  if(q("#projBtn")){ openProjects(); return; }
  if(q("#undoBtn")){ undo(); return; }
  if(el=q("[data-pa]")){ const a=el.dataset.pa, id=el.dataset.pid;
    if(a==="save"){ saveProject(); openProjects(); }
    if(a==="openlist"){ const h=$("plistH"); if(h) h.scrollIntoView({behavior:"smooth",block:"start"}); }
    if(a==="import") $("pImport").click();
    if(a==="close"){ closeDlg(); closeBoard(); }
    if(a==="new"){ closeDlg(); confirmLeave(()=>openWizard(false)); }
    if(a==="board") openWizard(true);
    if(a==="copy"){ dialog("Зберегти як…",`<label class="lbl2" for="dlgName">Назва нового проєкту</label><input class="inp" id="dlgName" value="${esc(((S.proj&&S.proj.name)||"Мій щит")+(S.proj&&S.proj.id?" (копія)":""))}" maxlength="60">`,
      [{label:"Скасувати",act:openProjects},{label:"Зберегти",cls:"primary",act:()=>{ newProjectFromCurrent(($("dlgName").value||"").trim()||"Мій щит"); openProjects(); }}]); }
    if(a==="export") exportProject();
    if(a==="guide"){ if(S.guide) S.guide.on=!S.guide.on; else S.guide={on:true,skip:[],testOK:false}; closeDlg(); save(); renderTools(); }
    if(a==="open"){ closeDlg(); confirmLeave(()=>openProject(id)); }
    if(a==="del"){ if(el.dataset.armed){ const db=projDB(); db.list=db.list.filter(p=>p.id!==id); projSave(db); if(S.proj&&S.proj.id===id){ S.proj={id:null,name:S.proj.name}; S.baseSig=""; renderProjBtn(); } openProjects(); }
      else { el.dataset.armed="1"; el.textContent="Видалити?"; setTimeout(()=>{ if(el.isConnected){ delete el.dataset.armed; el.textContent="✕"; } },3000); } }
    return; }
  if(el=q("[data-wz]")){ const a=el.dataset.wz, w=WZ;
    if(w.step===0){ const n=$("wzName"); if(n) w.name=(n.value||"").trim()||"Мій щит"; } if(w.step===4&&$("wzGuide")) w.guide=$("wzGuide").checked;
    if(a==="cancel") closeDlg(); if(a==="prev"){ w.step--; renderWizard(); } if(a==="next"){ w.step++; renderWizard(); }
    if(a==="create") wizardCreate(); if(a==="apply") wizardApply(); return; }
  if(el=q("[data-wk]")){ WZ.kind=el.dataset.wk; if(WZ.kind==="3ph"&&WZ.xn<4) WZ.xn=4; renderWizard(); return; }
  if(el=q("[data-wikw]")){ WZ.ikw=+el.dataset.wikw; renderWizard(); return; }
  if(el=q("[data-wikwh]")){ WZ.ikwh=+el.dataset.wikwh; renderWizard(); return; }
  if(el=q("[data-wr]")){ WZ.rails=+el.dataset.wr; renderWizard(); return; }
  if(el=q("[data-fadd]")){ addField(el.dataset.fadd); return; }
  if(el=q("[data-fdel]")){ const f=S.field.find(x=>x.id===el.dataset.fdel); if(f) removeField(f); return; }
  if(el=q("[data-field]")){ if(S.mode==="wire") return; S.selDev=el.dataset.field; renderAll(false); return; }
  if(el=q("[data-pvn]")){ const f=S.field.find(x=>x.id===S.selDev); if(f){ f.n=+el.dataset.pvn; commit(false); } return; }
  const d=S.selDev&&S.devices.find(x=>x.id===S.selDev);
  if(d){ if(q("[data-gtoggle]")){ d.group=d.group?null:mkGroup(groupsOf().length,"Нова група",2.5,[]); commit(); return; }
    if(el=q("[data-delay]")){ d.delay=+el.dataset.delay; commit(false); return; }
    if(q("[data-plug]")){ d.plug=!d.plug; commit(false); return; }
    if(el=q("[data-xcol]")){ d.col=el.dataset.xcol; commit(false); return; }
    if(el=q("[data-th]")){ d.th=+el.dataset.th; commit(false); return; } }
  if(q("#dbPause")){ if(S.demo){ S.demo.paused=!S.demo.paused; updateDemoBar(); } return; }
  if(q("#dbNext")){ if(S.demo){ S.demo.paused=false; S.demo.left=0; } return; }
  if(q("#dbStop")){ if(S.demo) demoStop(); return; }
});
document.addEventListener("change",e=>{ const t=e.target;
  if(t.id==="pImport"&&t.files&&t.files[0]){ importProject(t.files[0]); t.value=""; return; }
  if(t.id==="pName"&&S.proj){ const n=t.value.trim(); if(n){ S.proj.name=n; if(S.proj.id){ storeProject(); toast("Перейменовано","ok"); } save(); renderProjBtn(); } return; }
  if(t.id==="capIn"){ const d=S.devices.find(x=>x.id===t.dataset.capfor); if(!d) return; const v=t.value.trim(); if(d.group) d.group.name=v||"Група"; else d.cap=v||undefined; commit(); return; }
  if(t.id==="fldName"){ const f=S.field.find(x=>x.id===S.selDev); if(f){ f.name=t.value.trim()||f.name; commit(); } return; } });
document.addEventListener("input",e=>{ const t=e.target;
  if(t.id==="wzXn"){ WZ.xn=+t.value; $("wzXnO").textContent=t.value; } if(t.id==="wzXpe"){ WZ.xpe=+t.value; $("wzXpeO").textContent=t.value; } });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&!$("dlg").hidden) closeDlg(); if(e.key==="Enter"&&e.target.id==="wzName"){ e.preventDefault(); $("dlgCard").querySelector("[data-wz=next]")?.click(); } });
document.addEventListener("toggle",e=>{ if(e.target.id==="fldDD") S.fldOpen=e.target.open; },true);
