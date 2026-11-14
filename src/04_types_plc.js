/* ===== Керування 24 В: ОВЕН ПЛК200-04, реле й лампа 24 В=, DC/DC 24 В, перемикач «Авто / Ручний» ===== */
// Котушка 24 В постійного струму тягне від 16 до 40 В; 230 В на ній — помилка монтажу (у журналі)
function coil24(d,X,a,b){ const U=X.volt(K(d,a),K(d,b));
  if(U>60){ if(!d.hv){ d.hv=true; logp("e",`${desig(d)}: на котушку 24 В подано ${Math.round(U)} В — у щитку вона згорить`); } return false; }
  d.hv=false; return U>=16; }
function coil24Logic(d,X){ const p=coil24(d,X,"A1","A2"); if(p!==!!d.pulled){ d.pulled=p; return true; } return false; }

defType("rel24",{...T.rel, name:"Реле проміжне 1CO, котушка 24 В=", short:"Реле 24 В=",
  terms:[C("A1","top","A1","any"),C("11","top","11"),C("A2","bot","A2","any"),C("12","bot","12"),C("14","bot","14")],
  logic:coil24Logic, load:d=>d.pulled?[{a:"A1",b:"A2",I:0.02,U:24,dc:true}]:[],
  face(d,g){ return tx(g.cx,g.y+70,"РЕЛЕ 24 В=",{fs:7,fw:700})+tx(g.cx,g.y+82,"1 перекидний 10 А",{fs:6.3})
    +`<rect x="${g.cx-14}" y="${g.y+92}" width="28" height="28" rx="3" fill="#2a2d33"/>`+led(g.cx,g.y+106,d.pulled?"#3fbf4a":"#5a5e66")+tx(g.cx,g.y+135,d.pulled?"11–14":"11–12",{fs:7,ff:"var(--mono)"}); }});
defType("hl24",{...T.hl, name:"Лампа сигнальна 24 В", short:"Лампа 24 В", terms:[C("X1","top","X1","any"),C("X2","bot","X2","any")],
  init:d=>{ d.col=d.col||"#ff9830"; },
  load:(d,X)=>{ const U=X.volt(K(d,"X1"),K(d,"X2")); return U>=16&&U<=40?[{a:"X1",b:"X2",I:0.02,U:24,dc:true}]:[]; },
  face(d,g){ const X=S.sim&&S.sim.X, U=X?X.volt(K(d,"X1"),K(d,"X2")):0, on=U>=16&&U<=40;
    return (on?`<circle cx="${g.cx}" cy="${g.y+100}" r="22" fill="${d.col}" opacity=".35"/>`:"")+`<circle cx="${g.cx}" cy="${g.y+100}" r="14" fill="${on?d.col:"#5a5e66"}" stroke="#1a1c20" stroke-width="2"/>`+tx(g.cx,g.y+134,"24 В",{fs:7}); }});

defType("sa",{name:"Перемикач «Авто / Ручний»", short:"Перемикач А / Р", cat:"Керування", w:1, pre:"SA", terms:[C("13","top","13"),C("14","bot","14")],
  aux:d=>d.man?[["13","14"]]:[], cap:"Авто / Ручний", init:d=>{ d.man=!!d.man; },
  tap(d){ d.man=!d.man; logp(d.man?"w":"ok",`${desig(d)}: ${d.man?"«Ручний» — контакт 13–14 замкнено":"«Авто» — контакт 13–14 розімкнено"}`); return true; },
  face(d,g){ const a=d.man?40:-40, cy=g.y+104;
    return tx(g.x+7,g.y+84,"А",{fs:8,fw:700,a:"start"})+tx(g.x+g.w-7,g.y+84,"Р",{fs:8,fw:700,a:"end"})
      +`<g data-lever="${d.id}" style="cursor:pointer"><circle cx="${g.cx}" cy="${cy}" r="17" fill="#2a2d33"/><g transform="rotate(${a} ${g.cx} ${cy})"><rect x="${g.cx-4}" y="${cy-19}" width="8" height="26" rx="3" fill="#e9ecef"/></g></g>`
      +tx(g.cx,g.y+138,d.man?"РУЧНИЙ":"АВТО",{fs:6.3,fw:700,fill:d.man?"#c25e00":"#1b855e"}); }});

