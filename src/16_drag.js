/* ===== Перетягування апаратів по рейках (палець і миша) =====
   Палець: затиснути апарат ~0,3 с і тягти; вибраний апарат тягнеться одразу.
   Миша: просто тягти. Пунктирна рамка показує, куди він стане (червона — місце зайняте). */
(function(){
  const sc=$("scroller"), svg=$("svg"), HOLD=300, NS="http://www.w3.org/2000/svg"; let D=null, noClickUntil=0;
  const pt=e=>{ const m=svg.getScreenCTM(); if(!m) return {x:0,y:0}; const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse()); return {x:p.x,y:p.y}; };
  function target(d,dx,dy){ const w=T[d.type].w, cy=devTop(d.rail||0)+120+dy; let r=0, best=1e9;
    for(let i=0;i<S.board.rails;i++){ const dd=Math.abs(devTop(i)+120-cy); if(dd<best){ best=dd; r=i; } }
    const slot=Math.max(0,Math.min(SLOTS-w,Math.round(d.slot+dx/G.MW))); return {r,slot,w,ok:freeAt(r,slot,w,d)}; }
  function lift(){ if(D.lifted) return; D.lifted=true; D.g.classList.add("dragging"); svg.appendChild(D.g);
    if(D.touch&&navigator.vibrate) try{ navigator.vibrate(12); }catch(_){} }
  function ghost(t){ let gh=D.ghost; if(!gh){ gh=D.ghost=document.createElementNS(NS,"rect"); gh.setAttribute("rx","5"); svg.insertBefore(gh,D.g); }
    gh.setAttribute("x",G.X0+t.slot*G.MW+1); gh.setAttribute("y",devTop(t.r)); gh.setAttribute("width",t.w*G.MW-2); gh.setAttribute("height",240);
    gh.setAttribute("class","dropg"+(t.ok?"":" bad")); }
  function stop(cancel){ if(!D) return; const d=D; D=null; clearTimeout(d.tm); if(d.ghost) d.ghost.remove();
    if(!d.armed) return;
    if(d.moved){ noClickUntil=Date.now()+350; const t=d.t, dev=d.dev;
      if(!cancel&&t&&t.ok&&(t.r!==(dev.rail||0)||t.slot!==dev.slot)){ dev.rail=t.r; dev.slot=t.slot; S.selDev=dev.id; commit(); return; }
      if(!cancel&&t&&!t.ok) toast("Там зайнято","w"); renderAll(false); return; }
    if(d.lifted){ noClickUntil=Date.now()+350; if(!cancel) S.selDev=d.dev.id; renderAll(false); } }   // затиснули й відпустили — просто вибір

  svg.addEventListener("pointerdown",e=>{ if(D||S.noDoc||S.mode!=="mount"||S.pick||e.button>0) return;
    const g=e.target.closest("[data-dev]"), dev=g&&S.devices.find(x=>x.id===g.dataset.dev); if(!dev) return;
    const touch=e.pointerType!=="mouse";
    D={dev,g,pid:e.pointerId,touch,p0:pt(e),cx:e.clientX,cy:e.clientY,armed:false,lifted:false,moved:false,t:null};
    if(touch){ if(S.selDev===dev.id) D.armed=true; else D.tm=setTimeout(()=>{ if(D&&!D.armed){ D.armed=true; lift(); } },HOLD); } });
  addEventListener("pointermove",e=>{ if(!D||e.pointerId!==D.pid) return; const dist=Math.hypot(e.clientX-D.cx,e.clientY-D.cy);
    if(!D.armed){ if(D.touch){ if(dist>10){ clearTimeout(D.tm); D=null; } return; }   // палець поїхав до затискання — це прокрутка
      if(dist<=4) return; D.armed=true; try{ svg.setPointerCapture(e.pointerId); }catch(_){} }
    if(!D.moved){ if(dist<6) return; D.moved=true; lift(); }
    const p=pt(e), dx=p.x-D.p0.x, dy=p.y-D.p0.y; D.g.setAttribute("transform",`translate(${dx.toFixed(1)} ${dy.toFixed(1)})`); ghost(D.t=target(D.dev,dx,dy));
    const r=sc.getBoundingClientRect(), E=40, vy=e.clientY<r.top+E?-14:e.clientY>r.bottom-E?14:0, vx=e.clientX<r.left+E?-14:e.clientX>r.right-E?14:0;
    if(vx||vy){ sc.scrollTop+=vy; sc.scrollLeft+=vx; } });   // біля краю — підкручуємо щит
  addEventListener("pointerup",e=>{ if(D&&e.pointerId===D.pid) stop(false); });
  addEventListener("pointercancel",e=>{ if(D&&e.pointerId===D.pid) stop(true); });
  sc.addEventListener("touchmove",e=>{ if(D&&D.armed&&e.cancelable) e.preventDefault(); },{passive:false});   // поки тягнемо — щит не прокручується
  sc.addEventListener("touchstart",e=>{ if(D&&e.touches.length>1) stop(true); },{passive:true});           // другий палець — це масштаб
  svg.addEventListener("contextmenu",e=>{ if(D&&D.armed) e.preventDefault(); });
  sc.addEventListener("click",e=>{ if(Date.now()<noClickUntil){ e.stopPropagation(); e.preventDefault(); } },true);
})();
/* ===== Перетягування: з нижньої панелі на рейку і дроти між клемами (палець і миша) =====
   Миша: просто тягти. Палець: затиснути ~0,25 с і тягти. Пунктирна рамка — куди стане апарат (червона — зайнято). */
