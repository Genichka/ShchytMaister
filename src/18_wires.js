/* ===== Керування дротами: вид, колір ізоляції, переріз, перенесення кінців, видалення ===== */
const WCOL = { red:["Червоний","#e0352b"], brown:["Коричневий","#8b5a2b"], black:["Чорний","#26282c"], grey:["Сірий","#9aa0a6"],
  blue:["Синій","#2f6fdf"], pe:["Жовто-зелений",null], orange:["Помаранчевий","#f08c2e"], white:["Білий","#eef0f2"] };
const wColKey = w => w.col || (w.kind==="PE" ? "pe" : null);
const wHex = w => { const c=w.col; if(c) return WCOL[c][1]; return WK[w.kind] ? WK[w.kind][1] : "#888"; };
const wDark = w => ["black"].includes(w.col) || (!w.col && (w.kind==="L2"||w.kind==="DC-"));
const wireById = id => S.wires.find(w=>w.id===id);
const wNo = w => S.wires.indexOf(w)+1;
const swatch = (kindOrCol,isCol) => { const pe=isCol?kindOrCol==="pe":kindOrCol==="PE";
  const bg=pe?"linear-gradient(90deg,var(--wPEy) 50%,var(--wPEg) 50%)":(isCol?WCOL[kindOrCol][1]:WK[kindOrCol][1]); return `<span class="sw" style="background:${bg}"></span>`; };
function wireLabel(w){ return `${WK[w.kind][0]} · ${fmt(w.sec,w.sec%1?1:0)} мм²${w.col?" · "+WCOL[w.col][0].toLowerCase():""}`; }
function selectWire(id){ S.selWire=id; S.moveEnd=null; S.pend=null; S.selDev=null; renderAll(false); renderTools(); }
function renderWireSheet(w){ const sh=$("sheet"); sh.hidden=false; const me=S.moveEnd&&S.moveEnd.id===w.id?S.moveEnd.end:null, colKey=wColKey(w);
  let s=`<div class="sheet-h"><b>Дріт ${wNo(w)} з ${S.wires.length} · ${esc(wireLabel(w))}</b><div class="row nowrap"><button class="btn" data-wnav="-1" aria-label="Попередній дріт">◀</button><button class="btn" data-wnav="1" aria-label="Наступний дріт">▶</button><button class="btn" id="wClose">Готово</button></div></div>`;
  if(me) s+=`<div class="wmove">Торкніться нової клеми для ${me==="a"?"початку":"кінця"} дроту. <button class="btn" data-wmove="cancel">Скасувати перенесення</button></div>`;
  s+=`<div class="wends">${["a","b"].map(e=>`<div class="wend${me===e?" on":""}"><span class="lbl">${e==="a"?"Початок":"Кінець"}</span><span class="wterm">${esc(termName(w[e]))}</span><button class="btn" data-wmove="${e}">Перенести</button></div>`).join("")}</div>`;
  s+=`<div class="row"><span class="lbl">Вид</span>`+Object.keys(WK).map(x=>`<button class="chip" data-skind="${x}" aria-pressed="${w.kind===x}">${swatch(x)}${WK[x][0]}</button>`).join("")+`</div>`;
  s+=`<div class="row"><span class="lbl">Колір</span><button class="chip" data-scol="" aria-pressed="${!w.col}">За видом</button>`+Object.keys(WCOL).map(c=>`<button class="chip" data-scol="${c}" aria-pressed="${w.col===c}">${swatch(c,true)}${WCOL[c][0]}</button>`).join("")+`</div>`;
  s+=`<div class="row"><span class="lbl">Переріз</span>`+SECS.map(x=>`<button class="chip mono" data-ssec="${x}" aria-pressed="${w.sec===x}">${fmt(x,x%1?1:0)}</button>`).join("")+`<span class="hint" style="flex:0 0 auto">мм²</span></div>`;
  s+=`<div class="row"><button class="btn" data-wall="sec">Цей переріз — усім дротам лінії</button><button class="btn danger" data-wdel>Видалити дріт</button></div>`;
  if(colKey&&((PHK.includes(w.kind)||w.kind==="C")&&(colKey==="blue"||colKey==="pe")||w.kind==="N"&&colKey!=="blue"||w.kind==="PE"&&colKey!=="pe"||w.kind!=="PE"&&colKey==="pe"))
    s+=`<p class="wwarn">Колір не за правилами: синій — лише нуль N, жовто-зелений — лише PE. Перевірка схеми покаже це як помилку.</p>`;
  $("sheetIn").innerHTML=s; }
