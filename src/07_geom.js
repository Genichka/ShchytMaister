/* ===== Геометрія щита, трасування дротів, малювання ===== */
const G = { W:840, X0:96, MW:54, INY:36 };
const devTop = r => 208 + r*380, devBot = r => devTop(r)+240;
const busY = () => devBot(S.board.rails-1)+118, enclB = () => busY()+36, panelH = () => enclB()+10;
const fieldY = () => panelH()+34;
function fieldLayout(){ const out=[]; let x=24, row=0; for(const f of S.field){ const w=FT[f.type].fw; if(x+w>824&&x>24){ x=24; row++; } out.push({f,x,y:fieldY()+row*170}); x+=w+14; } return {items:out, rows:out.length?row+1:0}; }
const totalH = () => S.field.length ? fieldY()+fieldLayout().rows*170 : panelH();
let LSP={}, SSP={L:7,R:7};
const laneY = (c,s,i) => { const sp=LSP[c+s]||7; return s==="l" ? devTop(c)-20-sp*i : devBot(c-1)+20+sp*i; };
const sideX = (side,i) => side==="L" ? 86-(SSP.L||7)*i : 754+(SSP.R||7)*i;
const SW = {1.5:3,2.5:3.6,4:4.3,6:5,10:6,16:7,25:7.6,35:8.2,50:9};
function inputX(){ const m={}; let x=120;
  for(const inp of S.board.inputs){ inp.terms.forEach((t,i)=>{ m[inp.id+":"+t]=x+i*36; }); m[inp.id]=x; x+=inp.terms.length*36+34; } return m; }
function busRow(){ const b=S.board, n=b.xn, m=b.xt.length, p=b.xpe, cnt=n+m+p, gaps=(m?2:1)*20;
  let sp=28; if(cnt*sp+gaps>600) sp=(600-gaps)/cnt; const pos={}; let x=124;
  for(let i=0;i<n;i++){ pos["xn:"+i]=x; x+=sp; } x+=20-sp+sp;
  if(m){ b.xt.forEach(t=>{ pos["xt:"+t.k]=x; x+=sp; }); x+=20; }
  const shift=Math.max(0,716-(x+(p-1)*sp)); x+=shift; for(let i=0;i<p;i++){ pos["xpe:"+i]=x; x+=sp; }
  return {pos,sp}; }
let GEO=null;
function geoCache(){ GEO={inx:inputX(), bus:busRow()}; return GEO; }
function termX(d,t){ const def=T[d.type]; if(t.m!==undefined) return G.X0+(d.slot+t.m)*G.MW+G.MW/2;
  const side=def.terms.filter(x=>x.s===t.s), i=side.indexOf(t); return G.X0+d.slot*G.MW+(i+0.5)*(def.w*G.MW)/side.length; }
