/* ===== План приміщень: кімнати, щит, розетки, вимикачі, світло, виводи; траси й довжини кабелів по групах ===== */
const PX = 60;   // 1 м = 60 одиниць SVG
const PIT = { s:["Розетка",0.3], s2:["Розетка подвійна",0.3], sw:["Вимикач",0.9], lt:["Світильник",null], ap:["Вивід під прилад",0.6] };
const PTOOLS = [["sel","Вибір"],["room","Кімната"],["board","Щит"],["s","Розетка"],["s2","Розетка ×2"],["sw","Вимикач"],["lt","Світло"],["ap","Вивід"],["del","Видалити"]];
const RCOL = ["#f6e3c8","#e6def3","#dcefe0","#dce8f5","#f5dde3","#efeccf","#d9f0f0"];
function planObj(){ if(!S.plan) S.plan={rooms:[],items:[],board:{x:1,y:0.4},ceil:2.7,route:"ceil",res:10}; return S.plan; }
const snapM = v => Math.round(v*10)/10;
const gById = id => S.devices.find(d=>d.id===id&&d.group);
const roomAt = (x,y) => planObj().rooms.find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);
function itemH(it){ const P=planObj(); return it.h!==undefined?it.h:(PIT[it.type][1]??P.ceil); }

// ---- Розрахунок довжин: ланцюжок від щита до найближчої точки, далі до наступної (траса по осях), плюс спуски й запас
function planLengths(){ const P=planObj(), out={}, rooms={}, det={}, cnt={s:0,s2:0,sw:0,lt:0,ap:0}, boxes=new Set();
  const bTop=1.8, bBot=1.2;
  for(const g of groupsOf()){ const its=P.items.filter(i=>i.g===g.id); if(!its.length) continue;
    let cur={x:P.board.x+0.3,y:P.board.y+0.15}, left=its.slice(), order=[], hz=0;
    while(left.length){ left.sort((a,b)=>(Math.abs(a.x-cur.x)+Math.abs(a.y-cur.y))-(Math.abs(b.x-cur.x)+Math.abs(b.y-cur.y))); const n=left.shift(); hz+=Math.abs(n.x-cur.x)+Math.abs(n.y-cur.y); order.push(n); cur=n; }
    let vt=P.route==="ceil"?P.ceil-bTop:bBot; order.forEach((it,i)=>{ const h=itemH(it), d=P.route==="ceil"?Math.max(0,P.ceil-h):h; vt+=i<order.length-1?2*d:d; });
    const ends=0.5+order.length*0.3, tot=(hz+vt+ends)*(1+(P.res||0)/100);
    out[g.id]=Math.round(tot*10)/10; det[g.id]={order,hz,vt,ends,tot};
    rooms[g.id]=[...new Set(order.map(i=>(roomAt(i.x,i.y)||{}).name).filter(Boolean))].join(", ");
    for(const it of order){ cnt[it.type]++; const r=roomAt(it.x,it.y); boxes.add(g.id+"|"+(r?r.id:"-")); } }
  S.planLen=out; S.planRooms=rooms; S.planDet=det;
  const sp=[]; if(cnt.s) sp.push(["Розетка з заземленням","16 А, 250 В",String(cnt.s),"шт."]); if(cnt.s2) sp.push(["Розетка подвійна з заземленням","16 А, 250 В",String(cnt.s2),"шт."]);
  if(cnt.sw) sp.push(["Вимикач одноклавішний","10 А",String(cnt.sw),"шт."]); if(cnt.lt) sp.push(["Світильник (точка підключення)","",String(cnt.lt),"шт."]);
  if(cnt.ap) sp.push(["Вивід кабелю під прилад","",String(cnt.ap),"шт."]);
  const pod=cnt.s+cnt.s2+cnt.sw; if(pod) sp.push(["Підрозетник","Ø68 мм",String(pod+cnt.s2),"шт."]); if(boxes.size) sp.push(["Коробка розподільча","",String(boxes.size),"шт."]);
  const all=Object.values(out).reduce((a,b)=>a+b,0); if(all) sp.push(["Труба гофрована ПВХ","Ø20 мм",fmt(Math.ceil(all),0),"м"]);
  S.planSpec=sp; return out; }

