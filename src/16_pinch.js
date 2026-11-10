/* ===== Масштаб щитка двома пальцями (і щипком на тачпаді) ===== */
(function(){
  const sc=$("scroller"), Z_MIN=0.3, Z_MAX=4; let pin=null, blockClickUntil=0;
  const dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
  const mid=t=>({x:(t[0].clientX+t[1].clientX)/2, y:(t[0].clientY+t[1].clientY)/2});
  function zoomAt(z,cx,cy){ // тримаємо точку щитка під (cx,cy) на місці
    const svg=$("svg"), r=svg.getBoundingClientRect(), fx=(cx-r.left)/r.width, fy=(cy-r.top)/r.height;
    z=Math.max(Z_MIN,Math.min(Z_MAX,z)); S.zoom=z; svg.style.width=(z*100)+"%"; $("zFit").textContent=Math.round(z*100)+"%";
    const r2=svg.getBoundingClientRect(), sr=sc.getBoundingClientRect();
    sc.scrollLeft=Math.max(0,fx*r2.width-(cx-sr.left)); sc.scrollTop=Math.max(0,fy*r2.height-(cy-sr.top));
  }
  sc.addEventListener("touchstart",e=>{ if(e.touches.length===2){ const m=mid(e.touches); pin={d:dist(e.touches), z:S.zoom, x:m.x, y:m.y}; } },{passive:true});
  sc.addEventListener("touchmove",e=>{ if(!pin||e.touches.length!==2) return; e.preventDefault(); const m=mid(e.touches);
    zoomAt(pin.z*dist(e.touches)/pin.d, m.x, m.y); },{passive:false});
  const end=e=>{ if(pin&&e.touches.length<2){ pin=null; blockClickUntil=Date.now()+350; } };
  sc.addEventListener("touchend",end,{passive:true}); sc.addEventListener("touchcancel",end,{passive:true});
  sc.addEventListener("click",e=>{ if(Date.now()<blockClickUntil){ e.stopPropagation(); e.preventDefault(); } },true);
  sc.addEventListener("wheel",e=>{ if(!e.ctrlKey) return; e.preventDefault(); zoomAt(S.zoom*Math.exp(-e.deltaY*0.01), e.clientX, e.clientY); },{passive:false});
})();