function termPos(key){
  const [o,k]=key.split(":"), R=S.board.rails, g=GEO||geoCache();
  if(S.board.inputs.some(i=>i.id===o)) return {x:g.inx[key], y:G.INY, c:0, s:"l"};
  if(o==="xn"||o==="xpe"||o==="xt"){ const x=g.bus.pos[key]; return x===undefined?null:{x, y:busY(), c:R, s:"u"}; }
  const d=S.devices.find(x=>x.id===o); if(!d) return null; const t=T[d.type].terms.find(t=>t.k===k); if(!t) return null; const r=d.rail||0;
  return t.s==="top" ? {x:termX(d,t), y:devTop(r)+22, c:r, s:"l"} : {x:termX(d,t), y:devBot(r)-22, c:r+1, s:"u"};
}
function route(){
  const items=[];
  for(const w of S.wires){ let A=termPos(w.a), B=termPos(w.b); if(!A||!B) continue;
    if(A.c===B.c){ const set=(A.s==="u"||B.s==="u")?"u":"l"; items.push({w,A,B,cross:false,set,span:Math.abs(A.x-B.x)}); }
    else { if(A.c>B.c) [A,B]=[B,A]; const side=(A.x+B.x)/2<G.W/2?"L":"R", sx=sideX(side,0);
      items.push({w,A,B,cross:true,side,span:Math.abs(A.x-sx)+Math.abs(B.x-sx)+Math.abs(A.c-B.c)*50}); } }
  const lanes={};
  const take=(key,a,b)=>{ const lo=Math.min(a,b)-7, hi=Math.max(a,b)+7, L=lanes[key]||(lanes[key]=[]);
    for(let i=0;;i++){ const q=L[i]||(L[i]=[]); if(!q.some(([p,r])=>lo<r&&p<hi)){ q.push([lo,hi]); return i; } } };
  items.sort((p,q)=>p.span-q.span);
  for(const it of items){ if(!it.cross) it.lane=take(it.A.c+it.set,it.A.x,it.B.x);
    else { const sx=sideX(it.side,3); it.la=take(it.A.c+it.A.s,it.A.x,sx); it.lb=take(it.B.c+it.B.s,it.B.x,sx); } }
  for(const side of ["L","R"]){ const cs=items.filter(i=>i.cross&&i.side===side).sort((p,q)=>(p.la+p.lb)-(q.la+q.lb)); cs.forEach((it,i)=>it.ls=i); SSP[side]=Math.max(2.2,Math.min(7,60/Math.max(1,cs.length-0.5))); }
  LSP={}; const R=S.board.rails, n=key=>(lanes[key]||[]).length;
  for(const key of Object.keys(lanes)){ const c=parseInt(key), st=key.slice(-1); let avail;
    if(st==="l"&&c===0) avail=devTop(0)-20-92; else if(st==="u"&&c===R) avail=busY()-30-(devBot(R-1)+20);
    else avail=(devTop(c)-devBot(c-1)-40)*n(key)/Math.max(1,n(c+"u")+n(c+"l"));
    LSP[key]=Math.max(2.5,Math.min(7,avail/Math.max(1,n(key)-0.5))); }
  const out={};
  for(const it of items){ const {A,B}=it;
    if(!it.cross){ const y=laneY(A.c,it.set,it.lane); out[it.w.id]=[[A.x,A.y],[A.x,y],[B.x,y],[B.x,B.y]]; }
    else { const sx=sideX(it.side,it.ls), ya=laneY(A.c,A.s,it.la), yb=laneY(B.c,B.s,it.lb); out[it.w.id]=[[A.x,A.y],[A.x,ya],[sx,ya],[sx,yb],[B.x,yb],[B.x,B.y]]; } }
  return out;
}
function rpath(pts,r=7){
  const p=pts.filter((q,i)=>i===0||q[0]!==pts[i-1][0]||q[1]!==pts[i-1][1]); let d="M"+p[0][0]+" "+p[0][1];
  for(let i=1;i<p.length-1;i++){ const [x0,y0]=p[i-1],[x1,y1]=p[i],[x2,y2]=p[i+1];
    const l1=Math.hypot(x1-x0,y1-y0), l2=Math.hypot(x2-x1,y2-y1), rr=Math.min(r,l1/2,l2/2);
    if(rr<1||(x0===x1&&x1===x2)||(y0===y1&&y1===y2)){ d+=" L"+x1+" "+y1; continue; }
    d+=` L${(x1-(x1-x0)/l1*rr).toFixed(1)} ${(y1-(y1-y0)/l1*rr).toFixed(1)} Q${x1} ${y1} ${(x1+(x2-x1)/l2*rr).toFixed(1)} ${(y1+(y2-y1)/l2*rr).toFixed(1)}`; }
  const q=p[p.length-1]; return d+" L"+q[0]+" "+q[1];
}
const screw = (x,y,r=11) => `<circle class="screw" cx="${x}" cy="${y}" r="${r}"/><path class="screw-x" d="M${x-r*0.55} ${y}h${r*1.1}M${x} ${y-r*0.55}v${r*1.1}"/>`;
function devSVG(d){
  const t=T[d.type], r=d.rail||0, x=G.X0+d.slot*G.MW+1, w=t.w*G.MW-2, y=devTop(r), cx=x+w/2, on=d.on&&!d.trip, heat=S.heat[d.id]||0, H=240;
  let s=`<g data-dev="${d.id}">`;
  if(heat>0.15) s+=`<rect class="heat" x="${x-3}" y="${y-3}" width="${w+6}" height="${H+6}" rx="6" fill="none" stroke="var(--orange)" stroke-width="3"/>`;
  if(S.selDev===d.id) s+=`<rect x="${x-3}" y="${y-3}" width="${w+6}" height="${H+6}" rx="6" fill="none" stroke="var(--blue)" stroke-width="2.5"/>`;
  s+=`<rect class="devb" x="${x}" y="${y}" width="${w}" height="${H}" rx="4"/><rect class="devf" x="${x+3}" y="${y+46}" width="${w-6}" height="118" rx="2"/>`;
  const sr=t.terms.filter(q=>q.s==="top").length>w/27?9:11;
  for(const tm of t.terms){ const X=termX(d,tm);
    if(tm.s==="top") s+=screw(X,y+22,sr)+tx(X,y+42,tm.l,{fs:6.8}); else s+=screw(X,y+H-22,sr)+tx(X,y+H-36,tm.l,{fs:6.8}); }
  s+=tx(cx,y+56,"EnergyUA",{fs:7,fw:700});
  if(t.face) s+=t.face(d,{x,y,w,cx,on});
  const des=desig(d), pw=Math.max(38,des.length*7+12);
  s+=`<rect x="${cx-pw/2}" y="${y+168}" width="${pw}" height="15" rx="7.5" fill="#fade2a" stroke="#b39800"/>`+tx(cx,y+179,des,{fs:9.5,fw:700,ff:"var(--mono)",fill:"#222"});
  const gc=d.group?d.group.color:(d.capColor||"#8f93a2"); s+=`<rect x="${x+2}" y="${y+188}" width="${w-4}" height="5" fill="${gc}"/>`;
  const cap=d.group?d.group.name:(d.cap||t.cap||t.short), maxc=Math.max(7,Math.floor(w/7)); const lines=[]; let cur="";
  for(const wd of String(cap).split(/\s+/)){ if((cur+" "+wd).trim().length>maxc&&cur){ lines.push(cur); cur=wd; } else cur=(cur+" "+wd).trim(); } if(cur) lines.push(cur);
  lines.slice(0,2).forEach((ln,i)=>{ s+=tx(cx,y+203+i*9,ln.length>maxc+2?ln.slice(0,maxc+1)+"…":ln,{fs:7}); });
  if(d.trip) s+=`<circle cx="${x+w-8}" cy="${y+8}" r="7" fill="var(--red)"/><text x="${x+w-8}" y="${y+12}" font-size="10" font-weight="700" text-anchor="middle" fill="#fff">!</text>`;
  return s+"</g>";
}
function render(){
  geoCache(); const R=S.sim||{liveW:new Set()}, svg=$("svg"), H=totalH(), B=busY(), b=S.board, inx=GEO.inx; let s="";
  svg.setAttribute("viewBox",`0 0 840 ${H}`);
  s+=`<rect class="encl" x="14" y="70" width="812" height="${enclB()-70}" rx="10"/><rect class="encl-in" x="26" y="82" width="788" height="${enclB()-94}" rx="6"/>`;
  for(const [cx,cy] of [[44,100],[796,100],[44,enclB()-30],[796,enclB()-30]]) s+=`<circle cx="${cx}" cy="${cy}" r="6" fill="none" stroke="var(--muted)" stroke-width="1.5"/>`;
  for(let r=0;r<b.rails;r++) s+=`<rect class="rail" x="40" y="${devTop(r)+64}" width="760" height="46" rx="2" opacity=".55"/><rect class="rail" x="40" y="${devTop(r)+74}" width="760" height="26" opacity=".9"/>`;
  const used=S.devices.reduce((a,d)=>a+T[d.type].w,0);
  s+=`<text class="lab" x="810" y="78" font-size="10" text-anchor="end">${b.rails>1?"ЩРН-"+12*b.rails:"ЩРН-12"} · ${12*b.rails} модулів · зайнято ${used}</text>`;
  const bp=GEO.bus.pos, sp=GEO.bus.sp, xs=k=>bp[k];
  if(b.xn){ s+=`<rect x="${xs("xn:0")-16}" y="${B-12}" width="${xs("xn:"+(b.xn-1))-xs("xn:0")+32}" height="24" rx="3" fill="#2f6fdf"/>`+tx(xs("xn:0")-16,B-18,"N · XN1",{c:"lab",fs:10,a:"start"}); }
  if(b.xpe){ const a=xs("xpe:0")-16, w=xs("xpe:"+(b.xpe-1))-xs("xpe:0")+32; s+=`<rect x="${a}" y="${B-12}" width="${w}" height="24" rx="3" fill="#f2c400"/>`;
    for(let i=0;i<b.xpe;i++) s+=`<rect x="${xs("xpe:"+i)-7}" y="${B-12}" width="14" height="24" fill="#2e9a3e" opacity=".85"/>`; s+=tx(a,B-18,"PE · XPE1",{c:"lab",fs:10,a:"start"}); }
  if(b.xt.length){ const a=xs("xt:"+b.xt[0].k)-14, z=xs("xt:"+b.xt[b.xt.length-1].k)+14; s+=`<rect x="${a}" y="${B-14}" width="${z-a}" height="28" rx="2" fill="#7c8590"/>`+tx(a,B-18,"XT1 · до обладнання",{c:"lab",fs:10,a:"start"});
    for(const t of b.xt){ const x=xs("xt:"+t.k); s+=`<text class="lab" x="${x+3}" y="${B+20}" font-size="7.5" text-anchor="end" transform="rotate(-60 ${x+3} ${B+20})">${esc(t.l)}</text>`; } }
  for(const k of Object.keys(bp)) s+=screw(bp[k],B,sp<26?9:11);
  for(const inp of b.inputs){ const src=S.src[inp.id]||{}, x0=inx[inp.id];
    s+=tx(x0-16,12,inp.label+(inp.terms.every(t=>t==="PE")?"":" · "+(src.on?"~"+Math.round(src.U*(inp.terms.includes("L1")?1.732:1))+" В":"0 В")),{c:"lab",fs:9.5,a:"start",fill:src.on?"var(--green)":undefined});
    for(const t of inp.terms){ const x=inx[inp.id+":"+t]; s+=`<rect x="${x-16}" y="20" width="32" height="32" rx="3" fill="var(--panel2)" stroke="var(--line)"/>`+screw(x,G.INY)+tx(x,64,t,{c:"lab",fs:8.5}); } }
  if(S.mode==="mount") for(let r=0;r<b.rails;r++) for(let i=0;i<SLOTS;i++){ if(devAt(r,i)) continue; const fits=!S.pick||freeAt(r,i,T[S.pick].w);
    s+=`<rect class="slot" data-slot="${r}:${i}" x="${G.X0+i*G.MW+3}" y="${devTop(r)}" width="${G.MW-6}" height="240" rx="4" style="${S.pick&&fits?"stroke:var(--blue);opacity:1":""}${S.pick&&!fits?";opacity:.2":""}"/>`+tx(G.X0+i*G.MW+G.MW/2,devTop(r)+130,String(r*12+i+1),{c:"lab",fs:10}); }
  for(const d of S.devices) s+=devSVG(d);
  if(S.comb){ const cr=S.comb.rail||0, cov=S.devices.filter(d=>d.type==="qf1p"&&(d.rail||0)===cr&&d.slot>=S.comb.from&&d.slot<=S.comb.to).map(d=>G.X0+d.slot*G.MW+G.MW/2), y=devTop(cr);
    if(cov.length){ const a=Math.min(...cov)-10, z=Math.max(...cov)+10; for(const x of cov) s+=`<rect x="${x-3}" y="${y-10}" width="6" height="24" fill="var(--brass)"/>`;
      s+=`<rect x="${a}" y="${y-14}" width="${z-a}" height="9" rx="2" fill="var(--brass)" stroke="#9b7d22"/>`+tx(a,y-18,`Гребінка 1P · ${cov.length} мод.`,{c:"lab",fs:8.5,a:"start"}); } }
  if(S.field.length){ for(const {f,x,y:fy} of fieldLayout().items){ const ft=FT[f.type], cx=x+ft.fw/2; let k=0;
      for(const tk of ft.terms){ const key=f.map[tk], X=bp[key]; if(X===undefined) continue;
        s+=`<path d="M${X} ${B+12} V${enclB()+6+k*3} H${cx-12+k*5} V${fy}" fill="none" stroke="#6b7380" stroke-width="2.4" stroke-linejoin="round"/>`; k++; }
      s+=`<g data-field="${f.id}" style="cursor:pointer">${ft.draw(f,x,fy)}</g>`+(S.selDev===f.id?`<rect x="${x-3}" y="${fy-3}" width="${ft.fw+6}" height="156" rx="10" fill="none" stroke="var(--blue)" stroke-width="2.5"/>`:""); } }
  const P=route();
  for(const w of S.wires){ const pts=P[w.id]; if(!pts) continue; const d=rpath(pts), sw=SW[w.sec]||4, col=wHex(w), pe=wColKey(w)==="pe";
    if(S.selWire===w.id) s+=`<path class="wsel${S.moveEnd?" moving":""}" d="${d}" stroke-width="${sw+10}"/>`;
    s+=`<path class="wire" d="${d}" stroke="${wDark(w)?"#8a9099":"var(--encl-in)"}" stroke-width="${sw+2.5}"/>`;
    if(pe) s+=`<path class="wire" d="${d}" stroke="var(--wPEy)" stroke-width="${sw}"/><path class="wire" d="${d}" stroke="var(--wPEg)" stroke-width="${sw}" stroke-dasharray="9 9" stroke-linecap="butt"/>`;
    else s+=`<path class="wire" d="${d}" stroke="${col}" stroke-width="${sw}"/>`;
    if(R.liveW.has(w.id)) s+=`<path class="flow" d="${d}" stroke-width="${Math.max(1.5,sw-2.5)}"/>`;
    for(const [x,y] of [pts[0],pts[pts.length-1]]) s+=`<circle cx="${x}" cy="${y}" r="4" fill="var(--brass)"/>`;
    if(S.selWire===w.id){ const ends=[["a",pts[0]],["b",pts[pts.length-1]]]; for(const [e,[x,y]] of ends) s+=`<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="var(--blue)" stroke-width="2.5"${S.moveEnd&&S.moveEnd.end===e?' stroke-dasharray="4 3"':""}/>`; }
    if(!S.moveEnd&&!S.demo) s+=`<path class="wire-hit" data-wire="${w.id}" d="${d}"/>`; }
  if(S.mode==="wire"){ for(const k of allTermKeys()){ const p=termPos(k); if(!p) continue;
      if(S.pend===k) s+=`<circle class="term-sel" cx="${p.x}" cy="${p.y}" r="14"/>`;
      else if(S.moveEnd){ const mw=wireById(S.moveEnd.id); if(mw&&kindFits(mw.kind,termRole(k))) s+=`<circle class="term-ok" cx="${p.x}" cy="${p.y}" r="12"/>`; }
      else if(S.pend&&kindFits(S.wireKind,termRole(k))) s+=`<circle class="term-ok" cx="${p.x}" cy="${p.y}" r="12"/>`;
      s+=`<circle class="term-hit" data-term="${k}" cx="${p.x}" cy="${p.y}" r="15"/>`; } }
  svg.innerHTML=s;
}
