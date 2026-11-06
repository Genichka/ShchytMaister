/* ===== Апарати керування: контактори, реле, кнопки, лампи, МПЗ, LOGO!, АВР, перемикач ===== */
const coilOn = (d,X,a,b) => X.volt(K(d,a),K(d,b))>=150;
function coilLogic(d,X){ const p=coilOn(d,X,"A1","A2"); if(p!==!!d.pulled){ d.pulled=p; return true; } return false; }
const C = (k,s,l,r="C") => ({k,s,l,r});
const TCOIL = [C("A1","top","A1"),{k:"1",s:"top",r:"L",l:"1"},C("A2","bot","A2"),{k:"2",s:"bot",r:"L",l:"2"}];
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
// Перемикач вводів I–0–II, 2P 63 А, 4 модулі (як TOMZN TO219G). I: з’єднано 1–2 і 5–6; «0»: усе розімкнено; II: 1–4 і 5–8.
// Спільні клеми 1 і 5 (3 і 7 — їх дублі) — на навантаження; 2 і 6 — ввід I (мережа); 4 і 8 — ввід II (генератор).
defType("to219",{name:"Перемикач I–0–II 2P 63 А (тип TOMZN TO219G)", short:"Перемикач I–0–II", cat:"Комутація", w:4, pre:"QS", maker:"TOMZN",
  terms:[{k:"1",s:"top",r:"L",l:"1"},{k:"3",s:"top",r:"L",l:"3"},{k:"5",s:"top",r:"N",l:"5"},{k:"7",s:"top",r:"N",l:"7"},
    {k:"2",s:"bot",r:"L",l:"2"},{k:"4",s:"bot",r:"L",l:"4"},{k:"6",s:"bot",r:"N",l:"6"},{k:"8",s:"bot",r:"N",l:"8"}],
  poles:[{a:"2",b:"1",r:"L"},{a:"6",b:"5",r:"N"},{a:"4",b:"1",r:"L"},{a:"8",b:"5",r:"N"}], links:()=>[["1","3"],["5","7"]],
  closed:(d,pi)=>pi<2?d.pos===1:d.pos===2, init:d=>{ if(d.pos===undefined) d.pos=1; }, cap:"Мережа / генератор",
  tap(d){ const seq=[1,0,2,0]; d.seqI=((d.seqI??seq.indexOf(d.pos))+1)%4; d.pos=seq[d.seqI]; logp("w",`${desig(d)}: положення ${["0","I","II"][d.pos]}`); return true; },
  face(d,g){ const p=d.pos, hy=p===2?g.y+76:p===0?g.y+100:g.y+124, ww=g.w/2-24,
      win=x=>`<rect x="${x}" y="${g.y+72}" width="${ww}" height="72" rx="3" fill="#dfe1e5" stroke="#b9bcc4"/><rect x="${x+ww/2-3}" y="${g.y+79}" width="6" height="14" rx="2" fill="#c3c6cc"/>`;
    return tx(g.cx,g.y+66,"тип TO219G · 63 A · 400 В",{fs:6.6})+win(g.x+12)+win(g.cx+4)
      +`<g data-lever="${d.id}" style="cursor:pointer"><rect x="${g.x+8}" y="${hy}" width="${g.w-30}" height="20" rx="3" fill="#f4f5f7" stroke="#8e939b"/><rect x="${g.cx-30}" y="${hy+4}" width="44" height="12" rx="2" fill="#e3e5e9" stroke="#b0b4bb"/></g>`
      +tx(g.x+g.w-6,g.y+90,"II",{fs:8,fw:700,a:"end"})+tx(g.x+g.w-6,g.y+114,"0",{fs:8,fw:700,a:"end"})+tx(g.x+g.w-6,g.y+138,"I",{fs:8,fw:700,a:"end"})
      +tx(g.cx,g.y+157,p===1?"I · 1–2, 5–6 · мережа":p===2?"II · 1–4, 5–8 · генератор":"0 · усе розімкнено",{fs:6.8,fw:600}); }});
