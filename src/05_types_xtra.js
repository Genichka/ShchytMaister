/* ===== Додаткові модулі для конструктора ===== */
const P4 = (pre) => [{k:"t1",s:"top",r:"P",l:"1"},{k:"t2",s:"top",r:"P",l:"3"},{k:"t3",s:"top",r:"P",l:"5"},{k:"t4",s:"top",r:"N",l:"N"},
  {k:"b1",s:"bot",r:"P",l:"2"},{k:"b2",s:"bot",r:"P",l:"4"},{k:"b3",s:"bot",r:"P",l:"6"},{k:"b4",s:"bot",r:"N",l:"N"}];
const POLES4 = [{a:"t1",b:"b1",r:"L"},{a:"t2",b:"b2",r:"L"},{a:"t3",b:"b3",r:"L"},{a:"t4",b:"b4",r:"N"}];
Object.assign(T.qf3p,{group:true, groupOpt:true, gph:3});
defType("qf4p",{...brk, name:"Автомат 3P+N (4P)", short:"Автомат 4P", cat:"Захист", w:4, pre:"QF", group:true, groupOpt:true, gph:3,
  terms:P4(), poles:POLES4, ratings:["C6","C10","C16","C20","C25","C32","C40","C50","C63","C80","C100","C125"], def:"C25", face:breakerFace, cap:"Ввід 400 В"});
defType("rcd4",{name:"ПЗВ 4P 30 мА", short:"ПЗВ 4P", cat:"Захист", w:4, pre:"QD", rcd:true, terms:P4(), poles:POLES4, ratings:["16","25","32","40","63","80","100"], def:"40", unit:" А", cap:"Захист від ураження",
  face(d,g){ return tx(g.cx,g.y+72,mdl(d,"ПЗВ 4P · ΔI 30 мА"),{fs:7})+tx(g.cx,g.y+90,d.rating+" А",{c:"svt",fs:15})+lever(d,g.cx,g.y+102,72,g.on,"#2f6fdf")+flag(g.cx,g.y+150,g.on)+testBtn(d,g); }});
// Реле контролю фаз: наявність, напруга, послідовність L1-L2-L3
defType("kvf",{name:"Реле контролю фаз", short:"Реле контролю фаз", cat:"Захист", w:2, pre:"KV",
  terms:[{k:"L1",s:"top",r:"P",l:"L1"},{k:"L2",s:"top",r:"P",l:"L2"},{k:"L3",s:"top",r:"P",l:"L3"},{k:"N",s:"top",r:"N",l:"N"},C("11","bot","11"),C("12","bot","12"),C("14","bot","14")],
  aux:d=>d.ks&&d.ks.ok?[["11","14"]]:[["11","12"]], cap:"Контроль фаз",
  logic(d,X){ const s=d.ks||(d.ks={ok:false,delay:2}); const ps=["L1","L2","L3"].map(t=>X.ph(K(d,t))), a=ps.map(p=>p?PH_ANG[p.split(".")[1]]:null);
    s.ph=ps.map(Boolean); s.pw=ps.some(Boolean); const n=new Set(ps.filter(Boolean)).size, U=ps[0]?srcU(ps[0]):0;
    const seq=n===3&&(a[1]-a[0]+360)%360===120&&(a[2]-a[1]+360)%360===120;
    s.why=!s.pw?"":n<3?"обрив фази":!seq?"неправильне чергування фаз":U>U_MAX?"перенапруга":U<U_MIN?"знижена напруга":""; s.good=s.pw&&!s.why;
    if(!s.good){ s.delay=2; if(s.ok){ s.ok=false; logp("w",`${desig(d)}: ${s.why||"немає напруги"} — навантаження відключено`); return true; } }
    return false; },
  tick(d,X,dt){ const s=d.ks; if(!s||!s.good||s.ok) return; s.delay-=dt; if(s.delay<=0){ s.ok=true; logp("ok",`${desig(d)}: фази в нормі, контакт 11–14 замкнено`); } },
  face(d,g){ const s=d.ks||{}; return tx(g.cx,g.y+66,mdl(d,"КОНТРОЛЬ ФАЗ"),{fs:6.6,fw:700})+["L1","L2","L3"].map((l,i)=>led(g.x+22+i*30,g.y+84,s.ph&&s.ph[i]?"#3fbf4a":"#5a5e66")+tx(g.x+22+i*30,g.y+100,l,{fs:6.5})).join("")
    +led(g.cx,g.y+118,s.ok?"#ffd23f":s.pw?"#e23b3b":"#5a5e66")+tx(g.cx,g.y+134,s.ok?"норма":s.why||"—",{fs:6.6,fw:600}); }});
