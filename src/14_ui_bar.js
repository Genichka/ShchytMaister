/* ===== Нижня панель на один екран: усе в кількох рядках, без вертикальної прокрутки й спливних вікон ===== */
// Каталог нижньої панелі: група → підгрупи → апарати (за списком користувача). "G" — швидкі групи, "F" — польове обладнання, "C" — гребінка
const CATALOG = [["⚡ Групи","G"],
  ["Автомати",[["1P",["qf1p","qfn"]],["2P",["qf2p"]],["3P",["qf3p"]],["4P",["qf4p"]],["Автомати двигунів",["qm"]],["Модульні запобіжники",["fuac","fudc"]],["Автомати DC (СЕС)",["qfdc"]]],"Автоматичні вимикачі"],
  ["ПЗВ, дифавтомати",[["ПЗВ (УЗО)",["rcd","rcd4"]],["Дифавтомати (RCBO)",["rcbo"]],["AFDD",["afdd"]]],"Диференційний захист"],
  ["Реле",[["Контроль напруги",["kv","tovpd1"]],["Контроль фаз",["kvf","kvf2","pef"]],["Реле часу",["kt","stair"]],["Імпульсні реле",["kimp"]],["Фотореле",["photo"]],["Програмовані",["logo"]]],"Реле та автоматика"],
  ["Контактори",[["Модульні контактори",["km2a","km3a","km4a"]],["Проміжні реле",["rel"]],["Вимикачі, перемикачі",["sw2","qs"]],["АВР",["ats","to219","toq5","toq7"]]],"Контактори, пускачі, комутація"],
  ["ПЗІП",[["ПЗІП AC",["spdac","spd3"]],["ПЗІП DC",["spdc"]]],"Захист від перенапруг"],
  ["Шини",[["Гребінчасті шини 1P","C"]],"Розподільчі шини"],
  ["Клеми",[["Прохідні клеми",["xtb"]],["Розетка на DIN",["sock"]]],"Клеми та з’єднання"],
  ["Прилади",[["Лічильники",["pm1","pm3"]],["Вольтметри",["vm"]]],"Вимірювальні прилади"],
  ["Кнопки, лампи",[["Кнопки",["sbp","sbs"]],["Сигнальні лампи",["hl"]]],"Кнопки та сигналізація"],
  ["Розумний дім",[["Розумний дім",["ssw","hub","kr2","pm","tr"]]],"Розумний дім"],
  ["Поза щитом","F"]];
(function(){ const have=new Set(CATALOG.flatMap(c=>Array.isArray(c[1])?c[1].flatMap(g=>Array.isArray(g[1])?g[1]:[]):[]));   // що не потрапило до списку — у «Інше»
  const rest=Object.keys(T).filter(k=>!have.has(k)); if(rest.length) CATALOG.splice(CATALOG.length-1,0,["Інше",[["Інше",rest]],"Інше"]); })();
// номінали (C25, B16, 40 А, 30 мА…) підсвічуємо окремим кольором
const hlr = t => esc(t).replace(/(\b[A-DZ]\d{1,3}\b|\b\d{1,4}(?:[.,]\d+)? ?(?:мА|А|A)(?![\p{L}\d]))/gu,'<em class="rt">$1</em>');
const bx = `<button class="bx" data-bclose aria-label="Закрити">✕</button>`;
const bdel = attr => `<button class="bx bdel" ${attr} aria-label="Видалити" title="Видалити"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></button>`;
const bhead = (t,right) => `<div class="br bh"><b>${t}</b>${right||""}</div>`;
const brow = (inner,cls) => inner ? `<div class="br${cls?" "+cls:""}">${inner}</div>` : "";
const segRow = (list,cur) => `<div class="br seg">${list.map(([k,l])=>`<button class="sg" data-bseg="${k}" aria-pressed="${cur===k}">${l}</button>`).join("")}</div>`;
const chip = (attr,on,label,cls) => `<button class="chip${cls?" "+cls:""}" ${attr} aria-pressed="${!!on}">${label}</button>`;
function bseg(id,list,def){ if(S.bsegFor!==id){ S.bsegFor=id; S.bseg=def; } if(!list.some(x=>x[0]===S.bseg)) S.bseg=list[0][0]; return S.bseg; }

