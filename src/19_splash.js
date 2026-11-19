/* ===== Заставка при запуску: інтро EnergyUA (зі звуком, якщо браузер дозволяє) → QR із посиланням на застосунок,
   група EnergyUA в Telegram, «Поділитися», «Пропустити». Не показується після «Оновити» і в автотестах (?nosplash) ===== */
(function splash(){ const el=$("splash"); if(!el) return;
  const LINK="https://genichka.github.io/ShchytMaister/", v=$("splV"), card=$("splCard");
  let skip=false; try{ const u=new URL(location.href); skip=u.searchParams.has("nosplash")||(navigator.webdriver&&!u.searchParams.has("splash"))||sessionStorage.getItem("pc-nosplash")==="1"; sessionStorage.removeItem("pc-nosplash"); }catch(e){}
  if(skip){ el.remove(); return; }
  const close=()=>{ if(el.classList.contains("out")) return; el.classList.add("out"); try{ v.pause(); }catch(e){} setTimeout(()=>el.remove(),380); document.removeEventListener("keydown",key); };
  const showCard=()=>{ if(el.classList.contains("card")) return; $("splQR").innerHTML=qrSVG(LINK,200); el.classList.add("card"); card.setAttribute("aria-hidden","false"); setTimeout(()=>{ try{ v.pause(); }catch(e){} },500); };
  const key=e=>{ if(e.key==="Escape") close(); };
  document.addEventListener("keydown",key);
  $("splSkipV").onclick=close; $("splSkip").onclick=close;
  $("splShare").onclick=async()=>{ const data={title:"PanelCraft — симулятор електрощита",text:"Склади й перевір електрощит: PanelCraft від EnergyUA",url:LINK};
    try{ if(navigator.share){ await navigator.share(data); return; } }catch(e){ if(e&&e.name==="AbortError") return; }
    try{ await navigator.clipboard.writeText(LINK); toast("Посилання скопійовано — надішли його друзям","ok"); }catch(e){ toast(LINK,"ok"); } };
  // інтро: спершу зі звуком; якщо браузер не дає — без звуку; не вийшло зовсім — одразу картка
  v.addEventListener("ended",showCard); v.addEventListener("error",showCard);
  const t=setTimeout(showCard,6000);   // запасний вихід, якщо відео не завантажилось
  v.addEventListener("ended",()=>clearTimeout(t));
  v.muted=false; v.play().catch(()=>{ v.muted=true; v.play().catch(showCard); });
})();
