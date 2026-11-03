/* ===== Покроковий помічник складання щита ===== */
const R = (type,list,lbl) => list.map(r=>[type,r,(lbl?lbl+" ":(T[type].name+" "))+r+(T[type].unit||"")]);
function stepOpts(id,kind){
  if(id==="main") return kind==="3ph"?[...R("qf3p",["C25","C32","C40"]),...R("qf4p",["C25","C32","C40"])]:R("qf2p",["C25","C32","C40","C50","C63"]);
  if(id==="prot") return kind==="3ph"?[["kvf",null,"Реле контролю фаз (обрив, чергування, напруга)"],["spdac",null,"УЗІП Т2 1P+N (AC)"]]
    :[...R("kv",["40","63"],"Реле напруги"),["spdac",null,"УЗІП Т2 1P+N (AC)"]];
  if(id==="ats") return [["ats",null,"Модуль АВР TOMZN (тип TOQ5)",{variant:"tomzn"}],["ats",null,"Модуль АВР GEYA (тип G2R)",{variant:"geya"}],
    ["km2a",null,"Контактор 2НВ + блок 1НВ/1НЗ (для АВР на контакторах)"],["rel",null,"Реле проміжне 1CO (блокування)"],["logo",null,"Siemens LOGO! 230RCE (АВР на контролері)"]];
  if(id==="rcd") return kind==="3ph"?[...R("rcd4",["40","63"]),...R("rcd",["40","63"])]:[...R("rcd",["25","40","63"]),...R("rcbo",["B16","C16"])];
  if(id==="groups") return [["qf1p","B10","Автомат 1P B10 — освітлення"],["qf1p","B16","Автомат 1P B16 — розетки"],["qf1p","C16","Автомат 1P C16 — котел, насос"],
    ["qf1p","C25","Автомат 1P C25 — бойлер, кондиціонер"],["qf1p","C32","Автомат 1P C32 — плита"],["rcbo","B16","Диф-автомат B16 — ванна, вулиця"],
    ...(kind==="3ph"?[["qf3p","C16","Автомат 3P C16 — трифазна група",{asGroup:true}],["qf4p","C25","Автомат 4P C25 — трифазна група з N",{asGroup:true}],["qm",null,"Автомат захисту двигуна"]]:[])];
  if(id==="jump") return [["xtb",null,"Клемник прохідний (розподіл)"]];
  return null; }
function showOpts(step){ const kind=boardKind(S.board), opts=stepOpts(step.id,kind); if(!opts) return;
  S.mode="mount"; S.devFilter={step:step.id,title:step.short||step.t,opts}; S.devOpen=true; S.pick=null; S.pickRating=null; S.pickExtra=null; renderAll(true);
  }
function goWire(kind){ S.mode="wire"; S.wireKind=kind; renderAll(true); $("scroller").scrollIntoView({behavior:"smooth",block:"start"}); }
let JCACHE={sig:null,val:false};
function jumpOK(){ const sig=structSnap(); if(JCACHE.sig===sig) return JCACHE.val;
  const val=sandbox(()=>{ powerUp(); runFor(4); const G=groupsOf();
    if(G.length) return G.every(g=>S.sim.g[g.id]&&S.sim.g[g.id].phase&&S.sim.g[g.id].neutral);
    return S.field.length>0&&S.field.every(f=>Object.values(f.map).every(q=>S.wires.some(w=>w.a===q||w.b===q))); });
  JCACHE={sig,val}; return val; }