let guideOn=false;   // помічник показує незавершений крок (ставить guideBar)
function barSync(){ const sig=[S.selDev,S.selWire,S.pick,S.mode,S.chkOpen,S.noDoc,S.moveEnd?1:0,S.devFilter?1:0,S.allDev?1:0].join("|");
  if(S.barSig!==sig){ S.barSig=sig; S.barCol=false; }   // вибрали апарат, дріт чи режим — панель сама розгортається
  const b=$("bar"); if(b) b.classList.toggle("collapsed",!!S.barCol); }
function renderBar(){ const el=$("barIn"); if(!el) return; barSync(); let h="";
  const d=S.selDev&&S.devices.find(x=>x.id===S.selDev), f=S.selDev&&S.field.find(x=>x.id===S.selDev), w=S.mode==="wire"&&S.selWire&&wireById(S.selWire);
  if(S.noDoc) h=noDocBar();
  else if(S.chkOpen&&S.chk) h=chkBar();
  else if(w) h=wireBar(w);
  else if(d) h=devBar(d);
  else if(f) h=fieldBar(f);
  else { const gb=guideBar(); h=gb+(S.mode==="mount"?(guideOn&&!S.pick&&!S.devFilter&&!S.allDev?"":mountBar()):S.mode==="wire"?(guideOn?"":wireToolsBar()):testBar()); }
  el.innerHTML=h; if(S.mode==="test") updateLive(); }

// ---- Порожня робоча зона: стартові дії (збережені проєкти й імпорт — кнопка «Проєкт»)
function noDocBar(){
  return bhead("Немає відкритого щита")+brow(`<button class="btn sm primary" data-pa="new">＋ Створити новий щит</button><button class="btn sm" data-nodoc="tpl">Приклади щитів</button><button class="btn sm" data-nodoc="open">Відкрити збережений</button>`); }
// ---- Апарати: категорії + картки
function pickBar(){ const t=T[S.pick], q=S.pickQty||1, rate=S.pickRating||t.def||"";
  return bhead(`Ставимо: ${esc(t.short)}${rate?" "+hlr(rate+(t.unit||"")):""} <span class="bm">${t.w} мод.</span>`,`<button class="bx" data-pickx aria-label="Скасувати">✕</button>`)
    +(t.ratings?brow(`<span class="bl">Номінал</span>`+t.ratings.map(r=>chip(`data-prate="${r}"`,rate===r,r+(t.unit||""),"mono rt")).join("")):"")
    +brow(`<span class="bl">Скільки</span>`+[1,2,3,4,5,6,8].map(n=>chip(`data-pqty="${n}"`,q===n,"×"+n,"mono")).join("")+`<button class="btn sm" data-pauto>Поставити ×${q} у вільні місця</button>`); }
function mountBar(){ if(S.pick&&T[S.pick]) return pickBar(); const F=S.devFilter, mods=S.devices.reduce((a,d)=>a+T[d.type].w,0);
  if(F) return brow(`<span class="bl">${esc(F.title)} — оберіть:</span><button class="chip" data-fall>Усі апарати</button>`)
    +brow(F.opts.map((o,i)=>`<button class="dc" data-fpick="${i}" aria-pressed="${S.pick===o[0]&&(S.pickRating||null)===(o[1]||null)&&JSON.stringify(S.pickExtra||null)===JSON.stringify(o[3]||null)}"><b>${hlr(o[2]).replace(/^(TOMZN [A-Z0-9-/]+)/,'<em class="mk">$1</em>')}</b><small>${T[o[0]].w} мод.</small></button>`).join(""),"cards opts");
  const ci=Math.min(S.cat??0,CATALOG.length-1);
  const s=brow((S.guide&&S.guide.on?(guideOn?`<button class="btn sm" data-gback>← До кроку помічника</button>`:""):`<button class="btn sm assist" data-gon>Помічник</button>`)
      +`<input class="dq" id="devQ" type="search" placeholder="🔍 Знайти апарат: автомат, реле, ПЗВ…" value="${esc(S.devQ||"")}" autocomplete="off" aria-label="Пошук апарата">`
      +`<span class="bl mono">${mods}/${SLOTS*S.board.rails} мод.</span>`,"cats cattop")
    +`<div class="br cats wrap" id="devCats">${CATALOG.map(([l,,full],i)=>chip(`data-cat="${i}" title="${esc(full||l)}"`,i===ci&&!(S.devQ||"").trim(),l)).join("")}</div>`;
  return s+`<div id="devRes">${catBody()}</div>`; }