function wireListHTML(){ if(!S.wires.length) return "";
  return `<details class="dd2" id="wireDD"${S.wListOpen?" open":""}><summary><span>Усі дроти</span><span class="cnt">${S.wires.length}</span></summary><div class="wlist">`
    +S.wires.map((w,i)=>`<button class="wli" data-wsel="${w.id}" aria-pressed="${S.selWire===w.id}">${swatch(w.col||w.kind,!!w.col)}<span class="wli-t"><b>${i+1}. ${esc(wireLabel(w))}</b><small>${esc(termName(w.a))} → ${esc(termName(w.b))}</small></span></button>`).join("")+`</div></details>`; }
function lineWires(w){ // дроти того ж виду, з’єднані без апаратів (одна «лінія»)
  const f=build({allOpen:true}), r=f(w.a); return S.wires.filter(x=>x.kind===w.kind&&f(x.a)===r); }
function moveEnd(key){ const m=S.moveEnd, w=wireById(m.id); if(!w){ S.moveEnd=null; return; }
  const other=m.end==="a"?w.b:w.a;
  if(key===other){ toast("Обидва кінці не можуть бути на одній клемі","w"); return; }
  if(S.wires.some(x=>x!==w&&((x.a===key&&x.b===other)||(x.b===key&&x.a===other)))){ toast("Такий дріт уже є","w"); return; }
  if(S.wires.filter(x=>x!==w&&(x.a===key||x.b===key)).length>=2&&!/^x(n|pe):/.test(key)) toast("Під одну клему — не більше двох дротів","w");
  w[m.end]=key; S.moveEnd=null; toast(`Перенесено на ${termName(key)}`,"ok"); commit(false); renderTools(); }
document.addEventListener("click",e=>{ const q=s=>e.target.closest(s); let el; const w=S.selWire&&wireById(S.selWire);
  if(el=q("[data-wsel]")){ selectWire(el.dataset.wsel); $("scroller").scrollIntoView({behavior:"smooth",block:"start"}); return; }
  if(!w) return;
  if(el=q("[data-skind]")){ w.kind=el.dataset.skind; commit(false); renderTools(); return; }
  if(el=q("[data-scol]")){ w.col=el.dataset.scol||undefined; if(!w.col) delete w.col; commit(false); renderTools(); return; }
  if(el=q("[data-ssec]")){ w.sec=+el.dataset.ssec; commit(false); renderTools(); return; }
  if(q("[data-wall]")){ const L=lineWires(w); L.forEach(x=>x.sec=w.sec); toast(`Переріз ${fmt(w.sec,w.sec%1?1:0)} мм² — для ${L.length} дрот${L.length===1?"у":"ів"} лінії`,"ok"); commit(false); renderTools(); return; }
  if(q("[data-wdel]")){ S.wires=S.wires.filter(x=>x!==w); S.selWire=null; S.moveEnd=null; toast("Дріт видалено. «Скасувати» поверне його"); commit(); return; }
  if(el=q("[data-wmove]")){ const v=el.dataset.wmove; S.moveEnd=v==="cancel"?null:{id:w.id,end:v}; S.pend=null; renderAll(false); return; }
  if(el=q("[data-wnav]")){ const i=S.wires.indexOf(w), n=S.wires.length; selectWire(S.wires[(i+(+el.dataset.wnav)+n)%n].id); return; }
  if(q("#wClose")){ S.selWire=null; S.moveEnd=null; renderAll(true); return; } });
document.addEventListener("keydown",e=>{ if(S.mode!=="wire"||!S.selWire||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if(e.key==="Delete"||e.key==="Backspace"){ e.preventDefault(); document.querySelector("[data-wdel]")?.click(); }
  if(e.key==="Escape"){ S.selWire=null; S.moveEnd=null; renderAll(true); } });
document.addEventListener("toggle",e=>{ if(e.target.id==="wireDD") S.wListOpen=e.target.open; },true);