defType("spdac",{name:"УЗІП Т2 1P+N (AC)", short:"УЗІП AC", cat:"Захист", w:2, pre:"FV",
  terms:[{k:"L",s:"top",r:"L",l:"L"},{k:"N",s:"top",r:"N",l:"N"},{k:"pe",s:"bot",r:"PE",l:"PE"}], cap:"Захист від імпульсів",
  face(d,g){ const worn=(d.wear||0)>=2, c=worn?"#e23b3b":"#3fbf4a";
    return tx(g.cx,g.y+68,mdl(d,"УЗІП Т2 · AC"),{fs:modelOf(d)?6.2:7,fw:700})+tx(g.cx,g.y+80,"Uc 275 В · In 20 кА",{fs:6.3})
      +cartridges(g,2,c)
      +tx(g.cx,g.y+146,worn?"картридж замінити":"індикатор: справний",{fs:6.5,fw:worn?700:400}); }});
defType("pm1",{...T.pm, name:"Лічильник 1ф", short:"Лічильник 1ф", cat:"Облік", pre:"PI", cap:"Облік",
  face(d,g){ return tx(g.cx,g.y+64,mdl(d,"ЛІЧИЛЬНИК 1Ф")+" · 5(60) А",{fs:6.6,fw:700})+lcd(g.x+8,g.y+72,g.w-16,38,[fmt(d.kwh||0,2)+" кВт·год",fmt(d.p||0,2)+" кВт"],d.online)+led(g.cx,g.y+128,d.online&&d.p>0.01?"#ff5a5a":"#5a5e66")+tx(g.cx,g.y+146,"1600 імп/кВт·год",{fs:6.3}); }});
defType("pm3",{name:"Лічильник 3ф", short:"Лічильник 3ф", cat:"Облік", w:4, pre:"PI", meter:true,
  terms:[{k:"L1",s:"top",r:"P",l:"L1"},{k:"L2",s:"top",r:"P",l:"L2"},{k:"L3",s:"top",r:"P",l:"L3"},{k:"N",s:"top",r:"N",l:"N"},{k:"L1o",s:"bot",r:"P",l:"L1"},{k:"L2o",s:"bot",r:"P",l:"L2"},{k:"L3o",s:"bot",r:"P",l:"L3"},{k:"No",s:"bot",r:"N",l:"N"}],
  poles:[{a:"L1",b:"L1o",r:"L"},{a:"L2",b:"L2o",r:"L"},{a:"L3",b:"L3o",r:"L"}], links:LNK, closed:()=>true, init:d=>{ d.kwh=d.kwh||0; }, cap:"Облік",
  logic(d,X){ d.online=!!X.ph(K(d,"L1")); return false; },
  tick(d,X,dt){ const per=(S.sim&&S.sim.per[d.id])||[]; d.p=per.reduce((a,I)=>a+I*230/1000,0); d.kwh+=d.p*dt/60; },
  face(d,g){ return tx(g.cx,g.y+64,mdl(d,"ЛІЧИЛЬНИК 3Ф")+" · 5(100) А",{fs:7,fw:700})+lcd(g.x+14,g.y+72,g.w-28,38,[fmt(d.kwh||0,2)+" кВт·год",fmt(d.p||0,2)+" кВт"],d.online)+led(g.cx,g.y+128,d.online&&d.p>0.01?"#ff5a5a":"#5a5e66"); }});