function guideSteps(){ const b=S.board, kind=boardKind(b), f0=build({allOpen:true}), G=groupsOf(), has=(...ts)=>S.devices.some(d=>ts.includes(d.type));
  const feeds=b.inputs.filter(i=>i.terms.some(t=>/^L/.test(t)));
  const mainsOk=feeds.length>0&&feeds.every(i=>S.devices.some(d=>T[d.type].prot&&T[d.type].terms.some(t=>t.s==="top"&&f0(d.id+":"+t.k)===f0(i.id+":"+i.terms[0]))));
  return [
    {id:"main", t:kind==="2inv"?"Поставте два автомати 2P: ввідний від мережі й на виході інвертора":kind==="2in"?"Поставте два ввідні автомати 2P — по одному на кожен ввід":kind==="3ph"?"Поставте ввідний автомат 3P або 4P":"Поставте ввідний автомат 2P",
      h:"Ввідний автомат стоїть першим і захищає весь щит. Номінал — за дозволеною потужністю вводу (для квартири зазвичай C25–C40).",
      done:()=>S.devices.filter(d=>["qf2p","qf3p","qf4p"].includes(d.type)).length>=(kind==="2in"||kind==="2inv"?2:1), short:"Ввідний автомат", act:["Обрати автомат",null]},
    {id:"prot", opt:true, t:kind==="3ph"?"Захист від аварій мережі: реле контролю фаз, УЗІП":"Захист від перенапруги: реле напруги, УЗІП",
      h:kind==="3ph"?"Реле контролю фаз розімкне коло керування при обриві фази або неправильному чергуванні.":"Реле напруги відключить щит при стрибку напруги, УЗІП відведе імпульс блискавки на PE.",
      done:()=>has("kv","kvf","spdac"), short:"Захист від перенапруги", act:["Обрати реле",null]},
    ...(kind==="2in"||kind==="2inv"?[{id:"ats", t:kind==="2inv"?"Перемикання мережа ↔ інвертор: модуль АВР":"Перемикання вводів: модуль АВР або два контактори",
      h:kind==="2inv"?"Мережа — на ввід I модуля АВР, вихід інвертора — на ввід II. АВР має перемикати і фазу, і нуль. Вихід інвертора ніколи не можна з’єднувати з мережею — інвертор згорить."
        :"Модуль АВР — найпростіше. Контактори з блокуванням через НЗ-контакти 21–22 — класика. Головне, щоб вводи ніколи не з’єднались між собою.",
      done:()=>has("ats")||S.devices.filter(d=>d.type==="km2a").length>=2, short:"Перемикання вводів", act:["Обрати АВР",null]}]:[]),
    ...(b.noRcd?[]:[{id:"rcd", opt:kind==="3ph", t:"Захист людей: ПЗВ або диф-автомати",
      h:"ПЗВ 30 мА вимикає лінію при витоку струму на корпус. Номінал ПЗВ — не менший за ввідний автомат.",
      done:()=>has("rcd","rcd4","rcbo"), short:"Захист людей", act:["Обрати ПЗВ",null]}]),
    {id:"groups", t:"Групи й обладнання",
      h:"Кожен автомат 1P — окрема лінія: розетки, світло, кухня. Двигун, бойлер чи сонячні панелі додайте в «Обладнання поза щитом».",
      done:()=>(G.length>0||S.field.length>0)&&!!S.guide.gDone, short:"Групові автомати", act:["Обрати автомат",null], next:G.length||S.field.length?`Усі групи поставлено (${G.length}) →`:null},
    {id:"labels", short:"Підпишіть групи", opt:!G.length, t:"Наклейки: підпишіть групи",
      h:"Торкніться автомата і дайте назву в полі «Підпис»: «Кухня, розетки», «Освітлення»…",
      done:()=>G.every(g=>!/^(Група \d+|Нова група)$/.test(g.group.name))},
    {id:"loads", short:"Прилади в групах", opt:!G.length, t:"Прилади в групах",
      h:"У картці групи внизу додайте прилади. Симулятор порахує струм і перевірить номінали.",
      done:()=>G.every(g=>g.group.loads.length>0), act:["До карток груп",()=>showTab("groups",true)]},
    {id:"inwire", short:"Проводка: ввід → ввідний", t:"Апарати стоять — тепер проводка. Заведіть ввід на верхні клеми ввідного автомата",
      h:kind==="3ph"?"У режимі «Проводка» оберіть вид дроту L1, L2, L3 і з’єднайте клеми вводу з клемами 1, 3, 5 автомата. Нуль N — на клему N автомата 4P або на шину N.":"У режимі «Проводка» оберіть «Фаза L» і з’єднайте клему вводу L з клемою 1 автомата, потім «Нуль N» — з клемою 3.",
      todo:()=>gTodo("inwire"), done:()=>{ const t=gTodo("inwire"); return t.length?t.every(x=>x.ok):mainsOk; }, act:["До проводки",()=>goWire(kind==="3ph"?"L1":"L")]},
    {id:"bus", short:"Шини N і PE", t:"Шини N і PE",
      h:has("rcd")?"PE вводу — одразу на шину PE (XPE1), без апаратів. Шину N (XN1) живить лише нижня клема N ПЗВ — звідти беруть нуль групові автомати. Нуль від ввідного автомата на XN1 не заводьте: так він піде в обхід ПЗВ."
        :"PE вводу — одразу на шину PE (XPE1), без апаратів. Нуль — на шину N (XN1), звідти беруть нуль групи.",
      todo:()=>gTodo("bus"), done:()=>{ const t=gTodo("bus"); if(t.length) return t.every(x=>x.ok); const pe=b.inputs.find(i=>i.terms.includes("PE")), rc=S.devices.filter(d=>d.type==="rcd");
        return (!pe||f0(pe.id+":PE")===f0("xpe:0"))&&!rcdNBypass(f0).length&&(!b.xn||!G.some(g=>g.type==="qf1p")||(rc.length?rc.some(R=>f0("xn:0")===f0(R.id+":b2")):S.wires.some(w=>/^xn:/.test(w.a)||/^xn:/.test(w.b)))); },
      act:["До проводки (PE)",()=>goWire("PE")]},
    {id:"jump", short:"Перемички до груп", t:"Перемички: живлення до кожної групи",
      h:has("kv")&&has("rcd")?"Фаза: клема 2 ввідного → «L вх» реле напруги, «L вих» реле → клема 1 ПЗВ, клема 2 ПЗВ → групові автомати. Нуль: клема 4 ввідного → «N» реле і верхня «N» ПЗВ. Автомати 1P поруч зручно живити гребінкою (кнопка в режимі «Апарати»)."
        :"З’єднайте апарати по черзі: ввідний → реле → ПЗВ → групові автомати. Автомати 1P поруч зручно живити гребінкою (кнопка в режимі «Апарати»).",
      todo:()=>gTodo("jump"), done:()=>jumpOK()&&gTodo("jump").every(x=>x.ok), act:["До проводки",()=>goWire("L")]},
    {id:"check", short:"Перевірте схему", t:"Перевірте схему",
      h:"«Перевірити схему» знайде КЗ, помилки кольорів дротів, групи без ПЗВ, замалі перерізи. Крок зараховується, коли помилок нуль.",
      done:()=>S.lastCheck&&S.lastCheck.sig===structSnap()&&S.lastCheck.errors===0, act:["Перевірити",()=>checkNow()]},
    {id:"test", short:"Подайте напругу", t:"Випробування: подайте напругу",
      h:"У режимі «Випробування» ввімкніть мережу. Групи мають показати «Під напругою», обладнання — запрацювати.",
      done:()=>!!(S.guide&&S.guide.testOK), act:["До випробування",()=>{ S.mode="test"; renderAll(true); $("scroller").scrollIntoView({behavior:"smooth",block:"start"}); }]}]; }