// ---- Малювання плану
function renderPlan(){ const P=planObj(), svg=$("svg"); planLengths();
  const xs=[0,10,P.board.x+1,...P.rooms.map(r=>r.x+r.w),...P.items.map(i=>i.x)], ys=[0,8,P.board.y+1,...P.rooms.map(r=>r.y+r.h),...P.items.map(i=>i.y)];
  const W=Math.ceil(Math.max(...xs))+1, H=Math.ceil(Math.max(...ys))+1; svg.setAttribute("viewBox",`${-0.6*PX} ${-0.6*PX} ${(W+1.2)*PX} ${(H+1.2)*PX}`);
  let s=`<rect x="${-0.6*PX}" y="${-0.6*PX}" width="${(W+1.2)*PX}" height="${(H+1.2)*PX}" fill="var(--panel)" data-pbg="1"/>`;
  for(let x=0;x<=W;x+=0.5) s+=`<line x1="${x*PX}" y1="0" x2="${x*PX}" y2="${H*PX}" stroke="var(--line)" stroke-width="${x%1?0.5:1}" pointer-events="none"/>`;
  for(let y=0;y<=H;y+=0.5) s+=`<line x1="0" y1="${y*PX}" x2="${W*PX}" y2="${y*PX}" stroke="var(--line)" stroke-width="${y%1?0.5:1}" pointer-events="none"/>`;
  for(let x=0;x<=W;x++) s+=`<text x="${x*PX}" y="-10" font-size="10" text-anchor="middle" fill="var(--muted)" pointer-events="none">${x}</text>`;
  for(let y=1;y<=H;y++) s+=`<text x="-12" y="${y*PX+3}" font-size="10" text-anchor="end" fill="var(--muted)" pointer-events="none">${y}</text>`;
  P.rooms.forEach((r,i)=>{ const sel=S.psel===r.id;
    s+=`<g data-proom="${r.id}"><rect x="${r.x*PX}" y="${r.y*PX}" width="${r.w*PX}" height="${r.h*PX}" fill="${RCOL[i%RCOL.length]}" fill-opacity=".75" stroke="${sel?"var(--blue)":"#5b616b"}" stroke-width="${sel?4:3}"/>`
      +`<text x="${(r.x+r.w/2)*PX}" y="${(r.y+r.h/2)*PX-4}" font-size="13" font-weight="700" text-anchor="middle" fill="#2b2f36">${esc(r.name)}</text>`
      +`<text x="${(r.x+r.w/2)*PX}" y="${(r.y+r.h/2)*PX+12}" font-size="10.5" text-anchor="middle" fill="#4a4f57">${fmt(r.w,1)} × ${fmt(r.h,1)} м · ${fmt(r.w*r.h,1)} м²</text></g>`;
    if(sel) s+=`<circle data-pdrag="room:${r.id}:move" cx="${(r.x+r.w/2)*PX}" cy="${(r.y+r.h/2)*PX+30}" r="13" fill="var(--blue)" stroke="#fff" stroke-width="2" style="touch-action:none"/><text x="${(r.x+r.w/2)*PX}" y="${(r.y+r.h/2)*PX+34}" font-size="12" text-anchor="middle" fill="#fff" pointer-events="none">✥</text>`
      +`<rect data-pdrag="room:${r.id}:size" x="${(r.x+r.w)*PX-12}" y="${(r.y+r.h)*PX-12}" width="24" height="24" rx="4" fill="var(--blue)" stroke="#fff" stroke-width="2" style="touch-action:none"/>`; });
  if(S.proomA) s+=`<circle cx="${S.proomA.x*PX}" cy="${S.proomA.y*PX}" r="7" fill="var(--blue)"/>`;
  // траси
  const det=S.planDet||{}; let k=0;
  for(const g of groupsOf()){ const dd=det[g.id]; if(!dd) continue; const off=(k++%5)*3-6, c=g.group.color; let cur={x:P.board.x+0.3,y:P.board.y+0.15}, d=`M${cur.x*PX+off} ${cur.y*PX+off}`;
    for(const it of dd.order){ d+=` H${it.x*PX+off} V${it.y*PX+off}`; cur=it; }
    s+=`<path d="${d}" fill="none" stroke="${c}" stroke-width="2.6" stroke-dasharray="7 4" stroke-linejoin="round" pointer-events="none"/>`;
    const f=dd.order[0]; s+=`<text x="${(f.x+P.board.x)/2*PX}" y="${P.board.y*PX+off-6}" font-size="10" font-weight="700" fill="${c}" text-anchor="middle" pointer-events="none" style="paint-order:stroke;stroke:var(--panel);stroke-width:3px">${esc(desig(g))} · ${fmt(S.planLen[g.id],1)} м</text>`; }
  // щит
  const b=P.board; s+=`<g data-pdrag="board" style="touch-action:none"><rect x="${b.x*PX}" y="${b.y*PX}" width="${0.6*PX}" height="${0.3*PX}" rx="3" fill="#fade2a" stroke="${S.psel==="board"?"var(--blue)":"#8a6d00"}" stroke-width="${S.psel==="board"?3:1.5}"/><text x="${(b.x+0.3)*PX}" y="${(b.y+0.15)*PX+4}" font-size="11" font-weight="700" text-anchor="middle" fill="#222">ЩР</text></g>`;
  // точки
  for(const it of P.items){ const g=gById(it.g), c=g?g.group.color:"#8f93a2", x=it.x*PX, y=it.y*PX, sel=S.psel===it.id; let ic="";
    if(it.type==="s"||it.type==="s2"){ const n=it.type==="s2"?2:1; for(let j=0;j<n;j++){ const cx=x+(n===2?(j?7:-7):0); ic+=`<circle cx="${cx}" cy="${y}" r="8" fill="#fff" stroke="${c}" stroke-width="2.5"/><path d="M${cx-8} ${y} a8 8 0 0 1 16 0z" fill="${c}"/>`; } }
    if(it.type==="sw") ic=`<circle cx="${x}" cy="${y}" r="7" fill="#fff" stroke="${c}" stroke-width="2.5"/><line x1="${x+3}" y1="${y-3}" x2="${x+13}" y2="${y-13}" stroke="${c}" stroke-width="2.5"/>`;
    if(it.type==="lt") ic=`<circle cx="${x}" cy="${y}" r="11" fill="#fffbe0" stroke="${c}" stroke-width="2.5"/><path d="M${x-8} ${y-8}L${x+8} ${y+8}M${x+8} ${y-8}L${x-8} ${y+8}" stroke="${c}" stroke-width="2"/>`;
    if(it.type==="ap") ic=`<rect x="${x-12}" y="${y-9}" width="24" height="18" rx="3" fill="#fff" stroke="${c}" stroke-width="2.5"/><text x="${x}" y="${y+4}" font-size="9" font-weight="700" text-anchor="middle" fill="#222">${esc((it.label||"П").slice(0,3))}</text>`;
    s+=`<g data-pitem="${it.id}" data-pdrag="item:${it.id}" style="touch-action:none">${sel?`<circle cx="${x}" cy="${y}" r="17" fill="none" stroke="var(--blue)" stroke-width="2.5"/>`:""}<circle cx="${x}" cy="${y}" r="16" fill="transparent"/>${ic}`
      +`<text x="${x+12}" y="${y+19}" font-size="8.5" fill="var(--muted)" pointer-events="none">${g?esc(desig(g)):"без групи"}${it.h!==undefined||PIT[it.type][1]!==null?" · h "+fmt(itemH(it),1):""}</text></g>`; }
  svg.innerHTML=s; }