defType("kt",{name:"Реле часу (затримка ввімкнення)", short:"Реле часу", cat:"Керування", w:2, pre:"KT",
  terms:[C("A1","top","A1"),C("15","top","15"),C("A2","bot","A2"),C("16","bot","16"),C("18","bot","18")],
  aux:d=>d.out?[["15","18"]]:[["15","16"]], init:d=>{ d.delay=d.delay||5; d.t=0; }, cap:"Витримка часу",
  logic(d,X){ const c=coilOn(d,X,"A1","A2"); d.coil=c; if(!c&&(d.out||d.t)){ d.t=0; if(d.out){ d.out=false; return true; } } return false; },
  tick(d,X,dt){ if(d.coil&&!d.out){ d.t+=dt; if(d.t>=d.delay){ d.out=true; logp("ok",`${desig(d)}: витримка ${d.delay} с минула, контакт 15–18 замкнено`); } } },
  face(d,g){ const p=Math.min(1,(d.t||0)/d.delay), r=18, a=p*2*Math.PI, x2=g.cx+r*Math.sin(a), y2=g.y+102-r*Math.cos(a);
    return tx(g.cx,g.y+68,(modelOf(d)?modelOf(d)+" · ":"РЕЛЕ ЧАСУ · ")+"T = "+d.delay+" с",{fs:6.8,fw:700})+`<circle cx="${g.cx}" cy="${g.y+102}" r="${r}" fill="#2a2d33"/>`
      +(p>0&&p<1?`<path d="M${g.cx} ${g.y+102} L${g.cx} ${g.y+102-r} A${r} ${r} 0 ${p>0.5?1:0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="#ffb21f"/>`:p>=1?`<circle cx="${g.cx}" cy="${g.y+102}" r="${r}" fill="#3fbf4a"/>`:"")
      +led(g.x+14,g.y+138,d.coil?"#3fbf4a":"#5a5e66")+led(g.x+g.w-14,g.y+138,d.out?"#ffd23f":"#5a5e66")+tx(g.cx,g.y+150,d.out?"15–18":"15–16",{fs:7,ff:"var(--mono)"}); }});
defType("kimp",{name:"Імпульсне реле", short:"Імпульсне реле", cat:"Керування", w:1, pre:"KI",
  terms:TCOIL,
  poles:[{a:"1",b:"2",r:"L"}], closed:d=>!!d.st, cap:"Світло з кнопок",
  logic(d,X){ const c=coilOn(d,X,"A1","A2"); if(c&&!d.prev){ d.prev=true; d.st=!d.st; logp("ok",`${desig(d)}: імпульс → ${d.st?"увімкнено":"вимкнено"}`); return true; } if(!c) d.prev=false; return false; },
  face(d,g){ return tx(g.cx,g.y+68,mdl(d,"ІМП. 16 А"),{fs:modelOf(d)?5.6:6.6,fw:700})+`<rect x="${g.cx-12}" y="${g.y+84}" width="24" height="40" rx="3" fill="#2a2d33"/><rect x="${g.cx-9}" y="${g.y+(d.st?88:104)}" width="18" height="16" rx="2" fill="${d.st?"#e0352b":"#8e9196"}"/>`+tx(g.cx,g.y+140,d.st?"I":"O",{fs:9,fw:700}); }});