let GSTEPS=[];
document.addEventListener("click",e=>{ const q=s=>e.target.closest(s); let el;
  if(el=q("[data-gact]")){ const s=GSTEPS[+el.dataset.gact]; if(s&&s.act){ if(s.act[1]) s.act[1](); else showOpts(s); } return; }
  if(el=q("[data-gskip]")){ (S.guide.skip||(S.guide.skip=[])).push(el.dataset.gskip); save(); renderBar(); return; }
  if(q("[data-gx]")){ S.guide.on=false; save(); renderBar(); toast("Помічника можна знову ввімкнути в «Проєктах»"); return; } });
setInterval(()=>{ if(!S.guide||!S.guide.on||S.guide.testOK||S.mode!=="test"||!S.sim||!anySource()) return; const G=groupsOf();
  const ok=G.length?G.every(g=>S.sim.g[g.id]&&S.sim.g[g.id].phase&&S.sim.g[g.id].neutral):S.field.some(f=>f.run||f.on||f.mode==="grid"||f.mode==="backup");
  if(ok){ S.guide.testOK=true; save(); renderBar(); toast("Випробування пройдено: щит працює","ok"); } },1000);
// ---- Компактний помічник: рядок у нижній панелі + пояснення в рядку підказки вгорі
function guideCur(){ if(!S.guide||!S.guide.on) return null; const st=guideSteps(), skip=new Set(S.guide.skip||[]), done=st.map(s=>{ try{ return !!s.done(); }catch(e){ return false; } }); GSTEPS=st;
  const cur=st.findIndex((s,i)=>!done[i]&&!skip.has(s.id)); return {st,cur,s:st[cur]}; }
