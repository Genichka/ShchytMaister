/* ===== Нижня панель на один екран: усе в кількох рядках, без вертикальної прокрутки й спливних вікон ===== */
const CATS = [["Захист",0],["Напруга, УЗІП",1],["Облік",2],["Комутація, АВР",3],["Керування",4],["Двигуни",5],["Розподіл",6],["Розумний дім",7],["СЕС (DC)",8],["Поза щитом",-1]];
const bx = `<button class="bx" data-bclose aria-label="Закрити">✕</button>`;
const bdel = attr => `<button class="bx bdel" ${attr} aria-label="Видалити" title="Видалити"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></button>`;
const bhead = (t,right) => `<div class="br bh"><b>${t}</b>${right||""}</div>`;
const brow = (inner,cls) => inner ? `<div class="br${cls?" "+cls:""}">${inner}</div>` : "";
const segRow = (list,cur) => `<div class="br seg">${list.map(([k,l])=>`<button class="sg" data-bseg="${k}" aria-pressed="${cur===k}">${l}</button>`).join("")}</div>`;
const chip = (attr,on,label,cls) => `<button class="chip${cls?" "+cls:""}" ${attr} aria-pressed="${!!on}">${label}</button>`;
function bseg(id,list,def){ if(S.bsegFor!==id){ S.bsegFor=id; S.bseg=def; } if(!list.some(x=>x[0]===S.bseg)) S.bseg=list[0][0]; return S.bseg; }

function renderTools(){ renderBar(); }
function renderSheet(){ renderBar(); }
function renderGroups(){ }
function renderBar(){ const el=$("barIn"); if(!el) return; let h="";
  const d=S.selDev&&S.devices.find(x=>x.id===S.selDev), f=S.selDev&&S.field.find(x=>x.id===S.selDev), w=S.mode==="wire"&&S.selWire&&wireById(S.selWire);
  if(S.noDoc) h=noDocBar();
  else if(S.chkOpen&&S.chk) h=chkBar();
  else if(S.mode==="plan") h=planBar();
  else if(w) h=wireBar(w);
  else if(d) h=devBar(d);
  else if(f) h=fieldBar(f);
  else h=(typeof guideBar==="function"?guideBar():"")+(S.mode==="mount"?mountBar():S.mode==="wire"?wireToolsBar():testBar());
  el.innerHTML=h; if(S.mode==="test") updateLive(); }

// ---- Порожня робоча зона: стартові дії й останні проєкти
function noDocBar(){ const list=projDB().list.slice().sort((a,b)=>b.updated-a.updated).slice(0,8);
  return bhead("Немає відкритого щита")+brow(`<button class="btn sm primary" data-pa="new">＋ Створити новий щит</button><button class="btn sm" data-pa="openlistdlg">Відкрити збережений…</button><button class="btn sm" data-nodoc="tpl">Приклади щитів</button><button class="btn sm" data-pa="import">Імпорт з файлу</button>`)
    +brow(list.length?`<span class="bl">Останні:</span>`+list.map(p=>`<button class="chip" data-pa="open" data-pid="${p.id}">${esc(p.name)}</button>`).join(""):`<span class="bl">Збережених проєктів ще немає</span>`); }
// ---- Апарати: категорії + картки
function pickBar(){ const t=T[S.pick], q=S.pickQty||1, rate=S.pickRating||t.def||"";
  return bhead(`Ставимо: ${esc(t.short)}${rate?" "+esc(rate)+(t.unit||""):""} <span class="bm">${t.w} мод.</span>`,`<button class="btn sm primary" data-pickx>Готово</button>`)
    +(t.ratings?brow(`<span class="bl">Номінал</span>`+t.ratings.map(r=>chip(`data-prate="${r}"`,rate===r,r+(t.unit||""),"mono")).join("")):"")
    +brow(`<span class="bl">Скільки</span>`+[1,2,3,4,5,6,8].map(n=>chip(`data-pqty="${n}"`,q===n,"×"+n,"mono")).join("")+`<button class="btn sm" data-pauto>Поставити ×${q} у вільні місця</button>`); }
