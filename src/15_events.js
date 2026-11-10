/* ===== Події, демонстрація, таймери, старт ===== */
// Ставить qty однакових апаратів підряд, починаючи з вибраного місця (або з першого вільного); вибір лишається активним
function nextFree(w,r,slot){ for(let rr=r;rr<S.board.rails;rr++) for(let i=(rr===r?slot:0);i<SLOTS;i++) if(freeAt(rr,i,w)) return [rr,i];
  for(let rr=0;rr<S.board.rails;rr++) for(let i=0;i<SLOTS;i++) if(freeAt(rr,i,w)) return [rr,i]; return null; }
function placeDev(type,r,slot,qty){ const w=T[type].w, n0=qty||S.pickQty||1, put=[]; let motor=false;
  for(let j=0;j<n0;j++){ const at=j===0&&freeAt(r,slot,w)?[r,slot]:nextFree(w,r,j?slot:slot); if(!at){ toast(put.length?`Вмістилось лише ${put.length} — більше немає місця`:"На рейках немає місця для "+w+" мод.","w"); break; }
    [r,slot]=at; const n=groupsOf().length, ex=Object.assign({},S.pickExtra||{}), asG=ex.asGroup, gname=ex.gname, gloads=ex.gloads; motor=motor||ex.withMotor; delete ex.asGroup; delete ex.gname; delete ex.gloads; delete ex.withMotor;
    if(T[type].group&&(!T[type].groupOpt||asG)) ex.group=mkGroup(n,gname||"Група "+(n+1),S.pickRating&&/C(25|32)/.test(S.pickRating)?(/32/.test(S.pickRating)?6:4):/B10|C10|B6/.test(S.pickRating||"")?1.5:2.5,gloads||[]);
    if(S.brand&&S.brand!=="eua"&&MODELS[type]&&MODELS[type][S.brand]&&!ex.brand) ex.brand=S.brand;
    const d=mkDev(type,r,slot,S.pickRating||null,ex); S.devices.push(d); put.push(d); slot+=w; }
  if(!put.length) return; S.pick=null; S.pickRating=null; S.pickExtra=null; S.pickQty=1;   // поставили — режим розстановки закривається сам
  toast(put.length>1?`Поставлено ${put.length} × ${T[type].short} ${put[0].rating||""}: ${put.map(desig).join(", ")}`:`${desig(put[0])} ${put[0].rating?put[0].rating+(T[type].unit||"")+" ":""}встановлено`,"ok"); commit();
  if(motor&&S.field.filter(f=>f.type==="motor3").length<S.devices.filter(d=>d.type==="qm").length) addField("motor3"); }
function removeDev(d){ S.devices=S.devices.filter(x=>x!==d); S.wires=S.wires.filter(w=>![w.a,w.b].some(k=>k.startsWith(d.id+":")||k.startsWith("tb:"+d.id+":"))); S.leak.delete(d.id); S.short.delete(d.id); S.selDev=null; commit(); }
function termTap(key){
  if(!S.pend){ const r=termRole(key); if(r&&!kindFits(S.wireKind,r)){ S.wireKind=autoKind(r,key); toast(`Вид дроту: ${WK[S.wireKind][0]} — за клемою`); }
    S.pend=key; S.selWire=null; S.moveEnd=null; renderAll(); return; }
  if(S.pend===key){ S.pend=null; renderAll(); return; }
  const a=S.pend, b=key; S.pend=null;
  if(S.wires.some(w=>(w.a===a&&w.b===b)||(w.a===b&&w.b===a))){ toast("Такий дріт уже є","w"); renderAll(); return; }
  if(S.wires.filter(w=>w.a===b||w.b===b).length>=2&&!/^x(n|pe):/.test(b)) toast("Під одну клему — не більше двох дротів","w");
  S.wires.push({id:uid("w"),a,b,kind:S.wireKind,sec:S.wireSec}); commit(); }