const devCard = x => `<button class="dc" data-pick="${x}" aria-pressed="${S.pick===x}" title="${esc(T[x].name)}"><b>${esc(T[x].short)}</b><small>${T[x].w} мод.${brandsFor(x).length>1?" · "+(brandsFor(x).length-1)+" вир.":""}</small></button>`;
function catBody(){ const q=(S.devQ||"").trim().toLowerCase();
  if(q){ const hit=Object.keys(T).filter(k=>[T[k].name,T[k].short,T[k].pre,T[k].maker||""].join(" ").toLowerCase().includes(q));
    return brow(`<span class="bl">Знайдено: ${hit.length}</span>`)+(hit.length?brow(hit.map(devCard).join(""),"cards"):brow(`<span class="bl">Нічого не знайдено — спробуйте інше слово</span>`)); }
  const ci=Math.min(S.cat??0,CATALOG.length-1), c=CATALOG[ci], subs=Array.isArray(c[1])?c[1]:null, si=subs?Math.min(S.sub||0,subs.length-1):0;
  if(c[1]==="G") return groupsQuickBar();
  if(c[1]==="F") return brow(FIELD_LIB.map(L=>`<button class="dc" data-fadd="${L.type}"><b>${esc(L.name)}</b><small>+${Object.keys(L.t).length} клем на XT1</small></button>`).join(""),"cards");
  let h=brow(`<b class="bl gname">${esc(c[2]||c[0])}</b>`+(subs.length>1?subs.map(([l],i)=>chip(`data-sub="${i}"`,i===si,l)).join(""):""),"cats subs");
  const sg=subs[si][1];
  if(sg==="C") return h+brow(`<button class="dc" id="combBtn"><b>${S.comb?"Зняти гребінку":"Гребінка 1P"}</b><small>об’єднує автомати 1P на рейці</small></button>`,"cards");
  return h+brow(sg.filter(x=>T[x]).map(devCard).join(""),"cards"); }

// ---- Групові (розподільчі) автомати: один дотик — автомат стає у вільне місце з назвою групи й приладами
const GQ = [["💡","Освітлення","B10",1.5,[["Освітлення",0.1,1]]],["🔌","Розетки","C16",2.5,[["Холодильник",0.15,1],["Телевізор",0.15,1],["Чайник",2.0,0]]],
  ["🍳","Розетки кухні","C16",2.5,[["Мікрохвильовка",1.0,0],["Чайник",2.0,0]]],["🧺","Пральна машина","C16",2.5,[["Пральна машина",2.2,0]]],
  ["🚿","Бойлер","C16",2.5,[["Бойлер",2.0,1]]],["🔥","Котел, насос","B16",2.5,[["Газовий котел",0.15,1],["Насос",0.75,1]]],
  ["❄️","Кондиціонер","C16",2.5,[["Кондиціонер",1.0,0]]],["♨️","Тепла підлога","C16",2.5,[["Тепла підлога",1.5,0]]],
  ["🍲","Плита","C32",6,[["Плита",4.0,0]]],["🌳","Вулиця","C16",2.5,[["Насос поливу",0.75,0]]],["＋","Інша група","C16",2.5,[]]];
const GQ_T = [["qf1p","Автомат 1P"],["qfn","Автомат 1P+N"],["rcbo","Диф-автомат"]];
const gqRate = (type,r) => { const R=T[type].ratings; if(R.includes(r)) return r; const c=r[0], n=inA(r);
  return R.find(x=>x[0]===c&&inA(x)>=n)||R.find(x=>inA(x)>=n)||R[R.length-1]; };
function groupsQuickBar(){ const ty=S.gType||"qf1p", G=groupsOf();
  return brow(`<span class="bl">Тип</span>`+GQ_T.map(([k,l])=>chip(`data-gqt="${k}"`,ty===k,l)).join(""))
    +brow(GQ.map(([em,nm,r,sec],i)=>{ const n=G.filter(g=>g.group.name===nm||g.group.name.startsWith(nm+" ")).length, rr=gqRate(ty,r);
      return `<button class="dc" data-gq="${i}"><b>${em} ${esc(nm)}</b><small><em class="rt">${rr}</em> · ${fmt(sec,sec%1?1:0)} мм²${n?` · є ${n}`:""}</small></button>`; }).join(""),"cards")
    +brow(`<button class="btn sm primary" data-gall>⚡ Прокласти всі дроти</button>`+(gqNeedRcd()?`<button class="btn sm" data-gqrcd>＋ ПЗВ ${boardKind(S.board)==="3ph"?"4P":"2P"} 63 А</button>`:"")
      +`<span class="bl">Торкніться групи — автомат одразу стане у вільне місце${G.length?` · груп: ${G.length}`:""}</span>`); }
