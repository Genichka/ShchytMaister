/* ===== Модулі керування: контактори, реле, кнопки, лампи, МПЗ, LOGO!, АВР, перемикач ===== */
const coilOn = (d,X,a,b) => X.volt(K(d,a),K(d,b))>=150;
function coilLogic(d,X){ const p=coilOn(d,X,"A1","A2"); if(p!==!!d.pulled){ d.pulled=p; return true; } return false; }
const C = (k,s,l,r="C") => ({k,s,l,r});
const TCOIL = [C("A1","top","A1"),{k:"1",s:"top",r:"L",l:"1"},C("A2","bot","A2"),{k:"2",s:"bot",r:"L",l:"2"}];
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
        +`<circle cx="${g.cx}" cy="${g.y+100}" r="${d.pressed?9:12}" fill="none" stroke="#fff" stroke-opacity=".35"/></g>`+tx(g.cx,g.y+72,d.lbl||(start?"ПУСК":"СТОП"),{fs:(d.lbl||"").length>5?6.2:7.5,fw:700})+tx(g.cx,g.y+134,start?"НВ":"НЗ",{fs:7}); }}; }
defType("sbp",btnDef("sbp")); defType("sbs",btnDef("sbs"));
defType("hl",{name:"Лампа сигнальна", short:"Лампа", cat:"Керування", w:1, pre:"HL", terms:[C("X1","top","X1"),C("X2","bot","X2")], cap:"Робота",
  init:d=>{ d.col=d.col||"#3fbf4a"; }, load:(d,X)=>{ const U=X.volt(K(d,"X1"),K(d,"X2")); return [{a:"X1",b:"X2",I:U>100?0.01:0}]; },
  face(d,g){ const X=S.sim&&S.sim.X, on=X&&X.volt(K(d,"X1"),K(d,"X2"))>=150;
    return (on?`<circle cx="${g.cx}" cy="${g.y+100}" r="22" fill="${d.col}" opacity=".35"/>`:"")+`<circle cx="${g.cx}" cy="${g.y+100}" r="14" fill="${on?d.col:"#5a5e66"}" stroke="#1a1c20" stroke-width="2"/>`+tx(g.cx,g.y+134,"230 В",{fs:7}); }});
const MPR = ["1–1,6 А","1,6–2,5 А","2,5–4 А","4–6,3 А","6–10 А","9–14 А","13–18 А","17–23 А"];
const mprHi = r => parseFloat(String(r).split("–")[1].replace(",",".")), mprLo = r => parseFloat(String(r).split("–")[0].replace(",","."));
defType("qm",{name:"Автомат захисту двигуна", short:"Автомат двигуна (МПЗ)", cat:"Захист", w:3, bw:45/17.5, pre:"QM", prot:"mpcb",
  terms:[{k:"1",s:"top",r:"P",l:"1"},{k:"3",s:"top",r:"P",l:"3"},{k:"5",s:"top",r:"P",l:"5"},C("13","top","13"),
         {k:"2",s:"bot",r:"P",l:"2"},{k:"4",s:"bot",r:"P",l:"4"},{k:"6",s:"bot",r:"P",l:"6"},C("14","bot","14")],
  poles:[{a:"1",b:"2",r:"L"},{a:"3",b:"4",r:"L"},{a:"5",b:"6",r:"L"}], aux:d=>d.on&&!d.trip?[["13","14"]]:[],
  ratings:MPR, def:"6–10 А", init:d=>{ if(!d.Ir) d.Ir=mprHi(d.rating||"6–10 А"); }, cap:"Захист двигуна",
  face(d,g){ const on=g.on, a=on?0:-90;
    return tx(g.cx,g.y+68,"Ir "+fmt(d.Ir,1)+" А",{c:"svt",fs:12})+tx(g.cx,g.y+80,d.rating,{fs:6.5})
      +`<g data-lever="${d.id}" style="cursor:pointer"><circle cx="${g.cx}" cy="${g.y+110}" r="20" fill="#2a2d33"/><g transform="rotate(${a} ${g.cx} ${g.y+110})"><rect x="${g.cx-5}" y="${g.y+90}" width="10" height="40" rx="4" fill="${on?"#e0352b":"#8e9196"}"/></g></g>`
      +tx(g.cx-26,g.y+114,"O",{fs:8,fw:700})+tx(g.cx,g.y+144,"I",{fs:8,fw:700})+(d.trip?tx(g.cx,g.y+156,"TRIP",{fs:7,fw:700,fill:"#c0261c"}):""); }});