function guideHint(){ const g=guideCur(); if(!g) return ""; if(g.cur<0) return "<b>Помічник:</b> щит зібрано і випробувано. Збережіть проєкт або зробіть документи.";
  const td=g.s.todo?g.s.todo():[]; if(td.length) return `<b>Крок ${g.cur+1} · ${esc(g.s.short||g.s.t)}:</b> `+td.map(x=>x.bad?`<span style="color:var(--red)">✕ ${esc(x.t)}</span>`:`<span style="color:${x.ok?"var(--green)":"var(--fg)"}">${x.ok?"✓":"○"} ${esc(kName(x.a))} → ${esc(kName(x.b))}</span>`).join(" · ");
  return `<b>Крок ${g.cur+1}:</b> ${esc(g.s.h)}`; }
function guideBar(){ const g=guideCur(); guideOn=!!(g&&g.cur>=0); if(!g) return "";
  if(g.cur<0){ S.devFilter=null; return `<div class="br gd"><span class="gk">✓</span><b class="gt">Щит зібрано і випробувано</b><button class="bx" data-gx aria-label="Сховати помічника">✕</button></div>`; }
  const s=g.s; if(S.devFilter&&S.devFilter.step!==s.id) S.devFilter=null; const it=s.todo?(s.todo().find(x=>!x.ok)||null):null;
  if(it) return `<div class="br gd"><span class="gk">${g.cur+1}/${g.st.length}</span><b class="gt">${it.bad?esc(it.t):`З’єднайте <span class="gn">1</span> ${esc(kName(it.a))} → <span class="gn">2</span> ${esc(kName(it.b))}`}</b><button class="bx" data-gx aria-label="Сховати помічника">✕</button></div>`
    +`<div class="br">${it.bad?(it.fixKind?`<button class="btn sm primary" data-gfixkind>Зробити «${esc(WK[it.fixKind][0])}»</button><button class="btn sm" data-gshow>Показати дріт</button>`:it.wire?`<button class="btn sm danger" data-gfixdel>Прибрати цей дріт</button><button class="btn sm" data-gshow>Показати дріт</button>`:`<button class="btn sm primary" data-gwire>До проводки</button>`):`<button class="btn sm primary" data-gwire>${S.mode==="wire"&&S.wireKind===it.kind?"✓ Дріт «"+esc(WK[it.kind][0])+"» обрано — торкніться 1, потім 2":"Прокласти дріт «"+esc(WK[it.kind][0])+"»"}</button>`}<button class="btn sm" data-gskip="${s.id}">Пропустити крок</button></div>`;
  if(s.next) return `<div class="br gd"><span class="gk">${g.cur+1}/${g.st.length}</span><b class="gt">${esc(s.short||s.t)}</b><button class="bx" data-gx aria-label="Сховати помічника">✕</button></div>`
    +`<div class="br">${s.act?`<button class="btn sm" data-gact="${g.cur}">＋ ${esc(s.act[0])}</button>`:""}<button class="btn sm primary" data-gnext="${s.id}">${esc(s.next)}</button></div>`;
  return `<div class="br gd"><span class="gk">${g.cur+1}/${g.st.length}</span><b class="gt">${esc(s.short||s.t)}</b>${s.act?`<button class="btn sm primary" data-gact="${g.cur}">${esc(s.act[0])}</button>`:""}<button class="btn sm" data-gskip="${s.id}">Пропустити</button><button class="bx" data-gx aria-label="Сховати помічника">✕</button></div>`; }

// ---- Конкретні дії для кроків проводки: що з чим з’єднати, з перевіркою кожного пункту
const byPosD = (a,c) => ((a.rail||0)-(c.rail||0))||(a.slot-c.slot);
function kName(k){ if(k==="xn:*") return "шина N (XN1)"; if(k==="xpe:*") return "шина PE (XPE1)"; const n=termName(k), t=termDef(k), d=S.devices.find(x=>x.id===k.split(":")[0]);
  return t&&d&&T[d.type].terms.filter(x=>x.l===t.l).length>1 ? n+(t.s==="top"?" зверху":" знизу") : n; }
