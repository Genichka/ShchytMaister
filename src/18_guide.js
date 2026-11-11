/* ===== Покроковий помічник складання щитка =====
   Модулі ставляться з коротких списків (лише те, що помічник уміє підключити сам), перемички — «1 → 2» з підсвіченими клемами
   або «Підключити все» (autoWire у 18_autowire.js). Групам одразу дається назва й типові прилади. */
const R = (type,list,lbl) => list.map(r=>[type,r,(lbl?lbl+" ":(T[type].name+" "))+r+(T[type].unit||"")]);
const GOPT = (type,rating,label,gname,gloads,more) => [type,rating,label,Object.assign({gname,gloads},more||{})];
function stepOpts(id,kind){
  if(id==="main") return kind==="3ph"?[...R("qf3p",["C16","C20","C25","C32","C40","C50","C63","C80","C100","C125"]),...R("qf4p",["C16","C20","C25","C32","C40","C50","C63","C80","C100","C125"])]:R("qf2p",["C16","C20","C25","C32","C40","C50","C63","C80","C100","C125"]);
  if(id==="prot") return kind==="3ph"?[["kvf",null,"Реле контролю фаз (обрив, чергування, напруга)"],["spd3",null,"УЗІП Т2 3P+N — від блискавки"]]
    :[...R("kv",["16","25","32","40","63"],"Реле напруги"),["tovpd1","60","TOMZN TOVPD1-60 — реле напруги й струму (V + A)"],["spdac",null,"УЗІП Т2 1P+N — від блискавки"]];
  if(id==="ats") return [["ats",null,"Модуль АВР TOMZN (тип TOQ5)",{variant:"tomzn"}],["toq5","125","TOMZN TOQ5-125/2 — АВР з ручкою, 6 модулів"],["toq7","125","TOMZN TOQ7-125/2 — АВР з ручкою, чорний, 6 модулів"],
    ["ats",null,"Модуль АВР GEYA (тип G2R)",{variant:"geya"}],["to219",null,"TOMZN TO219G — механічний АВР I–0–II, ручний"],
    ["to119","40","TOMZN TO119G 40 А — перемикач I–0–II на 1 модуль, ручний, лише фаза"],["to119","63","TOMZN TO119G 63 А — перемикач I–0–II на 1 модуль, ручний, лише фаза"]];
  if(id==="rcd") return kind==="3ph"?R("rcd4",["16","25","32","40","63","80","100"]):[...R("rcd",["16","25","32","40","63","80","100"]),...R("rcbo",["B6","B10","B16","B20","B25","B32","C6","C10","C16","C20","C25","C32"])];
  if(id==="groups") return [GOPT("qf1p","B10","Автомат 1P B10 — освітлення","Освітлення",[["Освітлення",0.1,1]]),
    GOPT("qf1p","B16","Автомат 1P B16 — розетки","Розетки",[["Холодильник",0.15,1],["Телевізор",0.15,1],["Чайник",2.0,0]]),
    GOPT("qf1p","C16","Автомат 1P C16 — котел, насос","Котел, насос",[["Газовий котел",0.15,1],["Насос",0.75,1]]),
    GOPT("qf1p","C25","Автомат 1P C25 — бойлер, кондиціонер","Бойлер, кондиціонер",[["Бойлер",2.0,1],["Кондиціонер",1.0,0]]),
    GOPT("qf1p","C32","Автомат 1P C32 — плита","Плита",[["Плита",4.0,0]]),
    GOPT("rcbo","B16","Диф-автомат B16 — ванна, вулиця","Ванна, вулиця",[["Пральна машина",2.2,0]]),
    ...(kind==="3ph"?[GOPT("qf3p","C16","Автомат 3P C16 — трифазна група","Трифазна група",[["Електрокотел",6.0,0]],{asGroup:true}),
      GOPT("qf4p","C25","Автомат 4P C25 — трифазна група з N","Трифазна група з N",[["Електрокотел",6.0,0]],{asGroup:true}),
      ["qm",null,"Автомат захисту двигуна + двигун 3~ 4 кВт",{withMotor:true}]]:[])];
  return null; }
function showOpts(step){ const kind=boardKind(S.board), opts=stepOpts(step.id,kind); if(!opts) return;
  S.mode="mount"; S.allDev=false; S.devFilter={step:step.id,title:step.short||step.t,opts}; S.devOpen=true; S.pick=null; S.pickRating=null; S.pickExtra=null; renderAll(true); }