function mountBar(){ if(S.pick&&T[S.pick]) return pickBar(); const F=S.devFilter, mods=S.devices.reduce((a,d)=>a+T[d.type].w,0);
  if(F) return brow(`<span class="bl">${esc(F.title)}:</span>`+F.opts.map((o,i)=>`<button class="dc" data-fpick="${i}" aria-pressed="${S.pick===o[0]&&(S.pickRating||null)===(o[1]||null)&&JSON.stringify(S.pickExtra||null)===JSON.stringify(o[3]||null)}"><b>${esc(o[2])}</b><small>${T[o[0]].w} мод.</small></button>`).join("")+`<button class="chip" data-fall>Усі апарати</button>`,"cards");
  const ci=S.cat??0, c=CATS[ci], ks=c[1]<0?null:DEV_GROUPS[c[1]][1].filter(x=>T[x]);
  let s=brow(CATS.map(([l],i)=>chip(`data-cat="${i}"`,i===ci,l)).join("")+`<span class="bl mono">${mods}/${SLOTS*S.board.rails} мод.</span>`);
  s+=ks?brow(ks.map(x=>`<button class="dc" data-pick="${x}" aria-pressed="${S.pick===x}" title="${esc(T[x].name)}"><b>${esc(T[x].short)}</b><small>${T[x].w} мод.${brandsFor(x).length>1?" · "+(brandsFor(x).length-1)+" вир.":""}</small></button>`).join(""),"cards")
    :brow(FIELD_LIB.map(L=>`<button class="dc" data-fadd="${L.type}"><b>${esc(L.name)}</b><small>+${Object.keys(L.t).length} клем на XT1</small></button>`).join(""),"cards");
  return s; }

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
      +(S.planLen&&S.planLen[d.id]!==undefined?`<span class="bl mono">${fmt(S.planLen[d.id],1)} м (план)</span>`:`<label class="bl">Довжина <input class="inp num" type="number" min="0" step="0.5" id="gl-${d.id}" data-glen="${d.id}" value="${g.len||""}" placeholder="—"> м</label>`)
      +(du===null?"":`<span class="bl mono" style="color:${du>4?"var(--red)":"var(--muted)"}">ΔU ${fmt(du,1)} %</span>`)); }
  if(cur==="fault") s+=brow(chip(`data-leak="${d.id}"`,S.leak.has(d.id),"Витік на корпус")+chip(`data-short="${d.id}"`,S.short.has(d.id),"Коротке замикання")+chip(`data-arc="${d.id}"`,S.arc.has(d.id),"Іскріння")+`<span class="bl" data-gstat="${d.id}">${gStatus(d)}</span>`);
  if(cur==="set") s+=brow(set);
  if(cur==="pos") s+=brow(`<button class="btn sm" data-move="-1" aria-label="Ліворуч">←</button><button class="btn sm" data-move="1" aria-label="Праворуч">→</button>${S.board.rails>1?`<button class="btn sm" data-mrail="-1">↑ Рейка</button><button class="btn sm" data-mrail="1">↓ Рейка</button>`:""}`
    +(d.type==="qf1p"?`<button class="btn sm" id="combBtn">${S.comb?"Зняти гребінку":"Гребінка 1P"}</button>`:"")
    +(t.prot||t.rcd?`<button class="btn sm" id="devToggle">${d.on&&!d.trip?"Вимкнути":"Увімкнути"}</button>`:"")+`<button class="btn sm danger" data-devdel>Зняти з рейки</button>`)+brow(`<span class="bl">Або перетягніть апарат пальцем на потрібне місце</span>`);
  return s; }
