// ---- Контекстне меню модуля (дотик пальцем / клік / ПКМ): Замінити · Перемістити · Налаштувати · Видалити
function ctxClose(){ const m=$("ctxm"); if(m) m.remove(); }
function ctxOpen(d,cx,cy){ ctxClose(); const t=T[d.type], m=document.createElement("div");
  m.id="ctxm"; m.className="ctxm"; m.setAttribute("role","menu"); m.dataset.dev=d.id;
  m.innerHTML=`<div class="ctx-h">${esc(desig(d))} · ${esc(t.short)}${d.rating?" "+esc(d.rating)+(t.unit||""):""}${d.group?` <span>«${esc(d.group.name)}»</span>`:""}</div>`
    +`<button role="menuitem" data-cx="repl"><i>🔁</i>Замінити</button><button role="menuitem" data-cx="move"><i>✥</i>Перемістити</button>`
    +`<button role="menuitem" data-cx="set"><i>⚙️</i>Налаштувати<small>номінал, підпис, виробник</small></button>`
    +(shopFor(d)?`<button role="menuitem" data-cx="shop"><i>🛒</i>Замовити цей модуль</button>`:"")+`<button role="menuitem" class="danger" data-cx="del"><i>🗑</i>Видалити</button>`;
  document.body.appendChild(m);
  const r=m.getBoundingClientRect(), W=innerWidth, H=innerHeight; let x=cx+6, y=cy+6;
  if(x+r.width>W-8) x=Math.max(8,cx-r.width-6); if(y+r.height>H-8) y=Math.max(8,cy-r.height-6);
  m.style.left=x+"px"; m.style.top=y+"px"; }
// де в каталозі лежить тип — щоб заміна одразу показала схожі модулі
function catOf(type){ for(let i=0;i<CATALOG.length;i++){ const s=CATALOG[i][1]; if(!Array.isArray(s)) continue;
    for(let j=0;j<s.length;j++) if(Array.isArray(s[j][1])&&s[j][1].includes(type)) return [i,j]; } return [1,0]; }
// Заміна модуля на тому ж місці: id лишається, перемички на клеми, що є й у нового, — теж
function doReplace(id,type){ const i=S.devices.findIndex(x=>x.id===id); if(i<0){ S.repl=null; renderAll(); return; }
  const d=S.devices[i], t=T[type], r=d.rail||0;
  if(type===d.type){ toast("Це той самий модуль — оберіть інший або змініть номінал у «Налаштувати»"); return; }
  let slot=d.slot; if(!freeAt(r,slot,t.w,d)){ slot=null; for(let s=d.slot-1;s>=Math.max(0,d.slot-t.w+1);s--) if(freeAt(r,s,t.w,d)){ slot=s; break; } }
  if(slot==null){ toast(`${t.short} займає ${t.w} мод. — поруч немає місця. Звільніть місце або спершу перемістіть ${desig(d)}`,"w"); return; }
  const ex={}; if(d.group&&t.group) ex.group=d.group; else if(t.group&&!t.groupOpt) ex.group=mkGroup(groupsOf().length,d.group?d.group.name:"Група "+(groupsOf().length+1),2.5,[]); else ex.noGroup=true;
  if(d.cap&&!t.group) ex.cap=d.cap; if(d.brand&&MODELS[type]&&MODELS[type][d.brand]) ex.brand=d.brand;
  const rate=t.ratings&&t.ratings.includes(d.rating)?d.rating:null, nd=mkDev(type,r,slot,rate,ex); nd.id=d.id;
  const old=desig(d), lostG=d.group&&!t.group; S.devices[i]=nd; if(S.leak) S.leak.delete(d.id);
  const keys=new Set(allTermKeys()), mine=k=>k.startsWith(d.id+":")||k.startsWith("tb:"+d.id+":"), n0=S.wires.length;
  S.wires=S.wires.filter(w=>[w.a,w.b].every(k=>!mine(k)||keys.has(k))); const cut=n0-S.wires.length;
  S.repl=null; S.devQ=""; S.selDev=null; commit();
  toast(`${old} → ${desig(nd)} ${t.short}${nd.rating?" "+nd.rating+(t.unit||""):""}`+(cut?` · знято перемичок: ${cut} — «⚡ Прокласти всі перемички» підключить заново`:"")+(lostG?" · група прибрана":""),cut||lostG?"w":"ok"); }
// Перенесення дотиком: обираєте вільне місце — модуль переїжджає туди разом із перемичками
function doMoveTo(r,slot){ const d=S.devices.find(x=>x.id===S.moveDev); S.moveDev=null; S.pick=null; if(!d){ renderAll(); return; }
  if(!freeAt(r,slot,T[d.type].w,d)){ toast("Тут не вміщається — оберіть інше вільне місце","w"); S.moveDev=d.id; S.pick=d.type; renderAll(false); return; }
  moveDevice(d,r,slot); }
