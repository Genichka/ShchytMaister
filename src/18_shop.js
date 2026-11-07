/* ===== «Замовити апарат»: фото, QR-код і посилання. Дані — shop.json у корені сайту, картинки — папка shop/ ===== */
let SHOP=null;
const shopUrl = u => (u && /^(https?:\/\/|shop\/)/i.test(String(u).trim())) ? String(u).trim() : "";
function shopCards(list){
  if(list===null) return `<p class="shop-empty">Завантаження…</p>`;
  if(list==="off") return `<p class="shop-empty">Немає з'єднання — список апаратів з'явиться, коли буде інтернет.</p>`;
  if(!list.length) return `<p class="shop-empty">Скоро тут з'являться апарати з фото, QR-кодом і посиланням для замовлення.</p>`;
  return `<div class="shop">${list.map(it=>{ const link=shopUrl(it.link)&&/^https?:/i.test(it.link)?it.link.trim():"", ph=shopUrl(it.photo), qr=shopUrl(it.qr);
    return `<div class="shop-i">${ph?`<img class="shop-ph" src="${esc(ph)}" alt="${esc(it.name||"Апарат")}" loading="lazy">`:""}
      <b class="shop-n">${esc(it.name||"Апарат")}</b>${it.note?`<small class="shop-d">${esc(it.note)}</small>`:""}${it.price?`<span class="shop-p mono">${esc(it.price)}</span>`:""}
      <div class="shop-row">${qr?`<a class="qr" ${link?`href="${esc(link)}" target="_blank" rel="noopener"`:""}><img src="${esc(qr)}" alt="QR-код для замовлення" loading="lazy"></a>`:""}${link?`<a class="btn shop-go" href="${esc(link)}" target="_blank" rel="noopener">Замовити ↗</a>`:""}</div></div>`; }).join("")}</div>`; }
function shopShow(list){ dialog("Замовити апарат",`<p class="hint" style="margin:0">Апарати для щита: наведи камеру на QR-код або натисни «Замовити».</p>${shopCards(list)}`,[{label:"Закрити"}]); }
function openShop(){
  shopShow(SHOP);
  fetch("shop.json?t="+Date.now(),{cache:"no-store"}).then(r=>{ if(!r.ok) throw 0; return r.json(); })
    .then(j=>{ SHOP=Array.isArray(j)?j:((j&&j.items)||[]); })
    .catch(()=>{ if(SHOP===null) SHOP="off"; })
    .then(()=>{ const t=$("dlgTitle"); if(!$("dlg").hidden&&t&&t.textContent==="Замовити апарат") shopShow(SHOP); if(SHOP==="off") SHOP=null; }); }
