/* ===== Апарати керування: контактори, реле, кнопки, лампи, МПЗ, LOGO!, АВР, перемикач ===== */
const coilOn = (d,X,a,b) => X.volt(K(d,a),K(d,b))>=150;
function coilLogic(d,X){ const p=coilOn(d,X,"A1","A2"); if(p!==!!d.pulled){ d.pulled=p; return true; } return false; }
const C = (k,s,l,r="C") => ({k,s,l,r});
function kmFace(d,g,label){ const p=!!d.pulled;
  return tx(g.cx,g.y+68,label,{fs:7,fw:700})+tx(g.cx,g.y+79,"AC-3 · котушка 230 В",{fs:6.3})
    +`<rect x="${g.cx-22}" y="${g.y+88}" width="44" height="30" rx="3" fill="#2a2d33"/><rect x="${g.cx-16}" y="${g.y+(p?100:93)}" width="32" height="12" rx="2" fill="${p?"#e0352b":"#8e9196"}"/>`
    +tx(g.cx,g.y+132,p?"I · увімкнено":"O · вимкнено",{fs:7,fw:600,fill:p?"#c0261c":"#555"})+led(g.x+12,g.y+148,p?"#3fbf4a":"#9aa0aa"); }
defType("km2a",{name:"Контактор 2НВ+1НВ/1НЗ", short:"Контактор 2P", cat:"Керування", w:3, pre:"KM",
  terms:[C("A1","top","A1"),{k:"1",s:"top",r:"L",l:"1"},{k:"3",s:"top",r:"N",l:"3"},C("13","top","13"),C("21","top","21"),
         C("A2","bot","A2"),{k:"2",s:"bot",r:"L",l:"2"},{k:"4",s:"bot",r:"N",l:"4"},C("14","bot","14"),C("22","bot","22")],
  poles:[{a:"1",b:"2",r:"L"},{a:"3",b:"4",r:"N"}], closed:d=>!!d.pulled, aux:d=>d.pulled?[["13","14"]]:[["21","22"]],
  logic:coilLogic, cap:"Контактор", face:(d,g)=>kmFace(d,g,mdl(d,"КОНТАКТОР 25 А"))});
defType("km3a",{name:"Контактор 3НВ+1НВ/1НЗ", short:"Контактор 3P", cat:"Керування", w:4, pre:"KM",
  terms:[C("A1","top","A1"),{k:"1",s:"top",r:"P",l:"1"},{k:"3",s:"top",r:"P",l:"3"},{k:"5",s:"top",r:"P",l:"5"},C("13","top","13"),C("21","top","21"),
         C("A2","bot","A2"),{k:"2",s:"bot",r:"P",l:"2"},{k:"4",s:"bot",r:"P",l:"4"},{k:"6",s:"bot",r:"P",l:"6"},C("14","bot","14"),C("22","bot","22")],
  poles:[{a:"1",b:"2",r:"L"},{a:"3",b:"4",r:"L"},{a:"5",b:"6",r:"L"}], closed:d=>!!d.pulled, aux:d=>d.pulled?[["13","14"]]:[["21","22"]],
  logic:coilLogic, cap:"Пускач двигуна", face:(d,g)=>kmFace(d,g,"КОНТАКТОР 25 А · 3P")});
defType("rel",{name:"Реле проміжне 1CO", short:"Реле проміжне", cat:"Керування", w:2, pre:"K",
  terms:[C("A1","top","A1"),C("11","top","11"),C("A2","bot","A2"),C("12","bot","12"),C("14","bot","14")],
  aux:d=>d.pulled?[["11","14"]]:[["11","12"]], logic:coilLogic, cap:"Проміжне реле",
  face(d,g){ return tx(g.cx,g.y+70,"РЕЛЕ 230 В~",{fs:7,fw:700})+tx(g.cx,g.y+82,"1 перекидний 16 А",{fs:6.3})
    +`<rect x="${g.cx-14}" y="${g.y+92}" width="28" height="28" rx="3" fill="#2a2d33"/>`+led(g.cx,g.y+106,d.pulled?"#3fbf4a":"#5a5e66")+tx(g.cx,g.y+135,d.pulled?"11–14":"11–12",{fs:7,ff:"var(--mono)"}); }});