// Реле теплове 3P (як РТИ / LRD на DIN): силові полюси 1–2, 3–4, 5–6 завжди замкнені — реле лише міряє струм.
// Перевантаження (≈ клас 10, як у автомата двигуна; обрив фази — швидше) розмикає 95–96 (НЗ) і замикає 97–98 (НВ).
// Повернути — кнопкою Reset (дотик по синій кнопці або «Увімкнути» в налаштуваннях). КЗ реле не вимикає — це робота автомата.
defType("kk",{name:"Реле теплове 3P (95–96 НЗ, 97–98 НВ)", short:"Реле теплове", cat:"Захист", w:3, bw:45/17.5, pre:"KK", prot:"ovl",
  terms:[{k:"1",s:"top",r:"P",l:"1"},{k:"3",s:"top",r:"P",l:"3"},{k:"5",s:"top",r:"P",l:"5"},C("95","top","95"),C("97","top","97"),
         {k:"2",s:"bot",r:"P",l:"2"},{k:"4",s:"bot",r:"P",l:"4"},{k:"6",s:"bot",r:"P",l:"6"},C("96","bot","96"),C("98","bot","98")],
  poles:[{a:"1",b:"2",r:"L"},{a:"3",b:"4",r:"L"},{a:"5",b:"6",r:"L"}], closed:()=>true,
  aux:d=>d.on&&!d.trip?[["95","96"]]:[["97","98"]],
  ratings:MPR, def:"6–10 А", init:d=>{ if(!d.Ir) d.Ir=mprHi(d.rating||"6–10 А"); if(d.on===undefined) d.on=true; }, cap:"Захист від перевантаження",
  face(d,g){ const ok=d.on&&!d.trip;
    return tx(g.cx,g.y+66,"РЕЛЕ ТЕПЛОВЕ",{fs:6.6,fw:700})+tx(g.cx,g.y+80,"Ir "+fmt(d.Ir,1)+" А",{c:"svt",fs:11})+tx(g.cx,g.y+90,d.rating,{fs:6})
      +`<circle cx="${g.x+30}" cy="${g.y+112}" r="12" fill="#e9ebee" stroke="#8e9196"/><line x1="${g.x+30}" y1="${g.y+112}" x2="${g.x+38}" y2="${g.y+104}" stroke="#2a2d33" stroke-width="2.4" stroke-linecap="round"/>`
      +`<g data-lever="${d.id}" style="cursor:pointer"><circle cx="${g.x+g.w-32}" cy="${g.y+112}" r="11" fill="#2f6fd1" stroke="#1d4c93" stroke-width="1.5"/>`+tx(g.x+g.w-32,g.y+115,"R",{fs:8,fw:800,fill:"#fff"})+`</g>`
      +`<rect x="${g.cx-9}" y="${g.y+104}" width="18" height="16" rx="2" fill="${ok?"#2a2d33":"#e0352b"}"/>`
      +tx(g.cx,g.y+136,ok?"95–96 ● · 97–98 ○":"95–96 ○ · 97–98 ●",{fs:6.2,ff:"var(--mono)"})+(d.trip?tx(g.cx,g.y+150,"СПРАЦЮВАЛО",{fs:7,fw:700,fill:"#c0261c"}):tx(g.cx,g.y+150,"Reset — R",{fs:6,fill:"#5a5e66"})); }});
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
// АВР GEYA G2R-63 2P з контролем напруги — 3 модулі (50,5 мм). Зверху (I) N1 A1 — основне живлення, (II) N2 A2 — резерв;
// знизу LOAD N A. Пріоритет вводу I, перемикання < 50 мс. Ввід вважається нормальним при 187–242 В (85–110 % від 220 В);
// за паспортом і повернення на ввід I — < 50 мс (окремої затримки в G2R немає; витримку перед поверненням дає реле напруги на вводі I).
// У симуляторі — 1 с, щоб не «смикався» від стрибка напруги. Auto / Manual — повзунок на лицьовій панелі.
const G2R_OK = u => u>=187&&u<=242, G2R_BACK = 1;
defType("g2r",{name:"АВР GEYA G2R-63 2P з контролем напруги", short:"АВР GEYA G2R-63", cat:"Комутація", w:3, pre:"QA", maker:"GEYA",
  ratings:["25","40","63"], def:"63", unit:" А",
  terms:[{k:"IN",s:"top",r:"N",l:"N1"},{k:"IL",s:"top",r:"L",l:"A1"},{k:"IIN",s:"top",r:"N",l:"N2"},{k:"IIL",s:"top",r:"L",l:"A2"},{k:"N",s:"bot",r:"N",l:"N"},{k:"L",s:"bot",r:"L",l:"A"}],
  poles:[{a:"IL",b:"L",r:"L"},{a:"IN",b:"N",r:"N"},{a:"IIL",b:"L",r:"L"},{a:"IIN",b:"N",r:"N"}],
  closed:(d,pi)=>pi<2?d.pos==="I":d.pos==="II", init:d=>{ d.pos=d.pos||"I"; d.manual=!!d.manual; }, cap:"Перемикання вводів",
  logic(d,X){ const u1=X.volt(K(d,"IL"),K(d,"IN")), u2=X.volt(K(d,"IIL"),K(d,"IIN")); d.u=[u1,u2]; d.ok=[G2R_OK(u1),G2R_OK(u2)];
    if(d.manual) return false;
    const backI=d.ok[0]&&(d.pos==="I"||(d.wI||0)>=G2R_BACK), t=backI?"I":d.ok[1]?"II":d.pos;
    if(t!==d.pos){ d.pos=t; d.wI=0;
      logp(t==="I"?"ok":"w",t==="I"?`${desig(d)}: на вводі I знову ${Math.round(u1)} В — навантаження повернуто на ввід I (мережа), < 50 мс`
        :`${desig(d)}: на вводі I ${u1<1?"немає напруги":`${Math.round(u1)} В — поза 187–242 В`}, навантаження переведено на ввід II (резерв), < 50 мс`); return true; }
    return false; },
  tick(d,X,dt){ if(!d.manual&&d.ok&&d.ok[0]&&d.pos!=="I") d.wI=(d.wI||0)+dt; else d.wI=0; },
  tap(d){ if(!d.manual){ toast("АВР у режимі Auto. Перемкніть «Manual» у налаштуваннях модуля, щоб перемикати ручкою","w"); return false; } d.pos=d.pos==="I"?"II":"I"; return true; },
  face(d,g){ const ok=d.ok||[false,false], x=g.x, w=g.w, man=!!d.manual, src=d.pos==="I"?ok[0]:ok[1];
    const lamp=(cx,cy,lab,c,lit)=>`<circle cx="${cx}" cy="${cy}" r="5" fill="${lit?c:"#dfe2e6"}" stroke="${c}" stroke-width="1.6"/>`+tx(cx+9,cy+2.3,lab,{fs:6.2,fw:700,a:"start",fill:"#3d4250"});
    const wx=x+w*0.47, ww=w*0.53-12, ky=d.pos==="II"?g.y+80:g.y+116, kx=wx+ww*0.32, kw=ww*0.6;
    const sy=man?g.y+124:g.y+114;
    return tx(x+10,g.y+64,"G2R-63",{fs:8.5,fw:800,a:"start",fill:"#1f2329"})+tx(x+w-8,g.y+64,`${d.rating||63} A · 230 В`,{fs:6,fw:700,a:"end"})
      +lamp(x+16,g.y+80,"IU","#2fa84f",ok[0])+lamp(x+16,g.y+97,"IIU","#e0352b",ok[1])
      +tx(x+16,g.y+109,"Auto",{fs:5.4,fw:700,a:"start",fill:"#3d4250"})
      +`<rect x="${x+16}" y="${g.y+112}" width="12" height="22" rx="2" fill="#2a2d33"/><rect x="${x+18}" y="${sy}" width="8" height="8" rx="1.5" fill="#cfd3d8"/>`
      +tx(x+16,g.y+142,"Manual",{fs:5.4,fw:700,a:"start",fill:"#3d4250"})
      +lamp(x+16,g.y+152,"Load ON","#2fa84f",src)
      +`<rect x="${wx}" y="${g.y+72}" width="${ww}" height="72" rx="3" fill="#f3f4f6" stroke="#c4c9d0"/>`
      +tx(wx+6,g.y+84,"II",{fs:7,fw:700,a:"start"})+tx(wx+6,g.y+140,"I",{fs:7,fw:700,a:"start"})
      +`<circle cx="${wx+8}" cy="${g.y+100}" r="3" fill="${d.pos==="II"&&src?"#e0352b":"#e6c9c9"}"/><circle cx="${wx+8}" cy="${g.y+114}" r="3" fill="${d.pos==="I"&&src?"#2fa84f":"#c9e0cf"}"/>`
      +`<g data-lever="${d.id}" style="cursor:pointer"><rect x="${kx}" y="${ky}" width="${kw}" height="24" rx="7" fill="#cfd3d8" stroke="#9aa0aa"/>`
      +[0,1,2].map(i=>`<circle cx="${kx+kw*0.3+i*kw*0.2}" cy="${ky+12}" r="2.6" fill="#8a9099"/>`).join("")+`</g>`
      +tx(wx+ww/2,g.y+157,`${d.pos} · ${d.pos==="I"?"основне":"резерв"} · ${man?"Manual":"Auto"}`,{fs:6,fw:600}); }});
