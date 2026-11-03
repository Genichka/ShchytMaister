/* ===== Події, демонстрація, таймери, старт ===== */
function placeDev(type,r,slot){ const w=T[type].w;
  if(!freeAt(r,slot,w)){ let alt=null; for(let rr=0;rr<S.board.rails&&alt===null;rr++) for(let i=0;i<SLOTS;i++) if(freeAt(rr,i,w)){ alt=[rr,i]; break; }
    if(!alt){ toast("На рейках немає місця для "+w+" мод.","w"); return; } [r,slot]=alt; }
  const n=groupsOf().length, ex=Object.assign({},S.pickExtra||{}), asG=ex.asGroup; delete ex.asGroup;
  if(T[type].group&&(!T[type].groupOpt||asG)) ex.group=mkGroup(n,"Група "+(n+1),2.5,[]);
  if(S.brand&&S.brand!=="eua"&&MODELS[type]&&MODELS[type][S.brand]&&!ex.brand) ex.brand=S.brand;
  const d=mkDev(type,r,slot,S.pickRating||null,ex); S.devices.push(d);
  S.pick=null; S.pickRating=null; S.pickExtra=null; toast(`${desig(d)} ${d.rating?d.rating+(T[type].unit||"")+" ":""}встановлено`,"ok"); commit(); }
function removeDev(d){ S.devices=S.devices.filter(x=>x!==d); S.wires=S.wires.filter(w=>!w.a.startsWith(d.id+":")&&!w.b.startsWith(d.id+":")); S.leak.delete(d.id); S.short.delete(d.id); S.selDev=null; commit(); }
function termTap(key){
  if(!S.pend){ S.pend=key; S.selWire=null; S.moveEnd=null; renderAll(); return; }
  if(S.pend===key){ S.pend=null; renderAll(); return; }
  const a=S.pend, b=key; S.pend=null;
  if(S.wires.some(w=>(w.a===a&&w.b===b)||(w.a===b&&w.b===a))){ toast("Такий дріт уже є","w"); renderAll(); return; }
  if(S.wires.filter(w=>w.a===b||w.b===b).length>=2&&!/^x(n|pe):/.test(b)) toast("Під одну клему — не більше двох дротів","w");
  S.wires.push({id:uid("w"),a,b,kind:S.wireKind,sec:S.wireSec}); commit(); }
function demoStop(){ S.demo=null; hideDemoBar(); renderTools(); hint(); }
function demoStart(){ resetRuntime(); S.demo={i:-1,left:0,paused:false}; showDemoBar(); demoNext(); }
function demoNext(){ const sc=S.tplObj.demo.script; S.demo.i++; if(S.demo.i>=sc.length){ demoStop(); toast("Демонстрацію завершено","ok"); return; }
  const st=sc[S.demo.i]; try{ st.do(); }catch(e){ console.error(e); } S.demo.left=st.wait; logp("ok","▶ "+st.say); commit(false); renderTools(); updateDemoBar(); }
function checkNow(){ const C=runChecks(), ne=C.filter(c=>c.sev==="e").length, nw=C.filter(c=>c.sev==="w").length; S.lastCheck={sig:structSnap(),errors:ne};
  $("checks").innerHTML=C.map(c=>`<div class="ck"><span class="sev ${c.sev}">${c.sev==="e"?"Помилка":c.sev==="w"?"Увага":"OK"}</span><div><div class="t">${esc(c.t)}</div>${c.d?`<div class="d">${esc(c.d)}</div>`:""}</div></div>`).join("");
  $("score").innerHTML=ne?`<span style="color:var(--red)">● ${ne}</span>${nw?` <span style="color:var(--orange)">● ${nw}</span>`:""}`:nw?`<span style="color:var(--orange)">● ${nw}</span>`:`<span style="color:var(--green)">✓</span>`;
  $("checkHint").textContent=ne?`Помилок: ${ne}, попереджень: ${nw}. Виправте помилки й перевірте ще раз.`:nw?`Помилок немає, попереджень: ${nw}.`:"Схема правильна: помилок і попереджень немає.";
  S.chk={list:C,i:0}; S.chkOpen=true; solve(0); renderAll(true); }