(function(){
  const sc=$("scroller"), svg=$("svg"), NS="http://www.w3.org/2000/svg", HOLD=250;
  let C=null, W=null, blockUntil=0;
  const busy=()=>{ window.__dragBusy=!!((C&&C.armed)||(W&&W.armed)); };   // поки тягнемо, щит не перемальовується щосекунди
  const toSvg=e=>{ const m=svg.getScreenCTM(); if(!m) return {x:0,y:0}; const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse()); return {x:p.x,y:p.y}; };
  const mkEl=(tag,attrs)=>{ const el=document.createElementNS(NS,tag); for(const k in attrs) el.setAttribute(k,attrs[k]); return el; };
  const vib=()=>{ try{ if(navigator.vibrate) navigator.vibrate(12); }catch(_){} };
  const overBoard=e=>{ const r=sc.getBoundingClientRect(); return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom; };
  const edgeScroll=e=>{ const r=sc.getBoundingClientRect(), E=40, vy=e.clientY<r.top+E?-14:e.clientY>r.bottom-E?14:0, vx=e.clientX<r.left+E?-14:e.clientX>r.right-E?14:0; if(vx||vy){ sc.scrollTop+=vy; sc.scrollLeft+=vx; } };

  /* --- 1. з каталогу на рейку --- */
  const TILE=".dc[data-pick],.dc[data-fpick],.dc[data-gq]";
  function tileInfo(el){
    if(el.dataset.pick){ const type=el.dataset.pick; if(!T[type]) return null;
      return {w:T[type].w, go:(r,s)=>{ S.pick=type; S.pickRating=null; S.pickExtra=null; S.pickQty=1; S.selDev=null; placeDev(type,r,s,1); }}; }
    if(el.dataset.fpick!==undefined){ const o=S.devFilter&&S.devFilter.opts[+el.dataset.fpick]; if(!o||!T[o[0]]) return null;
      return {w:T[o[0]].w, go:(r,s)=>{ S.pick=o[0]; S.pickRating=o[1]||null; S.pickExtra=o[3]||null; S.pickQty=1; S.selDev=null; placeDev(o[0],r,s,1); }}; }
    if(el.dataset.gq!==undefined){ const i=+el.dataset.gq, type=S.gType||"qf1p"; if(!T[type]) return null;
      return {w:T[type].w, go:(r,s)=>quickGroup(i,[r,s])}; }
    return null; }
  function slotAt(e,w){ if(!overBoard(e)) return null; const p=toSvg(e); let r=0, best=1e9;
    for(let i=0;i<S.board.rails;i++){ const dd=Math.abs(devTop(i)+120-p.y); if(dd<best){ best=dd; r=i; } }
    const want=Math.max(0,Math.min(SLOTS-w,Math.round((p.x-G.X0)/G.MW-w/2)));
    if(freeAt(r,want,w)) return {r,slot:want,ok:true,w};
    for(let o=1;o<=2;o++) for(const s of [want-o,want+o]) if(s>=0&&s+w<=SLOTS&&freeAt(r,s,w)) return {r,slot:s,ok:true,w};
    return {r,slot:want,ok:false,w}; }
  function showGhost(t){ if(!t){ if(C.ghost){ C.ghost.remove(); C.ghost=null; } return; }
    if(!C.ghost){ C.ghost=mkEl("rect",{rx:5}); svg.appendChild(C.ghost); }
    const g=C.ghost; g.setAttribute("x",G.X0+t.slot*G.MW+1); g.setAttribute("y",devTop(t.r)); g.setAttribute("width",t.w*G.MW-2); g.setAttribute("height",240); g.setAttribute("class","dropg"+(t.ok?"":" bad")); }
  function armC(){ if(!C||C.armed) return; C.armed=true; vib(); busy();
    const chip=document.createElement("div"); chip.className="dragchip"; const b=C.el.querySelector("b"); chip.textContent=((b||C.el).textContent||"").trim(); document.body.appendChild(chip); C.chip=chip; }
  function endC(cancel){ if(!C) return; const c=C; C=null; clearTimeout(c.tm); busy();
    if(!c.armed) return;
    blockUntil=Date.now()+400; if(c.chip) c.chip.remove(); if(c.ghost) c.ghost.remove();
    if(cancel||!c.moved) return;
    if(!c.tgt){ return; }
    if(c.tgt.ok) c.inf.go(c.tgt.r,c.tgt.slot); else toast("Там зайнято","w"); }

  /* --- 2. дроти: від клеми до клеми і перенесення кінця дроту --- */
  function armW(){ if(!W||W.armed) return; W.armed=true; vib(); busy(); S.pend=null;
    W.line=mkEl("path",{class:"rubber"}); W.dot=mkEl("circle",{class:"term-ok",r:12}); svg.appendChild(W.line); svg.appendChild(W.dot); }
  function endW(cancel){ if(!W) return; const w=W; W=null; clearTimeout(w.tm); busy();
    if(!w.armed) return;
    blockUntil=Date.now()+400; if(w.line) w.line.remove(); if(w.dot) w.dot.remove();
    if(cancel||!w.moved) return;
    if(!w.cand){ toast("Відпустіть дріт на клемі","w"); return; }
    if(w.kind==="new"){ if(w.cand===w.key) return;
      const r=termRole(w.key); if(r&&!kindFits(S.wireKind,r)){ S.wireKind=autoKind(r,w.key); toast(`Вид дроту: ${WK[S.wireKind][0]} — за клемою`); }
      S.pend=w.key; termTap(w.cand); return; }
    if(w.cand===w.cur) return;
    S.moveEnd={id:w.wid,end:w.end}; moveEnd(w.cand); if(S.moveEnd){ S.moveEnd=null; renderAll(false); } }

  document.addEventListener("pointerdown",e=>{ if(C||W||e.button>0||S.noDoc) return;
    if(S.mode==="mount"){ const el=e.target.closest&&e.target.closest(TILE); if(!el||!$("bar").contains(el)) return; const inf=tileInfo(el); if(!inf) return;
      C={el,inf,pid:e.pointerId,touch:e.pointerType!=="mouse",x0:e.clientX,y0:e.clientY,armed:false,moved:false,tgt:null,ghost:null,chip:null};
      if(C.touch) C.tm=setTimeout(()=>{ if(C&&!C.armed) armC(); },HOLD); return; }
    if(S.mode==="wire"&&!S.demo){ if(!(e.target===svg||svg.contains(e.target))) return;
      const w=S.selWire&&wireById(S.selWire); let end=null, kind=null, key=null;
      if(w){ const m=svg.getScreenCTM(), p=toSvg(e), R=Math.max(16,30/(m?m.a:1)); for(const en of ["a","b"]){ const q=termPos(w[en]); if(q&&Math.hypot(q.x-p.x,q.y-p.y)<R){ end=en; break; } } }
      if(end){ kind="end"; key=w[end]; } else { key=nearTerm(e); if(key) kind="new"; }
      if(!kind) return;
      W={kind,key,end,cur:end?w[end]:null,wid:w?w.id:null,fix:end?w[end==="a"?"b":"a"]:key,pid:e.pointerId,touch:e.pointerType!=="mouse",x0:e.clientX,y0:e.clientY,armed:false,moved:false,cand:null,line:null,dot:null};
      if(W.touch) W.tm=setTimeout(()=>{ if(W&&!W.armed) armW(); },HOLD-50); } });
  document.addEventListener("pointermove",e=>{
    if(C&&e.pointerId===C.pid){ const dist=Math.hypot(e.clientX-C.x0,e.clientY-C.y0);
      if(!C.armed){ if(C.touch){ if(dist>10){ clearTimeout(C.tm); C=null; } return; } if(dist<6) return; armC(); }
      C.moved=true; C.chip.style.left=e.clientX+"px"; C.chip.style.top=e.clientY+"px";
      C.tgt=slotAt(e,C.inf.w); showGhost(C.tgt); edgeScroll(e); return; }
    if(W&&e.pointerId===W.pid){ const dist=Math.hypot(e.clientX-W.x0,e.clientY-W.y0);
      if(!W.armed){ if(W.touch){ if(dist>10){ clearTimeout(W.tm); W=null; } return; } if(dist<6) return; armW(); }
      W.moved=true; const p=toSvg(e), o=termPos(W.fix); let k=nearTerm(e); if(k&&W.kind==="new"&&k===W.key) k=null; if(k&&W.kind==="end"&&k===W.fix) k=null; W.cand=k;
      if(o) W.line.setAttribute("d",`M${o.x} ${o.y}L${p.x} ${p.y}`);
      const q=k&&termPos(k); if(q){ W.dot.setAttribute("cx",q.x); W.dot.setAttribute("cy",q.y); W.dot.style.display=""; } else W.dot.style.display="none";
      edgeScroll(e); } });
  document.addEventListener("pointerup",e=>{ if(C&&e.pointerId===C.pid) endC(false); if(W&&e.pointerId===W.pid) endW(false); });
  document.addEventListener("pointercancel",e=>{ if(C&&e.pointerId===C.pid) endC(true); if(W&&e.pointerId===W.pid) endW(true); });
  document.addEventListener("touchmove",e=>{ if(((C&&C.armed)||(W&&W.armed))&&e.cancelable) e.preventDefault(); },{passive:false});   // поки тягнемо — нічого не прокручується
  document.addEventListener("touchstart",e=>{ if(e.touches.length>1){ endC(true); endW(true); } },{passive:true});                       // другий палець — це масштаб
  document.addEventListener("contextmenu",e=>{ if(C||W) e.preventDefault(); });
  document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ endC(true); endW(true); } });
  document.addEventListener("click",e=>{ if(Date.now()<blockUntil){ e.stopPropagation(); e.preventDefault(); } },true);
})();