// ---- Інструменти плану (у панелі внизу)
function planToolsHTML(){ const P=planObj(), G=groupsOf(), t=S.ptool||"sel", det=S.planDet||{};
  let s=`<div class="row"><span class="lbl">Інструмент</span>${PTOOLS.map(([k,l])=>`<button class="chip" data-ptool="${k}" aria-pressed="${t===k}">${l}</button>`).join("")}</div>`;
  if(["s","s2","sw","lt","ap"].includes(t)) s+=`<div class="row"><span class="lbl">Група</span>${G.length?G.map(g=>`<button class="chip" data-pgrp="${g.id}" aria-pressed="${S.pgrp===g.id}"><span class="sw" style="background:${g.group.color}"></span>${esc(desig(g))} ${esc(g.group.name)}</button>`).join(""):`<span class="hint">Спершу поставте групові автомати на щит</span>`}</div>`;
  s+=`<div class="row"><span class="lbl">Стеля</span>${[2.5,2.7,3,3.2].map(v=>`<button class="chip mono" data-pceil="${v}" aria-pressed="${P.ceil===v}">${fmt(v,1)} м</button>`).join("")}</div>`;
  s+=`<div class="row"><span class="lbl">Траса</span><button class="chip" data-proute="ceil" aria-pressed="${P.route==="ceil"}">По стелі</button><button class="chip" data-proute="floor" aria-pressed="${P.route==="floor"}">По підлозі</button><span class="lbl">Запас</span>${[0,10,15].map(v=>`<button class="chip mono" data-pres="${v}" aria-pressed="${P.res===v}">${v} %</button>`).join("")}</div>`;
  const rows=G.filter(g=>det[g.id]).map(g=>{ const dd=det[g.id], u=groupDU(g); return `<tr><td><span class="sw" style="background:${g.group.color}"></span> ${esc(desig(g))} ${esc(g.group.name)}</td><td class="n">${dd.order.length}</td><td class="n">${fmt(dd.hz,1)}</td><td class="n">${fmt(dd.vt,1)}</td><td class="n"><b>${fmt(dd.tot,1)}</b></td><td class="n"${u>4?' style="color:var(--red)"':""}>${u===null?"—":fmt(u,1)}</td></tr>`; }).join("");
  s+=rows?`<div class="ptab"><table><thead><tr><th>Група</th><th>Точок</th><th>Гориз., м</th><th>Верт., м</th><th>Разом, м</th><th>ΔU, %</th></tr></thead><tbody>${rows}</tbody></table></div>`
    +`<p class="hint">Траса: від щита до найближчої точки, далі до наступної, по осях; спуски від стелі (або підйоми від підлоги) до кожної точки й назад; +0,3 м на кожне підключення і 0,5 м у щиті; запас ${P.res} %.</p>`
    :`<p class="hint">Намалюйте кімнати, поставте щит і точки (розетки, вимикачі, світло) та прив’яжіть їх до груп — довжини кабелів порахуються самі.</p>`;
  s+=`<div class="row"><button class="btn" data-pdemo>${P.rooms.length?"Замінити прикладом квартири":"Приклад: квартира 2 кімнати"}</button><button class="btn" data-pdocs>Документи</button>${P.rooms.length||P.items.length?`<button class="btn danger" data-pclear>Очистити план</button>`:""}</div>`;
  return s; }
