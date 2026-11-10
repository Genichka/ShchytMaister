// ---- Контекстне меню апарата (дотик пальцем / клік / ПКМ): Замінити · Перемістити · Налаштувати · Видалити
function ctxClose(){ const m=$("ctxm"); if(m) m.remove(); }
function ctxOpen(d,cx,cy){ ctxClose(); const t=T[d.type], m=document.createElement("div");
  m.id="ctxm"; m.className="ctxm"; m.setAttribute("role","menu"); m.dataset.dev=d.id;
  m.innerHTML=`<div class="ctx-h">${esc(desig(d))} · ${esc(t.short)}${d.rating?" "+esc(d.rating)+(t.unit||""):""}${d.group?` <span>«${esc(d.group.name)}»</span>`:""}</div>`
    +`<button role="menuitem" data-cx="repl"><i>🔁</i>Замінити</button><button role="menuitem" data-cx="move"><i>✥</i>Перемістити</button>`
    +`<button role="menuitem" data-cx="set"><i>⚙️</i>Налаштувати<small>номінал, підпис, виробник</small></button><button role="menuitem" class="danger" data-cx="del"><i>🗑</i>Видалити</button>`;
  document.body.appendChild(m);
  const r=m.getBoundingClientRect(), W=innerWidth, H=innerHeight; let x=cx+6, y=cy+6;
  if(x+r.width>W-8) x=Math.max(8,cx-r.width-6); if(y+r.height>H-8) y=Math.max(8,cy-r.height-6);
  m.style.left=x+"px"; m.style.top=y+"px"; }
// де в каталозі лежить тип — щоб заміна одразу показала схожі апарати
function catOf(type){ for(let i=0;i<CATALOG.length;i++){ const s=CATALOG[i][1]; if(!Array.isArray(s)) continue;
    for(let j=0;j<s.length;j++) if(Array.isArray(s[j][1])&&s[j][1].includes(type)) return [i,j]; } return [1,0]; }
// Заміна апарата на тому ж місці: id лишається, дроти на клеми, що є й у нового, — теж
function doReplace(id,type){ const i=S.devices.findIndex(x=>x.id===id); if(i<0){ S.repl=null; renderAll(); return; }
  const d=S.devices[i], t=T[type], r=d.rail||0;
  if(type===d.type){ toast("Це той самий апарат — оберіть інший або змініть номінал у «Налаштувати»"); return; }
  let slot=d.slot; if(!freeAt(r,slot,t.w,d)){ slot=null; for(let s=d.slot-1;s>=Math.max(0,d.slot-t.w+1);s--) if(freeAt(r,s,t.w,d)){ slot=s; break; } }
  if(slot==null){ toast(`${t.short} займає ${t.w} мод. — поруч немає місця. Звільніть місце або спершу перемістіть ${desig(d)}`,"w"); return; }
  const ex={}; if(d.group&&t.group) ex.group=d.group; else if(t.group&&!t.groupOpt) ex.group=mkGroup(groupsOf().length,d.group?d.group.name:"Група "+(groupsOf().length+1),2.5,[]); else ex.noGroup=true;
  if(d.cap&&!t.group) ex.cap=d.cap; if(d.brand&&MODELS[type]&&MODELS[type][d.brand]) ex.brand=d.brand;
  const rate=t.ratings&&t.ratings.includes(d.rating)?d.rating:null, nd=mkDev(type,r,slot,rate,ex); nd.id=d.id;
  const old=desig(d), lostG=d.group&&!t.group; S.devices[i]=nd; if(S.leak) S.leak.delete(d.id);
  const keys=new Set(allTermKeys()), mine=k=>k.startsWith(d.id+":")||k.startsWith("tb:"+d.id+":"), n0=S.wires.length;
  S.wires=S.wires.filter(w=>[w.a,w.b].every(k=>!mine(k)||keys.has(k))); const cut=n0-S.wires.length;
  S.repl=null; S.devQ=""; S.selDev=null; commit();
  toast(`${old} → ${desig(nd)} ${t.short}${nd.rating?" "+nd.rating+(t.unit||""):""}`+(cut?` · знято дротів: ${cut} — «⚡ Прокласти всі дроти» підключить заново`:"")+(lostG?" · група прибрана":""),cut||lostG?"w":"ok"); }
// Перенесення дотиком: обираєте вільне місце — апарат переїжджає туди разом із дротами
function doMoveTo(r,slot){ const d=S.devices.find(x=>x.id===S.moveDev); S.moveDev=null; S.pick=null; if(!d){ renderAll(); return; }
  if(!freeAt(r,slot,T[d.type].w,d)){ toast("Тут не вміщається — оберіть інше вільне місце","w"); S.moveDev=d.id; S.pick=d.type; renderAll(false); return; }
  d.rail=r; d.slot=slot; commit(); toast(`${desig(d)} перенесено. Якщо був на гребінці — натисніть «Перевірка»`,"ok"); }
document.addEventListener("click",e=>{ const m=$("ctxm"); if(!m) return; const b=e.target.closest("[data-cx]");
  if(!b){ if(!e.target.closest("#ctxm")) ctxClose(); return; }
  e.stopPropagation(); const d=S.devices.find(x=>x.id===m.dataset.dev); ctxClose(); if(!d) return;
  const a=b.dataset.cx; S.pend=null; S.selWire=null; S.moveEnd=null; S.devFilter=null;
  if(a==="repl"){ S.repl=d.id; S.mode="mount"; S.selDev=null; S.pick=null; S.moveDev=null; S.devQ=""; [S.cat,S.sub]=catOf(d.type); S.devOpen=true; renderAll(); toast(`Оберіть унизу, чим замінити ${desig(d)}`); return; }
  if(a==="move"){ S.moveDev=d.id; S.pick=d.type; S.pickQty=1; S.repl=null; S.mode="mount"; S.selDev=null; renderAll(); toast(`Торкніться вільного місця на рейці — ${desig(d)} переїде туди`); return; }
  if(a==="set"){ S.selDev=d.id; S.repl=null; S.moveDev=null; S.pick=null; if(S.mode==="wire") S.mode="mount"; renderAll(false); return; }
  if(a==="del"){ const n=desig(d); removeDev(d); S.selDev=null; toast(`${n} видалено. «Назад» ↶ поверне`); } },true);
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&$("ctxm")) ctxClose(); });
$("scroller").addEventListener("scroll",()=>ctxClose(),{passive:true});
// ПКМ на апараті — те саме меню (на комп’ютері)
$("svg").addEventListener("contextmenu",e=>{ if(S.noDoc||S.demo||!(S.mode==="mount"||S.mode==="wire")) return; const g=e.target.closest("[data-dev]"); if(!g) return;
  const d=S.devices.find(x=>x.id===g.dataset.dev); if(!d) return; e.preventDefault(); ctxOpen(d,e.clientX,e.clientY); });