// АВР TOMZN TOQ5-…/2 з поворотною ручкою, 6 модулів (мережа + генератор). Зверху Source A (R, N) — мережа, пріоритет;
// знизу Source B (R, N) — генератор, і окремі клеми навантаження Load (R, N). Блок керування бачить напругу лише через
// клеми AR/AN і BR/BN — їх з’єднують із силовими клемами комплектними перемичками. NC–C–NO: сигнальні контакти положення
// (зверху — «на вводі A», знизу — «на вводі B»). Перемикання < 10 мс, без витримок; повзунок Manual/Auto — ручний режим.
defType("toq5",{name:"АВР TOMZN TOQ5 2P з ручкою (мережа + генератор)", short:"АВР TOQ5", cat:"Комутація", w:6, pre:"QA", maker:"TOMZN",
  ratings:["63","100","125"], def:"125", unit:" А",
  terms:[{k:"RA",s:"top",r:"L",l:"R (A)",m:0.3,nl:1},{k:"NA",s:"top",r:"N",l:"N (A)",m:1.5,nl:1},
    {k:"AR",s:"top",r:"L",l:"AR",m:3.0,nl:1},{k:"AN",s:"top",r:"N",l:"AN",m:3.55,nl:1},{k:"NCA",s:"top",r:"C",l:"NC (A)",m:4.1,nl:1},{k:"CA",s:"top",r:"C",l:"C (A)",m:4.65,nl:1},{k:"NOA",s:"top",r:"C",l:"NO (A)",m:5.2,nl:1},
    {k:"RB",s:"bot",r:"L",l:"R (B)",m:0.05,nl:1},{k:"NB",s:"bot",r:"N",l:"N (B)",m:0.75,nl:1},{k:"RL",s:"bot",r:"L",l:"R (Load)",m:1.45,nl:1},{k:"NL",s:"bot",r:"N",l:"N (Load)",m:2.15,nl:1},
    {k:"BR",s:"bot",r:"L",l:"BR",m:3.0,nl:1},{k:"BN",s:"bot",r:"N",l:"BN",m:3.55,nl:1},{k:"NCB",s:"bot",r:"C",l:"NC (B)",m:4.1,nl:1},{k:"CB",s:"bot",r:"C",l:"C (B)",m:4.65,nl:1},{k:"NOB",s:"bot",r:"C",l:"NO (B)",m:5.2,nl:1}],
  poles:[{a:"RA",b:"RL",r:"L"},{a:"NA",b:"NL",r:"N"},{a:"RB",b:"RL",r:"L"},{a:"NB",b:"NL",r:"N"},
    {a:"CA",b:"NOA",r:"C"},{a:"CA",b:"NCA",r:"C"},{a:"CB",b:"NOB",r:"C"},{a:"CB",b:"NCB",r:"C"}],
  closed:(d,pi)=>{ const A=d.pos==="A"; return [A,A,!A,!A,A,!A,!A,A][pi]; },
  init:d=>{ d.pos=d.pos||"A"; d.manual=!!d.manual; }, cap:"Мережа / генератор",
  logic(d,X){ const ok=(a,b)=>{ const u=X.volt(K(d,a),K(d,b)); return u>=187&&u<=253; }, okA=ok("AR","AN"), okB=ok("BR","BN");
    d.ok=[okA,okB]; d.pw=okA||okB;
    if(d.manual||!d.pw) return false; const t=okA?"A":"B";
    if(t!==d.pos){ d.pos=t; logp(t==="A"?"ok":"w",`${desig(d)}: навантаження переведено на Source ${t} (${t==="A"?"мережа":"генератор"}), < 10 мс`); return true; } return false; },
  tap(d,el){ if(el&&el.dataset.zone==="mode"){ d.manual=!d.manual; logp("w",`${desig(d)}: повзунок у положенні ${d.manual?"Manual — ручний режим":"Auto — автоматичний режим"}`); return true; }
    if(!d.manual){ toast("Ручка працює лише в режимі Manual — пересуньте повзунок Manual/Auto","w"); return false; }
    d.pos=d.pos==="A"?"B":"A"; logp("w",`${desig(d)}: ручкою переведено на Source ${d.pos}`); return true; },
  face(d,g){ const X0=g.x-1, tx_=m=>X0+(m+0.5)*G.MW, A=d.pos==="A", pw=!!d.pw, ok=d.ok||[false,false], cx0=g.x+82, cy0=g.y+106,
      ang=A?-38:38, lab=(x,y,t)=>`<rect x="${x-21}" y="${y-7}" width="42" height="10" rx="1.5" fill="none" stroke="#5c616b" stroke-width=".8"/>`+tx(x,y+0.6,t,{fs:6.2});
    let s=`<line x1="${g.x+176}" y1="${g.y+48}" x2="${g.x+176}" y2="${g.y+162}" stroke="#b9bcc4"/>`;
    // надписи клем, як на корпусі
    [["RA","R"],["NA","N"],["AR","AR"],["AN","AN"],["NCA","NC"],["CA","C"],["NOA","NO"]].forEach(([k,l])=>{ const m=T.toq5.terms.find(t=>t.k===k).m; s+=tx(tx_(m),g.y+42,l,{fs:k.length>2||k==="AR"||k==="AN"?6.4:8,fw:700}); });
    [["RB","R"],["NB","N"],["RL","R"],["NL","N"],["BR","BR"],["BN","BN"],["NCB","NC"],["CB","C"],["NOB","NO"]].forEach(([k,l])=>{ const m=T.toq5.terms.find(t=>t.k===k).m; s+=tx(tx_(m),g.y+160,l,{fs:l.length>1?6.4:8,fw:700}); });
    s+=lab(g.x+76,g.y+62,"Source A")+lab((tx_(0.05)+tx_(0.75))/2,g.y+146,"Source B")+lab((tx_(1.45)+tx_(2.15))/2,g.y+146,"Load");
    // поворотна ручка
    s+=`<g data-lever="${d.id}" style="cursor:pointer"><circle cx="${cx0}" cy="${cy0}" r="31" fill="#f1f2f4" stroke="#b9bcc4" stroke-width="1.5"/>`
      +`<path d="M${cx0+24} ${cy0-20} A31 31 0 0 1 ${cx0+24} ${cy0+20}" fill="none" stroke="#5c616b" stroke-width="1.2" marker-end="none"/>`
      +`<g transform="rotate(${ang} ${cx0} ${cy0})"><rect x="${cx0-20}" y="${cy0-6}" width="50" height="12" rx="6" fill="#e0352b" stroke="#9e1e17" stroke-width="1"/><circle cx="${cx0}" cy="${cy0}" r="10" fill="#d42d24" stroke="#9e1e17"/><circle cx="${cx0}" cy="${cy0}" r="2.5" fill="#7a1611"/></g></g>`
      +`<circle cx="${cx0+40}" cy="${cy0-30}" r="6" fill="none" stroke="#5c616b" stroke-width=".8"/>`+tx(cx0+40,cy0-27.5,"A",{fs:7,fw:700})
      +`<circle cx="${cx0+40}" cy="${cy0+30}" r="6" fill="none" stroke="#5c616b" stroke-width=".8"/>`+tx(cx0+40,cy0+32.5,"B",{fs:7,fw:700});
    // блок керування: тип, стан вводів, індикатори A/B, повзунок Manual/Auto
    s+=tx(g.x+232,g.y+70,`Type: TOQ5-${d.rating||"125"}/2`,{fs:7.4,fw:700})+tx(g.x+232,g.y+80,`${d.rating||"125"} A · 220 V~ · < 10 мс`,{fs:5.8});
    s+=tx(g.x+184,g.y+98,"Ⅰ мережа: "+(ok[0]?"є":"немає"),{fs:6.4,a:"start",fill:ok[0]?"#1b855e":"#7a7e86",fw:600})
      +tx(g.x+184,g.y+110,"Ⅱ генератор: "+(ok[1]?"є":"немає"),{fs:6.4,a:"start",fill:ok[1]?"#1b855e":"#7a7e86",fw:600});
    s+=led(g.x+298,g.y+94,pw&&A?"#ff4a3d":"#8f949c")+tx(g.x+311,g.y+97,"A",{fs:8,fw:700})+led(g.x+298,g.y+146,pw&&!A?"#3fbf4a":"#8f949c")+tx(g.x+311,g.y+149,"B",{fs:8,fw:700});
    s+=`<g data-lever="${d.id}" data-zone="mode" style="cursor:pointer"><rect x="${g.x+250}" y="${g.y+104}" width="64" height="32" fill="transparent"/>`
      +tx(g.x+284,g.y+113,"Manual",{fs:6.2,a:"end"})+tx(g.x+284,g.y+133,"Auto",{fs:6.2,a:"end"})
      +`<rect x="${g.x+290}" y="${g.y+104}" width="16" height="32" rx="4" fill="#2a2d33"/><rect x="${g.x+292}" y="${d.manual?g.y+106:g.y+120}" width="12" height="14" rx="3" fill="#e0352b"/></g>`
      +tx(g.x+232,g.y+128,d.manual?"РУЧНИЙ":"АВТО",{fs:7,fw:700,fill:d.manual?"#c25e00":"#1b855e"});
    return s; }});