function planHint(){ const t=S.ptool||"sel";
  return t==="room"?(S.proomA?"Торкніться протилежного кута кімнати.":"Кімната: торкніться одного кута, потім протилежного."):t==="board"?"Торкніться місця, де висить щит."
    :t==="del"?"Торкніться точки або кімнати, щоб видалити.":t==="sel"?"Торкніться кімнати чи точки, щоб змінити. Перетягуйте точки й щит; кімнату — за синій кружок, розмір — за квадрат."
    :`${PIT[t][0]}: торкніться плану, щоб поставити. ${S.pgrp&&gById(S.pgrp)?"Група "+desig(gById(S.pgrp)):"Оберіть групу внизу."}`; }
function renderPlanSheet(){ const P=planObj(), sh=$("sheet"), r=P.rooms.find(x=>x.id===S.psel), it=P.items.find(x=>x.id===S.psel); if(!r&&!it){ sh.hidden=true; return; } sh.hidden=false; let s="";
  if(r) s=`<div class="sheet-h"><b>Кімната · ${esc(r.name)}</b><button class="btn" data-psx>Готово</button></div><div class="row nowrap"><span class="lbl">Назва</span><input class="inp" data-prname value="${esc(r.name)}" maxlength="30"></div>`
    +`<div class="row"><span class="lbl">Розмір, м</span><input class="inp num" type="number" step="0.1" min="0.5" data-prw value="${r.w}"> × <input class="inp num" type="number" step="0.1" min="0.5" data-prh value="${r.h}"><span class="hint">${fmt(r.w*r.h,1)} м²</span></div>`
    +`<div class="row"><button class="btn danger" data-pdel="${r.id}">Видалити кімнату</button></div>`;
  if(it){ const G=groupsOf(); s=`<div class="sheet-h"><b>${PIT[it.type][0]}${it.label?" · "+esc(it.label):""}</b><button class="btn" data-psx>Готово</button></div>`
    +`<div class="row"><span class="lbl">Група</span>${G.map(g=>`<button class="chip" data-pig="${g.id}" aria-pressed="${it.g===g.id}"><span class="sw" style="background:${g.group.color}"></span>${esc(desig(g))} ${esc(g.group.name)}</button>`).join("")||`<span class="hint">Немає груп</span>`}</div>`
    +`<div class="row"><span class="lbl">Висота, м</span>${[0.3,0.9,1.1,1.8].map(v=>`<button class="chip mono" data-pih="${v}" aria-pressed="${itemH(it)===v}">${fmt(v,1)}</button>`).join("")}<button class="chip" data-pih="ceil" aria-pressed="${it.h===undefined&&PIT[it.type][1]===null}">стеля</button></div>`
    +(it.type==="ap"?`<div class="row nowrap"><span class="lbl">Прилад</span><input class="inp" data-pilab value="${esc(it.label||"")}" maxlength="20" placeholder="Бойлер, плита…"></div>`:"")
    +`<div class="row"><button class="btn danger" data-pdel="${it.id}">Видалити точку</button></div>`; }
  $("sheetIn").innerHTML=s; }