function devSet(d){ const t=T[d.type]; let s="";
  if(t.group&&t.groupOpt) s+=chip("data-gtoggle",!!d.group,d.group?"Група споживачів (3 фази)":"Зробити групою");
  if(d.type==="kt") s+=[1,3,5,10,20,30].map(v=>chip(`data-delay="${v}"`,d.delay===v,v+" с")).join("");
  if(d.type==="stair") s+=[10,30,60,120].map(v=>chip(`data-delay="${v}"`,d.delay===v,v+" с")).join("");
  if(d.type==="sock") s+=chip("data-plug",!!d.plug,d.plug?"Інструмент 1,2 кВт увімкнено":"Увімкнути інструмент 1,2 кВт");
  if(d.type==="xtb") s+=[["grey","Сірий · L"],["blue","Синій · N"],["pe","Жовто-зелений · PE"]].map(([c,l])=>chip(`data-xcol="${c}"`,d.col===c,l)).join("");
  if(d.type==="photo") s+=[10,20,40].map(v=>chip(`data-th="${v}"`,d.th===v,"поріг "+v+" %")).join("");
  if(d.type==="ats") s+=chip(`data-atsm="0"`,!d.manual,"Автоматичний")+chip(`data-atsm="1"`,!!d.manual,"Ручний")+chip(`data-atsv="tomzn"`,d.variant==="tomzn","TOMZN")+chip(`data-atsv="geya"`,d.variant==="geya","GEYA");
  if(d.type==="ssw") s+=chip(`data-cmd="1"`,!!d.cmd,"Увімкнути з застосунку")+chip(`data-cmd="0"`,!d.cmd,"Вимкнути");
  if(d.type==="hl") s+=[["#3fbf4a","Зелений"],["#e23b3b","Червоний"],["#ffb21f","Жовтий"]].map(([c,l])=>chip(`data-hlc="${c}"`,d.col===c,l)).join("");
  return s; }

// ---- Обладнання поза щитом
function fieldBar(f){ const L=FIELD_LIB.find(x=>x.type===f.type)||{name:FT[f.type].name};
  return bhead(`${esc(f.name||desig(f))} · ${esc(L.name)}`,bdel(`data-fdel="${f.id}"`)+bx)+brow(`<span class="bl">XT1: ${Object.values(f.map).map(k=>esc(termName(k).replace(/^Клема XT1 /,""))).join(", ")}</span>`)
    +brow((f.type==="pv"?[6,8,10,12].map(n=>chip(`data-pvn="${n}"`,f.n===n,n+" панелей")).join("")+`<span class="bl">Voc ≈ ${Math.round((f.n||10)*49.6)} В</span>`:"")+`<button class="btn sm danger" data-fdel="${f.id}">Прибрати обладнання</button>`); }

// ---- Дроти
function wireToolsBar(){ const sw=k=>`<span class="sw" style="background:${k==="PE"?"linear-gradient(90deg,var(--wPEy) 50%,var(--wPEg) 50%)":WK[k][1]}"></span>`;
  return brow(`<span class="bl">Новий дріт</span>`+Object.keys(WK).map(x=>chip(`data-kind="${x}"`,S.wireKind===x,sw(x)+WK[x][0])).join(""))
    +brow(SECS.map(x=>chip(`data-sec="${x}"`,S.wireSec===x,fmt(x,x%1?1:0),"mono")).join("")+`<span class="bl">мм²</span>`
      +(S.wires.length?`<button class="btn sm" data-wsel="${S.wires[S.wires.length-1].id}">Вибрати дріт (${S.wires.length})</button><button class="btn sm danger" id="clearWires">${clearArm>Date.now()?"Ще раз — прибрати всі":"Прибрати всі"}</button>`:"")); }