function goWire(kind){ S.mode="wire"; S.wireKind=kind; renderAll(true); $("scroller").scrollIntoView({behavior:"smooth",block:"start"}); }
let JCACHE={sig:null,val:false};
function jumpOK(){ const sig=structSnap(); if(JCACHE.sig===sig) return JCACHE.val;
  const val=sandbox(()=>{ powerUp(); runFor(4); const G=groupsOf();
    if(G.length) return G.every(g=>S.sim.g[g.id]&&S.sim.g[g.id].phase&&S.sim.g[g.id].neutral);
    return S.field.length>0&&S.field.every(f=>Object.values(f.map).every(q=>S.wires.some(w=>w.a===q||w.b===q))); });
  JCACHE={sig,val}; return val; }
// Подати напругу на всі вводи й перейти у «Випробування»
function powerOn(){ for(const inp of S.board.inputs){ const s=S.src[inp.id]||(S.src[inp.id]={U:230,lost:{}}); s.on=true; s.blown=false; }
  for(const d of S.devices) if(T[d.type].prot||T[d.type].rcd){ d.on=true; d.trip=null; }
  logp("ok","Напругу подано на всі вводи"); S.mode="test"; save(); solve(0); renderAll(true); $("scroller").scrollIntoView({behavior:"smooth",block:"start"}); }
