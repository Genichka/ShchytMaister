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
function pickDev(type){ S.mode="mount"; S.pick=type; S.devOpen=false; renderAll(true); $("scroller").scrollIntoView({behavior:"smooth",block:"start"}); toast(`${T[type].short}: торкніться вільного місця на рейці`); }
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
    {id:"main", t:kind==="2inv"?"Поставте два автомати 2P: вступний від мережі й на виході інвертора":kind==="2in"?"Поставте два вступні автомати 2P — по одному на кожен ввід":kind==="3ph"?"Поставте вступний автомат 3P або 4P":"Поставте вступний автомат 2P",
      h:"Вступний автомат стоїть першим і захищає весь щит. Номінал — за дозволеною потужністю вводу (для квартири зазвичай C25–C40).",
      done:()=>S.devices.filter(d=>["qf2p","qf3p","qf4p"].includes(d.type)).length>=(kind==="2in"||kind==="2inv"?2:1), short:"Вступний автомат", act:["Обрати автомат",null]},
    {id:"inwire", short:"Ввід → вступний автомат", t:"Заведіть ввід на верхні клеми вступного автомата",
      h:kind==="3ph"?"У режимі «Проводка» оберіть вид дроту L1, L2, L3 і з’єднайте клеми вводу з клемами 1, 3, 5 автомата. Нуль N — на клему N автомата 4P або на шину N.":"У режимі «Проводка» оберіть «Фаза L» і з’єднайте клему вводу L з клемою 1 автомата, потім «Нуль N» — з клемою 3.",
      todo:()=>gTodo("inwire"), done:()=>{ const t=gTodo("inwire"); return t.length?t.every(x=>x.ok):mainsOk; }, act:["До проводки",()=>goWire(kind==="3ph"?"L1":"L")]},
    {id:"prot", opt:true, t:kind==="3ph"?"Захист від аварій мережі: реле контролю фаз, УЗІП":"Захист від перенапруги: реле напруги, УЗІП",
      h:kind==="3ph"?"Реле контролю фаз розімкне коло керування при обриві фази або неправильному чергуванні.":"Реле напруги відключить щит при стрибку напруги, УЗІП відведе імпульс блискавки на PE.",
      done:()=>has("kv","kvf","spdac"), short:"Захист від перенапруги", act:["Обрати реле",null]},
    ...(kind==="2in"||kind==="2inv"?[{id:"ats", t:kind==="2inv"?"Перемикання мережа ↔ інвертор: модуль АВР":"Перемикання вводів: модуль АВР або два контактори",
      h:kind==="2inv"?"Мережа — на ввід I модуля АВР, вихід інвертора — на ввід II. АВР має перемикати і фазу, і нуль. Вихід інвертора ніколи не можна з’єднувати з мережею — інвертор згорить."
        :"Модуль АВР — найпростіше. Контактори з блокуванням через НЗ-контакти 21–22 — класика. Головне, щоб вводи ніколи не з’єднались між собою.",
      done:()=>has("ats")||S.devices.filter(d=>d.type==="km2a").length>=2, short:"Перемикання вводів", act:["Обрати АВР",null]}]:[]),
    {id:"rcd", opt:kind==="3ph", t:"Захист людей: ПЗВ або диф-автомати",
      h:"ПЗВ 30 мА вимикає лінію при витоку струму на корпус. Номінал ПЗВ — не менший за вступний автомат.",
      done:()=>has("rcd","rcd4","rcbo"), short:"Захист людей", act:["Обрати ПЗВ",null]},
    {id:"groups", t:"Групи й обладнання",
      h:"Кожен автомат 1P — окрема лінія: розетки, світло, кухня. Двигун, бойлер чи сонячні панелі додайте в «Обладнання поза щитом».",
      done:()=>G.length>0||S.field.length>0, short:"Групові автомати", act:["Обрати автомат",null]},
    {id:"bus", short:"Шини N і PE", t:"Шини N і PE",
      h:has("rcd")?"PE вводу — одразу на шину PE (XPE1), без апаратів. Шину N (XN1) живить лише нижня клема N ПЗВ — звідти беруть нуль групові автомати. Нуль від вступного автомата на XN1 не заводьте: так він піде в обхід ПЗВ."
        :"PE вводу — одразу на шину PE (XPE1), без апаратів. Нуль — на шину N (XN1), звідти беруть нуль групи.",
      todo:()=>gTodo("bus"), done:()=>{ const t=gTodo("bus"); if(t.length) return t.every(x=>x.ok); const pe=b.inputs.find(i=>i.terms.includes("PE")), rc=S.devices.filter(d=>d.type==="rcd");
        return (!pe||f0(pe.id+":PE")===f0("xpe:0"))&&!rcdNBypass(f0).length&&(!b.xn||!G.some(g=>g.type==="qf1p")||(rc.length?rc.some(R=>f0("xn:0")===f0(R.id+":b2")):S.wires.some(w=>/^xn:/.test(w.a)||/^xn:/.test(w.b)))); },
      act:["До проводки (PE)",()=>goWire("PE")]},
    {id:"jump", short:"Перемички до груп", t:"Перемички: живлення до кожної групи",
      h:has("kv")&&has("rcd")?"Фаза: клема 2 вступного → «L вх» реле напруги, «L вих» реле → клема 1 ПЗВ, клема 2 ПЗВ → групові автомати. Нуль: клема 4 вступного → «N» реле і верхня «N» ПЗВ. Автомати 1P поруч зручно живити гребінкою (кнопка в режимі «Апарати»)."
        :"З’єднайте апарати по черзі: вступний → реле → ПЗВ → групові автомати. Автомати 1P поруч зручно живити гребінкою (кнопка в режимі «Апарати»).",
      todo:()=>gTodo("jump"), done:jumpOK, act:["До проводки",()=>goWire("L")]},
    {id:"labels", short:"Підпишіть групи", opt:!G.length, t:"Наклейки: підпишіть групи",
      h:"Торкніться автомата і дайте назву в полі «Підпис»: «Кухня, розетки», «Освітлення»…",
      done:()=>G.every(g=>!/^(Група \d+|Нова група)$/.test(g.group.name))},
    {id:"loads", short:"Прилади в групах", opt:!G.length, t:"Прилади в групах",
      h:"У картці групи внизу додайте прилади. Симулятор порахує струм і перевірить номінали.",
      done:()=>G.every(g=>g.group.loads.length>0), act:["До карток груп",()=>showTab("groups",true)]},
    {id:"check", short:"Перевірте схему", t:"Перевірте схему",
      h:"«Перевірити схему» знайде КЗ, помилки кольорів дротів, групи без ПЗВ, замалі перерізи. Крок зараховується, коли помилок нуль.",
      done:()=>S.lastCheck&&S.lastCheck.sig===structSnap()&&S.lastCheck.errors===0, act:["Перевірити",()=>checkNow()]},
    {id:"test", short:"Подайте напругу", t:"Випробування: подайте напругу",
      h:"У режимі «Випробування» ввімкніть мережу. Групи мають показати «Під напругою», обладнання — запрацювати.",
      done:()=>!!(S.guide&&S.guide.testOK), act:["До випробування",()=>{ S.mode="test"; renderAll(true); $("scroller").scrollIntoView({behavior:"smooth",block:"start"}); }]}]; }
