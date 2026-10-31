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
  const dd=$("devDD"); if(dd) dd.scrollIntoView({behavior:"smooth",block:"start"}); }
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
    {id:"main", t:kind==="2in"?"Поставте два вступні автомати 2P — по одному на кожен ввід":kind==="3ph"?"Поставте вступний автомат 3P або 4P":"Поставте вступний автомат 2P",
      h:"Вступний автомат стоїть першим і захищає весь щит. Номінал — за дозволеною потужністю вводу (для квартири зазвичай C25–C40).",
      done:()=>S.devices.filter(d=>["qf2p","qf3p","qf4p"].includes(d.type)).length>=(kind==="2in"?2:1), short:"Вступний автомат", act:["Обрати автомат",null]},
    {id:"inwire", t:"Заведіть ввід на верхні клеми вступного автомата",
      h:kind==="3ph"?"У режимі «Проводка» оберіть вид дроту L1, L2, L3 і з’єднайте клеми вводу з клемами 1, 3, 5 автомата. Нуль N — на клему N автомата 4P або на шину N.":"У режимі «Проводка» оберіть «Фаза L» і з’єднайте клему вводу L з клемою 1 автомата, потім «Нуль N» — з клемою 3.",
      done:()=>mainsOk, act:["До проводки",()=>goWire(kind==="3ph"?"L1":"L")]},
    {id:"prot", opt:true, t:kind==="3ph"?"Захист від аварій мережі: реле контролю фаз, УЗІП":"Захист від перенапруги: реле напруги, УЗІП",
      h:kind==="3ph"?"Реле контролю фаз розімкне коло керування при обриві фази або неправильному чергуванні.":"Реле напруги відключить щит при стрибку напруги, УЗІП відведе імпульс блискавки на PE.",
      done:()=>has("kv","kvf","spdac"), short:"Захист від перенапруги", act:["Обрати реле",null]},
    ...(kind==="2in"?[{id:"ats", t:"Перемикання вводів: модуль АВР або два контактори",
      h:"Модуль АВР — найпростіше. Контактори з блокуванням через НЗ-контакти 21–22 — класика. Головне, щоб вводи ніколи не з’єднались між собою.",
      done:()=>has("ats")||S.devices.filter(d=>d.type==="km2a").length>=2, short:"Перемикання вводів", act:["Обрати АВР",null]}]:[]),
    {id:"rcd", opt:kind==="3ph", t:"Захист людей: ПЗВ або диф-автомати",
      h:"ПЗВ 30 мА вимикає лінію при витоку струму на корпус. Номінал ПЗВ — не менший за вступний автомат.",
      done:()=>has("rcd","rcd4","rcbo"), short:"Захист людей", act:["Обрати ПЗВ",null]},
    {id:"groups", t:"Групи й обладнання",
      h:"Кожен автомат 1P — окрема лінія: розетки, світло, кухня. Двигун, бойлер чи сонячні панелі додайте в «Обладнання поза щитом».",
      done:()=>G.length>0||S.field.length>0, short:"Групові автомати", act:["Обрати автомат",null]},
    {id:"bus", t:"Шини N і PE",
      h:"PE вводу — одразу на шину PE (XPE1), без апаратів. Нуль після ПЗВ — на шину N (XN1), звідти беруть нуль групи.",
      done:()=>{ const pe=b.inputs.find(i=>i.terms.includes("PE")); return (!pe||f0(pe.id+":PE")===f0("xpe:0"))&&(!b.xn||!G.some(g=>g.type==="qf1p")||S.wires.some(w=>/^xn:/.test(w.a)||/^xn:/.test(w.b))); },
      act:["До проводки (PE)",()=>goWire("PE")]},
    {id:"jump", t:"Перемички: живлення до кожної групи",
      h:"З’єднайте апарати по черзі: вступний → реле → ПЗВ → групові автомати. Автомати 1P поруч зручно живити гребінкою (кнопка в режимі «Апарати»).",
      done:jumpOK, act:["До проводки",()=>goWire("L")]},
    {id:"labels", opt:!G.length, t:"Наклейки: підпишіть групи",
      h:"Торкніться автомата і дайте назву в полі «Підпис»: «Кухня, розетки», «Освітлення»…",
      done:()=>G.every(g=>!/^(Група \d+|Нова група)$/.test(g.group.name))},
    {id:"loads", opt:!G.length, t:"Прилади в групах",
      h:"У картці групи внизу додайте прилади. Симулятор порахує струм і перевірить номінали.",
      done:()=>G.every(g=>g.group.loads.length>0), act:["До карток груп",()=>$("groupsWrap").scrollIntoView({behavior:"smooth"})]},
    {id:"check", t:"Перевірте схему",
      h:"«Перевірити схему» знайде КЗ, помилки кольорів дротів, групи без ПЗВ, замалі перерізи. Крок зараховується, коли помилок нуль.",
      done:()=>S.lastCheck&&S.lastCheck.sig===structSnap()&&S.lastCheck.errors===0, act:["Перевірити",()=>checkNow()]},
    {id:"test", t:"Випробування: подайте напругу",
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