const gqNeedRcd = () => !S.board.noRcd&&groupsOf().some(g=>!T[g.type].rcd)&&!S.devices.some(d=>d.type==="rcd"||d.type==="rcd4");
function gqAt(w){ const last=S.devices.slice().sort((a,c)=>((c.rail||0)-(a.rail||0))||((c.slot+T[c.type].w)-(a.slot+T[a.type].w)))[0];
  return last?nextFree(w,last.rail||0,last.slot+T[last.type].w):nextFree(w,0,0); }
function quickRcd(){ const type=boardKind(S.board)==="3ph"?"rcd4":"rcd", at=gqAt(T[type].w); if(!at){ toast("На рейках немає вільного місця","w"); return; }
  const d=mkDev(type,at[0],at[1],"63"); S.devices.push(d); commit(); toast(`${desig(d)} 63 А, 30 мА встановлено — «Прокласти всі дроти» підключить групи через нього`,"ok"); }
function quickGroup(i,atOverride){ const p=GQ[i], type=S.gType||"qf1p", t=T[type], r=gqRate(type,p[2]);
  const at=atOverride||gqAt(t.w);
  if(!at){ toast("На рейках немає вільного місця — додайте рейку: «Меню → Корпус і ввід»","w"); return; }
  const G=groupsOf(), same=G.filter(g=>g.group.name===p[1]||g.group.name.startsWith(p[1]+" ")).length, nm=same?`${p[1]} ${same+1}`:p[1];
  const ex={group:mkGroup(G.length,nm,p[3],p[4])}; if(S.brand&&S.brand!=="eua"&&MODELS[type]&&MODELS[type][S.brand]) ex.brand=S.brand;
  const d=mkDev(type,at[0],at[1],r,ex); S.devices.push(d); commit(); toast(`${desig(d)} ${r} — «${nm}» встановлено`,"ok"); }
document.addEventListener("click",e=>{ const el=e.target.closest("[data-gq],[data-gqt],[data-gqrcd]"); if(!el) return; if(el.dataset.gqrcd!==undefined){ quickRcd(); return; }
  if(el.dataset.gqt){ S.gType=el.dataset.gqt; renderBar(); return; } quickGroup(+el.dataset.gq); });

