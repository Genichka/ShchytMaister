/* ===== Допоміжні елементи малювання + базові апарати ===== */
const tx = (x,y,s,o={}) => `<text class="${o.c||"svs"}" x="${x}" y="${y}" font-size="${o.fs||7.5}" text-anchor="${o.a||"middle"}"${o.fw?` font-weight="${o.fw}"`:""}${o.fill?` style="fill:${o.fill}"`:""}${o.ff?` font-family="${o.ff}"`:""}>${esc(s)}</text>`;
function lever(d,cx,y,lw,on,col){
  let s=`<g data-lever="${d.id}" style="cursor:pointer"><rect x="${cx-lw/2-4}" y="${y-4}" width="${lw+8}" height="48" rx="3" fill="#2a2d33"/>`;
  s+=`<rect x="${cx-lw/2}" y="${on?y:y+20}" width="${lw}" height="20" rx="2" fill="${col||"#45494f"}" stroke="#1a1c20"/>`;
  return s+`<rect x="${cx-lw/2+3}" y="${(on?y:y+20)+4}" width="${lw-6}" height="2" fill="#777"/><rect x="${cx-lw/2+3}" y="${(on?y:y+20)+9}" width="${lw-6}" height="2" fill="#777"/></g>`;
}
const flag = (cx,y,on) => `<rect x="${cx-6}" y="${y}" width="12" height="6" rx="1" fill="${on?"#e0352b":"#2e9a3e"}"/>`;
const led = (x,y,c) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${c}" stroke="#555"/>`;
const lcd = (x,y,w,h,txt,on,col) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#16181c"/>`+(Array.isArray(txt)?txt:[txt]).map((t,i,a)=>`<text x="${x+w/2}" y="${y+(h/(a.length))*(i+0.5)+ (a.length>1?3:5)}" font-size="${a.length>1?8:15}" text-anchor="middle" font-family="var(--mono)" font-weight="600" fill="${on?(col||"#5fe36b"):"#3a3f47"}">${esc(t)}</text>`).join("");
function breakerFace(d,g){ const m=typeof modelOf==="function"?modelOf(d):""; let s=(m?tx(g.cx,g.y+66,m,{fs:g.w>60?6.6:5.2}):"")+tx(g.cx,g.y+84,d.rating,{c:"svt",fs:g.w>60?17:15}); s+=lever(d,g.cx,g.y+102,g.w>60?44:20,g.on); return s+flag(g.cx,g.y+150,g.on); }
const brk = {prot:"breaker", sheetRatings:true};

defType("qf1p",{...brk, name:"Автомат 1P", short:"Автомат 1P", cat:"Захист", w:1, pre:"QF", group:true,
  terms:[{k:"t1",s:"top",r:"L",l:"1"},{k:"b1",s:"bot",r:"L",l:"2"}], poles:[{a:"t1",b:"b1",r:"L"}],
  ratings:["B6","B10","B16","B20","B25","C6","C10","C16","C20","C25","C32","C40"], def:"B16", face:breakerFace});
defType("qf2p",{...brk, name:"Автомат 2P", short:"Автомат 2P", cat:"Захист", w:2, pre:"QF",
  terms:[{k:"t1",s:"top",r:"L",l:"1"},{k:"t2",s:"top",r:"N",l:"3"},{k:"b1",s:"bot",r:"L",l:"2"},{k:"b2",s:"bot",r:"N",l:"4"}],
  poles:[{a:"t1",b:"b1",r:"L"},{a:"t2",b:"b2",r:"N"}], ratings:["C16","C20","C25","C32","C40","C50","C63"], def:"C32", face:breakerFace, cap:"Ввід 230 В"});
defType("qf3p",{...brk, name:"Автомат 3P", short:"Автомат 3P", cat:"Захист", w:3, pre:"QF",
  terms:[{k:"t1",s:"top",r:"P",l:"1"},{k:"t2",s:"top",r:"P",l:"3"},{k:"t3",s:"top",r:"P",l:"5"},{k:"b1",s:"bot",r:"P",l:"2"},{k:"b2",s:"bot",r:"P",l:"4"},{k:"b3",s:"bot",r:"P",l:"6"}],
  poles:[{a:"t1",b:"b1",r:"L"},{a:"t2",b:"b2",r:"L"},{a:"t3",b:"b3",r:"L"}], ratings:["C10","C16","C25","C32","C40","C63"], def:"C25", face:breakerFace, cap:"Ввід 400 В"});