const wireDone = id => { const t=gTodo(id); return t.every(x=>x.ok); };
function guideSteps(){ const b=S.board, kind=boardKind(b), G=groupsOf(), has=(...ts)=>S.devices.some(d=>ts.includes(d.type)), two=kind==="2in"||kind==="2inv";
  const hasOut=wirePlan().some(x=>x.step==="out");
  return [
    {id:"main", t:kind==="2inv"?"Поставте два автомати 2P: ввідний від мережі й на виході інвертора":two?"Поставте два ввідні автомати 2P — по одному на кожен ввід":kind==="3ph"?"Поставте ввідний автомат 3P або 4P":"Поставте ввідний автомат 2P",
      h:"Ввідний автомат стоїть першим і захищає весь щиток. Номінал — за дозволеною потужністю вводу (для квартири зазвичай C25–C40).",
      done:()=>mainsOf().length>=(two?2:1), short:two?"Два ввідні автомати":"Ввідний автомат", act:["Обрати автомат",null]},
    {id:"prot", opt:true, t:kind==="3ph"?"Захист від аварій мережі: реле контролю фаз, УЗІП":"Захист від перенапруги: реле напруги, УЗІП",
      h:kind==="3ph"?"Реле контролю фаз стежить за обривом і чергуванням фаз, УЗІП відводить імпульс блискавки на PE. Крок можна пропустити.":"Реле напруги відключить щиток при стрибку напруги, УЗІП відведе імпульс блискавки на PE. Крок можна пропустити.",
      done:()=>has("kv","tovpd1","kvf","kvf2","spdac","spd3"), short:"Захист від перенапруги", act:["Обрати реле",null]},
    ...(two?[{id:"ats", t:kind==="2inv"?"Перемикання мережа ↔ інвертор: модуль АВР":"Перемикання вводів: модуль АВР або перемикач",
      h:kind==="2inv"?"Мережа — на ввід I модуля АВР, вихід інвертора — на ввід II. АВР перемикає і фазу, і нуль, тож інвертор ніколи не з’єднається з мережею."
        :"Модуль АВР перемикає сам, перемикач I–0–II — вручну. TO219G розриває фазу й нуль, TO119G на 1 модуль — лише фазу (нулі вводів з’єднуються перед ПЗВ). Головне, щоб вводи ніколи не з’єдналися фазами.",
      done:()=>has(...SWITCH_T), short:"Перемикання вводів", act:["Обрати АВР",null]}]:[]),
    ...(b.noRcd?[]:[{id:"rcd", t:"Захист людей: ПЗВ або диф-автомати",
      h:"ПЗВ 30 мА вимикає лінію, коли струм тече на корпус або через людину. Номінал ПЗВ — не менший за ввідний автомат.",
      done:()=>has("rcd","rcd4","rcbo"), short:"Захист людей", act:["Обрати ПЗВ",null]}]),
    {id:"groups", t:"Групи й обладнання",
      h:kind==="3ph"?"Кожен автомат — окрема лінія: світло, розетки, котел. «Автомат захисту двигуна» одразу додасть і сам двигун.":"Кожен автомат — окрема лінія: світло, розетки, котел. Назву й прилади групи помічник підставить сам.",
      done:()=>(G.length>0||S.field.length>0)&&!!S.guide.gDone, short:"Групові автомати", act:["Обрати автомат",null], next:G.length||S.field.length?`Усі групи поставлено (${G.length}) →`:null},
    {id:"inwire", short:"Ввід → ввідний автомат", t:"Перемички: заведіть ввід на верхні клеми ввідного автомата",
      h:"Торкніться клеми 1, потім клеми 2 — їх підсвічено. Або «Покроково (Авто)» — програма проведе його сама, «Усі перемички (Авто)» — увесь щиток одразу.",
      todo:()=>gTodo("inwire"), done:()=>wireDone("inwire"), wire:true},
    {id:"bus", short:"Шини N і PE", t:"Шини N і PE",
      h:"PE вводу — на шину PE (XPE1) напряму. Шину N (XN1) живить нижня клема N ПЗВ — так нуль усіх груп проходить через ПЗВ.",
      todo:()=>gTodo("bus"), done:()=>wireDone("bus"), wire:true},
    {id:"jump", short:"Перемички між модулями", t:"Перемички: живлення до кожної групи",
      h:kind==="3ph"?"Ввідний → ПЗВ 4P → групові автомати. Однофазні групи помічник розкладає по фазах L1, L2, L3 почергово, щоб навантаження було рівним."
        :"Ввідний → реле → ПЗВ → групові автомати. Сусідні автомати живляться один від одного короткими перемичками.",
      todo:()=>gTodo("jump"), done:()=>{ const t=gTodo("jump"); return t.length?t.every(x=>x.ok):jumpOK(); }, wire:true},
    ...(hasOut?[{id:"out", short:"Лінії до обладнання", t:"Відхідні лінії: колодка XT2 і обладнання",
      h:"Кабель кожної групи — на свої клеми колодки: L з нижньої клеми автомата, N і PE — із шин. Двигун — від автомата захисту двигуна.",
      todo:()=>gTodo("out"), done:()=>wireDone("out"), wire:true}]:[]),
    {id:"check", short:"Перевірте схему", t:"Перевірте схему",
      h:"Перевірка шукає коротке замикання, переплутані перемички, групи без ПЗВ і замалі перерізи. Крок зараховується, коли помилок нуль.",
      done:()=>S.lastCheck&&S.lastCheck.sig===elecSnap()&&S.lastCheck.errors===0, act:["Перевірити",()=>checkNow()]},
    {id:"test", short:"Подайте напругу", t:"Випробування: подайте напругу",
      h:"Кнопка «Подати напругу» вмикає всі вводи. Групи мають показати «Під напругою», обладнання — запрацювати.",
      done:()=>!!(S.guide&&S.guide.testOK), act:["Подати напругу",powerOn]},
    {id:"labels", short:"Підпишіть групи", opt:true, t:"Наклейки: підпишіть групи",
      h:"Торкніться автомата і дайте назву в полі «Підпис»: «Кухня, розетки», «Освітлення»…",
      done:()=>G.every(g=>!/^(Група \d+|Нова група)$/.test(g.group.name))},
    {id:"loads", short:"Прилади в групах", opt:true, t:"Прилади в групах",
      h:"У картці групи внизу додайте прилади. Симулятор порахує струм і перевірить номінали.",
      done:()=>G.every(g=>g.group.loads.length>0), act:["До карток груп",()=>showTab("groups",true)]}]; }
let GSTEPS=[];
document.addEventListener("click",e=>{ const q=s=>e.target.closest(s); let el;
  if(el=q("[data-gact]")){ const s=GSTEPS[+el.dataset.gact]; if(s&&s.act){ if(s.act[1]) s.act[1](); else showOpts(s); } return; }
  if(el=q("[data-gskip]")){ (S.guide.skip||(S.guide.skip=[])).push(el.dataset.gskip); S.devFilter=null; save(); renderAll(false); return; }
  if(q("[data-gx]")){ S.guide.on=false; save(); renderAll(true); toast("Помічника вимкнено. Увімкнути знову — кнопка «Помічник» унизу"); return; } });
setInterval(()=>{ if(!S.guide||!S.guide.on||S.guide.testOK||S.mode!=="test"||!S.sim||!anySource()) return; const G=groupsOf();
  const ok=G.length?G.every(g=>S.sim.g[g.id]&&S.sim.g[g.id].phase&&S.sim.g[g.id].neutral):S.field.some(f=>f.run||f.on||f.mode==="grid"||f.mode==="backup");
  if(ok){ S.guide.testOK=true; save(); renderAll(false); toast("Випробування пройдено: щиток працює","ok"); } },1000);
