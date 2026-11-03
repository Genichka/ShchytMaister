/* ===== Розумний будинок і DC-апарати ===== */
const online = (d,X) => X.volt(K(d,"L"),K(d,"N"))>=150;
const onlineLogic = (d,X) => { const o=online(d,X); if(o!==!!d.online){ d.online=o; return true; } return false; };
const smartFace = (d,g,title,state,stOn) => tx(g.cx,g.y+64,title,{fs:g.w>60?7:6.2,fw:700})+`<rect x="${g.cx-(g.w>60?30:18)}" y="${g.y+76}" width="${g.w>60?60:36}" height="22" rx="3" fill="#16181c"/>`
  +tx(g.cx,g.y+91,d.online?"Wi-Fi":"офлайн",{fs:7.5,ff:"var(--mono)",fill:d.online?"#6eb4ff":"#5a5e66"})+led(g.cx,g.y+112,d.online?(stOn?"#3fbf4a":"#ffb21f"):"#5a5e66")+tx(g.cx,g.y+132,state,{fs:7,fw:600});
defType("ssw",{name:"Розумний вимикач Wi-Fi 1P+N", short:"Розумний вимикач", cat:"Розумний дім", w:1, pre:"SR",
  terms:TIO, poles:PIO, links:LNK, closed:d=>!!d.rel, init:d=>{ d.cmd=!!d.cmd; }, cap:"Розумне реле",
  logic(d,X){ d.online=online(d,X); const r=d.online&&d.cmd; if(r!==!!d.rel){ d.rel=r; return true; } return false; },
  load:(d,X)=>[{a:"L",b:"N",I:d.online?0.005:0}], face:(d,g)=>smartFace(d,g,"Wi-Fi 16А",d.rel?"УВІМК":"ВИМК",d.rel)});
defType("pm",{name:"Лічильник енергії Wi-Fi", short:"Лічильник Wi-Fi", cat:"Розумний дім", w:2, pre:"PM", meter:true,
  terms:TIO, poles:PIO, links:LNK, closed:()=>true, init:d=>{ d.kwh=d.kwh||0; }, cap:"Облік енергії",
  logic(d,X){ d.online=online(d,X); return false; },
  tick(d,X,dt){ const I=(S.sim&&S.sim.I[d.id])||0; d.p=I*(X.volt(K(d,"L"),K(d,"N"))||0)/1000; d.kwh+=d.p*dt/60; },
  face(d,g){ return tx(g.cx,g.y+64,"ЛІЧИЛЬНИК 1Ф · 63 А",{fs:7,fw:700})+lcd(g.x+8,g.y+72,g.w-16,38,[fmt(d.p||0,2)+" кВт",fmt(d.kwh||0,2)+" кВт·год"],d.online)
    +tx(g.cx,g.y+124,d.online?"Wi-Fi · онлайн":"офлайн",{fs:7,fill:d.online?"#1f62e0":"#777"})+led(g.cx,g.y+142,d.online&&d.p>0.01?"#ff5a5a":"#5a5e66"); }});
defType("tr",{name:"Терморегулятор теплої підлоги", short:"Терморегулятор", cat:"Розумний дім", w:2, pre:"TR",
  terms:[{k:"L",s:"top",r:"L",l:"L"},{k:"N",s:"top",r:"N",l:"N"},{k:"Lo",s:"bot",r:"L",l:"L ⏚"},{k:"No",s:"bot",r:"N",l:"N"}],
  poles:PIO, links:LNK, closed:d=>!!(d.online&&d.heat&&d.en),
  init:d=>{ d.set=d.set??24; d.temp=d.temp??19; d.en=d.en??true; }, cap:"Тепла підлога",
  logic:onlineLogic,
  tick(d,X,dt){ if(!d.online) { d.heat=false; } else { if(d.temp<d.set-0.5) d.heat=true; if(d.temp>d.set+0.5) d.heat=false; }
    const on=X.volt(K(d,"Lo"),K(d,"No"))>=150; d.temp+= on ? dt*0.35 : -dt*0.12*Math.max(0,d.temp-17)/5; },
  face(d,g){ return tx(g.cx,g.y+64,"ТЕРМОРЕГУЛЯТОР",{fs:7,fw:700})+lcd(g.x+8,g.y+72,g.w-16,38,[fmt(d.temp,1)+"°C",`задано ${fmt(d.set,0)}°`],d.online,"#ffb21f")
    +led(g.cx,g.y+128,d.online&&d.heat&&d.en?"#ff5a5a":"#5a5e66")+tx(g.cx,g.y+146,d.en?"нагрів":"вимкнено",{fs:7}); }});