// ---- Перенесення модуля з урахуванням гребінки: якщо автомат зійшов з неї — пропонуємо, як його живити
const combCov = () => { const c=S.comb; return c?S.devices.filter(d=>d.type==="qf1p"&&(d.rail||0)===(c.rail||0)&&d.slot>=c.from&&d.slot<=c.to):[]; };
function moveDevice(dev,r,slot){ const was=combCov().map(d=>d.id), old=[dev.rail||0,dev.slot]; dev.rail=r; dev.slot=slot; if(S.mode==="mount"&&!S.moveDev) S.selDev=null; commit();
  const now=combCov().map(d=>d.id);
  if(was.includes(dev.id)&&!now.includes(dev.id)) combBroken(dev,old);
  else if(!was.includes(dev.id)&&now.includes(dev.id)) toast(`${desig(dev)} став на гребінку — живлення тепер через неї`,"ok");
  else toast(`${desig(dev)} перенесено`,"ok"); }
function combBroken(dev,old){ const c=S.comb, cov=combCov(), same=(dev.rail||0)===(c.rail||0)&&dev.type==="qf1p";
  const lo=Math.min(c.from,dev.slot), hi=Math.max(c.to,dev.slot), gaps=same?[...Array(hi-lo+1).keys()].map(i=>lo+i).filter(s=>!devAt(c.rail||0,s)).length:0;
  const near=cov.slice().sort((a,b)=>Math.abs(a.slot-dev.slot)-Math.abs(b.slot-dev.slot))[0];
  const feed=cov.length&&S.wires.find(w=>cov.some(d=>w.a===d.id+":t1"||w.b===d.id+":t1")), sec=feed?feed.sec:(S.wireSec||2.5);
  const names=cov.length?`${desig(cov[0])}${cov.length>1?"–"+desig(cov[cov.length-1]):""}`:"—";
  const B=[];
  if(same) B.push({label:`↔ Подовжити гребінку до ${desig(dev)}`,cls:"primary",act:()=>{ c.from=lo; c.to=hi; commit(); toast(`Гребінка: ${hi-lo+1} мод.`+(gaps?` · на вільний зубець — заглушка`:""),"ok"); }});
  if(near) B.push({label:`〰 Перемичка від ${desig(near)}`,cls:same?"":"primary",act:()=>{ S.wires.push({id:uid("w"),a:near.id+":t1",b:dev.id+":t1",kind:"L",sec}); commit(); toast(`Перемичка ${desig(near)} → ${desig(dev)}, ${fmt(sec,sec%1?1:0)} мм²`,"ok"); }});
  B.push({label:"↶ Повернути на місце",act:()=>{ if(freeAt(old[0],old[1],T[dev.type].w,dev)){ dev.rail=old[0]; dev.slot=old[1]; commit(); toast(`${desig(dev)} повернуто`,"ok"); } else toast("Старе місце вже зайняте","w"); }});
  B.push({label:"Залишити так",act:()=>toast(`${desig(dev)} без живлення — «Перевірка» це покаже`,"w")});
  dialog("Гребінка розірвалась",`<p><b>${esc(desig(dev))}</b> зійшов з гребінки (вона живить ${esc(names)}). Без живлення ця група не працюватиме.</p>`
    +`<p class="hint2">${same?`Подовжити — гребінка дотягнеться до ${esc(desig(dev))}${gaps?`; вільних зубців: ${gaps} — закрийте їх заглушками`:""}. `:""}Перемичка — ${fmt(sec,sec%1?1:0)} мм² між клемами 1. Або поверніть автомат назад.</p>`,B); }
document.addEventListener("click",e=>{ const m=$("ctxm"); if(!m) return; const b=e.target.closest("[data-cx]");
  if(!b){ if(!e.target.closest("#ctxm")) ctxClose(); return; }
  e.stopPropagation(); const d=S.devices.find(x=>x.id===m.dataset.dev); ctxClose(); if(!d) return;
  const a=b.dataset.cx; S.pend=null; S.selWire=null; S.moveEnd=null; S.devFilter=null;
  if(a==="repl"){ S.repl=d.id; S.mode="mount"; S.selDev=null; S.pick=null; S.moveDev=null; S.devQ=""; [S.cat,S.sub]=catOf(d.type); S.devOpen=true; renderAll(); toast(`Оберіть унизу, чим замінити ${desig(d)}`); return; }
  if(a==="move"){ S.moveDev=d.id; S.pick=d.type; S.pickQty=1; S.repl=null; S.mode="mount"; S.selDev=null; renderAll(); toast(`Торкніться вільного місця на рейці — ${desig(d)} переїде туди`); return; }
  if(a==="set"){ S.selDev=d.id; S.repl=null; S.moveDev=null; S.pick=null; if(S.mode==="wire") S.mode="mount"; renderAll(false); return; }
  if(a==="shop"){ const it=shopFor(d); if(it) shopShow([it]); return; }
  if(a==="del"){ const n=desig(d); removeDev(d); S.selDev=null; toast(`${n} видалено. «Назад» ↶ поверне`); } },true);
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&$("ctxm")) ctxClose(); });
$("scroller").addEventListener("scroll",()=>ctxClose(),{passive:true});
// ПКМ на модулі — те саме меню (на комп’ютері)
$("svg").addEventListener("contextmenu",e=>{ if(S.noDoc||S.demo||!(S.mode==="mount"||S.mode==="wire")) return; const g=e.target.closest("[data-dev]"); if(!g) return;
  const d=S.devices.find(x=>x.id===g.dataset.dev); if(!d) return; e.preventDefault(); ctxOpen(d,e.clientX,e.clientY); });
