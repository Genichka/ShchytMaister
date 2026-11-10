/* ===== «Замовити апарат»: фото, QR-код і посилання. Дані — shop.json у корені сайту, картинки — папка shop/ ===== */
let SHOP=null, SHOP_T={};
// апарати з «Замовити», що є в бібліотеці (поле "type" у shop.json): на щитку на них QR замість напису EnergyUA
function shopIndex(){ SHOP_T={}; if(Array.isArray(SHOP)) for(const it of SHOP) if(it.type&&/^https?:/i.test(it.link||"")) for(const k of String(it.type).split(/[\s,]+/)) if(k) (SHOP_T[k]=SHOP_T[k]||[]).push(it); }
// кілька апаратів на один тип — береться той, у якого збігається виробник ("brand" у shop.json), інакше перший (для EnergyUA і фірмових апаратів)
const shopFor = d => { const L=SHOP_T[d.type]; if(!L) return null; const b=brandOf(d); return L.find(it=>it.brand===b)||(b==="eua"||T[d.type].maker?L[0]:null); };
function loadShop(){ try{ const c=JSON.parse(localStorage.getItem("pc-shop")||"null"); if(Array.isArray(c)){ SHOP=c; shopIndex(); } }catch(_){}
  fetch("shop.json?t="+Date.now(),{cache:"no-store"}).then(r=>r.ok?r.json():null).then(j=>{ if(!j) return; SHOP=Array.isArray(j)?j:((j&&j.items)||[]); shopIndex();
    try{ localStorage.setItem("pc-shop",JSON.stringify(SHOP)); }catch(_){} if(!S.noDoc&&!window.__dragBusy) render(); }).catch(()=>{}); }
setTimeout(loadShop,400);
const shopUrl = u => (u && /^(https?:\/\/|shop\/)/i.test(String(u).trim())) ? String(u).trim() : "";
function shopCards(list){
  if(list===null) return `<p class="shop-empty">Завантаження…</p>`;
  if(list==="off") return `<p class="shop-empty">Немає з'єднання — список апаратів з'явиться, коли буде інтернет.</p>`;
  if(!list.length) return `<p class="shop-empty">Скоро тут з'являться апарати з фото, QR-кодом і посиланням для замовлення.</p>`;
  return `<div class="shop">${list.map(it=>{ const link=shopUrl(it.link)&&/^https?:/i.test(it.link)?it.link.trim():"", ph=shopUrl(it.photo), qr=shopUrl(it.qr);
    return `<div class="shop-i">${ph?`<img class="shop-ph" src="${esc(ph)}" alt="${esc(it.name||"Апарат")}" loading="lazy">`:""}
      <b class="shop-n">${esc(it.name||"Апарат")}</b>${it.note?`<small class="shop-d">${esc(it.note)}</small>`:""}${it.price?`<span class="shop-p mono">${esc(it.price)}</span>`:""}
      <div class="shop-row">${qr?`<a class="qr" ${link?`href="${esc(link)}" target="_blank" rel="noopener"`:""}><img src="${esc(qr)}" alt="QR-код для замовлення" loading="lazy"></a>`:""}${link?`<a class="btn shop-go" href="${esc(link)}" target="_blank" rel="noopener">Замовити ↗</a>`:""}</div></div>`; }).join("")}</div>`; }
function shopShow(list){ dialog("Замовити апарат",`<p class="hint" style="margin:0">Апарати для щитка: наведи камеру на QR-код або натисни «Замовити».</p>${shopCards(list)}`,[{label:"Закрити"}]); }
function openShop(){
  shopShow(SHOP);
  fetch("shop.json?t="+Date.now(),{cache:"no-store"}).then(r=>{ if(!r.ok) throw 0; return r.json(); })
    .then(j=>{ SHOP=Array.isArray(j)?j:((j&&j.items)||[]); shopIndex(); })
    .catch(()=>{ if(SHOP===null) SHOP="off"; })
    .then(()=>{ const t=$("dlgTitle"); if(!$("dlg").hidden&&t&&t.textContent==="Замовити апарат") shopShow(SHOP); if(SHOP==="off") SHOP=null; }); }
// дотик по маленькому QR на апараті — поруч спливає великий код, який читає камера, і кнопка «Замовити»
function qrPopClose(){ const p=$("qrpop"); if(p) p.remove(); }
function qrPop(it,cx,cy){ qrPopClose(); const p=document.createElement("div"); p.id="qrpop"; p.className="qrpop"; p.setAttribute("role","dialog");
  p.innerHTML=`${qrSVG(it.link,196)}<b>${esc(it.name||"Апарат")}</b><small>Наведіть камеру телефона на код</small>`
    +`<div class="qp-row"><a class="btn primary" href="${esc(it.link)}" target="_blank" rel="noopener">🛒 Замовити ↗</a><button class="btn" data-qpmore>Фото й опис</button></div>`;
  document.body.appendChild(p); const r=p.getBoundingClientRect(), W=innerWidth, H=innerHeight;
  let x=cx-r.width/2, y=cy+16; if(y+r.height>H-8) y=cy-r.height-16;
  p.style.left=Math.max(8,Math.min(W-r.width-8,x))+"px"; p.style.top=Math.max(8,Math.min(H-r.height-8,y))+"px";
  p.querySelector("[data-qpmore]").onclick=()=>{ qrPopClose(); shopShow([it]); }; }
document.addEventListener("click",e=>{ const g=e.target.closest("[data-shopq]");
  if(!g){ if($("qrpop")&&!e.target.closest("#qrpop")) qrPopClose(); return; }
  e.stopPropagation(); e.preventDefault(); const it=Array.isArray(SHOP)&&SHOP.find(x=>x.link===g.dataset.shopq); if(it) qrPop(it,e.clientX,e.clientY); },true);
document.addEventListener("keydown",e=>{ if(e.key==="Escape") qrPopClose(); });
$("scroller").addEventListener("scroll",qrPopClose,{passive:true});
// апарати щита, які є в «Замовити»: для специфікації
function shopUsed(){ const m=new Map(); for(const d of S.devices){ const it=shopFor(d); if(!it) continue; const e=m.get(it.link)||{it,ds:[]}; e.ds.push(desig(d)); m.set(it.link,e); } return [...m.values()]; }