function btnDef(kind){ const start=kind==="sbp";
  return {name:start?"Кнопка «Пуск» (НВ)":"Кнопка «Стоп» (НЗ)", short:start?"Кнопка Пуск":"Кнопка Стоп", cat:"Керування", w:1, pre:"SB",
    terms:start?[C("13","top","13"),C("14","bot","14")]:[C("11","top","11"),C("12","bot","12")],
    aux:d=>start?(d.pressed?[["13","14"]]:[]):(d.pressed?[]:[["11","12"]]), cap:start?"Пуск":"Стоп", press:true,
    face(d,g){ const c=start?"#2e9a3e":"#d6332a";
      return `<g data-press="${d.id}" style="cursor:pointer"><circle cx="${g.cx}" cy="${g.y+100}" r="${d.pressed?14:17}" fill="${c}" stroke="#1a1c20" stroke-width="2"/>`
        +`<circle cx="${g.cx}" cy="${g.y+100}" r="${d.pressed?9:12}" fill="none" stroke="#fff" stroke-opacity=".35"/></g>`+tx(g.cx,g.y+72,start?"ПУСК":"СТОП",{fs:7.5,fw:700})+tx(g.cx,g.y+134,start?"НВ":"НЗ",{fs:7}); }}; }
defType("sbp",btnDef("sbp")); defType("sbs",btnDef("sbs"));
defType("hl",{name:"Лампа сигнальна", short:"Лампа", cat:"Керування", w:1, pre:"HL", terms:[C("X1","top","X1"),C("X2","bot","X2")], cap:"Робота",
  init:d=>{ d.col=d.col||"#3fbf4a"; }, load:(d,X)=>{ const U=X.volt(K(d,"X1"),K(d,"X2")); return [{a:"X1",b:"X2",I:U>100?0.01:0}]; },
  face(d,g){ const X=S.sim&&S.sim.X, on=X&&X.volt(K(d,"X1"),K(d,"X2"))>=150;
    return (on?`<circle cx="${g.cx}" cy="${g.y+100}" r="22" fill="${d.col}" opacity=".35"/>`:"")+`<circle cx="${g.cx}" cy="${g.y+100}" r="14" fill="${on?d.col:"#5a5e66"}" stroke="#1a1c20" stroke-width="2"/>`+tx(g.cx,g.y+134,"230 В",{fs:7}); }});
const MPR = ["1–1,6 А","1,6–2,5 А","2,5–4 А","4–6,3 А","6–10 А","9–14 А","13–18 А","17–23 А"];
const mprHi = r => parseFloat(String(r).split("–")[1].replace(",",".")), mprLo = r => parseFloat(String(r).split("–")[0].replace(",","."));
defType("qm",{name:"Автомат захисту двигуна", short:"Автомат двигуна (МПЗ)", cat:"Захист", w:3, pre:"QM", prot:"mpcb",
  terms:[{k:"1",s:"top",r:"P",l:"1"},{k:"3",s:"top",r:"P",l:"3"},{k:"5",s:"top",r:"P",l:"5"},C("13","top","13"),
         {k:"2",s:"bot",r:"P",l:"2"},{k:"4",s:"bot",r:"P",l:"4"},{k:"6",s:"bot",r:"P",l:"6"},C("14","bot","14")],
  poles:[{a:"1",b:"2",r:"L"},{a:"3",b:"4",r:"L"},{a:"5",b:"6",r:"L"}], aux:d=>d.on&&!d.trip?[["13","14"]]:[],
  ratings:MPR, def:"6–10 А", init:d=>{ if(!d.Ir) d.Ir=mprHi(d.rating||"6–10 А"); }, cap:"Захист двигуна",
  face(d,g){ const on=g.on, a=on?0:-90;
    return tx(g.cx,g.y+68,"Ir "+fmt(d.Ir,1)+" А",{c:"svt",fs:12})+tx(g.cx,g.y+80,d.rating,{fs:6.5})
      +`<g data-lever="${d.id}" style="cursor:pointer"><circle cx="${g.cx}" cy="${g.y+110}" r="20" fill="#2a2d33"/><g transform="rotate(${a} ${g.cx} ${g.y+110})"><rect x="${g.cx-5}" y="${g.y+90}" width="10" height="40" rx="4" fill="${on?"#e0352b":"#8e9196"}"/></g></g>`
      +tx(g.cx-26,g.y+114,"O",{fs:8,fw:700})+tx(g.cx,g.y+144,"I",{fs:8,fw:700})+(d.trip?tx(g.cx,g.y+156,"TRIP",{fs:7,fw:700,fill:"#c0261c"}):""); }});