let GSTEPS=[];
function guideHTML(){ if(!S.guide||!S.guide.on) return "";
  const st=guideSteps(), skip=new Set(S.guide.skip||[]), done=st.map(s=>{ try{ return !!s.done(); }catch(e){ return false; } }); GSTEPS=st;
  const cur=st.findIndex((s,i)=>!done[i]&&!skip.has(s.id)), fin=st.filter((s,i)=>done[i]||skip.has(s.id)).length, pct=Math.round(fin/st.length*100);
  const list=S.gList?`<ol class="g-list">${st.map((x,i)=>`<li class="${done[i]?"ok":skip.has(x.id)?"sk":i===cur?"cur":""}">${esc(x.t)}</li>`).join("")}</ol>`:"";
  if(cur<0){ S.devFilter=null; return `<div class="guide fin"><div class="g-top"><span class="g-k">Помічник складання</span><div class="g-bar"><i style="width:100%"></i></div><button class="g-x" data-gx aria-label="Сховати помічника">✕</button></div>
    <div class="g-t">Щит зібрано і випробувано</div><div class="g-h">Усі кроки виконано. Збережіть копію або експортуйте файл у «Проєктах».</div><div class="row"><button class="btn" data-glist>${S.gList?"Сховати список":"Усі кроки"}</button><button class="btn" data-gx>Закрити помічника</button></div>${list}</div>`; }
  const s=st[cur]; if(S.devFilter&&S.devFilter.step!==s.id) S.devFilter=null;
  return `<div class="guide"><div class="g-top"><span class="g-k">Крок ${cur+1} з ${st.length}${s.opt?" · необов’язковий":""}</span><div class="g-bar"><i style="width:${pct}%"></i></div><button class="g-x" data-gx aria-label="Сховати помічника">✕</button></div>
    <div class="g-t">${esc(s.t)}</div><div class="g-h">${esc(s.h)}</div>
    <div class="row">${s.act?`<button class="btn primary" data-gact="${cur}">${esc(s.act[0])}</button>`:""}<button class="btn" data-gskip="${s.id}">Пропустити</button><button class="btn" data-glist>${S.gList?"Сховати список":"Усі кроки"}</button></div>${list}</div>`; }