defType("dcdc",{name:"Перетворювач DC/DC 18–36 → 24 В", short:"DC/DC 24 В", cat:"Керування", w:2, pre:"U",
  terms:[{k:"ip",s:"top",r:"DC",l:"+Vin"},{k:"im",s:"top",r:"DC",l:"−Vin"},{k:"op",s:"bot",r:"any",l:"+24"},{k:"om",s:"bot",r:"any",l:"0 В"}],
  cap:"Живлення 24 В", init:d=>{ d.ok=false; d.prot=0; },
  logic(d,X){ const U=X.volt(K(d,"ip"),K(d,"im")); d.Uin=U; const ok=U>=18&&U<=36&&!(d.prot>0); if(ok!==d.ok){ d.ok=ok; return true; } return false; },
  tick(d,X,dt){ if(d.prot>0) d.prot=Math.max(0,d.prot-dt); },
  source:d=>d.ok?[["op","d24+"],["om","d24-"]]:[],
  load:d=>d.ok?[{a:"ip",b:"im",I:0.5*24/Math.max(18,d.Uin||24)/0.9,U:d.Uin||24,dc:true}]:[],
  onFault(d,c){ if(d.ok&&c.pots.includes("d24+")&&c.pots.includes("d24-")){ d.prot=5; d.ok=false; logp("e",`${desig(d)}: коротке замикання на виході 24 В — захист вимкнув вихід на 5 с`); return true; } return false; },
  face(d,g){ return tx(g.cx,g.y+70,"DC/DC",{fs:9,fw:700})+tx(g.cx,g.y+82,"18–36 → 24 В · 2 А",{fs:6.3})
    +lcd(g.x+10,g.y+92,g.w-20,24,d.ok?"24,0 В":"---",d.ok,"#5fe36b")+led(g.x+16,g.y+132,d.ok?"#3fbf4a":"#9aa0aa")+tx(g.x+24,g.y+134.5,"DC OK",{fs:6.3,a:"start"})
    +tx(g.cx,g.y+150,d.Uin>1?"вх. "+fmt(d.Uin,1)+" В":"вх. —",{fs:6.3,ff:"var(--mono)"}); }});

// ---- ПЛК200-04 з програмою АВР «мережа ↔ гібридний інвертор»
// FDI1 мережа в нормі (K2) · FDI2 KM1 · FDI3 KM2 · FDI4 BMS увімкнено (K3) · FDI6 «Ручний» (SA1)
// DO1 імпульс на кнопку BMS · DO2 Remote ON/OFF інвертора · DO3 K1 заборона мережі · DO4 KM3 заряд · DO5 HL3
const PLC_T = {loss:1, boot:5, pulse:3, bms:10, pause:2, inv:30, off:5, after:3, grid:5, chg:180, lost:20};
const PLC_ST = {off:"немає живлення", boot:"старт програми", grid:"мережа", loss:"мережа зникла", b_on:"вмикаю BMS", i_pause:"пауза 2 с", i_wait:"пуск інвертора",
  inv:"живлення від АКБ", r_off:"вимикаю інвертор", r_wait:"пауза 3 с", r_bms:"вимикаю BMS", r_grid:"вмикаю мережу", c_bms:"заряд: вмикаю BMS", c_km3:"заряд: вмикаю KM3",
  chg:"заряд АКБ", c_stop:"стоп заряду", c_off:"заряд: вимикаю BMS", alarm:"аварія", manual:"ручний режим"};
