/* ===== Додаткові апарати для конструктора ===== */
const P4 = (pre) => [{k:"t1",s:"top",r:"P",l:"1"},{k:"t2",s:"top",r:"P",l:"3"},{k:"t3",s:"top",r:"P",l:"5"},{k:"t4",s:"top",r:"N",l:"N"},
  {k:"b1",s:"bot",r:"P",l:"2"},{k:"b2",s:"bot",r:"P",l:"4"},{k:"b3",s:"bot",r:"P",l:"6"},{k:"b4",s:"bot",r:"N",l:"N"}];
const POLES4 = [{a:"t1",b:"b1",r:"L"},{a:"t2",b:"b2",r:"L"},{a:"t3",b:"b3",r:"L"},{a:"t4",b:"b4",r:"N"}];
Object.assign(T.qf3p,{group:true, groupOpt:true, gph:3});
defType("qf4p",{...brk, name:"Автомат 3P+N (4P)", short:"Автомат 4P", cat:"Захист", w:4, pre:"QF", group:true, groupOpt:true, gph:3,
  terms:P4(), poles:POLES4, ratings:["C16","C25","C32","C40","C50","C63"], def:"C25", face:breakerFace, cap:"Ввід 400 В"});
defType("rcd4",{name:"ПЗВ 4P 30 мА", short:"ПЗВ 4P", cat:"Захист", w:4, pre:"QD", rcd:true, terms:P4(), poles:POLES4, ratings:["25","40","63"], def:"40", unit:" А", cap:"Захист від ураження",
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
defType("sock",{name:"Розетка на DIN-рейку", short:"Розетка DIN", cat:"Розподіл", w:3, pre:"XS",
  terms:[{k:"L",s:"top",r:"L",l:"L"},{k:"N",s:"top",r:"N",l:"N"},{k:"PE",s:"top",r:"PE",l:"PE"}], cap:"Сервісна розетка",
  load(d,X){ const U=X.volt(K(d,"L"),K(d,"N")); d.live=U>=150; return [{a:"L",b:"N",I:d.plug&&U>=150?1200/U:0,U}]; },
  face(d,g){ return tx(g.cx,g.y+64,"16 А · 250 В",{fs:7,fw:700})+`<circle cx="${g.cx}" cy="${g.y+104}" r="30" fill="#f4f5f7" stroke="#9aa0aa"/><circle cx="${g.cx-11}" cy="${g.y+104}" r="4" fill="#222"/><circle cx="${g.cx+11}" cy="${g.y+104}" r="4" fill="#222"/>`
    +`<rect x="${g.cx-3}" y="${g.y+75}" width="6" height="7" fill="#b0b4bb"/><rect x="${g.cx-3}" y="${g.y+126}" width="6" height="7" fill="#b0b4bb"/>`+tx(g.cx,g.y+150,d.plug?"інструмент 1,2 кВт":d.live?"під напругою":"—",{fs:6.5}); }});
defType("xtb",{name:"Клемник прохідний", short:"Клемник", cat:"Розподіл", w:1, pre:"X", terms:[{k:"a",s:"top",r:"any",l:"1"},{k:"b",s:"bot",r:"any",l:"2"}],
  links:()=>[["a","b"]], init:d=>{ d.col=d.col||"grey"; }, cap:"Розподіл",
  face(d,g){ const f={grey:"#8f949c",blue:"#2f6fdf",pe:"#f2c400"}[d.col]||"#8f949c";
    return `<rect x="${g.x+8}" y="${g.y+56}" width="${g.w-16}" height="104" rx="3" fill="${f}"/>`+(d.col==="pe"?[0,1,2,3].map(i=>`<rect x="${g.x+8}" y="${g.y+64+i*24}" width="${g.w-16}" height="10" fill="#2e9a3e"/>`).join(""):"")
      +tx(g.cx,g.y+112,d.col==="blue"?"N":d.col==="pe"?"PE":"L",{fs:12,fw:700,fill:"#fff"}); }});