// ---- Приклад: квартира з двох кімнат; точки прив’язуються до груп за назвою
function planDemo(){ const P=planObj(); P.rooms=[{id:uid("r"),name:"Передпокій",x:0,y:0,w:2.6,h:3.2},{id:uid("r"),name:"Кухня",x:2.6,y:0,w:3.4,h:3.2},{id:uid("r"),name:"Зал",x:0,y:3.2,w:4.4,h:4.2},
    {id:uid("r"),name:"Спальня",x:4.4,y:3.2,w:3.6,h:4.2},{id:uid("r"),name:"Ванна",x:6,y:0,w:2,h:3.2}];
  P.board={x:0.3,y:0.1}; P.items=[]; const G=groupsOf(), find=re=>G.find(g=>re.test(g.group.name)), light=find(/світл|освітл/i), kit=find(/кух/i), bath=find(/ванн|сануз/i), stove=find(/плит|духов/i), sock=find(/зал|кімнат|спальн|вітальн/i)||G.find(g=>/розет/i.test(g.group.name)&&g!==kit)||G[0];
  const I=(type,x,y,g,ex)=>P.items.push(Object.assign({id:uid("pi"),type,x,y,g:g?g.id:null},ex||{}));
  if(light){ I("lt",1.3,1.6,light); I("lt",4.3,1.6,light); I("lt",2.2,5.3,light); I("lt",6.2,5.3,light); I("lt",7,1.6,light); I("sw",2.4,0.6,light); I("sw",2.8,2.9,light); I("sw",0.8,3.4,light); I("sw",4.6,3.4,light); I("sw",5.8,0.6,light); }
  if(kit){ I("s2",3.4,0.2,kit,{h:1.1}); I("s2",4.6,0.2,kit,{h:1.1}); I("s",5.8,1.5,kit); }
  if(stove) I("ap",5.8,2.6,stove,{label:"Плита",h:0.6});
  if(bath){ I("s",7.8,2.6,bath,{h:1.1}); I("ap",7.4,0.2,bath,{label:"Бойлер",h:1.8}); }
  if(sock){ I("s2",0.2,5,sock); I("s",2,7.2,sock); I("s2",4.2,6.2,sock); I("s2",7.8,4.8,sock); I("s",5.4,7.2,sock); }
  S.psel=null; }