// ---- Картка апарата
function devBar(d){ const t=T[d.type], g=d.group, m=modelOf(d), bl=brandsFor(d.type), set=devSet(d);
  const L=[...(t.ratings?[["rate",d.type==="qm"?"Діапазон":"Номінал"]]:[]),...(g?[["load","Навантаження"]]:[]),...(g&&S.mode==="test"?[["fault","Аварії"]]:[]),...(bl.length>1?[["brand","Виробник"]]:[]),
    ...(set?[["set","Налаштування"]]:[]),["cap","Підпис"],["pos","Місце"]];
  const cur=bseg(d.id,L,g&&S.mode==="test"?"load":L[0][0]);
  let s=bhead(`${esc(desig(d))} · ${esc(t.short)}${d.rating?" "+esc(d.rating)+(t.unit||""):""}${m?` <span class="bm">${esc(m)}</span>`:""}${g?` <span class="bm">«${esc(g.name)}»</span>`:""}`,bdel("data-devdel")+bx)+segRow(L,cur);
  if(cur==="rate") s+=brow(t.ratings.map(r=>chip(`data-rate="${r}"`,d.rating===r,`${r}${t.unit||""}`,"mono")).join("")+(d.type==="qm"?`<span class="volt sm"><input type="range" id="irset" min="${mprLo(d.rating)}" max="${mprHi(d.rating)}" step="0.1" value="${d.Ir}" aria-label="Уставка Ir"><output class="mono" id="irout">${fmt(d.Ir,1)} А</output></span>`:""));
  if(cur==="brand") s+=brow(bl.map(b=>chip(`data-brand="${b}"`,brandOf(d)===b,esc(BR[b].s||BR[b].n))).join("")+`<button class="btn sm" data-brandall>Усім апаратам</button>`);
  if(cur==="cap") s+=brow(`<input class="inp grow" id="capIn" data-capfor="${d.id}" value="${esc(g?g.name:(d.cap||t.cap||t.short))}" maxlength="40" aria-label="Підпис (наклейка)"><button class="btn sm primary" data-capok>Готово</button>`);
  if(cur==="load"){ const Ld=gLoad(d), du=groupDU(d);
    s+=brow(g.loads.map((l,i)=>`<span class="lchip${l.on?" on":""}"><button data-ltog="${d.id}:${i}" aria-pressed="${l.on}">${l.on?"●":"○"} ${esc(l.n)} <span class="mono">${fmt(l.kw,1)}</span></button><button class="lx" data-del="${d.id}:${i}" aria-label="Прибрати ${esc(l.n)}">✕</button></span>`).join("")
      +`<select class="btn sm" id="ga-${d.id}" data-add="${d.id}" aria-label="Додати прилад"><option value="">＋ Прилад</option>${LOADS.map((l,i)=>`<option value="${i}">${l[0]} · ${fmt(l[1],2)} кВт</option>`).join("")}</select>`);
    s+=brow(`<span class="bl" data-gload="${d.id}">${Ld.txt}</span><span data-gstat="${d.id}">${gStatus(d)}</span><label class="bl">Кабель <select class="btn sm" id="gs-${d.id}" data-gsec="${d.id}">${SECS.slice(0,6).map(x=>`<option value="${x}" ${g.sec===x?"selected":""}>${fmt(x,x%1?1:0)} мм²</option>`).join("")}</select></label>`
      +`<label class="bl">Довжина <input class="inp num" type="number" min="0" step="0.5" id="gl-${d.id}" data-glen="${d.id}" value="${g.len||""}" placeholder="—"> м</label>`
      +(du===null?"":`<span class="bl mono" style="color:${du>4?"var(--red)":"var(--muted)"}">ΔU ${fmt(du,1)} %</span>`)); }
  if(cur==="fault") s+=brow(chip(`data-leak="${d.id}"`,S.leak.has(d.id),"Витік на корпус")+chip(`data-short="${d.id}"`,S.short.has(d.id),"Коротке замикання")+chip(`data-arc="${d.id}"`,S.arc.has(d.id),"Іскріння")+`<span class="bl" data-gstat="${d.id}">${gStatus(d)}</span>`);
  if(cur==="set") s+=brow(set);
  if(cur==="pos") s+=brow(``
    +(d.type==="qf1p"?`<button class="btn sm" id="combBtn">${S.comb?"Зняти гребінку":"Гребінка 1P"}</button>`:"")
    +(t.prot||t.rcd?`<button class="btn sm" id="devToggle">${d.on&&!d.trip?"Вимкнути":"Увімкнути"}</button>`:"")+`<button class="btn sm danger" data-devdel>Зняти з рейки</button>`)+brow(`<span class="bl">Щоб пересунути, перетягніть апарат по рейці: мишею або затисніть пальцем і тягніть</span>`);
  return s; }
