/* ===== Нижня панель: згортання вниз (дотик по порожньому місцю щитка, ручка, свайп) ===== */
(function(){ const bar=$("bar"), h=$("barHandle"), set=v=>{ S.barCol=v; bar.classList.toggle("collapsed",v); };
  $("scroller").addEventListener("click",e=>{ if(S.noDoc||S.demo||S.pick||S.pend||S.moveEnd||S.barCol) return;
    if(e.target.closest("[data-dev],[data-term],[data-wire],[data-slot],[data-lever],[data-press],[data-test],[data-field],[data-closeboard]")) return; set(true); });
  let y0=null, swiped=false;
  h.addEventListener("pointerdown",e=>{ y0=e.clientY; swiped=false; try{ h.setPointerCapture(e.pointerId); }catch(_){} });
  h.addEventListener("pointerup",e=>{ if(y0===null) return; const dy=e.clientY-y0; y0=null; if(dy>18){ set(true); swiped=true; } else if(dy<-18){ set(false); swiped=true; } });
  h.addEventListener("pointercancel",()=>{ y0=null; });
  h.addEventListener("click",()=>{ if(swiped){ swiped=false; return; } set(!S.barCol); });
})();
document.addEventListener("input",e=>{ if(e.target.id!=="devQ") return; S.devQ=e.target.value; const r=$("devRes"); if(r) r.innerHTML=catBody();
  document.querySelectorAll("#devCats .chip").forEach((c,i)=>c.setAttribute("aria-pressed",String(!S.devQ.trim()&&i===Math.min(S.cat??0,CATALOG.length-1)))); });
/* ===== Старт ===== */
(function init(){
  const db=projDB(); let ok=false;
  if(load()&&(TPL[S.tpl]||S.tpl==="custom")){ S.tplObj=TPL[S.tpl]||TPL.custom; S.env0=S.env0||JSON.parse(JSON.stringify(S.env)); ok=true; }
  if(!ok) applyTemplate("flat");
  if(S.proj&&S.proj.id&&!db.list.some(p=>p.id===S.proj.id)) S.proj={id:null,name:S.proj.name};
  if(!S.proj) S.proj={id:null,name:(S.tplObj&&S.tplObj.name)||"Мій щиток"};
  if(!S.baseSig) S.baseSig=structSnap();
  resetHistory(); commit(); tplLabel(); renderProjBtn();
})();

// На широкому екрані щиток одразу вписується у висоту
(function(){ const fit=()=>{ if(window.innerWidth>=900){ const z=fitZoom(); if(z<1){ S.zoom=z; renderAll(false); } } }; setTimeout(fit,50); let t=null; window.addEventListener("resize",()=>{ clearTimeout(t); t=setTimeout(fit,200); }); })();