// Перемикач вводів I–0–II TOMZN TO219G 2P 63 А — 36 × 82 мм, 2 модулі: два корпуси по 1 модулю (як два TO119G), одна синя ручка на обидва.
// Зверху спільні клеми 1 і 5, на місцях «3» і «7» гвинтів немає (лише отвір). Знизу 2 і 6 — ввід I, 4 і 8 — ввід II.
// I (ручка вгорі): 1–2, 5–6; «0» (посередині): усе розімкнено; II (ручка внизу): 1–4, 5–8 — як на корпусі (↑ I · O · ↓ II).
defType("to219",{name:"Механічний АВР TOMZN TO219G — перемикач I–0–II 2P 63 А", short:"Мех. АВР TO219G", cat:"Комутація", w:2, pre:"QS", maker:"TOMZN", noBrand:true,
  faceFill:"#f6f7f9",
  terms:[{k:"1",s:"top",r:"L",l:"1",m:-0.25},{k:"5",s:"top",r:"N",l:"5",m:0.75},
    {k:"2",s:"bot",r:"L",l:"2"},{k:"4",s:"bot",r:"L",l:"4"},{k:"6",s:"bot",r:"N",l:"6"},{k:"8",s:"bot",r:"N",l:"8"}],
  poles:[{a:"2",b:"1",r:"L"},{a:"6",b:"5",r:"N"},{a:"4",b:"1",r:"L"},{a:"8",b:"5",r:"N"}],
  closed:(d,pi)=>pi<2?d.pos===1:d.pos===2, init:d=>{ if(d.pos===undefined) d.pos=1; }, cap:"Мережа / генератор",
  qrPos:g=>[g.cx+g.w/4,g.y+62],   // QR «Замовити» — на правому корпусі під синіми смугами, логотип TOMZN лишається
  tap(d){ const seq=[1,0,2,0]; d.seqI=((d.seqI??seq.indexOf(d.pos))+1)%4; d.pos=seq[d.seqI]; logp("w",`${desig(d)}: положення ${["0","I","II"][d.pos]}`); return true; },
  face(d,g){ const x=g.x, y=g.y, w=g.w, cx=g.cx, R=x+w-3, i=d.pos===1?0:d.pos===0?1:2, B="#1d3f8f", ink="#3a3f47", act="#1f74c2", q=w/4;
    // два корпуси по модулю: шов посередині на всю висоту
    let s=`<path d="M${cx} ${y+1}V${y+239}" stroke="#b9bec6" stroke-width="1.2"/>`;
    // «3» і «7»: гвинтів немає — круглий отвір у корпусі
    for(const [hx,l] of [[x+1.5*q,"3"],[x+3.5*q,"7"]]) s+=`<circle cx="${hx}" cy="${y+22}" r="10" fill="#fafbfc" stroke="#b3b9c1" stroke-width="1.3"/><circle cx="${hx}" cy="${y+22}" r="6.8" fill="none" stroke="#e2e5e9" stroke-width="1.5"/>`+tx(hx,y+42,l,{fs:6.8});
    // верхня наліпка: логотип TOMZN ≡, тип і номінал; на правому корпусі — три сині смуги
    s+=`<rect x="${x+3}" y="${y+49}" width="35" height="10" rx="2.5" fill="#fff" stroke="${B}" stroke-width="1.1"/>`+tx(x+20.5,y+57,"TOMZN",{fs:6.3,fw:800,fill:B,ff:"Georgia,'Times New Roman',serif"});
    for(const k of [0,1,2]) s+=`<rect x="${x+40}" y="${y+50.2+k*3.2}" width="${cx-x-43}" height="1.6" fill="${B}"/><rect x="${cx+4}" y="${y+50.2+k*3.2}" width="${R-cx-5}" height="1.6" fill="${B}"/>`;
    s+=tx(x+3,y+67.5,"TO219G",{fs:5.2,fw:700,a:"start",fill:ink})+tx(x+25,y+68,"63A",{fs:7.4,fw:700,a:"start",fill:ink})
      +tx(x+3,y+74.3,"400V~",{fs:4.6,a:"start",fill:ink})+tx(x+3,y+80.2,"50/60Hz",{fs:4.6,a:"start",fill:ink})+tx(x+24,y+80.5,"CE",{fs:6.4,fw:700,a:"start",fill:ink});
    // віконця з синіми клавішами й спільна синя ручка: I — угорі, 0 — посередині, II — унизу
    const wy=y+84, wh=43, by=[wy+1,wy+wh/2-6,wy+wh-13][i];
    s+=`<g data-lever="${d.id}" style="cursor:pointer">`;
    for(const [wx,ww] of [[x+6,cx-x-11],[cx+5,R-cx-8]])
      s+=`<rect x="${wx-2}" y="${wy-2}" width="${ww+4}" height="${wh+4}" rx="2.5" fill="#e1e4e8" stroke="#bfc4cb"/>`
        +`<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="2" fill="#1c4a96"/>`
        +`<rect x="${wx+2.5}" y="${wy+2.5}" width="${ww-5}" height="${wh-5}" rx="2" fill="#2961bb" stroke="#3b77d4" stroke-width=".8"/>`
        +`<path d="M${wx+ww/2} ${wy+4}v6" stroke="#86b0ee" stroke-width="1.2"/>`;
    s+=`<rect x="${x+2}" y="${by+1.4}" width="${w-4}" height="12" rx="6" fill="#123d80" opacity=".35"/>`
      +`<rect x="${x+2}" y="${by}" width="${w-4}" height="12" rx="6" fill="#2f80e6" stroke="#1b5aae"/>`
      +`<rect x="${x+6}" y="${by+2.4}" width="${w-12}" height="3.2" rx="1.6" fill="#9cc8f8" opacity=".85"/></g>`;
    // нижня наліпка ліворуч: категорія, ізоляція, стандарти; стрілки положень ↑ I · O · ↓ II
    s+=["AC-22A","Ui:690V","GB/T14048.3","IEC/EN60947-3"].map((l,k)=>tx(x+3,y+137+k*7.2,l,{fs:4.3,fw:k?500:700,a:"start",fill:ink})).join("");
    const ax=x+42; s+=`<path d="M${ax} ${y+132}l-2.6 4.2h1.8v4.2h1.6v-4.2h1.8z" fill="${i===0?act:ink}"/><path d="M${ax} ${y+163}l-2.6 -4.2h1.8v-4.2h1.6v4.2h1.8z" fill="${i===2?act:ink}"/>`;
    s+=[["I",y+139],["O",y+148.5],["II",y+158]].map(([l,ly],j)=>tx(ax+3.5,ly,l,{fs:j===i?6.2:5.2,fw:j===i?800:600,a:"start",fill:j===i?act:ink})).join("");
    // праворуч — схема контактів: ніж від 1 (5) до 2 (6) у I, до 4 (8) у II, посередині — у «0»
    const P=[cx+16,R-14], tip=px=>px+[-5,0,5][i];
    s+=`<g fill="none" stroke="${ink}" stroke-width=".8" stroke-linecap="round">`;
    for(const px of P) s+=`<circle cx="${px}" cy="${y+137}" r="1.7"/><path d="M${px} ${y+139}L${tip(px)} ${y+150.5}M${px-5} ${y+152}v4.5M${px+5} ${y+152}v4.5"/>`;
    s+=`<path d="M${(P[0]+tip(P[0]))/2} ${y+144.8}H${(P[1]+tip(P[1]))/2}" stroke-dasharray="2 1.6"/></g>`;
    s+=[[P[0]-4,"1"],[P[1]-4,"5"]].map(([lx,l])=>tx(lx,y+137.3,l,{fs:4.4,a:"end",fill:ink})).join("")
      +[[P[0]-5,"2"],[P[0]+5,"4"],[P[1]-5,"6"],[P[1]+5,"8"]].map(([lx,l])=>tx(lx,y+163,l,{fs:4.4,fill:ink})).join("")
      +tx(cx+3,y+152,"I",{fs:5.2,fw:i===0?800:600,a:"start",fill:i===0?act:ink})+tx(R+1,y+152,"II",{fs:5.2,fw:i===2?800:600,a:"end",fill:i===2?act:ink});
    return s; }});