defType("hub",{name:"Хаб Zigbee / контролер", short:"Хаб Zigbee", cat:"Розумний дім", w:2, pre:"A",
  terms:TLN, cap:"Хаб автоматики",
  logic(d,X){ const o=online(d,X); if(o!==!!d.online){ d.online=o; logp(o?"ok":"w",`${desig(d)}: хаб ${o?"онлайн":"офлайн — автоматизації не працюють"}`); } return false; },
  load:(d,X)=>[{a:"L",b:"N",I:d.online?0.02:0}],
  face(d,g){ return tx(g.cx,g.y+64,"HUB · Zigbee 3.0",{fs:7,fw:700})+`<circle cx="${g.cx}" cy="${g.y+104}" r="24" fill="#16181c"/>`
    +[10,17,24].map(r=>`<path d="M${g.cx-r*0.7} ${g.y+108-r*0.35} Q${g.cx} ${g.y+108-r} ${g.cx+r*0.7} ${g.y+108-r*0.35}" fill="none" stroke="${d.online?"#6eb4ff":"#3a3f47"}" stroke-width="2.5"/>`).join("")
    +tx(g.cx,g.y+146,d.online?"онлайн":"офлайн",{fs:7,fw:600}); }});
defType("kr2",{name:"Реле крана 2-канальне", short:"Реле крана", cat:"Розумний дім", w:2, pre:"KR",
  terms:[{k:"L",s:"top",r:"L",l:"L"},{k:"N",s:"top",r:"N",l:"N"},{k:"O1",s:"bot",r:"L",l:"Відкр."},{k:"O2",s:"bot",r:"L",l:"Закр."}],
  aux:d=>!d.online?[]:d.cmd==="open"?[["L","O1"]]:d.cmd==="close"?[["L","O2"]]:[], init:d=>{ d.cmd=d.cmd||"open"; }, cap:"Кран води",
  logic:onlineLogic,
  face:(d,g)=>smartFace(d,g,"РЕЛЕ КРАНА",d.cmd==="open"?"ВІДКРИТИ":"ЗАКРИТИ",d.cmd==="open")});
defType("qfdc",{...brk, name:"Автомат DC 2P", short:"Автомат DC", cat:"СЕС", w:2, pre:"QF",
  terms:[{k:"p1",s:"top",r:"DC+",l:"+"},{k:"m1",s:"top",r:"DC-",l:"−"},{k:"p2",s:"bot",r:"DC+",l:"+"},{k:"m2",s:"bot",r:"DC-",l:"−"}],
  poles:[{a:"p1",b:"p2",r:"L"},{a:"m1",b:"m2",r:"L"}], ratings:["C16","C25","C32","C63","C125"], def:"C16", cap:"DC",
  face(d,g){ return tx(g.cx,g.y+70,d.model||"DC 1000 В",{fs:7,fw:700})+breakerFace(d,g); }});
defType("spdc",{name:"УЗІП DC 1000 В", short:"УЗІП DC", cat:"СЕС", w:2, pre:"FV",
  terms:[{k:"p",s:"top",r:"DC+",l:"+"},{k:"m",s:"top",r:"DC-",l:"−"},{k:"pe",s:"bot",r:"PE",l:"PE"}], cap:"Захист від імпульсів",
  face(d,g){ const worn=(d.wear||0)>=2, c=worn?"#e23b3b":"#3fbf4a";
    return (d.model?`<rect x="${g.x+5}" y="${g.y+60}" width="${g.w-10}" height="104" rx="2" fill="#e8492f"/>`:"")+tx(g.cx,g.y+70,d.model||"УЗІП Т2 · DC",{fs:7,fw:700,fill:d.model?"#fff":undefined})+tx(g.cx,g.y+81,"Uc "+(d.uc||1000)+" В · In 20 кА",{fs:6.3,fill:d.model?"#fff":undefined})
    +cartridges(g,2,c)
    +tx(g.cx,g.y+146,worn?"картридж замінити":"індикатор: справний",{fs:6.5,fw:worn?700:400,fill:d.model?"#fff":undefined}); }});