function gTodo(id){ const b=S.board, f0=build({allOpen:true}), kind=boardKind(b), out=[], G=groupsOf();
  if(["inwire","bus","jump"].includes(id)) for(const w of S.wires){ const bad=[w.a,w.b].find(k=>{ const r=termRole(k); return r&&!kindFits(w.kind,r); });
    if(bad){ const nk=autoKind(termRole(bad),bad); out.push({ok:false,bad:true,wire:w.id,fixKind:nk,t:`Дріт ${kName(w.a)} → ${kName(w.b)} має вид «${WK[w.kind][0]}», а клема ${kName(bad)} — для «${WK[nk][0]}»`}); } }
  const mains=S.devices.filter(d=>["qf2p","qf3p","qf4p"].includes(d.type)).sort(byPosD), K2=(d,k)=>d.id+":"+k;
  const okOf=(a,c,alt)=>{ const m=x=>x==="xn:*"?"xn:0":x==="xpe:*"?"xpe:0":x, fa=m(a), fc=m(c); return f0(fa)===f0(fc)||(alt||[]).some(x=>f0(fc)===f0(x)); };
  const add=(a,c,k,sec,alt)=>out.push({a,b:c,kind:k,sec,ok:okOf(a,c,alt)});
  if(id==="inwire"){ b.inputs.filter(i=>i.terms.some(t=>/^L/.test(t))).forEach((inp,ix)=>{ const m=mains[ix]||mains[0]; if(!m) return;
      const tops=T[m.type].terms.filter(t=>t.s==="top"), ph=tops.filter(x=>x.r!=="N"), tn=tops.find(x=>x.r==="N"), sec=secFor(inA(m.rating));
      inp.terms.filter(t=>t!=="PE").forEach(t=>{ if(t==="N") add(inp.id+":N",tn?K2(m,tn.k):"xn:*","N",sec); else { const q=ph[t==="L"?0:+t.slice(1)-1]; if(q) add(inp.id+":"+t,K2(m,q.k),t==="L"?"L":t,sec); } }); }); }
  if(id==="bus"){ const pe=b.inputs.find(i=>i.terms.includes("PE")), m=mains[0], rc=S.devices.filter(d=>d.type==="rcd").sort(byPosD);
    if(pe&&b.xpe) add(pe.id+":PE","xpe:*","PE",m?secFor(inA(m.rating)):6);
    if(b.xn&&G.some(g=>g.type==="qf1p")){ if(rc.length) add(K2(rc[0],"b2"),"xn:*","N",m?secFor(inA(m.rating)):6); else if(m&&m.type!=="qf3p") add(K2(m,m.type==="qf4p"?"b4":"b2"),"xn:*","N",secFor(inA(m.rating))); }
    for(const R of rcdNBypass(f0)){ const w=bypassWire(R); out.push({ok:false,bad:true,wire:w&&w.id,t:w?`Приберіть дріт ${kName(w.a)} → ${kName(w.b)}: через нього нуль іде в обхід ${desig(R)}. На шину N має приходити лише нижня N ПЗВ.`:`Нуль іде в обхід ${desig(R)}: верхня і нижня N з’єднані.`}); } }
  if(id==="jump"&&kind==="1ph"){ const m=mains[0]; if(!m||m.type!=="qf2p") return out; const kv=S.devices.find(d=>d.type==="kv"), rc=S.devices.find(d=>d.type==="rcd"), sec=secFor(inA(m.rating));
    let L=K2(m,"b1"); const N=K2(m,"b2");
    if(kv){ add(L,K2(kv,"t2"),"L",sec); add(N,K2(kv,"t1"),"N",1.5,["xn:0"]); L=K2(kv,"b2"); }
    if(rc){ add(L,K2(rc,"t1"),"L",sec); add(N,K2(rc,"t2"),"N",sec); L=K2(rc,"b1"); }
    for(const g of G.filter(g=>["qf1p","qfn","afdd","rcbo"].includes(g.type))){ add(L,K2(g,"t1"),"L",sec); if(g.type!=="qf1p") add(K2(g,"t2"),"xn:*","N",2.5); } }
  if(id==="jump"&&S.board.tb) for(const g of G){ const sec=g.group.sec||2.5, ph=g3(g)?["L1","L2","L3"]:["L"];
    ph.forEach((t,i)=>add(K2(g,"b"+(i+1)),tbK(g,t),g3(g)?t:"L",sec));
    if(tbTerms(g).includes("N")) add(["rcbo","qfn","afdd"].includes(g.type)?K2(g,"b2"):g.type==="qf4p"?K2(g,"b4"):"xn:*",tbK(g,"N"),"N",sec,["xn:0"]);
    add("xpe:*",tbK(g,"PE"),"PE",sec); }
  return out; }