function demoStop(){ S.demo=null; hideDemoBar(); renderBar(); hint(); }
function demoStart(){ resetRuntime(); S.demo={i:-1,left:0,paused:false}; showDemoBar(); demoNext(); }
function demoNext(){ const sc=S.tplObj.demo.script; S.demo.i++; if(S.demo.i>=sc.length){ demoStop(); toast("Демонстрацію завершено","ok"); return; }
  const st=sc[S.demo.i]; try{ st.do(); }catch(e){ console.error(e); } S.demo.left=st.wait; logp("ok","▶ "+st.say); commit(false); updateDemoBar(); }
function checkNow(){ const C=runChecks(), ne=C.filter(c=>c.sev==="e").length, nw=C.filter(c=>c.sev==="w").length;
  S.lastCheck={sig:elecSnap(),errors:ne,warns:nw};
  S.chk={list:C,i:0}; S.chkOpen=!!(ne||nw); solve(0);   // усе гаразд — без вікна з переліком «1 з N», лише повідомлення й підказка «що далі»
  if(!ne&&!nw) toast(`✓ Схема правильна — щит готовий (перевірок: ${C.length})`,"ok");
  renderAll(true); }
function clearCheck(){ S.chk=null; S.chkOpen=false; }
function showTab(t){ if(t==="check"&&S.chk) S.chkOpen=true; if(t==="groups"){ const g=groupsOf()[0]; if(g){ S.selDev=g.id; S.bsegFor=g.id; S.bseg="load"; } } renderAll(false); }
function fitZoom(){ const sc=$("scroller"), vb=$("svg").viewBox.baseVal; if(!vb||!vb.width) return 1; return Math.max(0.3,Math.min(1,Math.floor((sc.clientHeight-6)/(sc.clientWidth*vb.height/vb.width)*20)/20)); }
function closeDrawer(){ $("drawer").hidden=true; }
// Меню: лише те, чого немає на панелі (проєкти — кнопка «Проєкт», документи — вкладка «Документи»)
function openDrawer(tpl){ renderTplMenu(); tplLabel();
  for(const el of document.querySelectorAll("#drawer [data-needdoc]")) el.hidden=!!S.noDoc;
  for(const el of document.querySelectorAll("#drawer [data-nodoconly]")) el.hidden=!S.noDoc;
  const g=$("mGuide"); if(g) g.textContent=S.guide&&S.guide.on?"🧭 Вимкнути покрокового помічника":"🧭 Увімкнути покрокового помічника";
  for(const x of document.querySelectorAll("#drawer details.dr-d")) x.open=false;   // за замовчуванням усі розділи згорнуті
  const d=$("tplDet"); if(d) d.open=!!tpl||!!S.noDoc; { const sh=$("shDet"); if(sh&&S.noDoc&&!tpl) sh.open=true; }
  $("drawer").hidden=false; if(tpl&&d) setTimeout(()=>d.scrollIntoView({block:"start"}),30); }
// Вийти з застосунку. Стан щита зберігається завжди, тож нічого не губиться; якщо система не дає закрити вікно кнопкою — підказуємо як.
function exitApp(){ save(); closeDrawer(); window.close();
  setTimeout(()=>{ if(!document.hidden) dialog("Вийти з PanelCraft",`<p>Телефон не дозволив закрити застосунок кнопкою. Закрийте його звичайно: відкрийте список нещодавніх програм і змахніть картку PanelCraft.</p><p>Щит і проєкти збережено — наступного разу все відкриється як було.</p>`,[{label:"Зрозуміло",cls:"primary"}]); },400); }