// ---- Компактний помічник: рядок у нижній панелі + пояснення в рядку підказки вгорі
function guideCur(){ if(!S.guide||!S.guide.on) return null; const st=guideSteps(), skip=new Set(S.guide.skip||[]), done=st.map(s=>{ try{ return !!s.done(); }catch(e){ return false; } }); GSTEPS=st;
  const cur=st.findIndex((s,i)=>!done[i]&&!(s.opt&&skip.has(s.id))); return {st,cur,s:st[cur]}; }
function guideHint(){ const g=guideCur(); if(!g) return ""; if(g.cur<0) return S.mode==="mount"?`<b>Щиток готовий.</b> Новий модуль — оберіть унизу й торкніться вільного місця на рейці.`:`<b>Щиток готовий.</b> Щось забули? <button class="hlink" data-hgo="add">＋ Додати модуль</button>`;
  const td=g.s.todo?g.s.todo():[]; if(td.length){ const ok=td.filter(x=>x.ok).length, bad=td.find(x=>x.bad);
    return `<b>Крок ${g.cur+1} з ${g.st.length} · ${esc(g.s.short||g.s.t)}</b> · з’єднано ${ok} з ${td.filter(x=>!x.bad).length}. `
      +(bad?`<span style="color:var(--red)">${esc(bad.t)}</span>`:`Торкніться клеми <span class="gn">1</span>, потім <span class="gn">2</span> — їх підсвічено. «Усі перемички (Авто)» прокладе решту перемичок сам.`); }
  if(g.s.id==="check"&&S.lastCheck&&S.lastCheck.sig===elecSnap()&&S.lastCheck.errors) return `<b>Крок ${g.cur+1}:</b> перевірка знайшла помилок: ${S.lastCheck.errors}. «Виправити все» перекладе перемички за правильною схемою й підбере номінали.`;
  return `<b>Крок ${g.cur+1}:</b> ${esc(g.s.h)}`; }
const GX = `<button class="bx" data-gx aria-label="Сховати помічника">✕</button>`;
function guideBar(){ const g=guideCur(); guideOn=!!(g&&g.cur>=0); if(!g) return "";
  if(g.cur<0){ S.devFilter=null; return `<div class="br gd"><span class="gk">✓</span><b class="gt">Щиток зібрано і випробувано</b>${GX}</div>`
    +brow((S.mode!=="mount"?`<span class="bl">Щось забули?</span><button class="btn" data-hgo="add">＋ Додати модуль</button>`:"")+(S.mode!=="wire"?`<button class="btn" data-hgo="wire">〰 Перемички</button>`:"")+`<button class="btn" data-hgo="fin">💾 PDF / Visio</button>`,"wrap"); }
  const s=g.s, num=`<span class="gk">${g.cur+1}/${g.st.length}</span>`; if(S.devFilter&&S.devFilter.step!==s.id) S.devFilter=null;
  const all=`<button class="btn sm" data-gall title="Програма сама проведе всі перемички щитка одразу">⚡ Усі перемички (Авто)</button>`;
  if(s.wire){ const it=s.todo().find(x=>!x.ok)||null; if(!it) return `<div class="br gd">${num}<b class="gt">${esc(s.short)}</b>${GX}</div>`;
    if(it.bad) return `<div class="br gd">${num}<b class="gt">${esc(it.t)}</b>${GX}</div>`
      +`<div class="br">${it.fixKind?`<button class="btn sm primary" data-gfixkind>Зробити «${esc(WK[it.fixKind][0])}»</button>`:it.wire?`<button class="btn sm primary" data-gfixdel>Прибрати цю перемичку</button>`:""}${it.wire?`<button class="btn sm" data-gshow>Показати перемичку</button>`:""}${all}</div>`;
    return `<div class="br gd">${num}<b class="gt"><span class="gn">1</span> ${esc(kName(it.a))} → <span class="gn">2</span> ${esc(kName(it.b))} <span class="bm">· ${esc(WK[it.kind][0])}</span></b>${GX}</div>`
      +`<div class="br">${all}<button class="btn sm primary" data-gauto title="Програма сама проведе цю одну перемичку">✓ Покроково (Авто)</button>${S.mode==="wire"?"":`<button class="btn sm" data-gwire title="Перейти в режим «Перемички» і провести перемичку самому">✋ Проведу сам</button>`}</div>`
      +`<div class="br"><span class="bl">Автоматично — програма проведе перемичку за вас. «Проведу сам» — торкніться клеми 1, потім клеми 2.</span></div>`; }
  if(s.id==="check"&&S.lastCheck&&S.lastCheck.sig===elecSnap()&&S.lastCheck.errors)
    return `<div class="br gd">${num}<b class="gt">Перевірка: помилок ${S.lastCheck.errors}</b>${GX}</div><div class="br"><button class="btn sm primary" data-gall>Виправити все</button><button class="btn sm" data-gact="${g.cur}">Перевірити ще раз</button></div>`;
  if(s.next) return `<div class="br gd">${num}<b class="gt">${esc(s.short||s.t)}</b>${GX}</div>`
    +`<div class="br">${s.act?`<button class="btn sm" data-gact="${g.cur}">＋ ${esc(s.act[0])}</button>`:""}<button class="btn sm primary" data-gnext="${s.id}">${esc(s.next)}</button></div>`;
  const act=s.act&&!(s.id==="test"&&S.mode==="test"&&S.board.inputs.every(i=>(S.src[i.id]||{}).on));
  return `<div class="br gd">${num}<b class="gt">${esc(s.short||s.t)}</b>${act?`<button class="btn sm primary" data-gact="${g.cur}">${esc(s.act[0])}</button>`:""}${s.opt?`<button class="btn sm" data-gskip="${s.id}">Пропустити</button>`:""}${GX}</div>`; }