function gItem(){ const g=guideCur(); if(!g||g.cur<0||!g.s.todo) return null; const t=g.s.todo(); return t.find(x=>!x.ok)||null; }
function gHL(){ if(!S.guide||!S.guide.on||S.mode!=="wire"||S.selWire||S.moveEnd) return []; const it=gItem(); if(!it) return []; if(it.bad){ const w=it.wire&&wireById(it.wire); return w?[w.a,w.b]:[]; }
  const free=p=>{ for(let i=0;i<(p==="xn"?S.board.xn:S.board.xpe);i++){ const k=p+":"+i; if(!S.wires.some(w=>w.a===k||w.b===k)) return k; } return p+":0"; };
  const R2=x=>x==="xn:*"?free("xn"):x==="xpe:*"?free("xpe"):x; return [R2(it.a),R2(it.b)]; }
document.addEventListener("click",e=>{ const el=e.target.closest("[data-gwire]"); if(!el) return; const it=gItem(); if(!it) return;
  if(it.bad){ S.mode="wire"; renderAll(true); return; }
  S.mode="wire"; S.wireKind=it.kind; if(it.sec) S.wireSec=it.sec; S.selWire=null; S.selDev=null; S.pend=null; renderAll(true); toast(`Торкніться клеми ${kName(it.a)}, потім ${kName(it.b)}`); });

// Вид дроту за призначенням клеми
function autoKind(role,key){ if(role==="N") return "N"; if(role==="PE") return "PE"; if(role==="DC") return "DC+"; if(role==="C") return PHK.includes(S.wireKind)||S.wireKind==="C"||S.wireKind==="N"?S.wireKind:"C";
  if(PHK.includes(role)) return role; const t=(key||"").split(":")[1]; if(/^in/.test(key||"")&&PHK.includes(t)) return t;
  return PHK.includes(S.wireKind)?S.wireKind:(boardKind(S.board)==="3ph"?"L1":"L"); }
// Який дріт з’єднує верхню і нижню N ПЗВ (шлях через дроти й шини) — його й треба прибрати
function bypassWire(R){ const p=T[R.type].poles[nPole(R)], A=R.id+":"+p.a, B=R.id+":"+p.b, adj=new Map(), add=(a,c,w)=>{ for(const [x,y] of [[a,c],[c,a]]){ if(!adj.has(x)) adj.set(x,[]); adj.get(x).push([y,w]); } };
  for(const w of S.wires) add(w.a,w.b,w); for(let i=1;i<S.board.xn;i++) add("xn:"+i,"xn:0",null);
  for(const d of S.devices){ const t=T[d.type]; if(t.links) for(const [a,c] of t.links(d)) add(K(d,a),K(d,c),null); }
  const prev=new Map([[A,null]]), q=[A]; for(let i=0;i<q.length&&!prev.has(B);i++) for(const [n,w] of adj.get(q[i])||[]) if(!prev.has(n)){ prev.set(n,[q[i],w]); q.push(n); }
  if(!prev.has(B)) return null; const path=[]; for(let c=B;prev.get(c);c=prev.get(c)[0]) if(prev.get(c)[1]) path.push(prev.get(c)[1]);
  const cand=path.filter(w=>w.a!==B&&w.b!==B); return cand.find(w=>/^xn:/.test(w.a)||/^xn:/.test(w.b))||cand[0]||path[0]; }
document.addEventListener("click",e=>{ const q=s=>e.target.closest(s); let el; const it=gItem(); if(!it||!it.wire) return; const w=wireById(it.wire); if(!w) return;
  if(q("[data-gfixdel]")){ S.wires=S.wires.filter(x=>x!==w); toast("Дріт прибрано. «Назад» поверне його","ok"); commit(); return; }
  if(q("[data-gfixkind]")){ w.kind=it.fixKind; delete w.col; toast(`Вид дроту: ${WK[w.kind][0]}`,"ok"); commit(); return; }
  if(q("[data-gshow]")){ S.mode="wire"; selectWire(w.id); return; } });

document.addEventListener("click",e=>{ const el=e.target.closest("[data-gnext]"); if(!el||!S.guide) return; if(el.dataset.gnext==="groups") S.guide.gDone=true; S.pick=null; S.devFilter=null; save(); renderAll(true); });
