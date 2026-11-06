/* ===== Старт ===== */
(function init(){
  const db=projDB(); let ok=false;
  if(load()&&(TPL[S.tpl]||S.tpl==="custom")){ S.tplObj=TPL[S.tpl]||TPL.custom; S.env0=S.env0||JSON.parse(JSON.stringify(S.env)); ok=true; }
  if(!ok) applyTemplate("flat");
  if(S.proj&&S.proj.id&&!db.list.some(p=>p.id===S.proj.id)) S.proj={id:null,name:S.proj.name};
  if(!S.proj) S.proj={id:null,name:(S.tplObj&&S.tplObj.name)||"Мій щит"};
  if(!S.baseSig) S.baseSig=structSnap();
  resetHistory(); commit(); tplLabel(); renderProjBtn();
})();

// На широкому екрані щит одразу вписується у висоту
(function(){ const fit=()=>{ if(window.innerWidth>=900){ const z=fitZoom(); if(z<1){ S.zoom=z; renderAll(false); } } }; setTimeout(fit,50); let t=null; window.addEventListener("resize",()=>{ clearTimeout(t); t=setTimeout(fit,200); }); })();