function clearCheck(){ S.chk=null; S.chkOpen=false; $("checks").innerHTML=""; $("score").innerHTML=""; $("checkHint").textContent="Натисніть «Перевірка» вгорі — застосунок прожене схему під напругою і перевірить правила."; }
function showTab(t){ if(t==="check"&&S.chk) S.chkOpen=true; if(t==="groups"){ const g=groupsOf()[0]; if(g){ S.selDev=g.id; S.bsegFor=g.id; S.bseg="load"; } } renderAll(false); }
function fitZoom(){ const sc=$("scroller"), vb=$("svg").viewBox.baseVal; if(!vb||!vb.width) return 1; return Math.max(0.3,Math.min(1,Math.floor((sc.clientHeight-6)/(sc.clientWidth*vb.height/vb.width)*20)/20)); }
function closeDrawer(){ $("drawer").hidden=true; }

document.addEventListener("click",e=>{ const qb=s=>e.target.closest(s); let eb;
  if(eb=qb("[data-brand]")){ const d=devById(S.selDev); if(d){ const b=eb.dataset.brand; if(b==="eua") delete d.brand; else d.brand=b; S.brand=b; commit(false); renderSheet(); } return; }
  if(qb("[data-brandall]")){ const d=devById(S.selDev), b=d?brandOf(d):"eua"; let n=0; for(const x of S.devices) if(b==="eua"||(MODELS[x.type]&&MODELS[x.type][b])){ if(b==="eua") delete x.brand; else x.brand=b; n++; }
    S.brand=b; toast(`${BR[b].s||BR[b].n}: ${n} апарат(ів)`,"ok"); commit(false); renderSheet(); return; }
  const q=s=>e.target.closest(s); let el;
  if(q("#menuBtn")){ renderTplMenu(); tplLabel(); $("drawer").hidden=false; return; }
  if(q("#drawerX")||e.target.id==="drawer"){ closeDrawer(); return; }
  if(el=q("[data-menu]")){ const m=el.dataset.menu; closeDrawer();
    if(m==="new") confirmLeave(()=>openWizard(false)); if(m==="projects"){ openProjects(); setTimeout(()=>{ const h=$("plistH"); if(h) h.scrollIntoView({block:"start"}); },50); } if(m==="board") openWizard(true);
    if(m==="save"){ saveProject(); } if(m==="saveas"){ openProjects(); document.querySelector('[data-pa="copy"]').click(); } if(m==="export") exportProject(); if(m==="import") $("pImport").click(); if(m==="close") closeBoard();
    if(m==="guide"){ if(S.guide) S.guide.on=!S.guide.on; else S.guide={on:true,skip:[],testOK:false}; S.mode="mount"; save(); renderAll(true); }
    if(m.startsWith("doc:")) openDocs(m.slice(4)); if(m==="plan"){ S.mode="plan"; S.pend=null; S.pick=null; S.selWire=null; S.selDev=null; renderAll(); }
    return; }
  if(el=q("[data-dtab]")){ showTab(el.dataset.dtab,true); return; }
  if(q("#dockGrip")){ const dk=$("dock"), st=dk.classList.contains("s1")?"s2":dk.classList.contains("s2")?"s0":"s1"; dk.classList.remove("s0","s1","s2"); dk.classList.add(st); return; }
  if(q("#undoTop")){ undo(); return; }
  if(q("#redoTop")){ redo(); return; }
  if(q("#docsBtn")){ openDocs("sld"); return; }
  if(q("#zAll")){ S.zoom=fitZoom(); renderAll(false); $("scroller").scrollTo(0,0); return; }
  if(el=q(".tb[data-mode]")){ S.mode=el.dataset.mode; S.pend=null; S.pick=null; S.selWire=null; S.moveEnd=null; renderAll(); return; }
  if(el=q("[data-term]")){ if(S.moveEnd) moveEnd(el.dataset.term); else termTap(el.dataset.term); return; }
  if(el=q("[data-wire]")){ const id=el.dataset.wire; if(S.mode!=="wire"){ S.mode="wire"; S.pend=null; S.pick=null; S.selDev=null; selectWire(id); renderAll(true); toast("Проводка: дріт вибрано — дії в панелі внизу"); return; }
    if(S.selWire===id){ S.selWire=null; renderAll(); } else selectWire(id); return; }
  if(el=q("[data-press]")){ if(S.mode==="wire") return; livePress(devById(el.dataset.press)); return; }
  if(el=q("[data-lever]")){ if(S.mode==="wire") return; const d=devById(el.dataset.lever), t=T[d.type];
    if(t.tap){ if(t.tap(d)) commit(false); return; }
    if(t.prot||t.rcd){ if(d.on&&!d.trip) d.on=false; else { d.on=true; d.trip=null; S.heat[d.id]=0; } commit(false); } return; }
  if(el=q("[data-test]")){ const d=devById(el.dataset.test), X=evaluate({extra:shortsExtra()});
    if(d.on&&!d.trip&&X.volt(k(d,"t1"),k(d,"t2"))>=150){ trip(d,"кнопка «Тест» — ПЗВ справний"); commit(false); } else toast("Тест працює, лише коли ПЗВ під напругою і ввімкнений","w"); return; }
  if(el=q("[data-slot]")){ const [r,i]=el.dataset.slot.split(":").map(Number); if(S.pick) placeDev(S.pick,r,i); else toast("Спершу оберіть апарат нижче"); return; }
  if(el=q("[data-dev]")){ if(S.mode==="wire") return; S.selDev=el.dataset.dev; renderAll(false); return; }
  if(el=q("[data-pick]")){ S.pick=S.pick===el.dataset.pick?null:el.dataset.pick; S.pickRating=null; S.pickExtra=null; S.selDev=null; if(S.pick){ S.devOpen=false; toast("Торкніться вільного місця на рейці"); $("scroller").scrollIntoView({behavior:"smooth",block:"start"}); } renderAll(); return; }
  if(el=q("[data-fpick]")){ const o=S.devFilter.opts[+el.dataset.fpick]; S.pick=o[0]; S.pickRating=o[1]||null; S.pickExtra=o[3]||null; S.selDev=null;
    toast(`${o[2]}: торкніться вільного місця на рейці`); renderAll(); $("scroller").scrollIntoView({behavior:"smooth",block:"start"}); return; }
  if(q("[data-fall]")){ S.devFilter=null; S.devOpen=true; renderAll(); return; }
  if(el=q("[data-tpl]")){ closeDrawer(); const key=el.dataset.tpl;
    if(key==="__new"){ confirmLeave(()=>openWizard(false)); return; }
    confirmLeave(()=>{ applyTemplate(key); clearCheck(); S.mode=S.tplObj.demo&&S.tplObj.demo.script.length?"test":"mount"; S.devOpen=S.mode==="mount";
      toast("Шаблон завантажено","ok"); commit(); tplLabel(); renderProjBtn(); }); return; }

  if(q("#combBtn")){ if(S.comb) S.comb=null; else { const p=S.devices.filter(d=>d.type==="qf1p"); if(p.length<2){ toast("Потрібно щонайменше два автомати 1P","w"); return; }
      const sel=S.selDev&&devById(S.selDev), r=sel&&sel.type==="qf1p"?(sel.rail||0):(p[0].rail||0), sl=p.filter(d=>(d.rail||0)===r).map(d=>d.slot); if(sl.length<2){ toast("На цій рейці потрібно щонайменше два автомати 1P","w"); return; } S.comb={rail:r,from:Math.min(...sl),to:Math.max(...sl)}; } commit(); return; }
  if(el=q("[data-kind]")){ S.wireKind=el.dataset.kind; renderAll(); return; }
  if(el=q("[data-sec]")){ S.wireSec=+el.dataset.sec; renderAll(); return; }
  if(q("#delWire")){ S.wires=S.wires.filter(w=>w.id!==S.selWire); S.selWire=null; commit(); return; }
  if(q("#clearWires")){ if(clearArm>Date.now()){ S.wires=[]; clearArm=0; S.selWire=null; commit(); } else { clearArm=Date.now()+3000; renderTools(); setTimeout(()=>{ if(S.mode==="wire") renderTools(); },3100); } return; }
  if(el=q("[data-srcon]")){ const s=S.src[el.dataset.srcon]; s.on=!s.on; if(s.on) s.blown=false; logp(s.on?"ok":"w",`${(S.board.inputs.find(i=>i.id===el.dataset.srcon)||{}).label}: ${s.on?"напругу подано":"напругу знято"}`); commit(false); return; }
  if(el=q("[data-ctl]")){ const c=S.tplObj.demo.controls[+el.dataset.ctl]; if(!c||c.type==="range") return;
    if(c.type==="toggle") c.set(!c.get()); else if(c.type==="choice") c.set(el.dataset.v); else if(c.type==="btn") c.act(); commit(false); return; }
  if(q("#demoBtn")){ if(S.demo) demoStop(); else demoStart(); return; }
  if(q("#allOn")){ S.devices.forEach(d=>{ if(T[d.type].prot||T[d.type].rcd){ d.on=true; d.trip=null; } }); S.heat={}; commit(false); return; }
  if(q("#clrFaults")){ S.leak.clear(); S.short.clear(); S.leakWarned.clear(); S.arc.clear(); S.arcWarned.clear(); commit(); return; }
  if(el=q("[data-arc]")){ const id=el.dataset.arc; S.arc.has(id)?S.arc.delete(id):S.arc.add(id); S.arcWarned.delete(id); commit(); return; }
  if(el=q("[data-leak]")){ const id=el.dataset.leak; S.leak.has(id)?S.leak.delete(id):S.leak.add(id); S.leakWarned.delete(id); commit(); return; }
  if(el=q("[data-short]")){ const id=el.dataset.short; S.short.has(id)?S.short.delete(id):S.short.add(id); commit(); return; }
  if(el=q("[data-del]")){ const [id,i]=el.dataset.del.split(":"); devById(id).group.loads.splice(+i,1); commit(); return; }
  const d=S.selDev&&devById(S.selDev);
  if(d){
    if(el=q("[data-rate]")){ d.rating=el.dataset.rate; if(d.type==="qm") d.Ir=mprHi(d.rating); commit(); return; }
    if(el=q("[data-move]")){ const ns=d.slot+(+el.dataset.move); if(freeAt(d.rail||0,ns,T[d.type].w,d)){ d.slot=ns; commit(); } else toast("Там зайнято","w"); return; }
    if(el=q("[data-mrail]")){ const nr=(d.rail||0)+(+el.dataset.mrail); if(freeAt(nr,d.slot,T[d.type].w,d)){ d.rail=nr; commit(); } else toast("На іншій рейці це місце зайняте","w"); return; }
    if(el=q("[data-atsm]")){ d.manual=el.dataset.atsm==="1"; commit(false); return; }
    if(el=q("[data-atsv]")){ d.variant=el.dataset.atsv; commit(false); return; }
    if(el=q("[data-cmd]")){ d.cmd=el.dataset.cmd==="1"; commit(false); return; }
    if(el=q("[data-hlc]")){ d.col=el.dataset.hlc; commit(false); return; }
    if(q("#devToggle")){ if(d.on&&!d.trip) d.on=false; else { d.on=true; d.trip=null; } commit(false); return; }
    if(q("#devDel")){ removeDev(d); return; } }
  if(q("#sheetClose")){ S.selDev=null; renderAll(false); return; }
  if(q("#btnCheck")){ checkNow(); return; }
  if(q("#zIn")){ S.zoom=Math.min(4,Math.round((S.zoom+(S.zoom>=1?0.5:0.1))*10)/10); renderAll(false); return; }
  if(q("#zOut")){ S.zoom=Math.max(0.3,Math.round((S.zoom-(S.zoom>1?0.5:0.1))*10)/10); renderAll(false); return; }
  if(q("#zFit")){ S.zoom=1; renderAll(false); return; }
});
document.addEventListener("change",e=>{ const t=e.target;
  if(t.dataset.load){ const [id,i]=t.dataset.load.split(":"); devById(id).group.loads[+i].on=t.checked; save(); solve(0); render(); renderSummary();
    const d=devById(id), L=gLoad(d); document.querySelector(`[data-gload="${id}"]`).innerHTML=L.txt; document.querySelector(`[data-gbar="${id}"]`).innerHTML=L.bar; return; }
  if(t.dataset.add){ if(t.value==="") return; const l=LOADS[+t.value]; devById(t.dataset.add).group.loads.push({n:l[0],kw:l[1],on:true}); commit(); return; }
  if(t.dataset.gsec){ devById(t.dataset.gsec).group.sec=+t.value; commit(); return; }
  if(t.dataset.glen){ const g=devById(t.dataset.glen).group, v=+t.value; if(v>0) g.len=v; else delete g.len; commit(); return; }
  if(t.dataset.gname){ devById(t.dataset.gname).group.name=t.value.trim()||"Група"; save(); render(); return; }
  if(t.id==="tpl"&&t.value){ applyTemplate(t.value); t.value=""; clearCheck(); S.mode=S.tplObj.demo&&S.tplObj.demo.script.length&&S.tpl!=="empty"?"test":"mount"; toast("Шаблон завантажено","ok"); commit(); return; }
});
document.addEventListener("input",e=>{ const t=e.target;
  if(t.dataset.srcu){ const s=S.src[t.dataset.srcu]; s.U=+t.value; const three=S.board.inputs.find(i=>i.id===t.dataset.srcu).terms.includes("L1");
    $("uo-"+t.dataset.srcu).textContent=three?Math.round(s.U*1.732)+" В лін.":s.U+" В"; solve(0); render(); updateLive(); return; }
  if(t.dataset.ctl){ const c=S.tplObj.demo.controls[+t.dataset.ctl]; if(c&&c.type==="range"){ c.set(+t.value); $("co-"+t.dataset.ctl).textContent=t.value; solve(0); render(); updateLive(); } return; }
  if(t.id==="irset"){ const d=devById(S.selDev); d.Ir=+t.value; $("irout").textContent=fmt(d.Ir,1)+" А"; save(); render(); }
});
setInterval(()=>{ if(!anySource()&&!S.demo) return; solve(0.5); render(); renderSummary(); hint(); updateLive(); },500);
setInterval(()=>{ if(!S.demo||S.demo.paused) return; S.demo.left-=0.25; if(S.demo.left<=0) demoNext(); },250);
function renderTplMenu(){ const cats=[...TPL_ORDER,...new Set(Object.values(TPL).map(t=>t.cat))].filter((c,i,a)=>a.indexOf(c)===i);
  $("tplMenu").innerHTML=`<div class="tm-g"><button class="tm-i tm-new" data-tpl="__new">＋ Новий щит — майстер з покроковим помічником</button></div>`+cats.map(c=>{ const it=Object.entries(TPL).filter(([,t])=>t.cat===c&&!t.hidden); if(!it.length) return "";
    return `<div class="tm-g"><div class="tm-h">${esc(c)}</div>`+it.map(([key,t])=>`<button class="tm-i" data-tpl="${key}" aria-current="${S.tpl===key}">${esc(t.name)}</button>`).join("")+`</div>`; }).join(""); }
function tplLabel(){ const t=TPL[S.tpl]; $("tplName").textContent=S.tpl==="custom"?"Власний щит":t?t.name:"Шаблон"; }
document.addEventListener("toggle",e=>{ if(e.target.id==="devDD") S.devOpen=e.target.open; },true);
document.addEventListener("keydown",e=>{ if(e.key!=="Escape") return; if(!$("drawer").hidden) closeDrawer(); else if(!$("docs").hidden) $("docs").hidden=true; });