defType("photo",{name:"Фотореле", short:"Фотореле", cat:"Керування", w:1, pre:"KL",
  terms:[...TLN,{k:"Lo",s:"bot",r:"L",l:"Lвих"}], poles:PIO, closed:d=>!!d.rel, cap:"Вуличне світло",
  init:d=>{ d.th=d.th||20; },
  logic(d,X){ const pw=X.volt(K(d,"L"),K(d,"N"))>=150, dark=(S.env.lux??60)<d.th, r=pw&&dark; d.pw=pw; if(r!==!!d.rel){ d.rel=r; return true; } return false; },
  load:(d,X)=>[{a:"L",b:"N",I:d.pw?0.005:0}],
  face(d,g){ const dark=(S.env.lux??60)<d.th; return tx(g.cx,g.y+68,"ФОТО",{fs:6.8,fw:700})+`<circle cx="${g.cx}" cy="${g.y+96}" r="12" fill="${dark?"#2a3550":"#ffd23f"}"/>`+led(g.cx,g.y+124,d.rel?"#ffd23f":"#5a5e66")+tx(g.cx,g.y+142,dark?"темно":"світло",{fs:6.3}); }});
// Клеми прохідні WAGO TOPJOB S 2002 (2,5 мм², 24 А): сіра 2002-1201 (L), синя 2002-1204 (N), жовто-зелена 2002-1207 (PE)
// і торцева пластина 2002-1291. Кожна клема 5,2 мм, разом 16,4 мм — займає одне місце на рейці; довжина клеми 48,5 мм.
// Вхід зверху й знизу — push-in з помаранчевою кнопкою; клема пропускає провід наскрізь (верх = низ).
const XTB = [["L","#a7abb2","2002-1201"],["N","#2f6fdf","2002-1204"],["PE","#f2c400","2002-1207"]];
defType("xtb",{name:"Клеми прохідні WAGO 2002 (L · N · PE), 2,5 мм²", short:"Клеми WAGO 2002", cat:"Розподіл", w:1, bw:16.4/17.5, bh:150, iy:56, sr:4.6, pre:"X", full:true, maker:"WAGO", noBrand:true,
  body:"#2a2d33", terms:XTB.flatMap(([l],i)=>[{k:l+"a",s:"top",r:l,l,m:-0.339+i*0.2854,nl:true},{k:l+"b",s:"bot",r:l,l,m:-0.339+i*0.2854,nl:true}]),
  links:()=>XTB.map(([l])=>[l+"a",l+"b"]), cap:"Розподіл",
  face(d,g){ const x0=g.x, y0=g.y+45, h=150, pw=5.2/16.4*g.w; let s="";
    XTB.forEach(([l,c],i)=>{ const x=x0+i*pw, cx=x+pw/2;
      s+=`<rect x="${x+.4}" y="${y0}" width="${pw-.8}" height="${h}" rx="1.5" fill="${c}" stroke="#1d1f23" stroke-width=".8"/>`;
      if(l==="PE") for(let k=0;k<7;k++) s+=`<rect x="${x+.4}" y="${y0+6+k*20.5}" width="${pw-.8}" height="9" fill="#2e9a3e"/>`;
      for(const [ey,by] of [[g.y+56,g.y+63],[g.y+184,g.y+169]])   // отвір під провід і помаранчева кнопка push-in
        s+=`<circle cx="${cx}" cy="${ey}" r="4.6" fill="#15171a" stroke="#4a4e56" stroke-width=".8"/><rect x="${cx-3.2}" y="${by}" width="6.4" height="8" rx="1.2" fill="#f28c1e" stroke="#b8620c" stroke-width=".6"/>`;
      s+=`<rect x="${x+1.6}" y="${g.y+107}" width="${pw-3.2}" height="24" rx="1" fill="#fff" stroke="#9aa0aa" stroke-width=".5"/>`+tx(cx,g.y+122.5,l,{fs:l==="PE"?5.6:7,fw:800,fill:"#222"}); });
    s+=`<rect x="${x0+3*pw}" y="${y0}" width="${g.w-3*pw}" height="${h}" rx="1" fill="#8a8f97"/>`;   // торцева пластина 2002-1291
    return s+desPill(g.cx,g.y+86,desig(d)); }});