defType("rcd",{name:"ПЗВ 30 мА", short:"ПЗВ (УЗО)", cat:"Захист", w:2, pre:"QD", rcd:true, sheetRatings:true,
  terms:[{k:"t1",s:"top",r:"L",l:"1"},{k:"t2",s:"top",r:"N",l:"N"},{k:"b1",s:"bot",r:"L",l:"2"},{k:"b2",s:"bot",r:"N",l:"N"}],
  poles:[{a:"t1",b:"b1",r:"L"},{a:"t2",b:"b2",r:"N"}], ratings:["25","40","63"], def:"40", unit:" А", cap:"Захист від ураження",
  face(d,g){ return tx(g.cx,g.y+72,mdl(d,"ПЗВ · ΔI 30 мА"),{fs:modelOf(d)?6:7})+tx(g.cx,g.y+90,d.rating+" А",{c:"svt",fs:15})+lever(d,g.cx,g.y+102,44,g.on,"#2f6fdf")+flag(g.cx,g.y+150,g.on)+testBtn(d,g); }});
const testBtn = (d,g) => `<g data-test="${d.id}" style="cursor:pointer"><circle cx="${g.x+g.w-11}" cy="${g.y+72}" r="8" fill="#f2c400" stroke="#8a6d00"/><text x="${g.x+g.w-11}" y="${g.y+75}" font-size="9" font-weight="700" text-anchor="middle" fill="#222">T</text></g>`;
defType("rcbo",{...brk, name:"Диф-автомат", short:"Диф-автомат", cat:"Захист", w:2, pre:"QFD", rcd:true, group:true,
  terms:[{k:"t1",s:"top",r:"L",l:"1"},{k:"t2",s:"top",r:"N",l:"N"},{k:"b1",s:"bot",r:"L",l:"2"},{k:"b2",s:"bot",r:"N",l:"N"}],
  poles:[{a:"t1",b:"b1",r:"L"},{a:"t2",b:"b2",r:"N"}], ratings:["B10","B16","C16","C20","C25","C32"], def:"C16",
  face(d,g){ return breakerFace(d,g)+tx(g.cx,g.y+98,"30 мА",{fs:7})+testBtn(d,g); }});
defType("kv",{name:"Реле напруги", short:"Реле напруги", cat:"Захист", w:2, pre:"KV", sheetRatings:true, unit:" А",
  terms:[{k:"t1",s:"top",r:"N",l:"N"},{k:"t2",s:"top",r:"L",l:"L вх"},{k:"b2",s:"bot",r:"L",l:"L вих",m:1}],
  poles:[{a:"t2",b:"b2",r:"L"}], ratings:["40","63"], def:"40", cap:"Контроль напруги",
  closed:d=>!!(d.ks&&d.ks.closed),
  logic(d,X){ const s=d.ks||(d.ks={closed:false,delay:KV_DELAY}); const U=X.volt(K(d,"t2"),K(d,"t1")); s.U=U; s.pw=U>60;
    const bad=U>U_MAX||U<U_MIN;
    if(!s.pw||bad){ s.delay=KV_DELAY; if(s.closed){ s.closed=false; if(s.pw) logp("w",`${desig(d)} відключив навантаження: ${U>U_MAX?"перенапруга":"знижена напруга"} ${Math.round(U)} В`); return true; } }
    return false; },
  tick(d,X,dt){ const s=d.ks; if(!s||!s.pw||s.closed||s.U>U_MAX||s.U<U_MIN) return; s.delay-=dt; if(s.delay<=0){ s.closed=true; s.delay=0; logp("ok",`${desig(d)} увімкнув навантаження, U = ${Math.round(s.U)} В`); } },
  face(d,g){ const s=d.ks||{}; const t=s.pw?(s.closed?String(Math.round(s.U)):(s.U>U_MAX||s.U<U_MIN?String(Math.round(s.U)):"⏱"+Math.ceil(s.delay))):"---";
    return lcd(g.x+8,g.y+66,g.w-16,30,t,s.pw,s.closed?"#5fe36b":"#ff5a5a")+tx(g.cx,g.y+110,modelOf(d)?"РЕЛЕ НАПРУГИ "+modelOf(d):"РЕЛЕ НАПРУГИ",{fs:7,fw:700})+tx(g.cx,g.y+121,`${d.rating} А · ${U_MIN}–${U_MAX} В`,{fs:6.5})
      +led(g.x+16,g.y+138,s.pw?(s.closed?"#3fbf4a":"#e23b3b"):"#9aa0aa")+led(g.x+g.w-16,g.y+138,s.pw&&s.closed?"#ffd23f":"#9aa0aa"); }});