function devSet(d){ const t=T[d.type]; let s="";
  if(t.group&&t.groupOpt) s+=chip("data-gtoggle",!!d.group,d.group?"Група споживачів (3 фази)":"Зробити групою");
  if(d.type==="kt") s+=[1,3,5,10,20,30].map(v=>chip(`data-delay="${v}"`,d.delay===v,v+" с")).join("");
  if(d.type==="stair") s+=[10,30,60,120].map(v=>chip(`data-delay="${v}"`,d.delay===v,v+" с")).join("");
  if(d.type==="sock") s+=chip("data-plug",!!d.plug,d.plug?"Інструмент 1,2 кВт увімкнено":"Увімкнути інструмент 1,2 кВт");
  if(d.type==="xtb") s+=[["grey","Сірий · L"],["blue","Синій · N"],["pe","Жовто-зелений · PE"]].map(([c,l])=>chip(`data-xcol="${c}"`,d.col===c,l)).join("");
  if(d.type==="photo") s+=[10,20,40].map(v=>chip(`data-th="${v}"`,d.th===v,"поріг "+v+" %")).join("");
  if(d.type==="tovpd1") s+=`<span class="bl">Відключення за струмом</span>`+[16,25,32,40,50,60,63].filter(v=>v<=inA(d.rating)).map(v=>chip(`data-iset="${v}"`,d.iset===v,v+" А","mono")).join("");
  if(d.type==="to219"||d.type==="qs") s+=`<span class="bl">Положення</span>`+[[1,"I"],[0,"0"],[2,"II"]].map(([v,l])=>chip(`data-qpos="${v}"`,d.pos===v,l,"mono")).join("");
  if(d.type==="ats") s+=chip(`data-atsm="0"`,!d.manual,"Автоматичний")+chip(`data-atsm="1"`,!!d.manual,"Ручний")+chip(`data-atsv="tomzn"`,d.variant==="tomzn","TOMZN")+chip(`data-atsv="geya"`,d.variant==="geya","GEYA");
  if(d.type==="toq5"||d.type==="toq7") s+=chip(`data-atsm="0"`,!d.manual,"Auto — автоматичний")+chip(`data-atsm="1"`,!!d.manual,"Manual — ручний")+`<span class="bl">Ручка</span>`+["A","B"].map(v=>chip(`data-tqpos="${v}"`,d.pos===v,v==="A"?"A · мережа":"B · генератор","mono")).join("");
  if(d.type==="ssw") s+=chip(`data-cmd="1"`,!!d.cmd,"Увімкнути з застосунку")+chip(`data-cmd="0"`,!d.cmd,"Вимкнути");
  if(d.type==="hl") s+=[["#3fbf4a","Зелений"],["#e23b3b","Червоний"],["#ffb21f","Жовтий"]].map(([c,l])=>chip(`data-hlc="${c}"`,d.col===c,l)).join("");
  return s; }

// ---- Обладнання поза щитом
function fieldBar(f){ const L=FIELD_LIB.find(x=>x.type===f.type)||{name:FT[f.type].name};
  return bhead(`${esc(f.name||desig(f))} · ${esc(L.name)}`,bdel(`data-fdel="${f.id}"`)+bx)+brow(`<span class="bl">XT1: ${Object.values(f.map).map(k=>esc(termName(k).replace(/^Клема XT1 /,""))).join(", ")}</span>`)
    +brow((f.type==="pv"?[6,8,10,12].map(n=>chip(`data-pvn="${n}"`,f.n===n,n+" панелей")).join("")+`<span class="bl">Voc ≈ ${Math.round((f.n||10)*49.6)} В</span>`:"")+`<button class="btn sm danger" data-fdel="${f.id}">Прибрати обладнання</button>`); }

// ---- Дроти
function wireToolsBar(){ const sw=k=>`<span class="sw" style="background:${k==="PE"?"linear-gradient(90deg,var(--wPEy) 50%,var(--wPEg) 50%)":WK[k][1]}"></span>`;
  const bad=!mainsOf().length?{t:"Спершу поставте ввідний автомат 2P (вкладка «Захист»)"}:wirePlan().find(x=>x.bad);
  return brow(`<button class="btn sm primary" data-gall>⚡ Прокласти всі дроти автоматично</button>`+(bad?`<span class="bl" style="color:var(--orange)">${esc(bad.t)}</span>`:`<span class="bl">перемички, шини N і PE, групи — за схемою</span>`))+brow(`<span class="bl">Новий дріт</span>`+Object.keys(WK).map(x=>chip(`data-kind="${x}"`,S.wireKind===x,sw(x)+WK[x][0])).join(""))
    +brow(SECS.map(x=>chip(`data-sec="${x}"`,S.wireSec===x,fmt(x,x%1?1:0),"mono")).join("")+`<span class="bl">мм²</span>`
      +(S.wires.length?`<button class="btn sm" data-wsel="${S.wires[S.wires.length-1].id}">Вибрати дріт (${S.wires.length})</button><button class="btn sm danger" id="clearWires">${clearArm>Date.now()?"Ще раз — прибрати всі":"Прибрати всі"}</button>`:"")); }