// Siemens LOGO! 230RCE — програма АВР з таймерами
const LOGO_T = {T1:3, T2:1, T3:2, DEAD:1};
defType("logo",{name:"Siemens LOGO! 230RCE", short:"LOGO! 230RCE", cat:"Керування", w:4, pre:"A",
  terms:[C("L1","top","L1"),{k:"N",s:"top",r:"N",l:"N"},C("I1","top","I1"),C("I2","top","I2"),C("Q1a","bot","Q1"),C("Q1b","bot","Q1"),C("Q2a","bot","Q2"),C("Q2b","bot","Q2")],
  aux:d=>(d.q||[]).flatMap((on,i)=>on?[["Q"+(i+1)+"a","Q"+(i+1)+"b"]]:[]), cap:"Логіка АВР",
  init:d=>{ d.q=[false,false]; d.tm={i1on:0,i1off:0,i2on:0,dead:0}; },
  logic(d,X){ const pw=X.volt(K(d,"L1"),K(d,"N"))>=150; d.pw=pw; d.in=[!!X.ph(K(d,"I1")),!!X.ph(K(d,"I2"))];
    if(!pw&&d.q.some(Boolean)){ d.q=[false,false]; return true; } return false; },
  tick(d,X,dt){ if(!d.pw) return; const m=d.tm, [i1,i2]=d.in||[false,false];
    if(i1){ m.i1on+=dt; m.i1off=0; } else { m.i1off+=dt; m.i1on=0; } m.i2on=i2?m.i2on+dt:0; m.dead=Math.max(0,m.dead-dt);
    const want = m.i1on>=LOGO_T.T1 ? 0 : (m.i1off>=LOGO_T.T2 && m.i2on>=LOGO_T.T3 ? 1 : (i1? (d.q[1]?1:-1) : -1));
    const cur=d.q.indexOf(true);
    if(cur!==want){ if(cur>=0){ d.q[cur]=false; m.dead=LOGO_T.DEAD; logp("w",`${desig(d)}: Q${cur+1} вимкнено`); }
      else if(want>=0&&m.dead<=0){ d.q[want]=true; logp("ok",`${desig(d)}: Q${want+1} увімкнено → ${want?"генератор":"мережа"}`); } } },
  face(d,g){ const [i1,i2]=d.in||[false,false]; const l=!d.pw?["",""]:[`I1:${i1?"OK":"--"} I2:${i2?"OK":"--"}`, d.q[0]?"Q1 МЕРЕЖА":d.q[1]?"Q2 ГЕНЕР.":(d.tm.dead>0?"ПАУЗА":"ОЧІКУВАННЯ")];
    return `<rect x="${g.x+4}" y="${g.y+44}" width="${g.w-8}" height="118" fill="#cfd3d8"/>`+tx(g.x+10,g.y+60,"LOGO! 230RCE",{fs:8,fw:700,a:"start"})
      +lcd(g.x+14,g.y+68,g.w-28,40,l,d.pw,"#a6e3ff")+[i1,i2].map((v,i)=>led(g.x+22+i*20,g.y+122,d.pw&&v?"#3fbf4a":"#7a7e86")+tx(g.x+22+i*20,g.y+138,"I"+(i+1),{fs:6.5})).join("")
      +[0,1].map(i=>led(g.x+g.w-62+i*22,g.y+122,d.pw&&d.q[i]?"#ffb21f":"#7a7e86")+tx(g.x+g.w-62+i*22,g.y+138,"Q"+(i+1),{fs:6.5})).join(""); }});