// Перемикач I–0–II 1P 40 / 63 А, 1 модуль (як TOMZN TO119G). Зверху клема 1 (спільна), місце «3» — заглушка;
// знизу 2 — положення I, 4 — положення II. Важіль угорі — I, посередині — 0, унизу — II. Нуль не комутує.
defType("to119",{name:"Перемикач I–0–II TOMZN TO119G 1P 40 / 63 А", short:"Перемикач TO119G", cat:"Комутація", w:1, pre:"QS", maker:"TOMZN",
  ratings:["40","63"], def:"63",
  terms:[{k:"1",s:"top",r:"L",l:"1",m:-0.25},{k:"2",s:"bot",r:"L",l:"2"},{k:"4",s:"bot",r:"L",l:"4"}],
  poles:[{a:"2",b:"1",r:"L"},{a:"4",b:"1",r:"L"}],
  closed:(d,pi)=>pi===0?d.pos===1:d.pos===2, init:d=>{ if(d.pos===undefined) d.pos=1; }, cap:"Перемикач I–0–II",
  tap(d){ const seq=[1,0,2,0]; d.seqI=((d.seqI??seq.indexOf(d.pos))+1)%4; d.pos=seq[d.seqI]; logp("w",`${desig(d)}: положення ${["0","I","II"][d.pos]}`); return true; },
  // Як на фото: синя клавіша у віконці; I — виступ клавіші вгорі (тіло нижче), 0 — виступ посередині, II — внизу (тіло вище).
  face(d,g){ const p=d.pos, x=g.x+5, w=g.w-21, top=g.y+68, bot=g.y+148,
      lip=p===1?top-2:p===0?g.y+100:bot-14, b0=p===1?lip+12:top+2, b1=p===1?bot-2:lip;
    return tx(g.cx,g.y+62,`TO119G ${d.rating||63}A`,{fs:5.4,fw:700})
      +`<g data-lever="${d.id}" style="cursor:pointer"><rect x="${x}" y="${top}" width="${w}" height="${bot-top}" rx="3" fill="#f1f3f6" stroke="#c8cdd5"/>`
      +`<rect x="${x+2}" y="${b0}" width="${w-4}" height="${b1-b0}" rx="2" fill="#2b67c9" stroke="#1d4c93"/>`
      +`<rect x="${x+6}" y="${b0+5}" width="${w-12}" height="${Math.max(0,b1-b0-10)}" rx="3" fill="#2a5fb8" stroke="#3d79d8" stroke-width=".8"/>`
      +`<line x1="${x+w/2}" y1="${b0+9}" x2="${x+w/2}" y2="${Math.max(b0+9,b1-9)}" stroke="#7ea9ea" stroke-width="1"/>`
      +`<rect x="${x-3}" y="${lip}" width="${w+6}" height="14" rx="3" fill="#2f80e6" stroke="#1b5aae"/><rect x="${x+1}" y="${lip+3}" width="${w-2}" height="3" rx="1.5" fill="#7fb4f4" opacity=".8"/></g>`
      +tx(g.x+g.w-4,g.y+80,"I",{fs:7,fw:700,a:"end"})+tx(g.x+g.w-4,g.y+111,"0",{fs:7,fw:700,a:"end"})+tx(g.x+g.w-4,g.y+144,"II",{fs:7,fw:700,a:"end"})
      +tx(g.cx,g.y+157,p===1?"I · 1–2":p===2?"II · 1–4":"0",{fs:6.4,fw:600}); }});