// ---- Кроки прокладання перемичок: що з чим з’єднати (план — wirePlan) + перемички, які треба виправити
function kName(k){ if(k==="xn:*") return "шина N (XN1)"; if(k==="xpe:*") return "шина PE (XPE1)"; const n=termName(k), t=termDef(k), d=S.devices.find(x=>x.id===k.split(":")[0]);
  return t&&d&&T[d.type].terms.filter(x=>x.l===t.l).length>1 ? n+(t.s==="top"?" зверху":" знизу") : n; }
function gTodo(id){ const f0=build({allOpen:true}), out=[];
  for(const w of S.wires){ const bad=[w.a,w.b].find(k=>{ const r=termRole(k); return r&&!kindFits(w.kind,r); });
    if(bad){ const nk=autoKind(termRole(bad),bad); out.push({ok:false,bad:true,wire:w.id,fixKind:nk,t:`Перемичка ${kName(w.a)} → ${kName(w.b)} має вид «${WK[w.kind][0]}», а клема ${kName(bad)} — для «${WK[nk][0]}»`}); } }
  if(id==="bus") for(const R of rcdNBypass(f0)){ const w=bypassWire(R); out.push({ok:false,bad:true,wire:w&&w.id,t:w?`Приберіть перемичку ${kName(w.a)} → ${kName(w.b)}: через нього нуль іде в обхід ${desig(R)}. На шину N має приходити лише нижня N ПЗВ.`:`Нуль іде в обхід ${desig(R)}: верхня і нижня N з’єднані.`}); }
  const m=x=>x==="xn:*"?"xn:0":x==="xpe:*"?"xpe:0":x;
  for(const x of wirePlan()) if(x.step===id) out.push(x.bad?x:Object.assign({},x,{ok:f0(m(x.a))===f0(m(x.b))||(x.alt||[]).some(y=>f0(m(x.b))===f0(y))}));
  return out; }
function gItem(){ const g=guideCur(); if(!g||g.cur<0||!g.s.todo) return null; return g.s.todo().find(x=>!x.ok)||null; }
// «Будь-який отвір шини» → перший вільний отвір
function gResolve(x){ const free=p=>{ for(let i=0;i<(p==="xn"?S.board.xn:S.board.xpe);i++){ const k=p+":"+i; if(!S.wires.some(w=>w.a===k||w.b===k)) return k; } return p+":0"; };
  return x==="xn:*"?free("xn"):x==="xpe:*"?free("xpe"):x; }
function gHL(){ if(!S.guide||!S.guide.on||S.mode!=="wire"||S.selWire||S.moveEnd) return []; const it=gItem(); if(!it) return []; if(it.bad){ const w=it.wire&&wireById(it.wire); return w?[w.a,w.b]:[]; }
  return [gResolve(it.a),gResolve(it.b)]; }
// Прокласти перемичку за помічника: правильний вид і переріз
function gConnect(it){ const a=gResolve(it.a), b=gResolve(it.b); S.wires.push({id:uid("w"),a,b,kind:it.kind,sec:it.sec||S.wireSec}); return [a,b]; }
document.addEventListener("click",e=>{
  if(e.target.closest("[data-gauto]")){ const it=gItem(); if(!it||it.bad) return; const [a,b]=gConnect(it); S.pend=null; commit(); toast(`З’єднано: ${kName(a)} → ${kName(b)}`,"ok"); } });