// ---- Події плану
const svgPt = e => { const svg=$("svg"), m=svg.getScreenCTM(); if(!m) return {x:0,y:0}; const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse()); return {x:p.x/PX, y:p.y/PX}; };
let PDRAG=null;
$("svg").addEventListener("pointerdown",e=>{ if(S.mode!=="plan"||(S.ptool||"sel")!=="sel") return; const el=e.target.closest("[data-pdrag]"); if(!el) return;
  const P=planObj(), [kind,id,how]=el.dataset.pdrag.split(":"), p=svgPt(e); let obj=kind==="board"?P.board:kind==="item"?P.items.find(x=>x.id===id):P.rooms.find(x=>x.id===id); if(!obj) return;
  PDRAG={kind,id,how,obj,p0:p,o0:{x:obj.x,y:obj.y,w:obj.w,h:obj.h},moved:false}; try{ el.setPointerCapture(e.pointerId); }catch(_){} e.preventDefault(); });
$("svg").addEventListener("pointermove",e=>{ if(!PDRAG) return; const p=svgPt(e), dx=p.x-PDRAG.p0.x, dy=p.y-PDRAG.p0.y; if(Math.abs(dx)+Math.abs(dy)<0.05&&!PDRAG.moved) return; PDRAG.moved=true; const o=PDRAG.obj, o0=PDRAG.o0;
  if(PDRAG.how==="size"){ o.w=Math.max(0.5,snapM(o0.w+dx)); o.h=Math.max(0.5,snapM(o0.h+dy)); } else { o.x=Math.max(0,snapM(o0.x+dx)); o.y=Math.max(0,snapM(o0.y+dy)); } renderPlan(); e.preventDefault(); });
$("svg").addEventListener("pointerup",e=>{ if(!PDRAG) return; const d=PDRAG; PDRAG=null; if(d.moved){ S.pnoClick=Date.now()+300; commit(false); renderTools(); } });
$("svg").addEventListener("click",e=>{ if(S.mode!=="plan") return; if(S.pnoClick&&Date.now()<S.pnoClick) return; const P=planObj(), t=S.ptool||"sel", p=svgPt(e), x=Math.max(0,snapM(p.x)), y=Math.max(0,snapM(p.y));
  const itEl=e.target.closest("[data-pitem]"), rmEl=e.target.closest("[data-proom]"), bd=e.target.closest("[data-pdrag='board']");
  if(t==="sel"){ S.psel=itEl?itEl.dataset.pitem:bd?"board":rmEl?rmEl.dataset.proom:null; renderAll(false); return; }
  if(t==="del"){ if(itEl) P.items=P.items.filter(i=>i.id!==itEl.dataset.pitem); else if(rmEl) P.rooms=P.rooms.filter(r=>r.id!==rmEl.dataset.proom); else return; S.psel=null; commit(); return; }
  if(t==="room"){ if(!S.proomA){ S.proomA={x,y}; renderAll(false); return; } const a=S.proomA; S.proomA=null; const r={id:uid("r"),name:"Кімната "+(P.rooms.length+1),x:Math.min(a.x,x),y:Math.min(a.y,y),w:Math.abs(x-a.x),h:Math.abs(y-a.y)};
    if(r.w<0.5||r.h<0.5){ toast("Кімната замала — мінімум 0,5 м","w"); renderAll(false); return; } P.rooms.push(r); S.psel=r.id; S.ptool="sel"; commit(); toast("Кімнату додано — дайте їй назву внизу","ok"); return; }
  if(t==="board"){ P.board={x,y}; commit(); return; }
  if(PIT[t]){ const g=S.pgrp&&gById(S.pgrp)?S.pgrp:null; P.items.push({id:uid("pi"),type:t,x,y,g}); if(!g) toast("Точку додано без групи — оберіть групу внизу","w"); commit(); } });