// Реле напруги й струму TOMZN TOVPD1 (2 модулі): червоний індикатор — напруга, зелений — струм навантаження.
// Зверху N і L — ввід, знизу N і L — вихід (N наскрізний). Як реле напруги: вимикає при U поза 170–250 В і вмикає
// після затримки. Додатково: струм понад уставку довше 1 с — відключає й чекає натискання ⏻ (захист від перевантаження).
const kvLogic=T.kv.logic, kvTick=T.kv.tick;
defType("tovpd1",{...T.kv, name:"Реле напруги й струму TOMZN TOVPD1 (V + A)", short:"Реле U+I TOVPD1", maker:"TOMZN", amm:true, faceFill:"#cdd0d5",
  ratings:["40","60","63"], def:"60", cap:"Контроль U та I",
  terms:[{k:"t1",s:"top",r:"N",l:"N"},{k:"t2",s:"top",r:"L",l:"L"},{k:"b1",s:"bot",r:"N",l:"N",m:0},{k:"b2",s:"bot",r:"L",l:"L",m:1}],
  links:()=>[["t1","b1"]],
  init:d=>{ if(!d.iset||d.iset>inA(d.rating)) d.iset=inA(d.rating)||60; },
  logic(d,X){ const s=d.ks||(d.ks={closed:false,delay:KV_DELAY});
    if(s.oc||s.off){ const U=X.volt(K(d,"t2"),K(d,"t1")); s.U=U; s.pw=U>60; if(s.closed){ s.closed=false; return true; } return false; }
    return kvLogic(d,X); },
  tick(d,X,dt){ const s=d.ks; if(!s) return; const I=s.closed?(((S.sim&&S.sim.per[d.id])||[])[0]||0):0; s.I=I;
    const lim=d.iset||inA(d.rating);
    if(s.closed&&I>lim){ s.ot=(s.ot||0)+dt; if(s.ot>=1){ s.closed=false; s.oc=true; s.ot=0; s.I=0;
      logp("e",`${desig(d)} відключив навантаження: струм ${fmt(I)} А більший за уставку ${lim} А. Натисніть ⏻ на реле, щоб увімкнути знову`);
      if(typeof toast==="function") toast(`${desig(d)}: перевантаження ${fmt(I)} А > ${lim} А`,"e"); } return; }
    s.ot=0; if(s.oc||s.off) return; kvTick(d,X,dt); },
  tap(d,el){ const s=d.ks||(d.ks={closed:false,delay:KV_DELAY}); s.delay=KV_DELAY;
    if(s.oc){ s.oc=false; logp("ok",`${desig(d)}: відключення за струмом скинуто — увімкне через ${KV_DELAY} с, якщо напруга в нормі`); return true; }
    s.off=!s.off; logp("w",`${desig(d)}: кнопка ⏻ — ${s.off?"навантаження вимкнено вручну":`увімкне через ${KV_DELAY} с, якщо напруга в нормі`}`); return true; },
  face(d,g){ const s=d.ks||{}, pw=!!s.pw, hiU=pw&&s.U>U_MAX, loU=pw&&s.U<U_MIN, x=g.x, y=g.y, dw=g.w-36;
    const vt=!pw?"---":s.closed||hiU||loU||s.oc||s.off?String(Math.round(s.U)):"⏱"+Math.ceil(s.delay),
      at=!pw?"---":s.oc?"OC":s.off?"OFF":fmt(s.I||0,(s.I||0)<10?1:0);
    const ledL=(yy,l,c)=>tx(x+g.w-17,yy+2.4,l,{fs:5.6,fw:700,a:"end",fill:"#3d4250"})+`<circle cx="${x+g.w-10}" cy="${yy}" r="3.4" fill="${c}" stroke="#555"/>`;
    const btn=(bx,lab,lev)=>`<g${lev?` data-lever="${d.id}" style="cursor:pointer"`:""}><circle cx="${bx}" cy="${y+141}" r="9" fill="#3d8de6" stroke="#1f63b3" stroke-width="1.2"/>`
      +(lab==="pw"?`<path d="M${bx-3.4} ${y+138.2} A4.6 4.6 0 1 0 ${bx+3.4} ${y+138.2}" fill="none" stroke="#fff" stroke-width="1.3"/><line x1="${bx}" y1="${y+135.2}" x2="${bx}" y2="${y+141}" stroke="#fff" stroke-width="1.3"/>`
        :tx(bx,y+143.3,lab,{fs:lab.length>1?5.6:7,fw:700,fill:"#fff"}))+`</g>`;
    return lcd(x+7,y+62,dw,26,vt,pw,"#ff4a3d")+lcd(x+7,y+92,dw,26,at,pw&&!s.off,s.oc?"#ff4a3d":"#43e05a")
      +tx(x+dw+4,y+86,"V",{fs:5.6,fw:700,a:"end",fill:"#8a8f99"})+tx(x+dw+4,y+116,"A",{fs:5.6,fw:700,a:"end",fill:"#8a8f99"})
      +ledL(y+67,">V",hiU?"#ff3b30":"#5a5e66")+ledL(y+80,"<V",loU?"#ff3b30":"#5a5e66")+ledL(y+97,">A",s.oc||(s.ot>0)?"#ff3b30":"#5a5e66")+ledL(y+110,"PWR",pw?"#3fd14e":"#5a5e66")
      +tx(x+8,y+128,"TOVPD1-"+d.rating,{fs:6.6,fw:700,a:"start",fill:"#22252b"})+tx(x+g.w-8,y+128,`I ≤ ${d.iset||inA(d.rating)} А`,{fs:5.8,a:"end",fill:"#3d4250"})
      +btn(x+16,"pw",1)+btn(x+40,"SET")+btn(x+g.w-40,"▲")+btn(x+g.w-16,"▼")
      +tx(g.cx,y+159,"TOMZN ELECTRIC",{fs:5.2,fw:600,fill:"#3d4250"}); }});