// Увімкнути помічника й перейти до його поточного кроку: для перемичок — режим «Перемички» з підсвіченими клемами «1 → 2»
function guideGo(){ if(!S.guide) S.guide={on:true,skip:[],testOK:false}; S.guide.on=true; if(groupsOf().length||S.field.length) S.guide.gDone=true;
  Object.assign(S,{chkOpen:false,selDev:null,selWire:null,pend:null,pick:null,moveEnd:null}); save(); const it=gItem();
  if(it&&!it.bad){ S.mode="wire"; S.wireKind=it.kind; if(it.sec) S.wireSec=it.sec; if(innerWidth<600&&S.zoom<1.5) S.zoom=1.6; S.hlSig=null;
    renderAll(true); toast(`Торкніться клеми ${kName(it.a)}, потім ${kName(it.b)}`); return; }
  S.mode=it?"wire":"mount"; renderAll(true); }
// Чи є в помічника незавершений крок (навіть коли його зараз вимкнено)
function guidePending(){ const keep=S.guide; S.guide=Object.assign({skip:[],testOK:false},keep||{},{on:true});
  try{ const g=guideCur(); return !!(g&&g.cur>=0); } catch(e){ return false; } finally{ S.guide=keep; } }
document.addEventListener("click",e=>{ if(e.target.closest("[data-gwire],[data-gon]")) guideGo(); });

// Вид перемички за призначенням клеми
function autoKind(role,key){ if(role==="N") return "N"; if(role==="PE") return "PE"; if(role==="DC") return "DC+"; if(role==="C") return PHK.includes(S.wireKind)||S.wireKind==="C"||S.wireKind==="N"?S.wireKind:"C";
  if(PHK.includes(role)) return role; const t=(key||"").split(":")[1]; if(/^in/.test(key||"")&&PHK.includes(t)) return t;
  return PHK.includes(S.wireKind)?S.wireKind:(boardKind(S.board)==="3ph"?"L1":"L"); }
// Яка перемичка з’єднує верхню і нижню N ПЗВ (шлях через перемички й шини) — його й треба прибрати
function bypassWire(R){ const p=T[R.type].poles[nPole(R)], A=R.id+":"+p.a, B=R.id+":"+p.b, adj=new Map(), add=(a,c,w)=>{ for(const [x,y] of [[a,c],[c,a]]){ if(!adj.has(x)) adj.set(x,[]); adj.get(x).push([y,w]); } };
  for(const w of S.wires) add(w.a,w.b,w); for(let i=1;i<S.board.xn;i++) add("xn:"+i,"xn:0",null);
  for(const d of S.devices){ const t=T[d.type]; if(t.links) for(const [a,c] of t.links(d)) add(K(d,a),K(d,c),null); }
  const prev=new Map([[A,null]]), q=[A]; for(let i=0;i<q.length&&!prev.has(B);i++) for(const [n,w] of adj.get(q[i])||[]) if(!prev.has(n)){ prev.set(n,[q[i],w]); q.push(n); }
  if(!prev.has(B)) return null; const path=[]; for(let c=B;prev.get(c);c=prev.get(c)[0]) if(prev.get(c)[1]) path.push(prev.get(c)[1]);
  const cand=path.filter(w=>w.a!==B&&w.b!==B); return cand.find(w=>/^xn:/.test(w.a)||/^xn:/.test(w.b))||cand[0]||path[0]; }
document.addEventListener("click",e=>{ const q=s=>e.target.closest(s); const it=gItem(); if(!it||!it.wire) return; const w=wireById(it.wire); if(!w) return;
  if(q("[data-gfixdel]")){ S.wires=S.wires.filter(x=>x!==w); toast("Перемичку прибрано. «Назад» поверне її","ok"); commit(); return; }
  if(q("[data-gfixkind]")){ w.kind=it.fixKind; delete w.col; toast(`Вид перемички: ${WK[w.kind][0]}`,"ok"); commit(); return; }
  if(q("[data-gshow]")){ S.mode="wire"; selectWire(w.id); return; } });

document.addEventListener("click",e=>{ const el=e.target.closest("[data-gnext]"); if(!el||!S.guide) return; if(el.dataset.gnext==="groups") S.guide.gDone=true; S.pick=null; S.devFilter=null; save(); renderAll(true); });