// Модульний АВР (тип TOQ5 TOMZN / G2R GEYA): пріоритет вводу I, без витримок
defType("ats",{name:"Модуль АВР 2P 63 А", short:"АВР-модуль", cat:"Комутація", w:4, pre:"QA",
  terms:[{k:"IL",s:"top",r:"L",l:"I L"},{k:"IN",s:"top",r:"N",l:"I N"},{k:"IIL",s:"top",r:"L",l:"II L"},{k:"IIN",s:"top",r:"N",l:"II N"},{k:"L",s:"bot",r:"L",l:"L"},{k:"N",s:"bot",r:"N",l:"N"}],
  poles:[{a:"IL",b:"L",r:"L"},{a:"IN",b:"N",r:"N"},{a:"IIL",b:"L",r:"L"},{a:"IIN",b:"N",r:"N"}],
  closed:(d,pi)=>pi<2?d.pos==="I":d.pos==="II", init:d=>{ d.pos=d.pos||"I"; d.manual=!!d.manual; d.variant=d.variant||"tomzn"; },
  cap:"Перемикання вводів",
  logic(d,X){ const okI=X.volt(K(d,"IL"),K(d,"IN"))>=187, okII=X.volt(K(d,"IIL"),K(d,"IIN"))>=187; d.ok=[okI,okII];
    if(d.manual) return false; const t=okI?"I":okII?"II":d.pos;
    if(t!==d.pos){ d.pos=t; logp(t==="I"?"ok":"w",`${desig(d)}: навантаження переведено на ввід ${t} (${t==="I"?"мережа":"резерв"}), < ${d.variant==="geya"?50:8} мс`); return true; } return false; },
  tap(d){ if(!d.manual){ toast("АВР в автоматичному режимі. Перемкніть «Ручний» у налаштуваннях апарата","w"); return false; } d.pos=d.pos==="I"?"II":"I"; return true; },
  face(d,g){ const ang=d.pos==="I"?-40:d.pos==="II"?40:0, ok=d.ok||[false,false];
    return tx(g.cx,g.y+64,d.variant==="geya"?"GEYA · тип G2R-63 2P":"TOMZN · тип TOQ5-63/2P",{fs:7,fw:700})+tx(g.cx,g.y+75,d.manual?"РУЧНИЙ":"АВТО",{fs:7,fw:700,fill:d.manual?"#c25e00":"#1b855e"})
      +`<g data-lever="${d.id}" style="cursor:pointer"><circle cx="${g.cx}" cy="${g.y+112}" r="24" fill="#2a2d33"/><g transform="rotate(${ang} ${g.cx} ${g.y+112})"><rect x="${g.cx-5}" y="${g.y+88}" width="10" height="30" rx="4" fill="#e0352b"/></g></g>`
      +tx(g.cx-36,g.y+92,"I",{fs:10,fw:700})+tx(g.cx+36,g.y+92,"II",{fs:10,fw:700})+led(g.x+14,g.y+150,ok[0]?"#3fbf4a":"#9aa0aa")+led(g.x+g.w-14,g.y+150,ok[1]?"#3fbf4a":"#9aa0aa")
      +tx(g.x+26,g.y+153,"I",{fs:7,a:"start"})+tx(g.x+g.w-26,g.y+153,"II",{fs:7,a:"end"}); }});
defType("qs",{name:"Перемикач 1-0-2", short:"Перемикач 1-0-2", cat:"Комутація", w:3, pre:"QS",
  terms:[{k:"1L",s:"top",r:"L",l:"1 L"},{k:"1N",s:"top",r:"N",l:"1 N"},{k:"2L",s:"top",r:"L",l:"2 L"},{k:"2N",s:"top",r:"N",l:"2 N"},{k:"L",s:"bot",r:"L",l:"L"},{k:"N",s:"bot",r:"N",l:"N"}],
  poles:[{a:"1L",b:"L",r:"L"},{a:"1N",b:"N",r:"N"},{a:"2L",b:"L",r:"L"},{a:"2N",b:"N",r:"N"}],
  closed:(d,pi)=>pi<2?d.pos===1:d.pos===2, init:d=>{ if(d.pos===undefined) d.pos=2; }, cap:"Обхід інвертора",
  tap(d){ const seq=[1,0,2,0]; d.seqI=((d.seqI??seq.indexOf(d.pos))+1)%4; d.pos=seq[d.seqI]; logp("w",`${desig(d)}: положення ${d.pos}`); return true; },
  face(d,g){ const ang=d.pos===1?-45:d.pos===2?45:0;
    return tx(g.cx,g.y+64,"1 – 0 – 2 · 63 А",{fs:7,fw:700})+`<g data-lever="${d.id}" style="cursor:pointer"><circle cx="${g.cx}" cy="${g.y+110}" r="24" fill="#2a2d33"/><g transform="rotate(${ang} ${g.cx} ${g.y+110})"><rect x="${g.cx-6}" y="${g.y+84}" width="12" height="34" rx="5" fill="#1d1f23" stroke="#666"/></g></g>`
      +tx(g.cx-34,g.y+90,"1",{fs:10,fw:700})+tx(g.cx,g.y+80,"0",{fs:9})+tx(g.cx+34,g.y+90,"2",{fs:10,fw:700})+tx(g.cx,g.y+150,d.pos===1?"Мережа напряму":d.pos===2?"Від інвертора":"Вимкнено",{fs:7,fw:600}); }});
