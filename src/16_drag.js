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