document.addEventListener("click",e=>{ if(S.mode!=="plan") return; const q=s=>e.target.closest(s); let el; const P=planObj(), cur=P.items.find(i=>i.id===S.psel);
  if(el=q("[data-ptool]")){ S.ptool=el.dataset.ptool; S.proomA=null; if(PIT[S.ptool]&&!S.pgrp){ const G=groupsOf(); const pref=S.ptool==="lt"||S.ptool==="sw"?/світл|освітл/i:/розет|кух|зал/i; S.pgrp=(G.find(g=>pref.test(g.group.name))||G[0]||{}).id||null; } renderAll(true); return; }
  if(el=q("[data-pgrp]")){ S.pgrp=el.dataset.pgrp; renderAll(true); return; }
  if(el=q("[data-pceil]")){ P.ceil=+el.dataset.pceil; commit(); return; }
  if(el=q("[data-proute]")){ P.route=el.dataset.proute; commit(); return; }
  if(el=q("[data-pres]")){ P.res=+el.dataset.pres; commit(); return; }
  if(q("[data-pdemo]")){ planDemo(); commit(); toast("Приклад плану додано, точки прив’язано до груп за назвами","ok"); return; }
  if(q("[data-pdocs]")){ openDocs("cab"); return; }
  if(q("[data-pclear]")){ dialog("Очистити план?","<p>Кімнати й точки буде видалено. «Назад» поверне їх.</p>",[{label:"Скасувати"},{label:"Очистити",cls:"primary",act:()=>{ P.rooms=[]; P.items=[]; S.psel=null; commit(); }}]); return; }
  if(q("[data-psx]")){ S.psel=null; renderAll(false); return; }
  if(el=q("[data-pdel]")){ const id=el.dataset.pdel; P.items=P.items.filter(i=>i.id!==id); P.rooms=P.rooms.filter(r=>r.id!==id); S.psel=null; commit(); return; }
  if(cur&&(el=q("[data-pig]"))){ cur.g=el.dataset.pig; commit(false); renderSheet(); return; }
  if(cur&&(el=q("[data-pih]"))){ if(el.dataset.pih==="ceil") cur.h=P.ceil; else cur.h=+el.dataset.pih; commit(false); renderSheet(); return; } });
document.addEventListener("change",e=>{ if(S.mode!=="plan") return; const t=e.target, P=planObj(), r=P.rooms.find(x=>x.id===S.psel), it=P.items.find(x=>x.id===S.psel);
  if(r&&t.dataset.prname!==undefined){ r.name=t.value.trim()||r.name; commit(false); return; }
  if(r&&t.dataset.prw!==undefined){ r.w=Math.max(0.5,snapM(+t.value||r.w)); commit(false); renderSheet(); return; }
  if(r&&t.dataset.prh!==undefined){ r.h=Math.max(0.5,snapM(+t.value||r.h)); commit(false); renderSheet(); return; }
  if(it&&t.dataset.pilab!==undefined){ it.label=t.value.trim(); commit(false); return; } });