document.addEventListener("click",e=>{ const qb=s=>e.target.closest(s); let eb;
  if(eb=qb("[data-brand]")){ const d=devById(S.selDev); if(d){ const b=eb.dataset.brand; if(b==="eua") delete d.brand; else d.brand=b; S.brand=b; commit(false); } return; }
  if(qb("[data-brandall]")){ const d=devById(S.selDev), b=d?brandOf(d):"eua"; let n=0; for(const x of S.devices) if(b==="eua"||(MODELS[x.type]&&MODELS[x.type][b])){ if(b==="eua") delete x.brand; else x.brand=b; n++; }
    S.brand=b; toast(`${BR[b].s||BR[b].n}: ${n} апарат(ів)`,"ok"); commit(false); return; }
  const q=s=>e.target.closest(s); let el;
  if(q("#menuBtn")){ openDrawer(false); return; }
  if(q("#drawerX")||e.target.id==="drawer"){ closeDrawer(); return; }
  if(el=q("[data-menu]")){ const m=el.dataset.menu; closeDrawer();
    if(m==="new") confirmLeave(()=>openWizard(false)); if(m==="projects"){ openProjects(); setTimeout(()=>{ const h=$("plistH"); if(h) h.scrollIntoView({block:"start"}); },50); } if(m==="board") openWizard(true);
    if(m==="tb"){ S.board.tb=!S.board.tb; if(!S.board.tb) S.wires=S.wires.filter(w=>!/^tb:/.test(w.a)&&!/^tb:/.test(w.b)); GEO=null; commit(); toast(S.board.tb?"Колодку XT2 додано: підключіть до неї L, N і PE кожної групи":"Колодку XT2 прибрано","ok"); }
    if(m==="save"){ saveProject(); } if(m==="saveas"){ openProjects(); document.querySelector('[data-pa="copy"]').click(); } if(m==="export") exportProject(); if(m==="exit") exitApp(); if(m==="import") $("pImport").click(); if(m==="close") closeBoard();
    if(m==="guide"){ if(S.guide) S.guide.on=!S.guide.on; else S.guide={on:true,skip:[],testOK:false}; S.mode="mount"; save(); renderAll(true); }
    if(m==="autowire") autoWire();
    if(m.startsWith("doc:")) openDocs(m.slice(4));
    return; }
  if(q("#undoTop")){ undo(); return; }
  if(q("#redoTop")){ redo(); return; }
  if(q("#docsBtn")){ openDocs("sld"); return; }
  if(el=q("[data-hgo]")){ if(el.dataset.hgo==="docs") openDocs("sld"); else { S.mode=el.dataset.hgo; S.pend=null; S.pick=null; S.selWire=null; S.selDev=null; S.moveEnd=null; renderAll(); } return; }
  if(q("#zAll")){ S.zoom=fitZoom(); renderAll(false); $("scroller").scrollTo(0,0); return; }
  if(el=q(".tb[data-mode]")){ S.mode=el.dataset.mode; S.pend=null; S.pick=null; S.selWire=null; S.moveEnd=null; S.repl=null; S.moveDev=null; ctxClose(); renderAll(); return; }
  if(el=q("[data-term]")){ if(S.moveEnd) moveEnd(el.dataset.term); else termTap(el.dataset.term); return; }
  if(el=q("[data-wire]")){ const id=el.dataset.wire; if(S.mode!=="wire"){ S.mode="wire"; S.pend=null; S.pick=null; S.selDev=null; selectWire(id); renderAll(true); toast("Проводка: дріт вибрано — дії в панелі внизу"); return; }
    if(S.selWire===id){ S.selWire=null; renderAll(); } else selectWire(id); return; }
  if((S.mode==="mount"||S.mode==="wire")&&(el=q("[data-dev]"))){ const d=S.devices.find(x=>x.id===el.dataset.dev); if(!d) return;
    if(S.mode==="wire"&&nearTerm(e)) return; if(S.moveDev){ toast("Оберіть вільне місце на рейці — або «Скасувати» внизу"); return; }
    S.pick=null; S.repl=null; ctxOpen(d,e.clientX,e.clientY); return; }
  if(el=q("[data-press]")){ if(S.mode==="wire") return; livePress(devById(el.dataset.press)); return; }
  if(el=q("[data-lever]")){ if(S.mode==="wire") return; const d=devById(el.dataset.lever), t=T[d.type];
    if(t.tap){ if(t.tap(d,el)) commit(false); return; }
    if(t.prot||t.rcd){ if(d.on&&!d.trip) d.on=false; else { d.on=true; d.trip=null; S.heat[d.id]=0; } commit(false); } return; }
  if(el=q("[data-test]")){ const d=devById(el.dataset.test), X=evaluate({extra:shortsExtra()});
    if(d.on&&!d.trip&&X.volt(k(d,"t1"),k(d,"t2"))>=150){ trip(d,"кнопка «Тест» — ПЗВ справний"); commit(false); } else toast("Тест працює, лише коли ПЗВ під напругою і ввімкнений","w"); return; }
  if(el=q("[data-slot]")){ const [r,i]=el.dataset.slot.split(":").map(Number); if(S.moveDev) doMoveTo(r,i); else if(S.pick) placeDev(S.pick,r,i); else toast("Спершу оберіть апарат нижче"); return; }
  if(el=q("[data-pqty]")){ S.pickQty=+el.dataset.pqty; renderAll(false); return; }
  if(el=q("[data-prate]")){ S.pickRating=el.dataset.prate; renderAll(false); return; }
  if(q("[data-pauto]")){ if(S.pick){ const f=nextFree(T[S.pick].w,0,0); if(f) placeDev(S.pick,f[0],f[1]); else toast("Немає вільного місця","w"); } return; }
  if(q("[data-pickx]")){ S.pick=null; S.pickRating=null; S.pickExtra=null; S.pickQty=1; renderAll(); return; }
  if(el=q("[data-dev]")){ S.selDev=el.dataset.dev; renderAll(false); return; }
  if((el=q("[data-pick]"))&&S.repl){ doReplace(S.repl,el.dataset.pick); return; }
  if(q("[data-replx]")){ S.repl=null; S.devQ=""; renderAll(); return; }
  if(q("[data-mvx]")){ S.moveDev=null; S.pick=null; renderAll(); return; }
  if(el=q("[data-pick]")){ S.devQ=""; S.pick=S.pick===el.dataset.pick?null:el.dataset.pick; S.pickRating=null; S.pickExtra=null; S.selDev=null; if(S.pick){ S.devOpen=false; toast("Торкніться вільного місця на рейці"); $("scroller").scrollIntoView({behavior:"smooth",block:"start"}); } renderAll(); return; }
  if(el=q("[data-fpick]")){ const o=S.devFilter.opts[+el.dataset.fpick]; S.pick=o[0]; S.pickRating=o[1]||null; S.pickExtra=o[3]||null; S.selDev=null;
    toast(`${o[2]}: торкніться вільного місця на рейці`); renderAll(); $("scroller").scrollIntoView({behavior:"smooth",block:"start"}); return; }
  if(q("[data-fall]")){ S.devFilter=null; S.devOpen=true; S.allDev=true; renderAll(); return; }
  if(q("[data-gback]")){ S.allDev=false; S.pick=null; renderAll(); return; }
  if(el=q("[data-tpl]")){ closeDrawer(); const key=el.dataset.tpl;
    if(key==="__new"){ confirmLeave(()=>openWizard(false)); return; }
    confirmLeave(()=>{ applyTemplate(key); clearCheck(); S.mode=S.tplObj.demo&&S.tplObj.demo.script.length?"test":"mount"; S.devOpen=S.mode==="mount";
      toast("Шаблон завантажено","ok"); commit(); tplLabel(); renderProjBtn(); }); return; }

  if(q("#combBtn")){ if(S.comb) S.comb=null; else { const p=S.devices.filter(d=>d.type==="qf1p"); if(p.length<2){ toast("Потрібно щонайменше два автомати 1P","w"); return; }
      const sel=S.selDev&&devById(S.selDev), r=sel&&sel.type==="qf1p"?(sel.rail||0):(p[0].rail||0), sl=p.filter(d=>(d.rail||0)===r).map(d=>d.slot); if(sl.length<2){ toast("На цій рейці потрібно щонайменше два автомати 1P","w"); return; } S.comb={rail:r,from:Math.min(...sl),to:Math.max(...sl)}; } commit(); return; }
  if(el=q("[data-kind]")){ S.wireKind=el.dataset.kind; renderAll(); return; }
  if(el=q("[data-sec]")){ S.wireSec=+el.dataset.sec; renderAll(); return; }
  if(q("#clearWires")){ if(clearArm>Date.now()){ S.wires=[]; clearArm=0; S.selWire=null; commit(); } else { clearArm=Date.now()+3000; renderBar(); setTimeout(()=>{ if(S.mode==="wire") renderBar(); },3100); } return; }
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
    if(el=q("[data-qpos]")){ d.pos=+el.dataset.qpos; delete d.seqI; logp("w",`${desig(d)}: положення ${["0","I","II"][d.pos]}`); commit(false); return; }
    if(el=q("[data-atsv]")){ d.variant=el.dataset.atsv; commit(false); return; }
    if(el=q("[data-tqpos]")){ if(!d.manual){ toast("Ручка працює лише в режимі Manual","w"); return; } d.pos=el.dataset.tqpos; logp("w",`${desig(d)}: ручкою переведено на Source ${d.pos}`); commit(false); return; }
    if(el=q("[data-iset]")){ d.iset=+el.dataset.iset; logp("w",`${desig(d)}: уставка струму ${d.iset} А`); commit(false); return; }
    if(el=q("[data-cmd]")){ d.cmd=el.dataset.cmd==="1"; commit(false); return; }
    if(el=q("[data-hlc]")){ d.col=el.dataset.hlc; commit(false); return; }
    if(q("#devToggle")){ if(d.on&&!d.trip) d.on=false; else { d.on=true; d.trip=null; } commit(false); return; }
    if(q("[data-devdel]")){ const n=desig(d); removeDev(d); toast(`${n} знято з рейки. «Назад» поверне`); return; } }
  if(q("#btnCheck")){ checkNow(); return; }
  if(q("#shopBtn")){ openShop(); return; }
  if(q("#closeBtn")||q("[data-closeboard]")){ closeBoard(); return; }
  if(q("#zIn")){ S.zoom=Math.min(4,Math.round((S.zoom+(S.zoom>=1?0.5:0.1))*10)/10); renderAll(false); return; }
  if(q("#zOut")){ S.zoom=Math.max(0.3,Math.round((S.zoom-(S.zoom>1?0.5:0.1))*10)/10); renderAll(false); return; }
  if(q("#zFit")){ S.zoom=1; renderAll(false); return; }
});
document.addEventListener("change",e=>{ const t=e.target;
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
setInterval(()=>{ if(window.__dragBusy) return; if(!anySource()&&!S.demo) return; solve(0.5); render(); hint(); updateLive(); },500);
setInterval(()=>{ if(!S.demo||S.demo.paused) return; S.demo.left-=0.25; if(S.demo.left<=0) demoNext(); },250);
function renderTplMenu(){ const cats=[...TPL_ORDER,...new Set(Object.values(TPL).map(t=>t.cat))].filter((c,i,a)=>a.indexOf(c)===i);
  $("tplMenu").innerHTML=`<div class="tm-g"><button class="tm-i tm-new" data-tpl="__new">＋ Новий щит — майстер з покроковим помічником</button></div>`+cats.map(c=>{ const it=Object.entries(TPL).filter(([,t])=>t.cat===c&&!t.hidden); if(!it.length) return "";
    return `<div class="tm-g"><div class="tm-h">${esc(c)}</div>`+it.map(([key,t])=>`<button class="tm-i" data-tpl="${key}" aria-current="${S.tpl===key}">${esc(t.name)}</button>`).join("")+`</div>`; }).join(""); }
function tplLabel(){ const t=TPL[S.tpl]; $("tplName").textContent=S.tpl==="custom"?"Власний щит":t?t.name:"Шаблон"; }
document.addEventListener("toggle",e=>{ if(e.target.id==="devDD") S.devOpen=e.target.open; },true);
document.addEventListener("keydown",e=>{ if((e.key==="Delete"||e.key==="Backspace")&&S.selDev&&S.mode!=="wire"&&!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)&&$("dlg").hidden){ const b=document.querySelector("[data-devdel],[data-fdel]"); if(b){ e.preventDefault(); b.click(); } return; } })
document.addEventListener("keydown",e=>{ if(e.key!=="Escape") return; if(!$("drawer").hidden) closeDrawer(); else if(!$("docs").hidden) $("docs").hidden=true; });

