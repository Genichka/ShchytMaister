/* ===== Версія, перевірка й встановлення оновлень ===== */
(function(){
  const fmtD = s => String(s).split("-").reverse().join(".");
  const cmp = (a,b) => { const x=String(a).split(".").map(Number), y=String(b).split(".").map(Number);
    for(let i=0;i<Math.max(x.length,y.length);i++){ const d=(x[i]||0)-(y[i]||0); if(d) return d; } return 0; };
  const btn=$("updBtn"), modal=$("upd"); let remote=null;
  $("ver").textContent=`v${APP.v} · ${fmtD(APP.date)}`;
  async function fetchRemote(){ const r=await fetch("version.json?t="+Date.now(),{cache:"no-store"}); if(!r.ok) throw new Error(r.status); return r.json(); }
  function show(mode,info){
    const isNew=mode==="new";
    $("updCard").innerHTML=`<h2 id="updTitle">${isNew?"Доступна нова версія":"Що нового"}</h2>
      <p class="mono upd-v">${isNew?`v${esc(APP.v)} → <b>v${esc(info.v)}</b> від ${fmtD(info.date)}`:`v${esc(info.v)} від ${fmtD(info.date)}`}</p>
      <ul>${(info.notes||[]).map(n=>`<li>${esc(n)}</li>`).join("")}</ul>
      ${isNew?`<p class="hint">Зібраний щит збережеться: він лежить у пам’яті браузера.</p>`:""}
      <div class="row" style="justify-content:flex-end">${isNew?`<button class="btn" data-upd="later">Пізніше</button><button class="btn primary" data-upd="go">Оновити зараз</button>`:`<button class="btn primary" data-upd="later">Закрити</button>`}</div>`;
    modal.hidden=false; const f=modal.querySelector(".btn.primary"); if(f) f.focus(); }
  async function check(silent){
    try{ remote=await fetchRemote();
      if(cmp(remote.v,APP.v)>0){ btn.classList.add("has"); btn.title=`Доступна версія v${remote.v}`; if(!silent) show("new",remote); }
      else { btn.classList.remove("has"); btn.title="Перевірити оновлення"; if(!silent) toast(`У вас остання версія v${APP.v} від ${fmtD(APP.date)}`,"ok"); } }
    catch(e){ if(!silent) toast("Не вдалося перевірити оновлення. Перевірте підключення до інтернету.","w"); } }
  function apply(){ save(); const u=new URL(location.href); u.searchParams.set("v",remote.v); location.replace(u.toString()); }
  document.addEventListener("click",e=>{
    if(e.target.closest("#updBtn")){ check(false); return; }
    if(e.target.closest("#ver")){ show("cur",APP); return; }
    const b=e.target.closest("[data-upd]"); if(b){ modal.hidden=true; if(b.dataset.upd==="go"&&remote) apply(); return; }
    if(e.target===modal) modal.hidden=true; });
  document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&!modal.hidden) modal.hidden=true; if((e.key==="Enter"||e.key===" ")&&e.target.id==="ver"){ e.preventDefault(); show("cur",APP); } });
  try{ const last=localStorage.getItem("shchyt-ver");
    if(last&&last!==APP.v) setTimeout(()=>toast(`Оновлено до v${APP.v} від ${fmtD(APP.date)}`,"ok"),600);
    localStorage.setItem("shchyt-ver",APP.v); }catch(e){}
  try{ const u=new URL(location.href); if(u.searchParams.has("v")){ u.searchParams.delete("v"); history.replaceState(null,"",u.toString()); } }catch(e){}
  setTimeout(()=>check(true),1500); setInterval(()=>check(true),30*60*1000);
})();