function wireBar(w){ const me=S.moveEnd&&S.moveEnd.id===w.id?S.moveEnd.end:null, ck=wColKey(w);
  const L=[["ends","Кінці"],["kind","Вид"],["col","Колір"],["sec","Переріз"],["del","Видалити"]], cur=bseg(w.id,L,"ends");
  let s=bhead(`Дріт ${wNo(w)} з ${S.wires.length} · ${esc(wireLabel(w))} <span class="bm">≈ ${wireLenCm(w)} см</span>`,`<button class="bx" data-wnav="-1" aria-label="Попередній">◀</button><button class="bx" data-wnav="1" aria-label="Наступний">▶</button>${bdel("data-wdel")}${bx}`);
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
  let s=brow(src.map(sHTML).join("")+(dm.script.length?`<button class="btn sm primary" id="demoBtn">${S.demo?"■ Стоп":"▶ Демонстрація"}</button>`:"")+`<button class="btn sm" id="allOn">Увімкнути все</button>${faults?`<button class="btn sm" id="clrFaults">Прибрати аварії</button>`:""}`);
  if(oth.length) s+=brow(oth.map(oHTML).join(""),"ctlrow");
  s+=`<div class="br" id="stl"></div><button class="br logline" id="logline" aria-label="Журнал подій"></button>`;
  return s; }

// ---- Результат перевірки: одна помилка за раз
function chkBar(){ const C=S.chk.list, ne=C.filter(c=>c.sev==="e").length, nw=C.filter(c=>c.sev==="w").length, bad=C.filter(c=>c.sev!=="ok"), L=bad.length?bad:C, i=Math.min(S.chk.i,L.length-1), c=L[i];
  let s=bhead(ne||nw?`Перевірка: ${ne?`<span style="color:var(--red)">● ${ne} помил.</span> `:""}${nw?`<span style="color:var(--orange)">● ${nw} попер.</span>`:""}`:`<span style="color:var(--green)">✓ Схема правильна</span>`,bx);
  if(!c) return s;
  s+=brow(`<button class="bx" data-cnav="-1" aria-label="Попередня">◀</button><span class="bl mono">${i+1}/${L.length}</span><button class="bx" data-cnav="1" aria-label="Наступна">▶</button><span class="sev ${c.sev}">${c.sev==="e"?"Помилка":c.sev==="w"?"Увага":"OK"}</span><b class="ct">${esc(c.t)}</b>`);
  s+=`<div class="br cd">${esc(c.d||"")}</div>`; return s; }