document.addEventListener("click",e=>{ const q=s=>e.target.closest(s); let el;
  if(el=q("[data-gact]")){ const s=GSTEPS[+el.dataset.gact]; if(s&&s.act){ if(s.act[1]) s.act[1](); else showOpts(s); } return; }
  if(el=q("[data-gskip]")){ (S.guide.skip||(S.guide.skip=[])).push(el.dataset.gskip); save(); renderTools(); return; }
  if(q("[data-glist]")){ S.gList=!S.gList; renderTools(); return; }
  if(q("[data-gx]")){ S.guide.on=false; save(); renderTools(); toast("Помічника можна знову ввімкнути в «Проєктах»"); return; } });
setInterval(()=>{ if(!S.guide||!S.guide.on||S.guide.testOK||S.mode!=="test"||!S.sim||!anySource()) return; const G=groupsOf();
  const ok=G.length?G.every(g=>S.sim.g[g.id]&&S.sim.g[g.id].phase&&S.sim.g[g.id].neutral):S.field.some(f=>f.run||f.on||f.mode==="grid"||f.mode==="backup");
  if(ok){ S.guide.testOK=true; save(); renderTools(); toast("Випробування пройдено: щит працює","ok"); } },1000);
// ---- Компактний помічник: рядок у нижній панелі + пояснення в рядку підказки вгорі
function guideCur(){ if(!S.guide||!S.guide.on) return null; const st=guideSteps(), skip=new Set(S.guide.skip||[]), done=st.map(s=>{ try{ return !!s.done(); }catch(e){ return false; } }); GSTEPS=st;
  const cur=st.findIndex((s,i)=>!done[i]&&!skip.has(s.id)); return {st,cur,s:st[cur]}; }
function guideHint(){ const g=guideCur(); if(!g) return ""; if(g.cur<0) return "<b>Помічник:</b> щит зібрано і випробувано. Збережіть проєкт або зробіть документи.";
  const td=g.s.todo?g.s.todo():[]; if(td.length) return `<b>Крок ${g.cur+1} · ${esc(g.s.short||g.s.t)}:</b> `+td.map(x=>x.bad?`<span style="color:var(--red)">✕ ${esc(x.t)}</span>`:`<span style="color:${x.ok?"var(--green)":"var(--fg)"}">${x.ok?"✓":"○"} ${esc(kName(x.a))} → ${esc(kName(x.b))}</span>`).join(" · ");
  return `<b>Крок ${g.cur+1}:</b> ${esc(g.s.h)}`; }
function guideBar(){ const g=guideCur(); if(!g) return "";
  if(g.cur<0){ S.devFilter=null; return `<div class="br gd"><span class="gk">✓</span><b class="gt">Щит зібрано і випробувано</b><button class="bx" data-gx aria-label="Сховати помічника">✕</button></div>`; }
  const s=g.s; if(S.devFilter&&S.devFilter.step!==s.id) S.devFilter=null; const it=s.todo?(s.todo().find(x=>!x.ok)||null):null;
  if(it) return `<div class="br gd"><span class="gk">${g.cur+1}/${g.st.length}</span><b class="gt">${it.bad?esc(it.t):`З’єднайте <span class="gn">1</span> ${esc(kName(it.a))} → <span class="gn">2</span> ${esc(kName(it.b))}`}</b><button class="bx" data-gx aria-label="Сховати помічника">✕</button></div>`
    +`<div class="br">${it.bad?`<button class="btn sm primary" data-gwire>До проводки</button>`:`<button class="btn sm primary" data-gwire>${S.mode==="wire"&&S.wireKind===it.kind?"✓ Дріт «"+esc(WK[it.kind][0])+"» обрано — торкніться 1, потім 2":"Прокласти дріт «"+esc(WK[it.kind][0])+"»"}</button>`}<button class="btn sm" data-gskip="${s.id}">Пропустити крок</button></div>`;
  return `<div class="br gd"><span class="gk">${g.cur+1}/${g.st.length}</span><b class="gt">${esc(s.short||s.t)}</b>${s.act?`<button class="btn sm primary" data-gact="${g.cur}">${esc(s.act[0])}</button>`:""}<button class="btn sm" data-gskip="${s.id}">Пропустити</button><button class="bx" data-gx aria-label="Сховати помічника">✕</button></div>`; }

// ---- Конкретні дії для кроків проводки: що з чим з’єднати, з перевіркою кожного пункту
const byPosD = (a,c) => ((a.rail||0)-(c.rail||0))||(a.slot-c.slot);
function kName(k){ if(k==="xn:*") return "шина N (XN1)"; if(k==="xpe:*") return "шина PE (XPE1)"; const n=termName(k), t=termDef(k), d=S.devices.find(x=>x.id===k.split(":")[0]);
  return t&&d&&T[d.type].terms.filter(x=>x.l===t.l).length>1 ? n+(t.s==="top"?" зверху":" знизу") : n; }