function wireBar(w){ const me=S.moveEnd&&S.moveEnd.id===w.id?S.moveEnd.end:null, ck=wColKey(w);
  const L=[["ends","Кінці"],["kind","Вид"],["col","Колір"],["sec","Переріз"],["del","Видалити"]], cur=bseg(w.id,L,"ends");
  let s=bhead(`Дріт ${wNo(w)} з ${S.wires.length} · ${esc(wireLabel(w))} <span class="bm">≈ ${wireLenCm(w)} см</span>`,`${bdel("data-wdel")}${bx}`);
  if(me) return s+brow(`<span class="bl warnt">Торкніться нової клеми для ${me==="a"?"початку":"кінця"} дроту</span><button class="btn sm" data-wmove="cancel">Скасувати</button>`)+brow(`<span class="bl">${me==="a"?"Початок":"Кінець"} зараз: ${esc(termName(w[me]))}</span>`);
  s+=segRow(L,cur);
  if(cur==="ends") s+=brow(["a","b"].map(e=>`<button class="btn sm wend2" data-wmove="${e}"><small>${e==="a"?"Початок":"Кінець"}</small> ${esc(termName(w[e]))} <b>⇄</b></button>`).join(""));
  if(cur==="kind") s+=brow(Object.keys(WK).map(x=>chip(`data-skind="${x}"`,w.kind===x,swatch(x)+WK[x][0])).join(""));
  if(cur==="col") s+=brow(chip(`data-scol=""`,!w.col,"За видом")+Object.keys(WCOL).map(c=>chip(`data-scol="${c}"`,w.col===c,swatch(c,true)+WCOL[c][0])).join(""));
  if(cur==="sec") s+=brow(SECS.map(x=>chip(`data-ssec="${x}"`,w.sec===x,fmt(x,x%1?1:0),"mono")).join("")+`<button class="btn sm" data-wall="sec">Усім дротам лінії</button>`);
  if(cur==="del") s+=brow(`<button class="btn sm danger" data-wdel>Видалити цей дріт</button><span class="bl">«Назад» угорі поверне його</span>`);
  if(ck&&((PHK.includes(w.kind)||w.kind==="C")&&(ck==="blue"||ck==="pe")||w.kind==="N"&&ck!=="blue"||w.kind==="PE"&&ck!=="pe"||w.kind!=="PE"&&ck==="pe")) s+=brow(`<span class="bl warnt">Колір не за правилами: синій — лише N, жовто-зелений — лише PE</span>`);
  return s; }

// ---- Випробування
function testBar(){ const dm=S.tplObj&&S.tplObj.demo||{controls:[{type:"src",id:S.board.inputs[0].id}],script:[]}, C=dm.controls.map((c,i)=>[c,i]);
  const src=C.filter(([c])=>c.type==="src"), oth=C.filter(([c])=>c.type!=="src");
  const sHTML=([c])=>{ const s=S.src[c.id]||{}, inp=S.board.inputs.find(x=>x.id===c.id)||{}, three=(inp.terms||[]).includes("L1");
    return `<button class="switch sm" data-srcon="${c.id}" aria-pressed="${!!s.on}"><span class="knob"></span>${esc(c.label||inp.label)}</button>`+(c.noU?"":`<span class="volt sm"><input type="range" id="u-${c.id}" data-srcu="${c.id}" min="150" max="290" step="1" value="${Math.round(s.U||230)}" aria-label="Напруга"><output class="mono" id="uo-${c.id}">${three?Math.round((s.U||230)*1.732)+" В":Math.round(s.U||230)+" В"}</output></span>`); };
  const oHTML=([c,i])=>c.type==="range"?`<span class="volt sm"><span class="bl">${esc(c.label)}</span><input type="range" id="c-${i}" data-ctl="${i}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.get()}"><output class="mono" id="co-${i}">${c.get()}</output></span>`:ctlHTML(c,i);
  const faults=S.leak.size||S.short.size||S.arc.size;
  // кожен ввід — окремим рядком (перемикач + напруга), щоб на телефоні нічого не ховалось за край
  let s=src.map(x=>brow(sHTML(x),"srcrow")).join("")
    +brow((dm.script.length?`<button class="btn sm primary" id="demoBtn">${S.demo?"■ Стоп":"▶ Демонстрація"}</button>`:"")+`<button class="btn sm" id="allOn">Увімкнути все</button>${faults?`<button class="btn sm" id="clrFaults">Прибрати аварії</button>`:""}`,"wrap");
  if(oth.length) s+=brow(oth.map(oHTML).join(""),"ctlrow wrap");
  s+=`<div class="br wrap" id="stl"></div><button class="br logline" id="logline" aria-label="Журнал подій"></button>`;
  return s; }