// ---- План
function planBar(){ const P=planObj(), G=groupsOf(), t=S.ptool||"sel", r=P.rooms.find(x=>x.id===S.psel), it=P.items.find(x=>x.id===S.psel); planLengths();
  if(r) return bhead(`Кімната · ${esc(r.name)} <span class="bm">${fmt(r.w*r.h,1)} м²</span>`,`<button class="bx" data-psx aria-label="Закрити">✕</button>`)
    +brow(`<input class="inp grow" data-prname value="${esc(r.name)}" maxlength="30" aria-label="Назва кімнати"><input class="inp num" type="number" step="0.1" min="0.5" data-prw value="${r.w}" aria-label="Ширина, м"><span class="bl">×</span><input class="inp num" type="number" step="0.1" min="0.5" data-prh value="${r.h}" aria-label="Довжина, м"><span class="bl">м</span>`)
    +brow(`<span class="bl">Перетягніть синій кружок, щоб посунути, квадрат — щоб змінити розмір</span><button class="btn sm danger" data-pdel="${r.id}">Видалити</button>`);
  if(it) return bhead(`${PIT[it.type][0]}${it.label?" · "+esc(it.label):""}`,`<button class="bx" data-psx aria-label="Закрити">✕</button>`)
    +brow(`<span class="bl">Група</span>`+(G.map(g=>chip(`data-pig="${g.id}"`,it.g===g.id,`<span class="sw" style="background:${g.group.color}"></span>${esc(desig(g))} ${esc(g.group.name)}`)).join("")||`<span class="bl">немає груп</span>`))
    +brow(`<span class="bl">Висота</span>`+[0.3,0.9,1.1,1.8].map(v=>chip(`data-pih="${v}"`,itemH(it)===v,fmt(v,1)+" м")).join("")+chip(`data-pih="ceil"`,itemH(it)===P.ceil,"стеля")
      +(it.type==="ap"?`<input class="inp" data-pilab value="${esc(it.label||"")}" maxlength="20" placeholder="Прилад" aria-label="Прилад">`:"")+`<button class="btn sm danger" data-pdel="${it.id}">Видалити</button>`);
  let s=brow(PTOOLS.map(([k,l])=>chip(`data-ptool="${k}"`,t===k,l)).join(""));
  s+=PIT[t]?brow(`<span class="bl">Група</span>`+(G.map(g=>chip(`data-pgrp="${g.id}"`,S.pgrp===g.id,`<span class="sw" style="background:${g.group.color}"></span>${esc(desig(g))} ${esc(g.group.name)}`)).join("")||`<span class="bl">Спершу поставте групові автомати</span>`))
    :brow(`<span class="bl">Стеля</span>`+[2.5,2.7,3].map(v=>chip(`data-pceil="${v}"`,P.ceil===v,fmt(v,1))).join("")+`<span class="bl">Траса</span>`+chip(`data-proute="ceil"`,P.route==="ceil","по стелі")+chip(`data-proute="floor"`,P.route==="floor","по підлозі")
      +`<span class="bl">Запас</span>`+[0,10,15].map(v=>chip(`data-pres="${v}"`,P.res===v,v+" %")).join("")+`<button class="btn sm" data-pdemo>Приклад</button>`+(P.rooms.length||P.items.length?`<button class="btn sm danger" data-pclear>Очистити</button>`:""));
  const det=S.planDet||{}, pills=G.filter(g=>det[g.id]).map(g=>{ const u=groupDU(g); return `<span class="pill2"><i style="background:${g.group.color}"></i>${esc(desig(g))} <b class="mono">${fmt(det[g.id].tot,1)} м</b>${u===null?"":` <span class="mono" style="color:${u>4?"var(--red)":"var(--muted)"}">${fmt(u,1)} %</span>`}</span>`; }).join("");
  s+=brow(pills?pills+`<button class="btn sm" data-pdocs>Журнал</button>`:`<span class="bl">Намалюйте кімнати, поставте щит і точки та прив’яжіть до груп — довжини порахуються самі</span>`);
  return s; }

// ---- Події панелі
document.addEventListener("click",e=>{ const q=s=>e.target.closest(s); let el;
  if(q("[data-bclose]")){ if(S.chkOpen){ S.chkOpen=false; } else { S.selDev=null; S.selWire=null; S.moveEnd=null; } renderAll(false); return; }
  if(el=q("[data-bseg]")){ S.bseg=el.dataset.bseg; renderBar(); return; }
  if(el=q("[data-cat]")){ S.cat=+el.dataset.cat; renderBar(); return; }
  if(el=q("[data-cnav]")){ const L=S.chk.list.filter(c=>c.sev!=="ok"), n=(L.length||S.chk.list.length); S.chk.i=((S.chk.i||0)+(+el.dataset.cnav)+n)%n; renderBar(); return; }
  if(q("[data-capok]")){ const c=$("capIn"); if(c) c.dispatchEvent(new Event("change",{bubbles:true})); S.bseg="pos"; return; }
  if(el=q("[data-ltog]")){ const [id,i]=el.dataset.ltog.split(":"), l=devById(id).group.loads[+i]; l.on=!l.on; save(); solve(0); render(); renderSummary(); renderBar(); return; }
  if(q("#logline")){ dialog("Журнал подій",`<div class="log">${S.log.length?S.log.map(l=>`<div class="${l.cls}">${esc(l.msg)}</div>`).join(""):"<div>Журнал порожній.</div>"}</div>`,[{label:"Закрити",cls:"primary"}]); return; } },true);