// АВР TOMZN TOQ5-…/2 з поворотною ручкою, 6 модулів (мережа + генератор). Зверху Source A (R, N) — мережа, пріоритет;
// знизу Source B (R, N) — генератор, і окремі клеми навантаження Load (R, N). Блок керування бачить напругу лише через
// клеми AR/AN і BR/BN — їх з’єднують із силовими клемами комплектними перемичками. NC–C–NO: сигнальні контакти положення
// (зверху — «на вводі A», знизу — «на вводі B»). Перемикання < 10 мс, без витримок; повзунок Manual/Auto — ручний режим.
defType("toq5",{name:"АВР TOMZN TOQ5 2P з ручкою (мережа + генератор)", short:"АВР TOQ5", cat:"Комутація", w:6, pre:"QA", maker:"TOMZN",
  ratings:["63","100","125"], def:"125", unit:" А",
  terms:[{k:"RA",s:"top",r:"L",l:"R (A)",m:0.3,nl:1},{k:"NA",s:"top",r:"N",l:"N (A)",m:1.5,nl:1},
    {k:"AR",s:"top",r:"L",l:"AR",m:3.0,nl:1},{k:"AN",s:"top",r:"N",l:"AN",m:3.55,nl:1},{k:"NCA",s:"top",r:"C",l:"NC (A)",m:4.1,nl:1},{k:"CA",s:"top",r:"C",l:"C (A)",m:4.65,nl:1},{k:"NOA",s:"top",r:"C",l:"NO (A)",m:5.2,nl:1},
    {k:"RB",s:"bot",r:"L",l:"R (B)",m:0.03,nl:1},{k:"RL",s:"bot",r:"L",l:"R (Load)",m:0.57,nl:1},{k:"NB",s:"bot",r:"N",l:"N (B)",m:1.23,nl:1},{k:"NL",s:"bot",r:"N",l:"N (Load)",m:1.77,nl:1},
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
    // низ, як на корпусі: «Source B», великі R і N над колонками; під гвинтами — ярус клеми (B — вхід генератора, Load — вихід на навантаження) і клеми керування
    s+=tx(tx_(0.3),g.y+161,"R",{fs:10,fw:800})+tx(tx_(1.5),g.y+161,"N",{fs:10,fw:800});
    for(const [a,b] of [[0.03,0.57],[1.23,1.77]]) s+=`<rect x="${tx_(a)-14}" y="${g.y+205}" width="${tx_(b)-tx_(a)+28}" height="29" rx="4" fill="none" stroke="#8f949c" stroke-width="1.2"/>`;
    [["RB","B"],["RL","Load"],["NB","B"],["NL","Load"],["BR","BR"],["BN","BN"],["NCB","NC"],["CB","C"],["NOB","NO"]].forEach(([k,l])=>{ const m=T.toq5.terms.find(t=>t.k===k).m; s+=tx(tx_(m)+5,g.y+238,l,{fs:6.4,fw:700,a:"start"}); });   // правіше від гвинта — перемичка не закриває
    s+=lab(g.x+76,g.y+62,"Source A")+lab(tx_(0.9),g.y+147,"Source B");
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
// ---- АВР TOMZN TOQ7 2P: принцип як у TOQ5 (пріоритет A, ручка, Manual/Auto, сигнальні контакти), чорний корпус, перемикання < 50 мс
defType("toq7",{...T.toq5, name:"АВР TOMZN TOQ7 2P з ручкою (мережа + генератор)", short:"АВР TOQ7", body:"#2a2d33", faceFill:"#1c1e23",
  logic(d,X){ const ok=(a,b)=>{ const u=X.volt(K(d,a),K(d,b)); return u>=187&&u<=253; }, okA=ok("AR","AN"), okB=ok("BR","BN");
    d.ok=[okA,okB]; d.pw=okA||okB;
    if(d.manual||!d.pw) return false; const t=okA?"A":"B";
    if(t!==d.pos){ d.pos=t; logp(t==="A"?"ok":"w",`${desig(d)}: навантаження переведено на Source ${t} (${t==="A"?"мережа":"генератор"}), < 50 мс`); return true; } return false; },
  face(d,g){ const X0=g.x-1, tx_=m=>X0+(m+0.5)*G.MW, A=d.pos==="A", pw=!!d.pw, ok=d.ok||[false,false], cx0=g.x+82, cy0=g.y+106, W_="#eceef2", M_="#9aa0aa",
      ang=A?-38:38, lab=(x,y,t)=>`<rect x="${x-21}" y="${y-7}" width="42" height="10" rx="1.5" fill="none" stroke="${M_}" stroke-width=".8"/>`+tx(x,y+0.6,t,{fs:6.2,fill:W_});
    let s=`<rect x="${g.cx-34}" y="${g.y+47}" width="68" height="12" fill="#1c1e23"/>`;   // ховаємо загальний підпис бренду — на TOQ7 своя біла табличка
    s+=`<rect x="${g.x+180}" y="${g.y+49}" width="${g.w-186}" height="12" rx="1.5" fill="#f4f5f7"/>`+tx(g.x+232,g.y+57.6,"TOMZN",{fs:7.6,fw:800,fill:"#1d4fa8"})
      +`<line x1="${g.x+176}" y1="${g.y+48}" x2="${g.x+176}" y2="${g.y+162}" stroke="#454a54"/>`;
    // надписи клем на корпусі (зверху — Source A і керування A, знизу — Source B, Load і керування B)
    [["RA","R"],["NA","N"],["AR","AR"],["AN","AN"],["NCA","NC"],["CA","C"],["NOA","NO"]].forEach(([k,l])=>{ const m=T.toq7.terms.find(t=>t.k===k).m; s+=tx(tx_(m),g.y+42,l,{fs:l.length>1?6.4:8,fw:700,fill:W_}); });
    // низ, як на корпусі: «Source B», великі R і N над колонками; під гвинтами — ярус клеми (B — вхід генератора, Load — вихід на навантаження) і клеми керування
    s+=tx(tx_(0.3),g.y+161,"R",{fs:10,fw:800,fill:W_})+tx(tx_(1.5),g.y+161,"N",{fs:10,fw:800,fill:W_});
    for(const [a,b] of [[0.03,0.57],[1.23,1.77]]) s+=`<rect x="${tx_(a)-14}" y="${g.y+205}" width="${tx_(b)-tx_(a)+28}" height="29" rx="4" fill="none" stroke="#5a606b" stroke-width="1.2"/>`;
    [["RB","B"],["RL","Load"],["NB","B"],["NL","Load"],["BR","BR"],["BN","BN"],["NCB","NC"],["CB","C"],["NOB","NO"]].forEach(([k,l])=>{ const m=T.toq7.terms.find(t=>t.k===k).m; s+=tx(tx_(m)+5,g.y+238,l,{fs:6.4,fw:700,a:"start",fill:W_}); });   // правіше від гвинта — перемичка не закриває
    s+=lab(g.x+76,g.y+62,"Source A")+lab(tx_(0.9),g.y+147,"Source B");
    // поворотна червона ручка на чорній основі
    s+=`<g data-lever="${d.id}" style="cursor:pointer"><circle cx="${cx0}" cy="${cy0}" r="31" fill="#121316" stroke="#4a4f59" stroke-width="1.5"/>`
      +`<path d="M${cx0+24} ${cy0-20} A31 31 0 0 1 ${cx0+24} ${cy0+20}" fill="none" stroke="${M_}" stroke-width="1.2"/>`
      +`<g transform="rotate(${ang} ${cx0} ${cy0})"><rect x="${cx0-20}" y="${cy0-6}" width="50" height="12" rx="6" fill="#e0352b" stroke="#9e1e17" stroke-width="1"/><circle cx="${cx0}" cy="${cy0}" r="10" fill="#d42d24" stroke="#9e1e17"/><circle cx="${cx0}" cy="${cy0}" r="2.5" fill="#7a1611"/></g></g>`
      +`<circle cx="${cx0+40}" cy="${cy0-25}" r="6" fill="none" stroke="${M_}" stroke-width=".8"/>`+tx(cx0+40,cy0-22.5,"A",{fs:7,fw:700,fill:W_})
      +`<circle cx="${cx0+40}" cy="${cy0+24}" r="6" fill="none" stroke="${M_}" stroke-width=".8"/>`+tx(cx0+40,cy0+26.5,"B",{fs:7,fw:700,fill:W_});
    // тип, стан вводів, індикатори A/B, повзунок Manual/Auto
    s+=tx(g.x+232,g.y+72,`Type: TOQ7-${d.rating||"125"}/2`,{fs:7.4,fw:700,fill:W_})+tx(g.x+232,g.y+82,`${d.rating||"125"} A · 220 V~ · < 50 мс`,{fs:5.8,fill:M_});
    s+=tx(g.x+184,g.y+98,"Ⅰ мережа: "+(ok[0]?"є":"немає"),{fs:6.4,a:"start",fill:ok[0]?"#5fd38a":"#8e939c",fw:600})
      +tx(g.x+184,g.y+110,"Ⅱ генератор: "+(ok[1]?"є":"немає"),{fs:6.4,a:"start",fill:ok[1]?"#5fd38a":"#8e939c",fw:600});
    s+=led(g.x+298,g.y+94,pw&&A?"#ff4a3d":"#4d5159")+tx(g.x+311,g.y+97,"A",{fs:8,fw:700,fill:W_})+led(g.x+298,g.y+146,pw&&!A?"#3fbf4a":"#4d5159")+tx(g.x+311,g.y+149,"B",{fs:8,fw:700,fill:W_});
    s+=`<g data-lever="${d.id}" data-zone="mode" style="cursor:pointer"><rect x="${g.x+250}" y="${g.y+104}" width="64" height="32" fill="transparent"/>`
      +tx(g.x+284,g.y+113,"Manual",{fs:6.2,a:"end",fill:W_})+tx(g.x+284,g.y+133,"Auto",{fs:6.2,a:"end",fill:W_})
      +`<rect x="${g.x+290}" y="${g.y+104}" width="16" height="32" rx="4" fill="#0d0e11" stroke="#454a54"/><rect x="${g.x+292}" y="${d.manual?g.y+106:g.y+120}" width="12" height="14" rx="3" fill="#e0352b"/></g>`
      +tx(g.x+232,g.y+128,d.manual?"РУЧНИЙ":"АВТО",{fs:7,fw:700,fill:d.manual?"#ffa04d":"#5fd38a"});
    return s; }});