// ---- Результат перевірки: одна помилка за раз
function chkCur(){ const C=S.chk.list, bad=C.filter(c=>c.sev!=="ok"), L=bad.length?bad:C, i=Math.min(S.chk.i||0,L.length-1); return {L,i,c:L[i]}; }
function chkBar(){ const C=S.chk.list, ne=C.filter(c=>c.sev==="e").length, nw=C.filter(c=>c.sev==="w").length, {L,i,c}=chkCur();
  let s=bhead(ne||nw?`Перевірка: ${ne?`<span style="color:var(--red)">● ${ne} помил.</span> `:""}${nw?`<span style="color:var(--orange)">● ${nw} попер.</span>`:""}`:`<span style="color:var(--green)">✓ Схема правильна</span>`,bx);
  if(!c) return s;
  s+=brow(`<button class="bx" data-cnav="-1" aria-label="Попередня">◀</button><span class="bl mono">${i+1}/${L.length}</span><button class="bx" data-cnav="1" aria-label="Наступна">▶</button><span class="sev ${c.sev}">${c.sev==="e"?"Помилка":c.sev==="w"?"Увага":"OK"}</span><b class="ct">${esc(c.t)}</b>`);
  s+=`<div class="br cd">${esc(c.d||"")}</div>`;
  // що робити далі: показати апарат чи дріт на щиті, або вести далі помічником
  const r=c.ref, gOn=!!(S.guide&&S.guide.on), gp=(ne||c.sev!=="ok")&&guidePending(), next=!ne&&gOn&&guidePending();
  if((r&&(r.dev||r.wire))||gp||next||ne) s+=brow((r&&(r.dev||r.wire)?`<button class="btn sm" data-cshow>Показати ${r.wire?"дріт":"на щиті"}</button>`:"")
    +(next?`<button class="btn sm primary" data-gon>Далі →</button>`:gp?`<button class="btn sm primary" data-gon>${gOn?"До помічника":"Виправити з помічником"}</button>`:"")
    +(ne&&mainsOf().length&&!wirePlan().some(x=>x.bad)?`<button class="btn sm" data-gall>Виправити все</button>`:""));
  return s; }
// ---- Події панелі
document.addEventListener("click",e=>{ const q=s=>e.target.closest(s); let el;
  if(q("[data-bclose]")){ if(S.chkOpen){ S.chkOpen=false; } else { S.selDev=null; S.selWire=null; S.moveEnd=null; } renderAll(false); return; }
  if(el=q("[data-bseg]")){ S.bseg=el.dataset.bseg; renderBar(); return; }
  if(el=q("[data-cat]")){ S.cat=+el.dataset.cat; S.sub=0; S.devQ=""; renderBar(); return; }
  if(el=q("[data-sub]")){ S.sub=+el.dataset.sub; renderBar(); return; }
  if(el=q("[data-cnav]")){ const n=chkCur().L.length; S.chk.i=((S.chk.i||0)+(+el.dataset.cnav)+n)%n; renderBar(); return; }
  if(q("[data-cshow]")){ const r=chkCur().c.ref||{}; S.chkOpen=false;
    if(r.wire&&wireById(r.wire)){ S.mode="wire"; selectWire(r.wire); }
    else if(r.dev&&devById(r.dev)){ const d=devById(r.dev); S.mode="mount"; S.selWire=null; S.selDev=d.id; renderAll(true); if(T[d.type]) requestAnimationFrame(()=>scrollToKeys([d.id+":"+T[d.type].terms[0].k])); }
    return; }
  if(q("[data-capok]")){ const c=$("capIn"); if(c) c.dispatchEvent(new Event("change",{bubbles:true})); S.bseg="pos"; return; }
  if(el=q("[data-ltog]")){ const [id,i]=el.dataset.ltog.split(":"), l=devById(id).group.loads[+i]; l.on=!l.on; save(); solve(0); render(); renderBar(); return; }
  if(q("#logline")){ dialog("Журнал подій",`<div class="log">${S.log.length?S.log.map(l=>`<div class="${l.cls}">${esc(l.msg)}</div>`).join(""):"<div>Журнал порожній.</div>"}</div>`,[{label:"Закрити",cls:"primary"}]); return; } },true);