const plcGo = (d,st,msg,cls) => { d.st=st; d.t=0; if(msg) logp(cls||"ok",`${desig(d)}: ${msg}`); };
const plcPulse = d => { d.q[0]=true; d.tp=PLC_T.pulse; };
const plcAlarm = (d,msg) => { d.alarm=msg; d.q[0]=false; d.q[1]=false; d.q[3]=false; d.tp=0; d.ok=0; plcGo(d,"alarm","аварія — "+msg,"e"); if(typeof toast==="function") toast("ПЛК: "+msg,"e"); };
defType("plc200",{name:"ОВЕН ПЛК200-04", short:"ПЛК200-04", cat:"Керування", w:5, pre:"A", maker:"ОВЕН", body:"#e4e7eb", faceFill:"#d7dce2",
  terms:[C("Vp","top","+24","any"),C("Vm","top","0 В","any"),C("SS1","top","SS1","any"),...[1,2,3,4,5,6].map(i=>C("FDI"+i,"top","FDI"+i)),
    ...[1,2,3,4,5].flatMap(i=>[{...C("DO"+i+"A","bot","DO"+i+"A"),nl:true},{...C("DO"+i+"B","bot","DO"+i+"B"),nl:true}])],   // підписи DO — на лицьовій панелі, над гвинтами
  cap:"АВР інвертора", init:d=>{ d.q=[false,false,false,false,false]; d.st="off"; d.t=0; d.tp=0; d.in=[]; d.pw=false; d.gt=0; d.gl=0; d.chgNeed=false; d.alarm=""; d.ret=d.ret||10; },
  aux:d=>(d.pw?d.q:[]).flatMap((on,i)=>on?[["DO"+(i+1)+"A","DO"+(i+1)+"B"]]:[]),
  load:d=>d.pw?[{a:"Vp",b:"Vm",I:0.5,U:24,dc:true}]:[],
  logic(d,X){ const U=X.volt(K(d,"Vp"),K(d,"Vm")); d.pw=U>=9&&U<=48;
    d.in=[1,2,3,4,5,6].map(i=>d.pw&&X.volt(K(d,"FDI"+i),K(d,"SS1"))>=9);
    if(!d.pw&&d.q.some(Boolean)){ d.q=d.q.map(()=>false); d.tp=0; return true; } return false; },
  tick(d,X,dt){ const q=d.q;
    if(!d.pw){ if(d.st!=="off"){ d.st="off"; d.t=0; d.tp=0; logp("w",`${desig(d)}: немає живлення 24 В — усі виходи вимкнено, K1 відпущене`); } return; }
    const [g,k1,k2,bms,,man]=d.in;
    if(d.st==="off") plcGo(d,"boot","живлення є, програма стартує");
    d.t+=dt; if(bms) d.soc=Math.round(S.env.soc||0);   // SOC по RS-485 — лише коли BMS увімкнена
    if(d.tp>0){ d.tp-=dt; if(d.tp<=1e-6){ d.tp=0; q[0]=false; } }
    if(man){ if(d.st!=="manual"){ q.fill(false); d.tp=0; plcGo(d,"manual","SA1 «Ручний» — ПЛК нічого не перемикає","w"); } return; }
    if(d.st==="manual") plcGo(d,"boot","SA1 «Авто» — програма стартує знову");
    d.gl=g?0:(d.gl||0)+dt; d.gt=g?(d.gt||0)+dt:0; const lost=d.gl>=PLC_T.loss, timeout=d.t>=PLC_T.pulse+PLC_T.bms;
    const toLoss=()=>{ q[2]=true; q[3]=false; q[4]=true; if(bms) plcGo(d,"i_pause","мережа зникла, BMS уже ввімкнена — пауза 2 с","w"); else { plcPulse(d); plcGo(d,"b_on","мережа зникла — K1 забороняє KM1, DO1: імпульс 3 с на кнопку BMS","w"); } };
    switch(d.st){
      case "boot": q[1]=false; q[3]=false;
        if(g){ if(k2){ q[2]=true; plcGo(d,"r_off","мережа є, а будинок на інверторі — повертаю на мережу"); } else { q[2]=false; q[4]=false; if(bms) d.chgNeed=true; plcGo(d,"grid","мережа є — KM1 дозволено"+(bms?"; BMS увімкнена — дозаряджу АКБ і вимкну її":"")); } }
        else if(d.t>=PLC_T.boot) toLoss(); break;
      case "grid": q[1]=false; q[2]=false; q[3]=false; q[4]=false;
        if(lost) toLoss();
        else if(d.chgNeed&&k1&&d.t>=2){ if(bms){ q[3]=true; plcGo(d,"c_km3","заряд АКБ: DO4 вмикає KM3 — мережа на AC IN інвертора"); } else { plcPulse(d); plcGo(d,"c_bms","заряд АКБ: DO1 — імпульс на кнопку BMS"); } } break;
      case "b_on": if(bms&&!d.tp) plcGo(d,"i_pause","BMS увімкнено (FDI4 = 1), пауза 2 с"); else if(timeout) plcAlarm(d,"BMS не ввімкнулась після імпульсу"); break;
      case "i_pause": if(d.t>=PLC_T.pause){ q[1]=true; plcGo(d,"i_wait","DO2 замкнено й утримується — інвертор стартує"); } break;
      case "i_wait": q[1]=true; q[4]=true;
        if(k2) plcGo(d,"inv","KM2 увімкнено (FDI3 = 1) — будинок живиться від АКБ"); else if(d.t>=PLC_T.inv) plcAlarm(d,"інвертор не видав 230 В за 30 с (KM2 не ввімкнувся)"); break;
      case "inv": q[1]=true; q[2]=true; q[3]=false;
        if(!bms){ plcAlarm(d,"BMS вимкнулась — АКБ розряджена або спрацював її захист"); break; }
        d.lk=k2?0:(d.lk||0)+dt; q[4]=k2||Math.floor(d.t*2)%2===0;
        if(d.lk>=PLC_T.lost){ plcAlarm(d,"немає напруги від інвертора 20 с"); break; }
        if(d.gt>=d.ret) plcGo(d,"r_off",`мережа стабільна ${d.ret} с — DO2 розімкнено, інвертор вимикається`); break;
      case "r_off": q[1]=false; q[3]=false; q[4]=false;
        if(lost){ toLoss(); break; } if(!k2) plcGo(d,"r_wait","KM2 відпав (FDI3 = 0), пауза 3 с"); else if(d.t>=PLC_T.off) plcAlarm(d,"KM2 не відпадає після вимкнення інвертора"); break;
      case "r_wait": if(lost){ toLoss(); break; }
        if(d.t>=PLC_T.after){ if(bms){ plcPulse(d); plcGo(d,"r_bms","DO1: імпульс 3 с — вимикаю BMS"); } else plcGo(d,"r_grid"); } break;
      case "r_bms": if(!bms&&!d.tp) plcGo(d,"r_grid","BMS вимкнено (FDI4 = 0) — DO3 розімкнено, K1 дозволяє KM1"); else if(timeout) plcAlarm(d,"BMS не вимкнулась після імпульсу"); break;
      case "r_grid": if(lost){ toLoss(); break; } q[2]=false;
        if(k1){ d.chgNeed=d.soc==null||d.soc<98; plcGo(d,"grid","KM1 увімкнено — будинок на мережі"+(d.chgNeed?", далі заряд АКБ":"")); } else if(d.t>=PLC_T.grid) plcAlarm(d,"KM1 не ввімкнувся"); break;
      case "c_bms": if(lost){ toLoss(); break; }
        if(bms&&!d.tp){ q[3]=true; plcGo(d,"c_km3","BMS увімкнено — DO4 вмикає KM3, мережа на AC IN інвертора"); } else if(timeout) plcAlarm(d,"BMS не ввімкнулась для заряду"); break;
      case "c_km3": q[3]=true; if(lost){ toLoss(); break; }
        if(d.t>=1){ q[1]=true; plcGo(d,"chg","DO2 — інвертор заряджає АКБ від мережі"); } break;
      case "chg": q[1]=true; q[3]=true;
        if(lost){ q[2]=true; q[3]=false; q[4]=true; plcGo(d,"i_wait","мережа зникла під час заряду — KM2 підхоплює живлення від уже ввімкненого інвертора","w"); break; }
        if(!bms){ plcAlarm(d,"BMS вимкнулась під час заряду"); break; }
        if(d.soc>=100||d.t>=PLC_T.chg){ q[1]=false; plcGo(d,"c_stop",d.soc>=100?"АКБ заряджено (SOC 100 % по RS-485) — DO2 розімкнено":"ліміт часу заряду — DO2 розімкнено"); } break;
      case "c_stop": q[1]=false; if(lost){ toLoss(); break; }
        if(d.t>=PLC_T.after){ q[3]=false; if(bms){ plcPulse(d); plcGo(d,"c_off","DO4 розімкнено, DO1: імпульс — вимикаю BMS"); } else { d.chgNeed=false; plcGo(d,"grid","заряд завершено"); } } break;
      case "c_off": if(!bms&&!d.tp){ d.chgNeed=false; plcGo(d,"grid","заряд завершено, BMS вимкнено"); } else if(timeout) plcAlarm(d,"BMS не вимкнулась після заряду"); break;
      case "alarm": q[1]=false; q[3]=false; q[2]=!g; q[4]=Math.floor(d.t*2)%2===0;
        if(g&&k1){ d.ok=(d.ok||0)+dt; if(d.ok>=3){ d.alarm=""; d.chgNeed=true; plcGo(d,"grid","мережа є, KM1 увімкнено — аварію скинуто"); } } else d.ok=0; break;
    } },
  face(d,g){ const on=!!d.pw, x=g.x, y=g.y, inn=d.in||[], q=d.q||[], st=PLC_ST[d.st]||d.st;
    let s=tx(x+10,y+70,"ПЛК200-04",{fs:9.5,fw:700,a:"start"})+tx(x+g.w-10,y+70,"8 FDI · 8 DO · 4 AI · RS-485",{fs:6,a:"end"});
    s+=tx(x+12,y+87,"FDI",{fs:6.5,fw:700,a:"start"})+tx(x+12,y+109,"DO",{fs:6.5,fw:700,a:"start"});
    for(let i=0;i<6;i++) s+=led(x+44+i*19,y+84,on&&inn[i]?"#3fbf4a":"#80858d")+tx(x+44+i*19,y+97,String(i+1),{fs:6});
    for(let i=0;i<5;i++) s+=led(x+44+i*19,y+106,on&&q[i]?"#ffb21f":"#80858d")+tx(x+44+i*19,y+119,String(i+1),{fs:6});
    const r=x+g.w-48; [["Живл.",on?"#3fbf4a":"#80858d"],["Робота",on&&d.st!=="alarm"?"#3fbf4a":"#80858d"],["Аварія",on&&d.st==="alarm"?"#e23b3b":"#80858d"]]
      .forEach(([l,c],i)=>{ s+=led(r,y+82+i*13,c)+tx(r+8,y+84.5+i*13,l,{fs:6,a:"start"}); });
    const l2=!on?"":d.st==="inv"?`мережа ${fmt(d.gt||0,0)} з ${d.ret} с · SOC ${d.soc??"—"} %`:d.st==="alarm"?String(d.alarm||"").slice(0,44)
      :`SOC ${d.soc??"—"} % (RS-485)${d.chgNeed&&d.st==="grid"?" · потрібен заряд":""}`;
    for(let i=0;i<10;i++) s+=tx(x-1+(i+0.5)*(g.w+2)/10,y+162.5,"DO"+(Math.floor(i/2)+1)+(i%2?"B":"A"),{fs:5.6,fw:600});
    return s+lcd(x+8,y+125,g.w-16,29,on?["АВР: "+st.toUpperCase(),l2]:["",""],on,d.st==="alarm"?"#ff6b5a":"#a6e3ff"); }});