function gTodo(id){ const b=S.board, f0=build({allOpen:true}), kind=boardKind(b), out=[], G=groupsOf();
  const mains=S.devices.filter(d=>["qf2p","qf3p","qf4p"].includes(d.type)).sort(byPosD), K2=(d,k)=>d.id+":"+k;
  const okOf=(a,c,alt)=>{ const fc=c==="xn:*"?"xn:0":c==="xpe:*"?"xpe:0":c; return f0(a)===f0(fc)||(alt||[]).some(x=>f0(a)===f0(x)); };
  const add=(a,c,k,sec,alt)=>out.push({a,b:c,kind:k,sec,ok:okOf(a,c,alt)});
  if(id==="inwire"){ b.inputs.filter(i=>i.terms.some(t=>/^L/.test(t))).forEach((inp,ix)=>{ const m=mains[ix]||mains[0]; if(!m) return;
      const tops=T[m.type].terms.filter(t=>t.s==="top"), ph=tops.filter(x=>x.r!=="N"), tn=tops.find(x=>x.r==="N"), sec=secFor(inA(m.rating));
      inp.terms.filter(t=>t!=="PE").forEach(t=>{ if(t==="N") add(inp.id+":N",tn?K2(m,tn.k):"xn:*","N",sec); else { const q=ph[t==="L"?0:+t.slice(1)-1]; if(q) add(inp.id+":"+t,K2(m,q.k),t==="L"?"L":t,sec); } }); }); }
  if(id==="bus"){ const pe=b.inputs.find(i=>i.terms.includes("PE")), m=mains[0], rc=S.devices.filter(d=>d.type==="rcd").sort(byPosD);
    if(pe&&b.xpe) add(pe.id+":PE","xpe:*","PE",m?secFor(inA(m.rating)):6);
    if(b.xn&&G.some(g=>g.type==="qf1p")){ if(rc.length) add(K2(rc[0],"b2"),"xn:*","N",m?secFor(inA(m.rating)):6); else if(m&&m.type!=="qf3p") add(K2(m,m.type==="qf4p"?"b4":"b2"),"xn:*","N",secFor(inA(m.rating))); }
    for(const R of rcdNBypass(f0)) out.push({ok:false,bad:true,t:`Нуль іде в обхід ${desig(R)}: верхня і нижня N ${desig(R)} з’єднані через шину. Перенесіть дріт з верхньої N на вихід N вступного автомата.`}); }
  if(id==="jump"&&kind==="1ph"){ const m=mains[0]; if(!m||m.type!=="qf2p") return out; const kv=S.devices.find(d=>d.type==="kv"), rc=S.devices.find(d=>d.type==="rcd"), sec=secFor(inA(m.rating));
    let L=K2(m,"b1"); const N=K2(m,"b2");
    if(kv){ add(L,K2(kv,"t2"),"L",sec); add(N,K2(kv,"t1"),"N",1.5,["xn:0"]); L=K2(kv,"b2"); }
    if(rc){ add(L,K2(rc,"t1"),"L",sec); add(N,K2(rc,"t2"),"N",sec); L=K2(rc,"b1"); }
    for(const g of G.filter(g=>["qf1p","qfn","afdd","rcbo"].includes(g.type))){ add(L,K2(g,"t1"),"L",sec); if(g.type!=="qf1p") add(K2(g,"t2"),"xn:*","N",2.5); } }
  return out; }
function gItem(){ const g=guideCur(); if(!g||g.cur<0||!g.s.todo) return null; const t=g.s.todo(); return t.find(x=>!x.ok)||null; }
function gHL(){ if(!S.guide||!S.guide.on||S.mode!=="wire"||S.selWire||S.moveEnd) return []; const it=gItem(); if(!it||it.bad) return [];
  const free=p=>{ for(let i=0;i<(p==="xn"?S.board.xn:S.board.xpe);i++){ const k=p+":"+i; if(!S.wires.some(w=>w.a===k||w.b===k)) return k; } return p+":0"; };
  return [it.a,it.b==="xn:*"?free("xn"):it.b==="xpe:*"?free("xpe"):it.b]; }
document.addEventListener("click",e=>{ const el=e.target.closest("[data-gwire]"); if(!el) return; const it=gItem(); if(!it) return;
  if(it.bad){ S.mode="wire"; renderAll(true); return; }
  S.mode="wire"; S.wireKind=it.kind; if(it.sec) S.wireSec=it.sec; S.selWire=null; S.selDev=null; S.pend=null; renderAll(true); toast(`Торкніться клеми ${kName(it.a)}, потім ${kName(it.b)}`); });
